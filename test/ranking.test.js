'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { rankCombos } = require('../src/core/ranking');
const { describeDiscount } = require('../src/core/discount');

const fixture = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../src/fixtures/demo-ranking-cases.json'), 'utf8')
);

function toRankItems(items) {
  return items.map((it) => ({
    id: it.id,
    P: it.P,
    D: it.D,
    A: it.D - it.P,
    ratio: { num: it.P, den: it.D },
  }));
}

for (const item of fixture.cases) {
  test(`${item.id} ${item.title}`, () => {
    const ranked = rankCombos(toRankItems(item.items));
    const expected = item.expected;

    if (expected.order) {
      assert.deepStrictEqual(ranked.map((r) => r.id), expected.order, '展示顺序不符合预期');
    }
    if (expected.ranks) {
      assert.deepStrictEqual(ranked.map((r) => r.rank), expected.ranks, '竞争名次不符合预期');
    }
    if (expected.discountTexts) {
      const texts = ranked.map((r) => describeDiscount({ P: r.P, D: r.D }).discountText);
      assert.deepStrictEqual(texts, expected.discountTexts, '折数文案不符合预期');
    }
  });
}

test('竞争排名跳号：1、1、3 而非 1、1、2', () => {
  const ranked = rankCombos([
    { id: 'a', P: 600, D: 1000, A: 400, ratio: { num: 600, den: 1000 } },
    { id: 'b', P: 1200, D: 2000, A: 800, ratio: { num: 1200, den: 2000 } },
    { id: 'c', P: 700, D: 1000, A: 300, ratio: { num: 700, den: 1000 } },
  ]);
  assert.deepStrictEqual(ranked.map((r) => r.rank), [1, 1, 3]);
});

test('缺少合法 P/D/ratio 的项目不参与排名', () => {
  const ranked = rankCombos([
    { id: 'good', P: 600, D: 1000, A: 400, ratio: { num: 600, den: 1000 } },
    { id: 'missing-price', P: null, D: 1000, A: null, ratio: null },
    { id: 'zero-den', P: 100, D: 0, A: 100, ratio: { num: 100, den: 0 } },
  ]);
  assert.deepStrictEqual(ranked.map((r) => r.id), ['good']);
});
