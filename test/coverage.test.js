'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { buildCoverage, catalogCompletenessText } = require('../src/core/coverage');

const fixture = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../src/fixtures/demo-coverage-cases.json'), 'utf8')
);

for (const item of fixture.cases) {
  test(`${item.id} ${item.title}`, () => {
    const coverage = buildCoverage({ catalogComplete: item.catalogComplete, combos: item.combos });
    const expected = item.expected;
    for (const [key, value] of Object.entries(expected)) {
      assert.strictEqual(coverage[key], value, `${key} 不符合预期`);
    }
    // 失败数与缺价数可能重叠：验证没有相加成「总商品数」
    assert.notStrictEqual(
      coverage.quoteFailureCount + coverage.missingPriceCount,
      coverage.requiredSingleCount + coverage.discoveredComboCount,
      '失败数 + 缺价数不能当作总商品数'
    );
  });
}

test('T22 目录不完整 -> 不计算全店覆盖率，界面不称全店最优', () => {
  const item = fixture.cases.find((c) => c.id === 'T22');
  const coverage = buildCoverage({ catalogComplete: item.catalogComplete, combos: item.combos });
  assert.strictEqual(coverage.fullStoreCoverageRatio, null);
  assert.strictEqual(coverage.catalogComplete, false);
  assert.match(catalogCompletenessText(false), /不完整/);
});

test('单品数为本批默认套餐所需的去重规格数，不是全店单品数', () => {
  const coverage = buildCoverage({
    catalogComplete: true,
    combos: [
      { comboVariantId: 'c1', eligible: true, observation: {}, components: [{ variantId: 's1', quote: { amountCents: 100 } }] },
      { comboVariantId: 'c2', eligible: true, observation: {}, components: [{ variantId: 's1', quote: { amountCents: 100 } }] },
    ],
  });
  assert.strictEqual(coverage.requiredSingleCount, 1, '同一规格跨套餐只应计一次');
});

test('成功报价数只统计符合普通价口径的报价', () => {
  const coverage = buildCoverage({
    catalogComplete: true,
    combos: [
      {
        comboVariantId: 'c1', eligible: true,
        observation: { amountCents: 2760, pricePolicyState: 'requires_entitlement' },
        components: [{ variantId: 's1', quote: { amountCents: 100, pricePolicyState: 'verified_ordinary' } }],
      },
    ],
  });
  assert.strictEqual(coverage.quoteSuccessCount, 1, '权益不可核实的报价不计入成功');
});
