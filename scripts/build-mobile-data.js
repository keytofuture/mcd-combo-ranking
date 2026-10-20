'use strict';

/**
 * 把一次真实 MCP 抓取结果，转成前端的静态数据。
 *
 * 两种输出（同一份计算结果，只是序列化形态不同）：
 *   --format web     → mobile/data.js        浏览器用，window.MCD_DATA
 *   --format weapp   → miniprogram/services/data.js  小程序用，module.exports，
 *                      并把金额/折扣预格式化成字符串（WXML 里不能调函数）
 *
 * 用法：
 *   node scripts/build-mobile-data.js .mcd-live/raw --channel pickup --format web
 *   node scripts/build-mobile-data.js .mcd-live/raw --channel pickup --format weapp
 *
 * 与 scripts/live/rank.js 用同一套计算链路（src/core + src/mcp/normalize），
 * 保证「界面上看到的数字」与「报告 / 单元测试」完全一致，不存在第二套算法。
 */

const fs = require('node:fs');
const path = require('node:path');

const { buildChannelRanking } = require('../src/core/rank-batch');
const { reasonText } = require('../src/core/contracts');
const { normalizeMeals, assembleCombos } = require('../src/mcp/normalize');
const { loadRaw } = require('./live/rank');

const OUT = {
  web: 'mobile/data.js',
  weapp: 'miniprogram/services/data.js',
};

function parseArgs(argv) {
  const args = { rawDir: '.mcd-live/raw', channel: 'pickup', format: 'web', out: null, observed: null };
  const rest = [];
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--channel') args.channel = argv[++i];
    else if (a === '--format') args.format = argv[++i];
    else if (a === '--out') args.out = argv[++i];
    else if (a === '--observed') args.observed = argv[++i];
    else if (a.startsWith('--')) throw new Error(`未知参数：${a}`);
    else rest.push(a);
  }
  if (rest[0]) args.rawDir = rest[0];
  if (!OUT[args.format]) throw new Error('--format 只能是 web 或 weapp');
  args.out = args.out || OUT[args.format];
  return args;
}

/**
 * 抓取时间不能用「跑脚本的时间」——那是造数时间，不是报价时间。
 * 取 raw 目录内文件的最新 mtime 作为这次抓取发生的时刻（物理事实，不臆造）。
 */
function inferObservedAt(rawDir) {
  // _meta.json 是调用记录，不含报价，不能参与「报价时刻」推断
  const files = fs.readdirSync(rawDir).filter((f) => f.endsWith('.json') && f !== '_meta.json');
  if (!files.length) return new Date().toISOString();
  const latest = files
    .map((f) => fs.statSync(path.join(rawDir, f)).mtimeMs)
    .reduce((a, b) => Math.max(a, b), 0);
  return new Date(latest).toISOString();
}

/**
 * 真实 API 调用次数。绝不能拿 raw 文件数冒充：
 * detail 复用旧文件时并没有发生调用，按文件数会把 101 次说成 236 次。
 */
function readCallCount(rawDir) {
  try {
    const meta = JSON.parse(fs.readFileSync(path.join(rawDir, '_meta.json'), 'utf8'));
    if (Number.isInteger(meta.calls) && meta.calls > 0) return meta.calls;
  } catch (e) {
    // 没有记录就退回文件数，但会在报告里体现为较大值
  }
  return null;
}

function yuan(cents) {
  return cents == null ? null : (cents / 100).toFixed(2);
}

/** 组件归一化：原始 cents + 预格式化文案一起给，前端不用再算 */
function mapComponents(combo) {
  return (combo.components || []).map((c) => {
    const note = c.priceSource === 'menu-name-match' ? '按零售单品价估'
      : (c.priceSource === 'menu-price' ? '单价取自菜单' : '');
    return {
      name: c.name,
      quantity: c.quantity,
      quantityText: '×' + c.quantity,
      isGift: Boolean(c.isGift),
      unitPriceCents: c.unitPriceCents,
      unitPriceText: c.unitPriceCents == null ? '' : '¥' + yuan(c.unitPriceCents),
      subtotalText: c.unitPriceCents != null && c.quantity > 1
        ? '合计 ¥' + yuan(c.unitPriceCents * c.quantity) : '',
      sourceNote: note,
      missing: c.unitPriceCents == null,
    };
  });
}

function knownSumOf(components) {
  return components.reduce((s, c) => s + (c.unitPriceCents == null ? 0 : c.unitPriceCents * c.quantity), 0);
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  const raw = loadRaw(args.rawDir);
  const meals = normalizeMeals(raw.meals);
  const harvested = new Set(Object.keys(raw.details || {}));
  const candidates = meals.filter((m) => harvested.has(m.code));
  // 展示用全量，不做「只取前 15 个」的截取
  const list = candidates.length ? candidates : meals;

  const observedAt = args.observed || inferObservedAt(args.rawDir);

  const assembled = assembleCombos({
    meals: list,
    allMeals: meals,
    details: raw.details,
    prices: raw.prices,
    channel: args.channel,
    observedAt,
    options: { strict: false },
  });

  const byId = new Map(assembled.combos.map((c) => [c.id, c]));
  const built = buildChannelRanking({ catalogComplete: true, combos: assembled.combos });

  // ---- 主榜 ----
  // 只放真正划算的（A > 0）。A ≤ 0 表示打包买不比分开买便宜，那不是折扣，
  // 不该占名次；但直接丢掉又浪费了一个有用的发现，所以单列成 unfavorable。
  const toRow = (row) => {
    const combo = byId.get(row.id) || {};
    const components = mapComponents(combo);
    const orig = combo.menuOriginalCents;
    const dev = orig && row.D ? Math.abs(row.D - orig) / orig : null;
    return {
      id: row.id,
      rank: row.rank,
      name: row.name,
      P: row.P,
      D: row.D,
      A: row.A,
      ratioText: row.ratio.num + '/' + row.ratio.den,
      priceText: yuan(row.P),
      denominatorText: yuan(row.D),
      discountText: row.display.discountText,
      savedPercentText: row.display.savedPercentText,
      savedAmountText: row.display.savedAmountText,
      savedAmountPlain: '¥' + yuan(row.A),
      compositionSummary: row.compositionSummary,
      menuOriginalCents: orig == null ? null : orig,
      menuOriginalText: orig == null ? '' : '¥' + yuan(orig),
      devPctText: dev == null ? '' : (dev * 100).toFixed(1) + '%',
      devWarn: dev != null && dev > 0.015,
      comboPriceSource: combo.comboPriceSource || null,
      components,
      componentCount: components.length,
    };
  };

  const allRows = built.ranking.map(toRow);
  let cursor = 0;
  const ranking = allRows
    .filter((r) => r.A > 0)
    .map((r, i, arr) => {
      if (i === 0 || r.ratioText !== arr[i - 1].ratioText) cursor = i + 1;
      return { ...r, rank: cursor };
    });
  const unfavorable = allRows.filter((r) => r.A <= 0);

  // ---- 不可比 ----
  const notComparable = built.notComparable.map((n) => {
    const combo = byId.get(n.id) || {};
    const components = mapComponents(combo);
    const missingCount = components.filter((c) => c.missing).length;
    return {
      id: n.id,
      name: n.name,
      P: n.P,
      priceText: n.P == null ? '—' : yuan(n.P),
      reasons: n.reasons,
      reasonTexts: n.reasons.map(reasonText),
      reasonText: n.reasons.map(reasonText).join('、'),
      menuOriginalCents: combo.menuOriginalCents == null ? null : combo.menuOriginalCents,
      menuOriginalText: combo.menuOriginalCents == null ? '' : '¥' + yuan(combo.menuOriginalCents),
      components,
      componentCount: components.length,
      missingCount,
      knownSumText: '¥' + yuan(knownSumOf(components)),
    };
  });

  let nameMatchedCount = 0;
  let componentCount = 0;
  for (const combo of assembled.combos) {
    for (const c of combo.components) {
      componentCount += 1;
      if (c.priceSource === 'menu-name-match') nameMatchedCount += 1;
    }
  }

  const reasons = notComparable.map((n) => n.reasonText);
  const allSameReason = reasons.filter((v, i, a) => a.indexOf(v) === i).length === 1;

  const data = {
    source: {
      kind: 'live',
      channel: args.channel,
      channelLabel: args.channel === 'pickup' ? '到店自取' : '官方麦乐送',
      store: '麦当劳深圳桂庙路餐厅',
      storeCode: '1420207',
      observedDisplay: built.observedRange.display,
      observedTime: built.observedRange.display.slice(11),
      observedISO: built.observedRange.start,
      toolCalls: readCallCount(args.rawDir)
        || (Object.keys(raw.prices).length + Object.keys(raw.details).length + 1),
      toolCallsExact: readCallCount(args.rawDir) != null,
      server: 'mcd-mcp 1.0.0',
      endpoint: 'mcp.mcd.cn',
    },
    coverage: built.coverage,
    pricePolicyLabel: '普通可购价（含直接促销，不含个人券与付费会员）',
    ranking,
    unfavorable,
    notComparable,
    notComparableNote: allSameReason
      ? '这 ' + notComparable.length + ' 个都卡在同一件事上：组成里有单品麦当劳不单独卖（多数是套餐专属的饮料编码），拿不到独立售价。硬算出来的数就是编的，所以宁可不上榜。'
      : '',
    honesty: {
      nameMatchedCount,
      componentCount,
      comboCount: assembled.combos.length,
      comparableCount: allRows.length,
      discountedCount: ranking.length,
      unfavorableCount: unfavorable.length,
      undiscoveredCount: built.coverage.discoveredComboCount - assembled.combos.length,
      tightMatchCount: ranking.filter((r) => !r.devWarn).length,
      devSampleCount: ranking.filter((r) => r.devPctText).length,
    },
  };

  const header = '/* 自动生成，请勿手改。来源：scripts/build-mobile-data.js（.mcd-live/raw 真实 MCP 抓取结果）*/\n';
  let body;
  if (args.format === 'weapp') {
    body = 'module.exports = ' + JSON.stringify(data, null, 2) + ';\n';
  } else {
    body = 'window.MCD_DATA = ' + JSON.stringify(data, null, 2) + ';\n';
  }

  fs.mkdirSync(path.dirname(args.out), { recursive: true });
  fs.writeFileSync(args.out, header + body, 'utf8');

  console.log(`格式：${args.format}　门店：${data.source.store}（${data.source.channelLabel}）`);
  console.log(`报价时间：${data.source.observedDisplay}（真实调用 ${data.source.toolCalls} 次）`);
  console.log(`有折扣 ${ranking.length} 个 / 不划算 ${unfavorable.length} 个 / 不可比 ${notComparable.length} 个`);
  console.log(`组件 ${componentCount} 项，其中同名匹配补价 ${nameMatchedCount} 项`);
  console.log(`已写入：${args.out}`);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(String(error.message || error));
    process.exit(1);
  }
}
