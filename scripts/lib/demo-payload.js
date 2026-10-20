'use strict';

/**
 * 演示数据组装（v1.1，共享模块）。
 *
 * 本模块**不自己算折扣**：它把 fixture 组装成核心模块的输入，
 * 由 src/core/rank-batch.js 走同一套资格/折扣/排名/覆盖规则产出数值，
 * 保证「测试、HTML 原型、微信小程序里的数是同一套规则算出来的」。
 *
 * 消费方：
 * - scripts/build-prototype.js    → prototype/prototype-data.js + preview.html
 * - scripts/build-miniprogram.js  → miniprogram/services/demo-data.js
 */

const fs = require('node:fs');
const path = require('node:path');

const { buildChannelRanking } = require('../../src/core/rank-batch');
const { resolveValidityState, resolveDisplayState } = require('../../src/core/validity');
const { initChannelState } = require('../../src/core/publish');
const { BATCH_STATUS, DISPLAY_STATE } = require('../../src/core/contracts');
const { beijingDisplay } = require('../../src/core/clock');

const root = path.join(__dirname, '..', '..');
const market = JSON.parse(fs.readFileSync(path.join(root, 'src/fixtures/demo-market.json'), 'utf8'));

// 固定的演示观测时刻（不随运行时间变化，保证离线可复现）
const OBSERVED_AT = '2026-10-16T04:00:00.000Z'; // 北京 12:00
const PREV_OBSERVED_AT = '2026-10-16T01:30:00.000Z'; // 北京 09:30（上一批）
const GENERATED_AT = '2026-10-16T04:12:00.000Z'; // 北京 12:12（服务响应时间，非采集时间）

function ctxVersionOf(ctx) {
  return `${ctx.id}@v${ctx.version}`;
}

/** 由价格表 + 缺陷表组装一个渠道的套餐输入 */
function buildCombosFor(context, observedAt) {
  const cv = ctxVersionOf(context);
  const table = market.priceTables[cv];
  const defects = (market.defects && market.defects[cv]) || {};
  const at = observedAt || OBSERVED_AT;

  return market.combos.map((combo) => {
    const defect = defects[combo.id] || null;
    const comboPrice = table.combo[combo.comboVariantId];

    const components = combo.components.map((c) => {
      const variant = market.variants.find((v) => v.id === c.variantId);
      const basePrice = table.food[c.variantId];

      // 缺陷：必需组件缺价
      const missing = defect && defect.kind === 'missingComponent' && defect.variantId === c.variantId;
      const unitPriceCents = missing ? null : basePrice;

      // 组件级报价（与套餐同一批、同条件）。字段同时摊平在组件上，
      // 供 eligibility 直接读取；quote 保留给覆盖统计使用。
      const quote = {
        amountCents: unitPriceCents,
        observedAt: at,
        pricePolicyState: 'verified_ordinary',
        saleState: 'available',
        conditionState: 'verified_same',
        feeSplitState: 'food_only_verified',
        amountScope: 'single_unit_food',
        quotedQuantity: 1,
        evidenceType: 'verified_quote',
        reasonCode: missing ? 'COMPONENT_PRICE_MISSING' : null,
        purchaseCondition: 'standalone',
      };

      return {
        variantId: c.variantId,
        name: variant ? variant.name : c.variantId,
        variantLabel: variant ? variant.variantLabel : '',
        quantity: c.quantity,
        isGift: c.isGift,
        unitPriceCents,
        purchaseCondition: 'standalone',
        ...quote,
        quote,
      };
    });

    const soldOut = defect && defect.kind === 'soldOut';
    const feeNotSeparable = defect && defect.kind === 'feeNotSeparable';

    const observation = {
      amountCents: comboPrice,
      observedAt: at,
      pricePolicyState: 'verified_ordinary',
      saleState: soldOut ? 'sold_out' : 'available',
      conditionState: 'verified_same',
      feeSplitState: feeNotSeparable ? 'not_separable' : 'food_only_verified',
      amountScope: 'default_combo_food',
      quotedQuantity: 1,
      evidenceType: 'verified_quote',
      reasonCode: soldOut ? 'SALE_NOT_AVAILABLE' : feeNotSeparable ? 'FEE_NOT_SEPARABLE' : null,
    };

    return {
      id: combo.id,
      comboVariantId: combo.comboVariantId,
      name: combo.name,
      configId: combo.configId,
      defaultConfigVerified: combo.isVerifiedDefault === true,
      comboPriceCents: comboPrice,
      components,
      observation,
    };
  });
}

/** 每个渠道产出一份候选快照 */
function buildChannel(context, { observedAt, catalogComplete, batchId, status }) {
  const combos = buildCombosFor(context, observedAt);
  const built = buildChannelRanking({ catalogComplete, combos });

  const allQuotes = combos.flatMap((c) => [c.observation, ...c.components.map((x) => x.quote)]);

  return {
    batchId,
    status,
    ranking: built.ranking,
    notComparable: built.notComparable,
    coverage: built.coverage,
    observedRange: built.observedRange,
    validityState: resolveValidityState(
      allQuotes.map((q) => ({ validFrom: null, validTo: null, conditionState: q.conditionState })),
      Date.parse(OBSERVED_AT)
    ),
  };
}

function toSnapshot(batch) {
  return {
    batchId: batch.batchId,
    status: batch.status,
    ranking: batch.ranking,
    notComparable: batch.notComparable,
    coverage: batch.coverage,
    observedRange: batch.observedRange,
    validityState: batch.validityState,
  };
}

/** 组装所有展示场景 */
function buildScenarios(context) {
  const current = buildChannel(context, {
    observedAt: OBSERVED_AT,
    catalogComplete: true,
    batchId: 'batch-current-01',
    status: BATCH_STATUS.COMPLETED,
  });
  const previous = buildChannel(context, {
    observedAt: PREV_OBSERVED_AT,
    catalogComplete: true,
    batchId: 'batch-previous-01',
    status: BATCH_STATUS.COMPLETED,
  });
  const partial = buildChannel(context, {
    observedAt: OBSERVED_AT,
    catalogComplete: false,
    batchId: 'batch-partial-01',
    status: BATCH_STATUS.PARTIAL,
  });

  const currentSnapshot = toSnapshot(current);
  const previousSnapshot = toSnapshot(previous);
  const partialSnapshot = toSnapshot(partial);

  const makeState = (published, activeStatus, note, opts) => {
    let state = initChannelState(context.channel);
    state.published = published;
    if (activeStatus) state.activeBatch = { id: 'batch-running-01', status: BATCH_STATUS.RUNNING, finishedAt: null };
    const display = resolveDisplayState({
      publishedBatch: published ? { status: published.status } : null,
      hasActiveRequest: Boolean(activeStatus),
    });
    // noteLevel：info = 与折叠头标签同义，不再单独铺横幅；warn = 需要用户注意/行动，单行横幅
    return {
      published,
      displayState: (opts && opts.displayState) || display.state,
      isStale: display.isStale,
      note: note || null,
      noteLevel: note ? ((opts && opts.noteLevel) || 'info') : null,
      activeStatus: activeStatus || null,
    };
  };

  return {
    normal: makeState(currentSnapshot, null, '本次结果已发布'),
    empty: makeState(null, null, null),
    updating: makeState(previousSnapshot, BATCH_STATUS.RUNNING, '更新进行中，以下仍为上次已发布结果'),
    partial: makeState(partialSnapshot, null, '本次为局部结果，目录不完整', { noteLevel: 'warn' }),
    // 与 publish.js concludeBatch 一致：失败保留旧结果时 displayState 为 previous_result
    failed_keep_previous: makeState(previousSnapshot, null, '本次更新失败/未执行，以下为上次结果',
      { noteLevel: 'warn', displayState: DISPLAY_STATE.PREVIOUS_RESULT }),
    failed_no_previous: makeState(null, null, '本次更新失败/未执行，暂无历史结果', { noteLevel: 'warn' }),
    expired: makeState({ ...currentSnapshot, validityState: 'expired' }, null, '报价已过期，请手动更新榜单', { noteLevel: 'warn' }),
    validity_unknown: makeState({ ...currentSnapshot, validityState: 'unknown' }, null, '有效期未知，仅为报价时点结果', { noteLevel: 'warn' }),
    // 详情页用：不可比套餐的完整依据
    detailSources: { current: currentSnapshot, previous: previousSnapshot },
  };
}

function buildDemoPayload() {
  const payload = {
    mode: 'demo',
    timezone: 'Asia/Shanghai',
    generatedAt: GENERATED_AT,
    generatedAtDisplay: beijingDisplay(GENERATED_AT),
    observedAtDisplay: beijingDisplay(OBSERVED_AT),
    pricePolicyLabel: '普通可购价（含直接促销，不含个人券与付费会员）',
    banner: '演示数据：虚构门店、商品与地址，不代表任何真实麦当劳报价',
    contexts: market.contexts.map((ctx) => ({
      id: ctx.id,
      version: ctx.version,
      contextVersion: ctxVersionOf(ctx),
      channel: ctx.channel,
      storeName: ctx.storeName,
      addressAlias: ctx.addressAlias,
      pricePolicy: ctx.pricePolicy,
      deliveryFeeCents: market.priceTables[ctxVersionOf(ctx)].deliveryFeeCents,
      minOrderCents: market.priceTables[ctxVersionOf(ctx)].minOrderCents,
    })),
    channels: {},
    variants: market.variants,
  };

  for (const ctx of market.contexts) {
    payload.channels[ctx.channel] = {
      contextVersion: ctxVersionOf(ctx),
      storeName: ctx.storeName,
      addressAlias: ctx.addressAlias,
      deliveryFeeCents: market.priceTables[ctxVersionOf(ctx)].deliveryFeeCents,
      minOrderCents: market.priceTables[ctxVersionOf(ctx)].minOrderCents,
      scenarios: buildScenarios(ctx),
    };
  }

  // 详情页所需的组成明细：key = channel|comboId
  payload.comboLookup = {};
  for (const ctx of market.contexts) {
    const combos = buildCombosFor(ctx);
    for (const combo of combos) {
      payload.comboLookup[`${ctx.channel}|${combo.id}`] = {
        name: combo.name,
        configId: combo.configId,
        components: combo.components.map((c) => ({
          variantId: c.variantId,
          name: c.name,
          variantLabel: c.variantLabel,
          quantity: c.quantity,
          isGift: c.isGift,
          unitPriceCents: c.unitPriceCents,
        })),
      };
    }
  }

  return payload;
}

module.exports = { buildDemoPayload, OBSERVED_AT, PREV_OBSERVED_AT, GENERATED_AT };
