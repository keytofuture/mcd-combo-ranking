'use strict';

/**
 * 小程序页面预览器（开发用）。
 *
 * 本机没有微信开发者工具，为了在交付前确认「真机小程序长什么样」，
 * 这里把 WXML 渲染成等价 HTML：真实加载页面的 .js 取 data、真实套 .wxss，
 * 所以看到的就是页面逻辑真跑出来的结果，不是另写一份假数据。
 *
 * 只实现本项目用到的子集：{{}} 插值、wx:if/elif/else、wx:for、class 内插值。
 *
 * 用法：
 *   node scripts/dev/preview-miniprogram.js ranking
 *   node scripts/dev/preview-miniprogram.js detail --id 9900016073
 *   node scripts/dev/preview-miniprogram.js source
 */

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..', '..');
const MP = path.join(ROOT, 'miniprogram');
const OUT_DIR = path.join(ROOT, '.preview');

/* ============ 1. 在 Node 里跑小程序 JS，拿初始 data ============ */

function loadJsData(jsPath, query) {
  let captured = null;
  const prev = { Page: global.Page, Component: global.Component, getApp: global.getApp, wx: global.wx };

  global.Page = (cfg) => { captured = cfg; };
  global.Component = (cfg) => { captured = cfg; };
  global.getApp = () => ({ globalData: {} });
  global.wx = { navigateTo() {}, switchTab() {}, showToast() {}, navigateBack() {} };

  try {
    delete require.cache[require.resolve(jsPath)];
    require(jsPath);
  } finally {
    global.Page = prev.Page;
    global.Component = prev.Component;
    global.getApp = prev.getApp;
    global.wx = prev.wx;
  }

  if (!captured) return {};
  const data = JSON.parse(JSON.stringify(captured.data || {}));
  const ctx = {
    data,
    setData(patch) { Object.assign(this.data, patch); },
    getTabBar() { return null; },
  };
  if (typeof captured.onLoad === 'function') captured.onLoad.call(ctx, query || {});
  return ctx.data;
}

function pageData(pageDir, query) {
  const data = loadJsData(path.join(MP, pageDir + '.js'), query);
  // 折叠区默认收起，截图时看不到内容；用 --open 打开指定折叠项才能核对排版
  const open = query && query.open;
  if (open) {
    for (const key of String(open).split(',')) {
      const flag = 'show' + key.charAt(0).toUpperCase() + key.slice(1);
      if (flag in data) data[flag] = true;
    }
  }
  return data;
}

function tabBarData(selected) {
  const data = loadJsData(path.join(MP, 'custom-tab-bar', 'index.js'), {});
  data.selected = selected;
  return data;
}

/* ============ 2. 极简 WXML 解析 + 渲染 ============ */

function parseAttrs(raw) {
  const attrs = {};
  const re = /([\w:.-]+)(?:\s*=\s*"([^"]*)")?/g;
  let m;
  while ((m = re.exec(raw))) {
    if (m[1]) attrs[m[1]] = m[2] == null ? '' : m[2];
  }
  return attrs;
}

function parseWxml(src) {
  const cleaned = src.replace(/<!--[\s\S]*?-->/g, '');
  const root = { tag: '#root', attrs: {}, children: [] };
  const stack = [root];
  const tagRe = /<(\/)?([\w-]+)((?:[^>"']|"[^"]*"|'[^']*')*?)(\/)?>/g;
  let last = 0;
  let m;

  const pushText = (t) => {
    const v = t.trim();
    if (v) stack[stack.length - 1].children.push({ text: v });
  };

  while ((m = tagRe.exec(cleaned))) {
    pushText(cleaned.slice(last, m.index));
    last = tagRe.lastIndex;
    const [, closing, tag, attrRaw, selfClose] = m;
    if (closing) {
      if (stack.length > 1) stack.pop();
      continue;
    }
    const node = { tag, attrs: parseAttrs(attrRaw), children: [] };
    stack[stack.length - 1].children.push(node);
    if (!selfClose) stack.push(node);
  }
  pushText(cleaned.slice(last));
  return root;
}

/** 在 data 上下文里求值；出错返回空，避免整页炸掉 */
function evaluate(expr, scope) {
  try {
    // eslint-disable-next-line no-new-func
    return new Function('$s', 'with ($s) { return (' + expr + '); }')(scope);
  } catch (e) {
    return '';
  }
}

function bare(expr) {
  return String(expr).replace(/^\{\{|\}\}$/g, '').trim();
}

function interpolate(str, scope) {
  return String(str).replace(/\{\{([\s\S]*?)\}\}/g, (_, expr) => {
    const v = evaluate(expr.trim(), scope);
    if (v == null || v === false) return '';
    return String(v);
  });
}

/** 同层 wx:if / wx:elif / wx:else 收成命中分支 */
function resolveIfChains(nodes, scope) {
  const result = [];
  let inChain = false;
  let taken = false;

  for (const node of nodes) {
    if (node.text != null || node.attrs['wx:for'] != null) {
      inChain = false;
      result.push(node);
      continue;
    }
    const a = node.attrs;
    if (a['wx:if'] != null) {
      inChain = true;
      taken = Boolean(evaluate(bare(a['wx:if']), scope));
      if (taken) result.push(node);
      continue;
    }
    if (a['wx:elif'] != null) {
      if (inChain && !taken) {
        taken = Boolean(evaluate(bare(a['wx:elif']), scope));
        if (taken) result.push(node);
      }
      continue;
    }
    if (a['wx:else'] != null) {
      if (inChain && !taken) result.push(node);
      inChain = false;
      taken = false;
      continue;
    }
    inChain = false;
    result.push(node);
  }
  return result;
}

const TAG_MAP = { block: null };

function renderNodes(nodes, scope, out) {
  const live = resolveIfChains(nodes, scope);

  for (const node of live) {
    if (node.text != null) { out.push(interpolate(node.text, scope)); continue; }

    const a = node.attrs;

    if (a['wx:for'] != null) {
      const list = evaluate(bare(a['wx:for']), scope) || [];
      const itemName = a['wx:for-item'] || 'item';
      const idxName = a['wx:for-index'] || 'index';
      const arr = Array.isArray(list) ? list : [];
      arr.forEach((it, i) => {
        const inner = Object.create(scope);
        inner[itemName] = it;
        inner[idxName] = i;
        renderOne(node, inner, out);
      });
      continue;
    }

    renderOne(node, scope, out);
  }
}

function renderOne(node, scope, out) {
  const a = node.attrs;
  const mapped = TAG_MAP.hasOwnProperty(node.tag) ? TAG_MAP[node.tag] : node.tag;
  const inner = [];

  renderNodes(node.children, scope, inner);

  if (!mapped) { out.push(inner.join('')); return; }

  const attrs = [];
  if (a.class) {
    const cls = interpolate(a.class, scope).replace(/\s+/g, ' ').trim();
    if (cls) attrs.push('class="' + cls + '"');
  }
  if (a.style) attrs.push('style="' + interpolate(a.style, scope) + '"');
  out.push('<' + mapped + (attrs.length ? ' ' + attrs.join(' ') : '') + '>' + inner.join('') + '</' + mapped + '>');
}

/* ============ 3. WXSS → CSS ============ */

function wxssToCss(src) {
  let css = src.replace(/\/\*[\s\S]*?\*\//g, '');
  // 750rpx = 390px 设计宽度
  css = css.replace(/(-?[\d.]+)rpx/g, (_, n) => (Number(n) * 0.52).toFixed(2) + 'px');
  css = css.replace(/env\(safe-area-inset-bottom\)/g, '0px');
  css = css.replace(/(^|[\s,}])page(?=[\s,{])/g, '$1.mp-page');
  return css;
}

const RESET = `
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #f6f1ea; }
  view { display: block; }
  text { display: inline; }
  button { display: block; border: 0; background: none; font: inherit; padding: 0; }
`;

/* ============ 4. 主流程 ============ */

function renderPage(pageName, opts) {
  const pageDir = path.join('pages', pageName, pageName);
  const appJson = JSON.parse(fs.readFileSync(path.join(MP, 'app.json'), 'utf8'));
  const pageJson = JSON.parse(fs.readFileSync(path.join(MP, pageDir + '.json'), 'utf8'));
  const appWxss = fs.readFileSync(path.join(MP, 'app.wxss'), 'utf8');
  const pageWxssPath = path.join(MP, pageDir + '.wxss');
  const pageWxss = fs.existsSync(pageWxssPath) ? fs.readFileSync(pageWxssPath, 'utf8') : '';

  const data = pageData(pageDir, { id: opts.id || null, open: opts.open || null });
  const tree = parseWxml(fs.readFileSync(path.join(MP, pageDir + '.wxml'), 'utf8'));
  const out = [];
  renderNodes(tree.children, data, out);
  let body = out.join('');

  const tabPath = 'pages/' + pageName + '/' + pageName;
  const isTab = (appJson.tabBar.list || []).some((t) => t.pagePath === tabPath);
  let extraCss = '';
  if (isTab) {
    const tbWxml = fs.readFileSync(path.join(MP, 'custom-tab-bar', 'index.wxml'), 'utf8');
    const tbWxss = fs.readFileSync(path.join(MP, 'custom-tab-bar', 'index.wxss'), 'utf8');
    const selected = appJson.tabBar.list.findIndex((t) => t.pagePath === tabPath);
    const tbOut = [];
    renderNodes(parseWxml(tbWxml).children, tabBarData(selected < 0 ? 0 : selected), tbOut);
    body += tbOut.join('');
    extraCss += wxssToCss(tbWxss);
  }

  const css = wxssToCss(appWxss) + '\n' + wxssToCss(pageWxss) + '\n' + extraCss;
  const html = '<!DOCTYPE html>\n<html lang="zh-CN"><head><meta charset="utf-8">'
    + '<meta name="viewport" content="width=device-width,initial-scale=1">'
    + '<style>' + RESET + css + '</style></head><body>'
    + '<div class="mp-page">' + body + '</div></body></html>';

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const file = path.join(OUT_DIR, pageName + '.html');
  fs.writeFileSync(file, html, 'utf8');
  console.log('已生成：' + path.relative(ROOT, file) + '　（' + (pageJson.navigationBarTitleText || pageName) + '）');
  return file;
}

function main() {
  const argv = process.argv.slice(2);
  const page = argv[0];
  const i = argv.indexOf('--id');
  const o = argv.indexOf('--open');
  if (!page) {
    throw new Error('用法：node scripts/dev/preview-miniprogram.js <ranking|detail|source> [--id xxx] [--open off,policy,realtime]');
  }
  renderPage(page, {
    id: i > -1 ? argv[i + 1] : null,
    open: o > -1 ? argv[o + 1] : null,
  });
}

if (require.main === module) {
  try {
    main();
  } catch (e) {
    console.error(String(e.stack || e.message || e));
    process.exit(1);
  }
}

module.exports = { renderPage, pageData };
