'use strict';

/**
 * 原型数据构建（v1.1）——薄壳，数值组装逻辑在 scripts/lib/demo-payload.js。
 *
 * 产出：
 * - prototype/prototype-data.js  供 index.html 读取
 * - prototype/preview.html       自包含单文件预览（内联数据与样式）
 */

const fs = require('node:fs');
const path = require('node:path');
const { buildDemoPayload } = require('./lib/demo-payload');

const root = path.join(__dirname, '..');
const payload = buildDemoPayload();

// 输出 prototype-data.js
const outDir = path.join(root, 'prototype');
fs.mkdirSync(outDir, { recursive: true });
const dataJs =
  '/* 自动生成，请勿手改。来源：scripts/lib/demo-payload.js（数值由 src/core 统一规则计算） */\n' +
  'window.PROTOTYPE_DATA = ' + JSON.stringify(payload, null, 2) + ';\n';
fs.writeFileSync(path.join(outDir, 'prototype-data.js'), dataJs, 'utf8');

// 生成自包含 preview.html（原型）与 simulator-preview.html（小程序仿真）
const pages = [
  ['index.html', 'preview.html'],
  ['simulator.html', 'simulator-preview.html'],
];
for (const [srcName, outName] of pages) {
  const srcPath = path.join(outDir, srcName);
  if (!fs.existsSync(srcPath)) continue;
  const html = fs.readFileSync(srcPath, 'utf8');
  const inline = html.replace(
    /<script src="prototype-data\.js"><\/script>/,
    `<script>\n${dataJs}\n</script>`
  );
  fs.writeFileSync(path.join(outDir, outName), inline, 'utf8');
}

const p = payload.channels.pickup.scenarios.normal.published;
const d = payload.channels.delivery.scenarios.normal.published;
console.log('已生成：prototype/prototype-data.js、preview.html、simulator-preview.html');
console.log(`自取：可比 ${p.ranking.length} 个，不可比 ${p.notComparable.length} 个，目录完整=${p.coverage.catalogComplete}`);
console.log(`外送：可比 ${d.ranking.length} 个，不可比 ${d.notComparable.length} 个，目录完整=${d.coverage.catalogComplete}`);
