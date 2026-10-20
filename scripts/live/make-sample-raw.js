'use strict';

/**
 * 生成一份「模拟 MCP 原始返回」的样本数据，用于：
 * 1. 没有 Token 时验证计算链路（评审、CI、演示）；
 * 2. 新增字段映射后做回归。
 *
 * 字段形状刻意做成**接近真实 MCP 返回**的嵌套结构（data.meals / data.comboItems / 金额为元字符串），
 * 以便暴露 normalize.js 的容错能力。
 *
 * 用法：node scripts/live/make-sample-raw.js [输出目录，默认 .mcd-live/sample-raw]
 */

const fs = require('node:fs');
const path = require('node:path');

const outDir = process.argv[2] || path.join('.mcd-live', 'sample-raw');

const STORE = { code: 0, message: 'ok', data: { stores: [{ storeCode: 'S-DEMO-01', storeName: '演示门店（虚构）', distanceMeters: 860 }] } };

const ITEMS = {
  'IT-BURGER': { name: '演示牛肉堡', price: '18.00' },
  'IT-NUGGETS': { name: '演示鸡块(5块装)', price: '12.50' },
  'IT-FRIES-M': { name: '演示薯条(中份)', price: '11.00' },
  'IT-FRIES-L': { name: '演示薯条(大份)', price: '13.50' },
  'IT-DRINK-M': { name: '演示饮料(中杯)', price: '9.50' },
  'IT-DRINK-L': { name: '演示饮料(大杯)', price: '11.50' },
  'IT-SUNDAE': { name: '演示圣代', price: '8.00' },
  'IT-PIE': { name: '演示派', price: '7.00' },
};

const COMBOS = [
  {
    code: 'CMB-BASIC',
    name: '演示套餐·基础',
    price: '27.60',
    items: [
      ['IT-BURGER', 1], ['IT-FRIES-M', 1], ['IT-DRINK-M', 1],
    ],
  },
  {
    code: 'CMB-LARGE',
    name: '演示套餐·大份',
    price: '36.00',
    items: [
      ['IT-BURGER', 1], ['IT-FRIES-L', 1], ['IT-DRINK-L', 1],
    ],
  },
  {
    code: 'CMB-NUGGETS',
    name: '演示套餐·鸡块',
    price: '19.90',
    items: [
      ['IT-NUGGETS', 1], ['IT-FRIES-M', 1], ['IT-DRINK-M', 1],
    ],
  },
  {
    code: 'CMB-SWEET',
    name: '演示套餐·甜品',
    price: '15.00',
    items: [
      ['IT-SUNDAE', 1], ['IT-PIE', 1],
    ],
    // 故意缺一个单品报价，用于验证「不猜测、照实不可比」
    missingPriceFor: 'IT-PIE',
  },
];

function write(name, data) {
  fs.writeFileSync(path.join(outDir, name), JSON.stringify(data, null, 2), 'utf8');
}

function priceResponse(amountYuan) {
  return {
    code: 0,
    message: 'ok',
    data: {
      items: [{ amount: Number(amountYuan) }],
      itemTotalAmount: String(amountYuan),
      deliveryFee: '0.00',
      discountAmount: '0.00',
      payableAmount: String(amountYuan),
    },
  };
}

fs.mkdirSync(outDir, { recursive: true });
write('stores.json', STORE);

// query-meals
write('meals.json', {
  code: 0,
  message: 'ok',
  data: {
    meals: COMBOS.map((c) => ({
      mealCode: c.code,
      mealName: c.name,
      categoryName: '套餐',
      tags: [{ name: '套餐' }, { name: '人气' }],
      minPrice: c.price,
    })),
  },
});

for (const combo of COMBOS) {
  // query-meal-detail
  write(`detail-${combo.code}.json`, {
    code: 0,
    message: 'ok',
    data: {
      mealCode: combo.code,
      mealName: combo.name,
      comboItems: combo.items.map(([code, qty]) => ({
        mealCode: code,
        mealName: ITEMS[code].name,
        quantity: qty,
        isGift: false,
      })),
    },
  });

  // calculate-price：套餐
  write(`price-${combo.code}-combo.json`, priceResponse(combo.price));

  // calculate-price：逐项单买
  for (const [code] of combo.items) {
    if (combo.missingPriceFor === code) continue; // 故意不产出 → 模拟核价失败
    write(`price-${combo.code}-single-${code}.json`, priceResponse(ITEMS[code].price));
  }
}

const count = fs.readdirSync(outDir).filter((f) => f.endsWith('.json')).length;
console.log(`已生成示例原始数据 ${count} 个文件 → ${outDir}`);
console.log('注意：门店、餐品、价格均为虚构，仅用于验证计算链路，不代表任何真实报价。');
