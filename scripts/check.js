'use strict';

/**
 * 静态检查：语法 + fixture 可解析性 + 小程序配置/模板结构 + 敏感信息。
 * 无网络、无凭据，可离线运行。
 */

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const root = path.join(__dirname, '..');
let errors = 0;

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

function fail(message) {
  errors += 1;
  console.error(message);
}

// 1) 语法检查：核心、测试、脚本、小程序
const scanDirs = ['src', 'test', 'scripts', 'miniprogram'].map((d) => path.join(root, d));
const jsFiles = scanDirs.flatMap((d) => walk(d)).filter((f) => f.endsWith('.js'));
for (const file of jsFiles) {
  try {
    execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' });
  } catch (error) {
    fail(`[语法错误] ${path.relative(root, file)}\n${String(error.stderr || error.message)}`);
  }
}

// 2) fixtures JSON 必须可解析且带 mode=demo
const fixtureDir = path.join(root, 'src', 'fixtures');
for (const name of fs.readdirSync(fixtureDir).filter((f) => f.endsWith('.json'))) {
  const full = path.join(fixtureDir, name);
  try {
    const data = JSON.parse(fs.readFileSync(full, 'utf8'));
    if (data.mode !== 'demo') fail(`[fixture 缺少 mode=demo] ${name}`);
  } catch (error) {
    fail(`[JSON 解析失败] ${name}: ${error.message}`);
  }
}

// 3) 小程序配置 JSON 必须可解析
const mpRoot = path.join(root, 'miniprogram');
const jsonFiles = [path.join(root, 'project.config.json'), ...walk(mpRoot).filter((f) => f.endsWith('.json'))];
for (const file of jsonFiles) {
  try {
    JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    fail(`[JSON 解析失败] ${path.relative(root, file)}: ${error.message}`);
  }
}

// 4) WXML 标签闭合检查（防止手写模板漏闭合，微信工具才会报的错提前发现）
const VOID_TAGS = new Set(['input', 'image', 'icon', 'import', 'include', 'wxs', 'br']);
for (const file of walk(mpRoot).filter((f) => f.endsWith('.wxml'))) {
  const src = fs.readFileSync(file, 'utf8').replace(/<!--[\s\S]*?-->/g, '');
  const tags = [...src.matchAll(/<\/?([a-zA-Z][\w-]*)([^>]*?)(\/?)>/g)];
  const stack = [];
  for (const m of tags) {
    const isClose = m[0].startsWith('</');
    const name = m[1];
    const isSelfClose = m[3] === '/';
    if (isClose) {
      const top = stack.pop();
      if (top !== name) {
        fail(`[WXML 闭合不匹配] ${path.relative(root, file)}: 期望 </${top}>，得到 </${name}>`);
        break;
      }
    } else if (!isSelfClose && !VOID_TAGS.has(name)) {
      stack.push(name);
    }
  }
  if (stack.length) fail(`[WXML 未闭合] ${path.relative(root, file)}: ${stack.join(', ')}`);
}

// 5) 小程序页面三件套齐全（同一页面必须有 js/wxml）
for (const file of walk(path.join(mpRoot, 'pages')).filter((f) => f.endsWith('.js'))) {
  const base = file.slice(0, -3);
  for (const ext of ['.wxml', '.json']) {
    if (!fs.existsSync(base + ext)) fail(`[页面文件缺失] ${path.relative(root, base + ext)}`);
  }
}

// 6) 源码与 fixtures 不得出现疑似真实 Token
const tokenPattern = /Bearer\s+[A-Za-z0-9._-]{20,}/;
for (const file of [...jsFiles, ...walk(fixtureDir)]) {
  const text = fs.readFileSync(file, 'utf8');
  if (tokenPattern.test(text)) fail(`[疑似真实 Token] ${path.relative(root, file)}`);
}

if (errors > 0) {
  console.error(`\ncheck 失败：共 ${errors} 项问题`);
  process.exit(1);
}
console.log(
  `check 通过：语法检查 ${jsFiles.length} 个 JS、${jsonFiles.length} 个 JSON、WXML 闭合与页面结构校验通过`
);
