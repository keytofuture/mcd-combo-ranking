'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const contracts = require('../src/core/contracts');

const market = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../src/fixtures/demo-market.json'), 'utf8')
);

test('PriceContext：外送必须带 addressRef/addressAlias，自取可省', () => {
  const delivery = market.contexts.find((c) => c.channel === 'delivery');
  const built = contracts.makePriceContext(delivery);
  assert.strictEqual(built.addressAlias, '演示地址A');

  assert.throws(
    () => contracts.makePriceContext({ ...delivery, addressRef: null }),
    /addressRef/,
    '外送缺少 addressRef 应报错'
  );

  const pickup = market.contexts.find((c) => c.channel === 'pickup');
  assert.doesNotThrow(() => contracts.makePriceContext(pickup));
});

test('contextVersion 是 id 与版本的唯一引用，不是裸版本号', () => {
  const ctx = contracts.makePriceContext(market.contexts[0]);
  assert.strictEqual(contracts.contextVersionOf(ctx), 'ctx-pickup-demo@v1');
});

test('枚举校验：非法取值直接失败，不静默放行', () => {
  assert.throws(
    () => contracts.makeQuoteBatch({
      id: 'b1', requestId: 'r1', contextVersion: 'ctx-pickup-demo@v1',
      channel: 'pickup', status: 'whatever', startedAt: '2026-10-16T04:00:00.000Z',
    }),
    /QuoteBatch.status/
  );
});

test('T24 组成变化产生新配置快照，不覆盖旧依据', () => {
  const v1 = contracts.makeComboConfig({
    id: 'cfg-1', comboVariantId: 'cv-1', version: 1, isVerifiedDefault: true,
    components: [{ variantId: 'a', quantity: 1 }],
  });
  const v2 = contracts.makeComboConfig({
    id: 'cfg-2', comboVariantId: 'cv-1', version: 2, isVerifiedDefault: true,
    components: [{ variantId: 'a', quantity: 1 }, { variantId: 'b', quantity: 1 }],
  });
  assert.notStrictEqual(v1.id, v2.id, '新配置必须是新快照');
  assert.strictEqual(v1.components.length, 1, '旧快照不被改写');
});

test('ComboConfig 数量必须为正整数；空组成非法', () => {
  assert.throws(
    () => contracts.makeComboConfig({
      id: 'c', comboVariantId: 'cv', version: 1, isVerifiedDefault: true,
      components: [{ variantId: 'a', quantity: 0 }],
    }),
    /数量/
  );
  assert.throws(
    () => contracts.makeComboConfig({
      id: 'c', comboVariantId: 'cv', version: 1, isVerifiedDefault: true, components: [],
    }),
    /components/
  );
});

test('PriceQuote：缺失金额为 null 而不是 0；无报价不虚构 observedAt', () => {
  const q = contracts.makePriceQuote({
    id: 'q1', batchId: 'b1', targetKind: 'combo', variantId: 'cv-1',
    quotedQuantity: 1, amountScope: 'default_combo_food', amountCents: null,
    saleState: 'unknown', pricePolicyState: 'unknown', evidenceType: 'verified_quote',
    conditionState: 'unknown', feeSplitState: 'unknown', purchaseCondition: 'unknown',
    reasonCode: 'REQUEST_FAILED',
  });
  assert.strictEqual(q.amountCents, null);
  assert.notStrictEqual(q.amountCents, 0);
  assert.strictEqual(q.observedAt, null, '无报价不得虚构观测时间');
});

test('PriceQuote：负金额非法', () => {
  assert.throws(
    () => contracts.makePriceQuote({
      id: 'q', batchId: 'b', targetKind: 'single', variantId: 'v', quotedQuantity: 1,
      amountScope: 'single_unit_food', amountCents: -1, saleState: 'available',
      pricePolicyState: 'verified_ordinary', evidenceType: 'verified_quote',
      conditionState: 'verified_same', feeSplitState: 'food_only_verified',
      purchaseCondition: 'standalone',
    }),
    /amountCents/
  );
});

test('live 拒绝 demo 来源 / fixture: 引用', () => {
  assert.throws(() => contracts.assertEvidenceAllowed('live', { evidenceRef: 'fixture:combo-basic' }), /fixture/);
  assert.doesNotThrow(() => contracts.assertEvidenceAllowed('demo', { evidenceRef: 'fixture:combo-basic' }));
});

test('原因码映射为简明中文，不暴露原始码', () => {
  assert.match(contracts.reasonText('COMPONENT_PRICE_MISSING'), /缺价/);
  assert.match(contracts.reasonText('AUTH_EXPIRED'), /登录状态/);
  assert.strictEqual(contracts.REASON_CODES.length >= 18, true);
});
