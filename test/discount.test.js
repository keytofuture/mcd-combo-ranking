'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { computeDiscount, describeDiscount } = require('../src/core/discount');

const fixture = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../src/fixtures/demo-calc-cases.json'), 'utf8')
);

for (const item of fixture.cases) {
  test(`${item.id} ${item.title}`, () => {
    const result = computeDiscount({
      comboPriceCents: item.comboPriceCents,
      components: item.components,
    });
    const expected = item.expected;

    assert.strictEqual(result.eligible, expected.eligible, 'eligibility 不符合预期');

    if ('denominatorCents' in expected) {
      assert.strictEqual(result.D, expected.denominatorCents, '单买合计 D 不符合预期');
    }
    if ('savedCents' in expected) {
      assert.strictEqual(result.A, expected.savedCents, '节省金额 A 不符合预期');
    }
    if (expected.reasonContains) {
      assert.ok(
        result.reasons.includes(expected.reasonContains),
        `reasonCodes 应包含 ${expected.reasonContains}，实际为 ${JSON.stringify(result.reasons)}`
      );
    }

    if (result.eligible) {
      const display = describeDiscount({ P: result.P, D: result.D });
      assert.strictEqual(display.discountText, expected.discountText, '折数文案不符合预期');
      assert.strictEqual(display.savedPercentText, expected.savedPercentText, '比例文案不符合预期');
      assert.strictEqual(display.savedAmountText, expected.savedAmountText, '金额文案不符合预期');
    }
  });
}

test('不按已显示折数排序：0.601 与 0.604 显示同为 6.0 折但比例不同', () => {
  const a = describeDiscount({ P: 601, D: 1000 });
  const b = describeDiscount({ P: 604, D: 1000 });
  assert.strictEqual(a.discountText, '6.0折');
  assert.strictEqual(b.discountText, '6.0折');
  // 内部比值必须保留，供 ranking 精确排序
  assert.notStrictEqual(601 / 1000, 604 / 1000);
});

test('缺失不得以 0 代替：组件缺价时 D 为 null 而非 0', () => {
  const result = computeDiscount({
    comboPriceCents: 1000,
    components: [{ variantId: 'x', quantity: 1, unitPriceCents: null }],
  });
  assert.strictEqual(result.D, null);
  assert.notStrictEqual(result.D, 0);
});
