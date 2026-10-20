'use strict';

/**
 * MCP 返回解析的回归测试。
 * 断言的都是**实测踩过的坑**（2026-10-17 用真实门店 1420207 校准）：
 * 混排文本、meals 以 code 为键、金额单位不一致、默认组成取 isDefault。
 */

const test = require('node:test');
const assert = require('node:assert');

const {
  extractJson,
  normalizeMeals,
  normalizeDetail,
  normalizePrice,
  assembleCombos,
} = require('../src/mcp/normalize');

test('extractJson：说明文字里的花括号不会破坏解析', () => {
  const text = [
    '# API Response',
    '结构示例：{ "data": { "meals": {} } }  ← 这是说明里的花括号',
    '{"success":true,"code":200,"data":{"meals":{"123":{"name":"测试汉堡","currentPrice":"9.9"}}}}',
    '## 尾部说明 { 未闭合',
  ].join('\n');
  const j = extractJson(text);
  assert.strictEqual(j.success, true);
  assert.strictEqual(j.data.meals['123'].name, '测试汉堡');
});

test('normalizeMeals：meals 以 code 为键，分类通过 categories 关联', () => {
  const raw = {
    success: true,
    data: {
      categories: [{ categoryName: '汉堡', meals: [{ code: '123', tags: ['单品'] }] }],
      meals: {
        123: { name: '测试汉堡', currentPrice: '22.5', originalPrice: '22.5' },
        456: { name: '测试套餐', currentPrice: '33.5', originalPrice: '46' },
      },
    },
  };
  const meals = normalizeMeals(raw);
  assert.strictEqual(meals.length, 2);
  const burger = meals.find((m) => m.code === '123');
  assert.strictEqual(burger.name, '测试汉堡');
  assert.strictEqual(burger.categoryName, '汉堡');
  assert.strictEqual(burger.menuPriceCents, 2250); // 元字符串 → 分
  const combo = meals.find((m) => m.code === '456');
  assert.strictEqual(combo.categoryName, ''); // 未出现在 categories 中，不臆造分类
});

test('normalizePrice：calculate-price 的金额本来就是分，不能再乘 100', () => {
  const raw = {
    success: true,
    data: { price: 3350, originalPrice: 3350, discount: 0, productList: [{ productCode: '1', productName: '测试套餐', quantity: 1 }] },
  };
  const p = normalizePrice(raw);
  assert.strictEqual(p.priceCents, 3350);
  assert.strictEqual(p.hasProduct, true);
  assert.strictEqual(p.productName, '测试套餐');
});

test('normalizeDetail：只取 isDefault=1 的选项作为默认组成', () => {
  const raw = {
    success: true,
    data: {
      code: '456',
      name: '测试套餐',
      rounds: [
        { id: 1, name: '主餐', choices: [{ code: '100', name: '汉堡', quantity: 1, isDefault: 1 }] },
        { id: 2, name: '小食', choices: [
          { code: '200', name: '中薯条', quantity: 1, isDefault: 1 },
          { code: '201', name: '大薯条', quantity: 0, isDefault: 0 },
        ] },
      ],
    },
  };
  const d = normalizeDetail(raw);
  assert.strictEqual(d.components.length, 2);
  assert.deepStrictEqual(d.components.map((c) => c.name), ['汉堡', '中薯条']);
});

test('assembleCombos：套餐内专属码无独立售价 → 照实标缺价（strict 模式）', () => {
  const meals = [
    { code: '456', name: '测试套餐', menuPriceCents: 3350, originalPriceCents: 4600 },
    { code: '100', name: '汉堡', menuPriceCents: 2250 },
  ];
  const details = {
    456: { success: true, data: { rounds: [{ id: 1, choices: [
      { code: '100', name: '汉堡', quantity: 1, isDefault: 1 },
      { code: '3050', name: '可乐中杯', quantity: 1, isDefault: 1 },
    ] }] } },
  };
  const prices = { '456|combo': { success: true, data: { price: 3350, productList: [{ productCode: '456' }] } } };

  const { combos } = assembleCombos({ meals, allMeals: meals, details, prices, channel: 'pickup', options: { strict: true } });
  const combo = combos[0];
  assert.strictEqual(combo.comboPriceCents, 3350);
  const drink = combo.components.find((c) => c.name === '可乐中杯');
  assert.strictEqual(drink.unitPriceCents, null);
  assert.strictEqual(drink.quote.reasonCode, 'COMPONENT_PRICE_MISSING');
});

test('assembleCombos：非 strict 时按唯一同名单品补价，并标记来源便于披露', () => {
  const meals = [
    { code: '456', name: '测试套餐', menuPriceCents: 3350 },
    { code: '100', name: '汉堡', menuPriceCents: 2250 },
    { code: '9900', name: '可乐', menuPriceCents: 950 },
  ];
  const details = {
    456: { success: true, data: { rounds: [{ id: 1, choices: [
      { code: '100', name: '汉堡', quantity: 1, isDefault: 1 },
      { code: '3050', name: '可乐中杯', quantity: 1, isDefault: 1 },
    ] }] } },
  };
  const prices = { '456|combo': { success: true, data: { price: 3350, productList: [{ productCode: '456' }] } } };

  const { combos } = assembleCombos({ meals, allMeals: meals, details, prices, channel: 'pickup' });
  const drink = combos[0].components.find((c) => c.name === '可乐中杯');
  assert.strictEqual(drink.unitPriceCents, 950);
  assert.strictEqual(drink.priceSource, 'menu-name-match');
  assert.strictEqual(drink.matchedName, '可乐'); // 报告据此披露「按同名匹配」
});

test('assembleCombos：组件名绝不匹配到套餐自己（曾把 D 虚增一整份套餐价）', () => {
  const meals = [
    { code: '5449', name: '吉士汉堡包套餐', menuPriceCents: 2600, originalPriceCents: 3850 },
    { code: '7001', name: '吉士汉堡包', menuPriceCents: null }, // 零售单品，无菜单价
    { code: '9900', name: '可乐', menuPriceCents: 950 },
  ];
  const details = {
    5449: { success: true, data: { rounds: [{ id: 1, choices: [{ code: '8888', name: '吉士汉堡包', quantity: 1, isDefault: 1 }] }] } },
  };
  const prices = { '5449|combo': { success: true, data: { price: 2600, productList: [{ productCode: '5449' }] } } };

  const { combos } = assembleCombos({ meals, allMeals: meals, details, prices, channel: 'pickup' });
  const burger = combos[0].components[0];
  // 既不能匹配「吉士汉堡包套餐」（自己），也不能拿 null 当 0
  assert.notStrictEqual(burger.unitPriceCents, 2600);
  assert.strictEqual(burger.unitPriceCents, null);
});

test('assembleCombos：同名有歧义时不猜，保持缺价', () => {
  const meals = [
    { code: '456', name: '测试套餐', menuPriceCents: 3350 },
    { code: '1', name: '可乐', menuPriceCents: 950 },
    { code: '2', name: '可乐', menuPriceCents: 1000 },
  ];
  const details = {
    456: { success: true, data: { rounds: [{ id: 1, choices: [{ code: '3050', name: '可乐中杯', quantity: 1, isDefault: 1 }] }] } },
  };
  const prices = { '456|combo': { success: true, data: { price: 3350, productList: [{ productCode: '456' }] } } };

  const { combos } = assembleCombos({ meals, allMeals: meals, details, prices, channel: 'pickup' });
  assert.strictEqual(combos[0].components[0].unitPriceCents, null);
});
