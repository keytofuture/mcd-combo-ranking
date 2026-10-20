'use strict';

/**
 * v1.1 范围守卫（Step 1 断言）。
 * 直接验证 PRD v1.1 已取消的东西没有残留在新契约与源码里：
 * 单品走势、历史窗口、固定时点、定时/调度、漏采补采、历史覆盖率。
 */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const srcDir = path.join(root, 'src');

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

// v1.0 的调度 / 历史概念标识符，不得再出现在源码中
const FORBIDDEN = [
  'timewindow',
  'summarizeHistory',
  'selectBatch',
  'resolveTargetSlot',
  'DEFAULT_SLOTS',
  'monitoringEnabledAt',
  'windowBounds',
  'inclusiveDayCount',
  'gapCount',
  'node-cron',
  'setInterval',
  'samplingSchedule',
];

test('源码中不残留 v1.0 的历史窗口 / 固定时点 / 调度标识符', () => {
  const self = __filename;
  const files = [...walk(srcDir), ...walk(path.join(root, 'test'))].filter(
    (f) => f.endsWith('.js') && f !== self
  );
  const hits = [];
  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    for (const term of FORBIDDEN) {
      if (text.includes(term)) hits.push(`${path.relative(root, file)} -> ${term}`);
    }
  }
  assert.deepStrictEqual(hits, [], `发现 v1.0 残留：\n${hits.join('\n')}`);
});

test('已删除的旧文件确实不存在', () => {
  for (const rel of [
    'src/core/timewindow.js',
    'src/core/batch.js',
    'src/fixtures/demo-history.json',
    'test/timewindow.test.js',
    'test/batch.test.js',
  ]) {
    assert.strictEqual(fs.existsSync(path.join(root, rel)), false, `${rel} 应已删除`);
  }
});

test('PRD.md 为 v1.1，且不再把「走势/定时」列为待补功能', () => {
  const prd = fs.readFileSync(path.join(root, 'PRD.md'), 'utf8');
  assert.match(prd.split('\n')[0], /v1\.1/);
  assert.match(prd, /取消/);
  assert.match(prd, /按需更新/);
});

test('核心模块齐全：按需更新所需的模块都已建立', () => {
  for (const rel of [
    'src/core/clock.js',
    'src/core/contracts.js',
    'src/core/coverage.js',
    'src/core/validity.js',
    'src/core/update.js',
    'src/core/publish.js',
    'src/core/rank-batch.js',
  ]) {
    assert.strictEqual(fs.existsSync(path.join(root, rel)), true, `${rel} 缺失`);
  }
});

test('fixtures 全部为 demo 模式且不含按日价格序列', () => {
  const fixtureDir = path.join(srcDir, 'fixtures');
  for (const name of fs.readdirSync(fixtureDir).filter((f) => f.endsWith('.json'))) {
    const data = JSON.parse(fs.readFileSync(path.join(fixtureDir, name), 'utf8'));
    assert.strictEqual(data.mode, 'demo', `${name} 缺少 mode=demo`);
    assert.ok(!('history' in data), `${name} 不应含历史序列`);
  }
});
