'use strict';

/**
 * 榜单构建中「哪些算套餐」的回归测试。
 * 踩过的坑：麦当劳主力套餐叫「三件套 / 四件套」，不含「套餐」二字，
 * 早期规则只匹配 /套餐|双人餐|家庭餐/，导致 28 个套餐被漏掉。
 */

const test = require('node:test');
const assert = require('node:assert');

const { filterCombos } = require('../scripts/live/rank');

const meals = [
  { code: '1', name: '巨无霸三件套', category: '', tags: [], menuPriceCents: 3650 },
  { code: '2', name: '人气超值四件套随心选', category: '', tags: [], menuPriceCents: 2800 },
  { code: '3', name: '麦麦周末双人餐', category: '', tags: [], menuPriceCents: 4990 },
  { code: '4', name: 'BFF四宫格小食盘双人餐', category: '', tags: [], menuPriceCents: 6290 },
  { code: '5', name: '麦乐鸡套餐', category: '', tags: [], menuPriceCents: 2500 },
  { code: '6', name: '巨无霸', category: '', tags: [], menuPriceCents: 2550 },
  { code: '7', name: '薯条', category: '小食', tags: [], menuPriceCents: 1350 },
];

test('filterCombos：三件套 / 四件套 / 随心选 / 双人餐 都算套餐', () => {
  const { list } = filterCombos(meals, 20);
  const names = list.map((m) => m.name);
  assert.ok(names.includes('巨无霸三件套'));
  assert.ok(names.includes('人气超值四件套随心选'));
  assert.ok(names.includes('麦麦周末双人餐'));
  assert.ok(names.includes('BFF四宫格小食盘双人餐'));
  assert.ok(names.includes('麦乐鸡套餐'));
});

test('filterCombos：纯单品不进候选（但不会被当成套餐）', () => {
  const { list } = filterCombos(meals, 20);
  const names = list.map((m) => m.name);
  assert.ok(!names.includes('巨无霸'));
  assert.ok(!names.includes('薯条'));
});

test('filterCombos：超过上限时标记 truncated', () => {
  const { list, truncated } = filterCombos(meals, 2);
  assert.strictEqual(list.length, 2);
  assert.strictEqual(truncated, true);
});
