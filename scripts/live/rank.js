'use strict';

/**
 * 把 MCP 原始返回算成折扣排行榜，并生成可分享的 HTML 报告。
 *
 * 用法：
 *   node scripts/live/rank.js .mcd-live/raw --channel pickup --out .mcd-live/out
 *   node scripts/live/rank.js .mcd-live/sample-raw --channel pickup          # 无 Token 也能跑
 *
 * 计算规则与单元测试完全一致（src/core），本脚本只负责读写与渲染。
 */

const fs = require('node:fs');
const path = require('node:path');

const { buildChannelRanking } = require('../../src/core/rank-batch');
const { reasonText } = require('../../src/core/contracts');
const { readMcpJson, normalizeMeals, assembleCombos } = require('../../src/mcp/normalize');
const { resolveValidityState } = require('../../src/core/validity');

function parseArgs(argv) {
  const args = { rawDir: null, channel: 'pickup', out: null, strict: false };
  const rest = [];
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--channel') args.channel = argv[++i];
    else if (a === '--out') args.out = argv[++i];
    else if (a === '--strict') args.strict = true;
    else if (a.startsWith('--')) throw new Error(`未知参数：${a}`);
    else rest.push(a);
  }
  args.rawDir = rest[0] || '.mcd-live/raw';
  args.out = args.out || path.join(args.rawDir, '..', 'out');
  if (!['pickup', 'delivery'].includes(args.channel)) throw new Error('--channel 只能是 pickup 或 delivery');
  return args;
}

function readJson(file) {
  // MCP 返回是「说明文字 + JSON + 说明文字」混排，需要按括号配对截取
  return readMcpJson(file, fs);
}

function yuan(cents) {
  return cents == null ? null : (cents / 100).toFixed(2);
}

/** 读取 raw 目录：meals.json + detail-*.json + price-*.json(+ stores.json) */
function loadRaw(rawDir) {
  if (!fs.existsSync(rawDir)) {
    throw new Error(`原始数据目录不存在：${rawDir}\n先让 Skill 把 MCP 返回写进该目录，或跑 npm run live:sample 生成示例数据。`);
  }
  const files = fs.readdirSync(rawDir).filter((f) => f.endsWith('.json'));
  const mealsFile = files.find((f) => f === 'meals.json') || files.find((f) => f.startsWith('meals'));
  if (!mealsFile) throw new Error(`缺少 meals.json（query-meals 的原始返回）。目录内现有：${files.join(', ') || '（空）'}`);

  const storesFile = files.find((f) => f === 'stores.json');
  const details = {};
  const prices = {};

  for (const f of files) {
    const full = path.join(rawDir, f);
    if (f === mealsFile || f === storesFile) continue;

    // detail-<comboCode>.json
    let m = f.match(/^detail-(.+?)(?:\.json)$/);
    if (m) {
      details[m[1]] = readJson(full);
      continue;
    }
    // price-<comboCode>-combo.json  /  price-<comboCode>-single-<itemCodeOrSlug>.json
    m = f.match(/^price-(.+?)-(combo|single(?:-.+)?)\.json$/);
    if (m) {
      const comboCode = m[1];
      const kind = m[2];
      if (kind === 'combo') prices[`${comboCode}|combo`] = readJson(full);
      else {
        const itemRef = kind.replace(/^single-/, '');
        prices[`${comboCode}|single:${itemRef}`] = readJson(full);
      }
    }
  }

  return {
    meals: readJson(path.join(rawDir, mealsFile)),
    stores: storesFile ? readJson(path.join(rawDir, storesFile)) : null,
    details,
    prices,
    fileCount: files.length,
  };
}

/** 只保留套餐类餐品（名称/分类/标签命中套餐关键词） */
function filterCombos(meals, limit) {
  // 麦当劳主力套餐叫「三件套/四件套」，不含「套餐」二字——曾因此漏掉 28 个
  const isCombo = (m) => /套餐|件套|组合|超值|随心选|拼盘|双人|家庭|桶/.test(`${m.name} ${m.category} ${m.tags.join(' ')}`);
  const picked = meals.filter(isCombo);
  const list = picked.length ? picked : meals; // 菜单没有明显套餐标记时，整体都算候选
  return { list: list.slice(0, limit), truncated: list.length > limit, total: list.length };
}

function buildReport({ channel, store, ranking, notComparable, reference, coverage, observedRange, meta }) {
  const CHANNEL_LABEL = { pickup: '到店自取', delivery: '官方麦乐送' };
  const rows = ranking.map((r, i) => `
      <tr class="${i === 0 ? 'top' : ''}">
        <td class="rank"><span class="badge ${i === 0 ? 'badge1' : ''}">${r.rank}</span></td>
        <td class="name">${escapeHtml(r.name)}<div class="comp">${escapeHtml(r.compositionSummary || '')}</div></td>
        <td class="num">${r.display.discountText}</td>
        <td class="num">¥${yuan(r.P)}</td>
        <td class="num muted">¥${yuan(r.D)}</td>
        <td class="num save">${escapeHtml(r.display.savedAmountText)}</td>
      </tr>`).join('');

  const ncRows = notComparable.map((n) => `
      <li><b>${escapeHtml(n.name)}</b><span>${escapeHtml(n.reasons.map(reasonText).join('、'))}</span></li>`).join('');

  // 参考区：单品无法逐项核价，但有官方标称原价 —— 单独列出，绝不并入主榜
  const refRows = (reference || []).map((r) => `
      <tr>
        <td class="name">${escapeHtml(r.name)}</td>
        <td class="num">¥${yuan(r.P)}</td>
        <td class="num muted">¥${yuan(r.originalCents)}</td>
        <td class="num">${r.discountText}</td>
      </tr>`).join('');

  return `<!DOCTYPE html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>麦麦套餐折扣榜 · ${escapeHtml(store)}</title>
<style>
:root{--bg:#f6f1ea;--card:#fff;--ink:#20242b;--ink2:#5f646d;--ink3:#9aa0a8;--line:#efe7dc;
--red:#e8392f;--red-deep:#c81623;--green:#0f9d6c;--gray:#f4f0e9;
--shadow:0 1px 2px rgba(70,45,20,.05),0 8px 24px rgba(70,45,20,.06)}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font:14px/1.6 -apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",system-ui,sans-serif;padding:28px 16px 60px}
.wrap{max-width:760px;margin:0 auto}
h1{font-size:22px;margin:0 0 4px;font-weight:800}
.sub{color:var(--ink2);font-size:13px}
.card{background:var(--card);border-radius:18px;padding:18px;box-shadow:var(--shadow);margin-top:14px}
table{width:100%;border-collapse:collapse;font-size:13px}
th{text-align:left;color:var(--ink3);font-weight:600;font-size:11.5px;padding:0 8px 8px;border-bottom:1px solid var(--line)}
td{padding:11px 8px;border-bottom:1px dashed var(--line);vertical-align:middle}
tr:last-child td{border-bottom:0}
tr.top{background:linear-gradient(135deg,#ef4b36,#c81623);border-radius:12px}
tr.top td{color:#fff;border-bottom:0}
tr.top .muted{color:rgba(255,255,255,.75)}
tr.top .save{color:#fff}
.badge{display:inline-flex;width:24px;height:24px;border-radius:8px;background:var(--gray);color:var(--ink2);align-items:center;justify-content:center;font-weight:800;font-size:12px}
.badge1{background:#ffc72c;color:#7a4a00}
.rank{width:40px}
.name{font-weight:600}
.name .comp{font-weight:400;font-size:11.5px;color:var(--ink3);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:300px}
tr.top .name .comp{color:rgba(255,255,255,.78)}
.num{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
.muted{color:var(--ink3)}
.save{color:var(--red);font-weight:700}
ul.nc{list-style:none;padding:0;margin:8px 0 0}
ul.nc li{display:flex;justify-content:space-between;gap:10px;padding:9px 0;border-bottom:1px dashed var(--line);font-size:12.5px}
ul.nc li:last-child{border-bottom:0}
ul.nc span{color:var(--ink3);text-align:right}
.foot{margin-top:14px;font-size:11.5px;color:var(--ink3);line-height:1.8}
.pill{display:inline-block;padding:2px 9px;border-radius:99px;background:var(--gray);color:var(--ink2);font-size:11px;margin-right:6px}
</style></head>
<body><div class="wrap">
<h1>麦麦套餐折扣榜</h1>
<div class="sub">${CHANNEL_LABEL[channel]} · ${escapeHtml(store)} · 报价 ${escapeHtml(observedRange.display || '未知')}</div>

<div class="card">
<table>
<thead><tr><th></th><th>套餐</th><th class="num">折数</th><th class="num">套餐价</th><th class="num">单买合计</th><th class="num">省</th></tr></thead>
<tbody>${rows || '<tr><td colspan="6" class="muted">本次没有可比套餐</td></tr>'}</tbody>
</table>
</div>

${notComparable.length ? `<div class="card"><b>暂不可比较 · ${notComparable.length} 个</b><ul class="nc">${ncRows}</ul></div>` : ''}

${refRows ? `<div class="card"><b>参考：按官方标称原价</b>
<div class="foot" style="margin-top:6px">这些套餐的单品在核价接口里没有独立售价，无法逐项加总，因此**不进主榜**。下表只是用菜单标称原价做参考，口径弱于主榜。</div>
<table style="margin-top:10px">
<thead><tr><th>套餐</th><th class="num">套餐价</th><th class="num">标称原价</th><th class="num">参考折数</th></tr></thead>
<tbody>${refRows}</tbody>
</table></div>` : ''}

<div class="card">
<div><span class="pill">覆盖</span>${escapeHtml(coverage.summaryText)}</div>
<div class="foot">
口径：普通可购价（含直接促销，不含个人券与付费会员）；套餐价与单买合计只含餐品金额，配送/包装/服务费另列。<br>
排序使用未舍入的折扣比；展示折数已四舍五入。失败数与缺价数可能重叠，不相加。<br>
本次分析 ${meta.analyzedCount} 个套餐${meta.truncated ? `（候选 ${meta.totalCandidates} 个，已按上限截取）` : ''}；原始调用 ${meta.callCount} 次工具。${meta.nameMatchedCount ? `<br><b>口径提示</b>：其中 ${meta.nameMatchedCount} 项单买价由「同名零售单品」匹配得出（套餐内专属码无独立售价），已在明细中标注。` : ''}
</div>
</div>
</div></body></html>`;
}

function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  const raw = loadRaw(args.rawDir);
  const meals = normalizeMeals(raw.meals);
  // 有明细的套餐优先分析（用户/Agent 已经为它们付过调用成本），否则回退到按名称挑套餐
  const harvested = new Set(Object.keys(raw.details || {}));
  const candidates = meals.filter((m) => harvested.has(m.code));
  const { list, truncated, total } = filterCombos(candidates.length ? candidates : meals, 15);

  const assembled = assembleCombos({
    meals: list,
    allMeals: meals,
    details: raw.details,
    prices: raw.prices,
    channel: args.channel,
    observedAt: new Date().toISOString(),
    options: { strict: args.strict },
  });

  // 由「同名零售单品」补出的单价：必须在报告里披露，不能装作完全实测
  let nameMatchedCount = 0;
  for (const combo of assembled.combos) {
    for (const c of combo.components) {
      if (c.priceSource === 'menu-name-match') nameMatchedCount += 1;
    }
  }

  const built = buildChannelRanking({ catalogComplete: !truncated, combos: assembled.combos });

  const validity = resolveValidityState(
    assembled.combos.map((c) => ({ validFrom: null, validTo: null, conditionState: c.observation.conditionState })),
    Date.now()
  );

  const store = raw.stores ? guessStoreName(raw.stores) : '（未提供门店信息）';

  // 自检闸门：D 是逐项核价加出来的，菜单 originalPrice 是官方标称原价，两者应大致吻合。
  // 偏差过大通常意味着「组件匹配错了」——出现过一次：吉士汉堡包匹配到同类套餐，D 虚增 27%。
  const byId = new Map(assembled.combos.map((c) => [c.id, c]));
  const suspects = [];
  for (const row of built.ranking) {
    const combo = byId.get(row.id);
    const orig = combo && combo.menuOriginalCents;
    if (!orig || !row.D) continue;
    const dev = Math.abs(row.D - orig) / orig;
    if (dev > 0.3) {
      suspects.push({
        name: row.name,
        computedD: row.D,
        menuOriginalCents: orig,
        deviationPct: Math.round(dev * 100),
      });
    }
  }
  if (suspects.length) {
    console.warn('\n⚠️ D 与菜单标称原价偏差超过 30%，请人工核对组成单价：');
    for (const s of suspects) {
      console.warn(`   ${s.name}：D=¥${yuan(s.computedD)} vs 菜单原价 ¥${yuan(s.menuOriginalCents)}（偏差 ${s.deviationPct}%）`);
    }
  }

  // 参考区：不可比但有官方标称原价的，单独列，不进主榜
  const reference = built.notComparable
    .map((n) => {
      const combo = byId.get(n.id);
      const orig = combo && combo.menuOriginalCents;
      if (!orig || !n.P) return null;
      const ratio = n.P / orig;
      return {
        name: n.name,
        P: n.P,
        originalCents: orig,
        ratio: Number(ratio.toFixed(4)),
        discountText: (ratio * 10).toFixed(1) + '折',
      };
    })
    .filter(Boolean);

  const meta = {
    analyzedCount: built.ranking.length + built.notComparable.length,
    totalCandidates: total,
    truncated,
    callCount: Object.keys(raw.prices).length + Object.keys(raw.details).length + 1,
    nameMatchedCount,
    strict: Boolean(args.strict),
    dSanitySuspects: suspects,
  };

  fs.mkdirSync(args.out, { recursive: true });
  const result = {
    mode: 'live',
    channel: args.channel,
    store,
    generatedAt: new Date().toISOString(),
    validityState: validity.state,
    observedRange: built.observedRange,
    coverage: built.coverage,
    ranking: built.ranking,
    notComparable: built.notComparable,
    reference,
    meta,
  };
  fs.writeFileSync(path.join(args.out, 'result.json'), JSON.stringify(result, null, 2), 'utf8');
  fs.writeFileSync(
    path.join(args.out, 'report.html'),
    buildReport({
      channel: args.channel,
      store,
      ranking: built.ranking,
      notComparable: built.notComparable,
      reference,
      coverage: built.coverage,
      observedRange: built.observedRange,
      meta,
    }),
    'utf8'
  );

  console.log(`门店：${store}（${args.channel}）`);
  console.log(`可比 ${built.ranking.length} 个，不可比 ${built.notComparable.length} 个`);
  for (const r of built.ranking) {
    console.log(`  #${r.rank} ${r.name}  ¥${yuan(r.P)} / 单买 ¥${yuan(r.D)}  ${r.display.discountText}  ${r.display.savedAmountText}`);
  }
  for (const n of built.notComparable) {
    console.log(`  — ${n.name}  ${n.reasons.map(reasonText).join('、')}`);
  }
  if (reference.length) {
    console.log('\n参考（官方标称原价，不进主榜）：');
    for (const r of reference) console.log(`  · ${r.name}  ¥${yuan(r.P)} / 标称 ¥${yuan(r.originalCents)}  ${r.discountText}`);
  }
  console.log(`已写入：${path.join(args.out, 'result.json')}`);
  console.log(`已写入：${path.join(args.out, 'report.html')}`);
}

/** 从工具返回里尽力找门店名；找不到就给占位，不编造 */
function guessStoreName(storesRaw) {
  const candidates = [];
  const walk = (node, depth) => {
    if (!node || depth > 6) return;
    if (Array.isArray(node)) return node.forEach((n) => walk(n, depth + 1));
    if (typeof node === 'object') {
      for (const key of ['storeName', 'shopName', 'restaurantName']) {
        if (typeof node[key] === 'string' && node[key].trim()) candidates.push(node[key].trim());
      }
      Object.values(node).forEach((v) => walk(v, depth + 1));
    }
  };
  walk(storesRaw, 0);
  return candidates[0] || '（未识别门店名）';
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(String(error.message || error));
    process.exit(1);
  }
}

module.exports = { loadRaw, filterCombos, buildReport };
