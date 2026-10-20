'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const {
  evaluateObservation,
  evaluateComboEligibility,
} = require('../src/core/eligibility');

/** 构造一条默认「完全合格」的单品观测，再按用例覆盖字段 */
function makeObservation(overrides = {}) {
  return {
    pricePolicyState: 'verified_ordinary',
    saleState: 'available',
    conditionState: 'verified_same',
    feeSplitState: 'food_only_verified',
    amountScope: 'single_unit_food',
    quotedQuantity: 1,
    amountCents: 1000,
    evidenceType: 'verified_quote',
    ...overrides,
  };
}

test('基准观测：全部字段合格 -> 可成为普通价有效点', () => {
  const r = evaluateObservation(makeObservation());
  assert.strictEqual(r.eligible, true);
  assert.deepStrictEqual(r.reasons, []);
});

test('A11 会员/定向权益无法排除 -> 不成为普通价有效点', () => {
  const r = evaluateObservation(makeObservation({ pricePolicyState: 'requires_entitlement' }));
  assert.strictEqual(r.eligible, false);
  assert.ok(r.reasons.includes('ENTITLEMENT_UNKNOWN'));
});

test('权益未知（含 null）同样退出，不静默放行', () => {
  const r = evaluateObservation(makeObservation({ pricePolicyState: null }));
  assert.strictEqual(r.eligible, false);
  assert.ok(r.reasons.includes('ENTITLEMENT_UNKNOWN'));
});

test('仅菜单展示价、未核价 -> 不成为核价依据', () => {
  const r = evaluateObservation(makeObservation({ evidenceType: 'menu_display_only' }));
  assert.strictEqual(r.eligible, false);
  assert.ok(r.reasons.includes('PRICE_POLICY_UNVERIFIED'));
});

test('A37 多件购物车单行分摊价 -> QUOTE_NOT_SINGLE_UNIT，不作独立单份基准', () => {
  const r = evaluateObservation(makeObservation({ quotedQuantity: 2 }));
  assert.strictEqual(r.eligible, false);
  assert.ok(r.reasons.includes('QUOTE_NOT_SINGLE_UNIT'));
});

test('A31 报价含两份总额 -> 不作单份价', () => {
  const r = evaluateObservation(makeObservation({ quotedQuantity: 2, amountScope: 'unknown' }));
  assert.strictEqual(r.eligible, false);
  assert.ok(r.reasons.includes('QUOTE_NOT_SINGLE_UNIT'));
});

test('费用无法拆分 -> FEE_NOT_SEPARABLE', () => {
  const r = evaluateObservation(makeObservation({ feeSplitState: 'not_separable' }));
  assert.strictEqual(r.eligible, false);
  assert.ok(r.reasons.includes('FEE_NOT_SEPARABLE'));
});

test('请求失败记 unknown，不得推断停售', () => {
  const r = evaluateObservation(makeObservation({ saleState: 'unknown' }));
  assert.strictEqual(r.eligible, false);
  assert.ok(r.reasons.includes('SALE_NOT_AVAILABLE'));
});

function makeCombo(overrides = {}) {
  return {
    defaultConfigVerified: true,
    observation: makeObservation({ amountScope: 'default_combo_food' }),
    components: [
      makeObservation({ variantId: 'x', unitPriceCents: 2400 }),
      makeObservation({ variantId: 'y', unitPriceCents: 1200 }),
    ],
    ...overrides,
  };
}

test('基准套餐：默认组成可核实且条件一致 -> 可进入主榜', () => {
  const r = evaluateComboEligibility(makeCombo());
  assert.strictEqual(r.eligible, true);
  assert.deepStrictEqual(r.reasons, []);
});

test('A04/A18 默认组成未核实 -> DEFAULT_CONFIG_UNKNOWN', () => {
  const r = evaluateComboEligibility(makeCombo({ defaultConfigVerified: false }));
  assert.strictEqual(r.eligible, false);
  assert.ok(r.reasons.includes('DEFAULT_CONFIG_UNKNOWN'));
});

test('A18 供餐条件不同（即使时间差很小）-> CONDITION_MISMATCH 退出', () => {
  const combo = makeCombo();
  combo.components[1] = makeObservation({
    variantId: 'y',
    unitPriceCents: 1200,
    conditionState: 'mismatch',
  });
  const r = evaluateComboEligibility(combo);
  assert.strictEqual(r.eligible, false);
  assert.ok(r.reasons.includes('CONDITION_MISMATCH'));
});

test('A35 供餐证据未知（null）-> CONDITION_UNKNOWN 退出主榜，不得当作一致', () => {
  const combo = makeCombo();
  combo.components[0] = makeObservation({
    variantId: 'x',
    unitPriceCents: 2400,
    conditionState: null,
  });
  const r = evaluateComboEligibility(combo);
  assert.strictEqual(r.eligible, false);
  assert.ok(r.reasons.includes('CONDITION_UNKNOWN'));
});

test('A12 组件与套餐跨批/超跨度 -> 不比较、不借旧价', () => {
  const combo = makeCombo();
  combo.observation = makeObservation({
    amountScope: 'default_combo_food',
    conditionState: 'mismatch',
  });
  const r = evaluateComboEligibility(combo);
  assert.strictEqual(r.eligible, false);
  assert.ok(r.reasons.includes('CONDITION_MISMATCH'));
});

test('A05 同名不同规格不合并：数据层以不同 id / 来源标识区分', () => {
  const market = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../src/fixtures/demo-market.json'), 'utf8')
  );
  const sameName = market.variants.filter((v) => v.name === '演示汉堡');
  assert.strictEqual(sameName.length, 2, '应存在两个同名规格');
  assert.notStrictEqual(sameName[0].id, sameName[1].id);
  assert.notStrictEqual(sameName[0].sourceProductRef, sameName[1].sourceProductRef);
  assert.notStrictEqual(sameName[0].variantLabel, sameName[1].variantLabel);
});

test('自选套餐（随心选/随心配）默认组成只有 1 项 -> 判组成不完整', () => {
  // 实测：学生专享汉堡小食随心选 只返回「中薯条×2」，饮品随心选 只返回「可乐中杯×1」。
  // 名称描述的内容和默认组成完全不是一回事，这种 A 算出来就是假的。
  const r = evaluateComboEligibility(
    makeCombo({
      name: '学生专享汉堡小食随心选',
      components: [makeObservation({ variantId: 'fries', unitPriceCents: 1350 })],
    })
  );
  assert.strictEqual(r.eligible, false);
  assert.ok(r.reasons.includes('DEFAULT_CONFIG_INCOMPLETE'));
});

test('自选套餐组成完整（≥2 项）时正常参与比较', () => {
  const r = evaluateComboEligibility(
    makeCombo({ name: '人气超值四件套随心选' })
  );
  assert.strictEqual(r.eligible, true, '组成完整就不该误伤：' + r.reasons.join(','));
});

test('名称不含自选字样时，单项组成不触发该规则', () => {
  const r = evaluateComboEligibility(
    makeCombo({
      name: '麦辣鸡翅4块套餐',
      components: [makeObservation({ variantId: 'wing', unitPriceCents: 1200, quantity: 4 })],
    })
  );
  assert.ok(!r.reasons.includes('DEFAULT_CONFIG_INCOMPLETE'));
});
