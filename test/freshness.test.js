'use strict';

/**
 * 「数据多旧」的文案测试。
 * 这个模块存在的理由：界面上曾经写死「19:49 现查」，而数据其实是三天前抓的。
 * 新鲜度必须是算出来的、且旧了要变脸色，不能靠一句固定文案假装新鲜。
 */

const test = require('node:test');
const assert = require('node:assert');

const { describeAge } = require('../miniprogram/utils/freshness.js');

const now = Date.parse('2026-10-20T08:00:00.000Z');
const before = (ms) => new Date(now - ms).toISOString();

const MIN = 60 * 1000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

test('刚抓的：5 分钟内算「刚刚」', () => {
  assert.strictEqual(describeAge(before(0), now).text, '刚刚');
  assert.strictEqual(describeAge(before(4 * MIN), now).text, '刚刚');
  assert.strictEqual(describeAge(before(4 * MIN), now).level, 'fresh');
});

test('分钟级：不到 1 小时显示分钟', () => {
  assert.strictEqual(describeAge(before(30 * MIN), now).text, '30 分钟前');
  assert.strictEqual(describeAge(before(59 * MIN), now).level, 'fresh');
});

test('小时级：不到 24 小时显示小时', () => {
  assert.strictEqual(describeAge(before(5 * HOUR), now).text, '5 小时前');
  assert.strictEqual(describeAge(before(23 * HOUR), now).level, 'fresh');
});

test('昨天、几天前：平滑进入 aging', () => {
  assert.strictEqual(describeAge(before(30 * HOUR), now).text, '昨天');
  assert.strictEqual(describeAge(before(30 * HOUR), now).level, 'aging');
  assert.strictEqual(describeAge(before(2 * DAY), now).text, '2 天前');
});

test('三天及以上标记为 stale（界面据此显示告警）', () => {
  assert.strictEqual(describeAge(before(3 * DAY), now).level, 'stale');
  assert.strictEqual(describeAge(before(3 * DAY), now).text, '3 天前');
  assert.strictEqual(describeAge(before(10 * DAY), now).text, '1 周前');
  assert.strictEqual(describeAge(before(70 * DAY), now).text, '2 个月前');
});

test('手机时钟早于服务器时不出现负数', () => {
  const future = new Date(now + 10 * MIN).toISOString();
  const r = describeAge(future, now);
  assert.strictEqual(r.level, 'fresh');
  assert.ok(!/-/.test(r.text), '不应出现负号：' + r.text);
});

test('时间缺失或非法时明确说「未知」，不冒充新鲜', () => {
  assert.strictEqual(describeAge(null, now).level, 'unknown');
  assert.strictEqual(describeAge('', now).level, 'unknown');
  assert.strictEqual(describeAge('不是时间', now).level, 'unknown');
  assert.strictEqual(describeAge(null, now).text, '时间未知');
});
