'use strict';

/**
 * 内部数据契约（v1.1）。
 * 对应 PRD：第 7 节「内部数据契约」、第 7.1 节「状态、证据和金额语义」。
 *
 * 重要：以下是**本项目内部命名**，不是麦当劳官方字段。
 * 接入前先验证实际参数、单位和错误结构，再做映射（见 Step 5 的 MCP_FIELD_MAPPING.md）。
 *
 * 约定：
 * - 金额为非负整数分，数量为正整数；缺失为 null，不是 0 或空串。
 * - 没有实际报价的错误记录不得虚构 observedAt。
 * - 时间保存为 UTC / 带偏移的 ISO 8601。
 */

const {
  PRICE_POLICY_STATE,
  SALE_STATE,
  CONDITION_STATE,
  FEE_SPLIT_STATE,
  AMOUNT_SCOPE,
} = require('./eligibility');

/** 批次状态（PRD 7.1） */
const BATCH_STATUS = {
  RUNNING: 'running',
  COMPLETED: 'completed',   // 必要发现/查询完整结束，可能因售罄而空榜
  PARTIAL: 'partial',       // 有可发布证据但有工作未完成
  FAILED: 'failed',         // 执行开始但无可发布有效证据
  BLOCKED: 'blocked',       // 前提不满足而未调用
};

/** 已发布（可进入展示）的批次状态 */
const PUBLISHED_STATUS = new Set([BATCH_STATUS.COMPLETED, BATCH_STATUS.PARTIAL]);

/** 终态批次（不再被迟到响应改写） */
const TERMINAL_STATUS = new Set([
  BATCH_STATUS.COMPLETED,
  BATCH_STATUS.PARTIAL,
  BATCH_STATUS.FAILED,
  BATCH_STATUS.BLOCKED,
]);

/** 购买条件（PRD 7.1） */
const PURCHASE_CONDITION = {
  STANDALONE: 'standalone',
  NEEDS_ADD_ON: 'needs_add_on',
  UNKNOWN: 'unknown',
};

/** 证据类型（PRD 7.1） */
const EVIDENCE_TYPE = {
  VERIFIED_QUOTE: 'verified_quote',
  MENU_DISPLAY_ONLY: 'menu_display_only',
  LISTED_PRICE_DISPLAY: 'listed_price_display',
};

/** 模式 */
const MODE = { DEMO: 'demo', LIVE: 'live' };

/** 来源类型 */
const SOURCE_KIND = { SINGLE: 'single', COMBO: 'combo', UNKNOWN: 'unknown' };

/** 展示状态（PRD 第 8 节响应元数据） */
const DISPLAY_STATE = {
  CURRENT_SNAPSHOT: 'current_snapshot',
  PREVIOUS_RESULT: 'previous_result',
  EMPTY: 'empty',
};

/** 原因码（PRD 7.1，至少包含以下项） */
const REASON_CODES = [
  'AUTH_EXPIRED',
  'RATE_LIMITED',
  'REQUEST_FAILED',
  'UPDATE_NOT_READY',
  'BUDGET_EXCEEDED',
  'EXECUTION_TIMEOUT',
  'AMOUNT_MISSING',
  'UNIT_UNKNOWN',
  'MENU_INCOMPLETE',
  'VARIANT_UNMATCHED',
  'COMPONENT_PRICE_MISSING',
  'DEFAULT_CONFIG_UNKNOWN',
  'DEFAULT_CONFIG_INCOMPLETE',
  'ENTITLEMENT_UNKNOWN',
  'QUOTE_TIME_MISMATCH',
  'QUOTE_NOT_SINGLE_UNIT',
  'CONDITION_MISMATCH',
  'CONDITION_UNKNOWN',
  'FEE_NOT_SEPARABLE',
];

const REASON_CODE_SET = new Set(REASON_CODES);

/** 界面映射：原因码 -> 简明中文（不展示调用栈或原始错误码） */
const REASON_TEXT = {
  AUTH_EXPIRED: '登录状态已失效，请按获准方式重新配置凭据',
  RATE_LIMITED: '请求过于频繁，已停止本次调用',
  REQUEST_FAILED: '本次查询未成功',
  UPDATE_NOT_READY: '更新尚未就绪',
  BUDGET_EXCEEDED: '已达本次请求预算，提前结束',
  EXECUTION_TIMEOUT: '本次执行超时，按已有结果结束',
  AMOUNT_MISSING: '未取到有效金额',
  UNIT_UNKNOWN: '金额口径无法确认',
  MENU_INCOMPLETE: '菜单未完整取得',
  VARIANT_UNMATCHED: '规格无法对应',
  COMPONENT_PRICE_MISSING: '组成单品缺价',
  DEFAULT_CONFIG_UNKNOWN: '默认组成未知',
  DEFAULT_CONFIG_INCOMPLETE: '自选套餐的默认组成不完整',
  ENTITLEMENT_UNKNOWN: '价格口径待核实',
  QUOTE_TIME_MISMATCH: '报价时间跨度过大',
  QUOTE_NOT_SINGLE_UNIT: '不是单份独立购买价',
  CONDITION_MISMATCH: '供餐/促销条件不一致',
  CONDITION_UNKNOWN: '供餐/促销条件未知',
  FEE_NOT_SEPARABLE: '费用无法拆分为纯餐品金额',
};

/** 原因码转中文；未知码原样返回但前缀提示，避免伪装成已知原因 */
function reasonText(code) {
  return REASON_TEXT[code] || `未知原因（${code}）`;
}

function fail(message) {
  throw new TypeError(message);
}

function assertNonEmptyString(value, label) {
  if (typeof value !== 'string' || value.length === 0) fail(`${label} 必须为非空字符串`);
  return value;
}

function assertPositiveInt(value, label) {
  if (!Number.isInteger(value) || value <= 0) fail(`${label} 必须为正整数，实际：${JSON.stringify(value)}`);
  return value;
}

/** 金额：非负整数分或 null（缺失不得为 0 / 空串） */
function assertAmountOrNull(value, label) {
  if (value === null) return null;
  if (!Number.isInteger(value) || value < 0) {
    fail(`${label} 必须为非负整数分或 null，实际：${JSON.stringify(value)}`);
  }
  return value;
}

function assertEnum(value, enumObj, label) {
  if (!Object.values(enumObj).includes(value)) {
    fail(`${label} 取值非法：${JSON.stringify(value)}`);
  }
  return value;
}

/** PriceContext（PRD 第 7 节） */
function makePriceContext(input) {
  const c = input || {};
  assertNonEmptyString(c.id, 'PriceContext.id');
  assertPositiveInt(c.version, 'PriceContext.version');
  assertEnum(c.channel, { pickup: 'pickup', delivery: 'delivery' }, 'PriceContext.channel');
  assertNonEmptyString(c.storeRef, 'PriceContext.storeRef');
  assertNonEmptyString(c.storeName, 'PriceContext.storeName');
  if (c.channel === 'delivery') {
    assertNonEmptyString(c.addressRef, 'PriceContext.addressRef（外送必需）');
    assertNonEmptyString(c.addressAlias, 'PriceContext.addressAlias（外送只显示别名）');
  }
  if (c.pricePolicy !== 'ordinary_direct_promo_no_personal_coupon_no_paid_membership') {
    fail('PriceContext.pricePolicy 必须为普通价口径常量');
  }
  return {
    id: c.id,
    version: c.version,
    channel: c.channel,
    storeRef: c.storeRef,
    storeName: c.storeName,
    addressRef: c.addressRef ?? null,
    addressAlias: c.addressAlias ?? null,
    pricePolicy: c.pricePolicy,
    timezone: c.timezone || 'Asia/Shanghai',
  };
}

/** contextVersion：上下文 id 与版本的唯一引用，不是裸版本号 */
function contextVersionOf(context) {
  return `${context.id}@v${context.version}`;
}

/** UpdateRequest（PRD 第 7 节） */
function makeUpdateRequest(input) {
  const r = input || {};
  assertNonEmptyString(r.id, 'UpdateRequest.id');
  assertNonEmptyString(r.idempotencyKey, 'UpdateRequest.idempotencyKey');
  assertNonEmptyString(r.ownerRef, 'UpdateRequest.ownerRef');
  assertEnum(r.mode, MODE, 'UpdateRequest.mode');
  if (!Array.isArray(r.contextVersions) || r.contextVersions.length === 0) {
    fail('UpdateRequest.contextVersions 必须为非空数组');
  }
  assertNonEmptyString(r.requestedAt, 'UpdateRequest.requestedAt');
  return {
    id: r.id,
    idempotencyKey: r.idempotencyKey,
    ownerRef: r.ownerRef,
    mode: r.mode,
    contextVersions: r.contextVersions.slice(),
    requestedAt: r.requestedAt,
    finishedAt: r.finishedAt ?? null,
  };
}

/** QuoteBatch：一个请求内每个上下文唯一（唯一键 requestId + contextVersion） */
function makeQuoteBatch(input) {
  const b = input || {};
  assertNonEmptyString(b.id, 'QuoteBatch.id');
  assertNonEmptyString(b.requestId, 'QuoteBatch.requestId');
  assertNonEmptyString(b.contextVersion, 'QuoteBatch.contextVersion');
  assertEnum(b.channel, { pickup: 'pickup', delivery: 'delivery' }, 'QuoteBatch.channel');
  assertEnum(b.status, BATCH_STATUS, 'QuoteBatch.status');
  assertNonEmptyString(b.startedAt, 'QuoteBatch.startedAt');
  return {
    id: b.id,
    requestId: b.requestId,
    contextVersion: b.contextVersion,
    channel: b.channel,
    startedAt: b.startedAt,
    finishedAt: b.finishedAt ?? null,
    status: b.status,
    coverage: b.coverage ?? null,
  };
}

/** ComboConfig：不可变快照；组成变化产生新版本 */
function makeComboConfig(input) {
  const c = input || {};
  assertNonEmptyString(c.id, 'ComboConfig.id');
  assertNonEmptyString(c.comboVariantId, 'ComboConfig.comboVariantId');
  assertPositiveInt(c.version, 'ComboConfig.version');
  if (typeof c.isVerifiedDefault !== 'boolean') fail('ComboConfig.isVerifiedDefault 必须为布尔值');
  if (!Array.isArray(c.components) || c.components.length === 0) {
    fail('ComboConfig.components 必须为非空数组');
  }
  const components = c.components.map((item) => {
    assertNonEmptyString(item.variantId, 'ComboConfig.components[].variantId');
    assertPositiveInt(item.quantity, `ComboConfig ${item.variantId} 数量`);
    return { variantId: item.variantId, quantity: item.quantity, isGift: Boolean(item.isGift) };
  });
  return {
    id: c.id,
    comboVariantId: c.comboVariantId,
    version: c.version,
    isVerifiedDefault: c.isVerifiedDefault,
    components,
    compositionEvidenceRef: c.compositionEvidenceRef ?? null,
  };
}

/** PriceQuote（PRD 第 7 节，字段较多，逐项兜底为 null） */
function makePriceQuote(input) {
  const q = input || {};
  assertNonEmptyString(q.id, 'PriceQuote.id');
  assertNonEmptyString(q.batchId, 'PriceQuote.batchId');
  assertEnum(q.targetKind, { single: 'single', combo: 'combo' }, 'PriceQuote.targetKind');
  assertNonEmptyString(q.variantId, 'PriceQuote.variantId');
  assertPositiveInt(q.quotedQuantity, 'PriceQuote.quotedQuantity');
  assertEnum(q.amountScope, AMOUNT_SCOPE, 'PriceQuote.amountScope');
  assertEnum(q.saleState, SALE_STATE, 'PriceQuote.saleState');
  assertEnum(q.pricePolicyState, PRICE_POLICY_STATE, 'PriceQuote.pricePolicyState');
  assertEnum(q.evidenceType, EVIDENCE_TYPE, 'PriceQuote.evidenceType');
  assertEnum(q.conditionState, CONDITION_STATE, 'PriceQuote.conditionState');
  assertEnum(q.feeSplitState, FEE_SPLIT_STATE, 'PriceQuote.feeSplitState');
  assertEnum(q.purchaseCondition, PURCHASE_CONDITION, 'PriceQuote.purchaseCondition');
  if (q.reasonCode !== null && q.reasonCode !== undefined && !REASON_CODE_SET.has(q.reasonCode)) {
    fail(`PriceQuote.reasonCode 未知：${q.reasonCode}`);
  }
  assertAmountOrNull(q.amountCents ?? null, 'PriceQuote.amountCents');
  return {
    id: q.id,
    batchId: q.batchId,
    targetKind: q.targetKind,
    variantId: q.variantId,
    configId: q.configId ?? null,
    quotedQuantity: q.quotedQuantity,
    amountScope: q.amountScope,
    amountCents: q.amountCents ?? null,
    observedAt: q.observedAt ?? null, // 无实际报价时必须为 null，不得虚构
    saleState: q.saleState,
    pricePolicyState: q.pricePolicyState,
    evidenceType: q.evidenceType,
    validFrom: q.validFrom ?? null,
    validTo: q.validTo ?? null,
    mealPeriod: q.mealPeriod ?? null,
    conditionState: q.conditionState,
    feeSplitState: q.feeSplitState,
    feeItems: q.feeItems ?? null,
    purchaseCondition: q.purchaseCondition,
    reasonCode: q.reasonCode ?? null,
    evidenceRef: q.evidenceRef ?? null,
  };
}

/** live 拒绝 demo 来源或 fixture: 引用（PRD 7.1、第 9 节） */
function assertEvidenceAllowed(mode, quote) {
  const ref = quote && quote.evidenceRef;
  const isFixtureRef = typeof ref === 'string' && ref.startsWith('fixture:');
  if (mode === MODE.LIVE && isFixtureRef) {
    fail('live 模式拒绝 fixture 引用');
  }
  return true;
}

module.exports = {
  PRICE_POLICY_STATE,
  SALE_STATE,
  CONDITION_STATE,
  FEE_SPLIT_STATE,
  AMOUNT_SCOPE,
  BATCH_STATUS,
  PUBLISHED_STATUS,
  TERMINAL_STATUS,
  PURCHASE_CONDITION,
  EVIDENCE_TYPE,
  MODE,
  SOURCE_KIND,
  DISPLAY_STATE,
  REASON_CODES,
  REASON_CODE_SET,
  reasonText,
  makePriceContext,
  contextVersionOf,
  makeUpdateRequest,
  makeQuoteBatch,
  makeComboConfig,
  makePriceQuote,
  assertEvidenceAllowed,
};
