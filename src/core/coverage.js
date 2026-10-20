'use strict';

/**
 * 覆盖统计（v1.1）。
 * 对应 PRD：第 7.2 节「覆盖与折扣结果」、R07（结果资格和覆盖）、T22。
 *
 * 规则：
 * - 单品数为**本批默认套餐所需**的去重规格数，不是全店单品数。
 * - 成功报价数只统计符合普通价口径的报价；失败数统计请求失败目标；
 *   缺价数统计无有效金额目标。**失败与缺价可能重叠，不能相加当总商品数。**
 * - 目录不完整（catalogComplete !== true）时**不计算全店覆盖率**，只称「已发现套餐」。
 * - 未知总量为 null。
 */

const { PRICE_POLICY_STATE, SALE_STATE } = require('./eligibility');

/** 记为「请求失败」的原因码 */
const FAILURE_REASONS = new Set([
  'REQUEST_FAILED',
  'AUTH_EXPIRED',
  'RATE_LIMITED',
  'EXECUTION_TIMEOUT',
  'BUDGET_EXCEEDED',
]);

function isValidAmount(value) {
  return Number.isInteger(value) && value >= 0;
}

/** 该报价是否「符合普通价口径」：权益可核实为普通价，且金额有效 */
function isOrdinaryValidQuote(quote) {
  if (!quote) return false;
  return (
    quote.pricePolicyState === PRICE_POLICY_STATE.VERIFIED_ORDINARY &&
    isValidAmount(quote.amountCents)
  );
}

/** 该报价是否算「有有效金额」（用于缺价统计） */
function hasValidAmount(quote) {
  return Boolean(quote) && isValidAmount(quote.amountCents);
}

/**
 * 构建覆盖统计。
 * @param {object} input
 * @param {boolean|'unknown'} input.catalogComplete
 * @param {Array<{comboVariantId:string, eligible:boolean, components:Array<{variantId:string, quote:object|null}>, observation?:object|null}>} input.combos
 * @returns {object} coverage
 */
function buildCoverage({ catalogComplete, combos }) {
  const list = combos || [];

  // 去重规格：本批默认套餐所需的组成单品
  const requiredVariants = new Set();
  // 需要核价的目标：套餐自身 + 必需组成单品（去重）
  const targets = new Map(); // key -> quote

  for (const combo of list) {
    targets.set(`combo:${combo.comboVariantId}`, combo.observation || null);
    for (const component of combo.components || []) {
      requiredVariants.add(component.variantId);
      const key = `single:${component.variantId}`;
      // 同一规格只统计一次；优先保留已有有效金额的报价
      if (!targets.has(key) || (!hasValidAmount(targets.get(key)) && hasValidAmount(component.quote))) {
        targets.set(key, component.quote || null);
      }
    }
  }

  let quoteSuccessCount = 0;
  let quoteFailureCount = 0;
  let missingPriceCount = 0;

  for (const quote of targets.values()) {
    const ordinaryValid = isOrdinaryValidQuote(quote);
    if (ordinaryValid) quoteSuccessCount += 1;

    const failed = Boolean(quote) && FAILURE_REASONS.has(quote.reasonCode);
    if (failed) quoteFailureCount += 1;

    // 缺价：无有效金额（含报价缺失、金额缺失、费用不可拆、规格未匹配等）
    if (!hasValidAmount(quote)) missingPriceCount += 1;
  }

  const eligibleComboCount = list.filter((c) => c.eligible === true).length;

  // 目录完整才计算全店覆盖率；否则为 null，界面不称「全店最优」
  const fullStoreCoverageRatio =
    catalogComplete === true && list.length > 0
      ? round4(eligibleComboCount / list.length)
      : null;

  return {
    catalogComplete: catalogComplete === 'unknown' ? 'unknown' : Boolean(catalogComplete),
    discoveredComboCount: list.length,
    requiredSingleCount: requiredVariants.size,
    quoteSuccessCount,
    eligibleComboCount,
    quoteFailureCount,
    missingPriceCount,
    fullStoreCoverageRatio,
    // 供界面直接使用的概要（不把失败数 + 缺价数相加当总数）
    summaryText:
      `已发现 ${list.length} 个套餐，其中 ${eligibleComboCount} 个可比；` +
      `所需单品规格 ${requiredVariants.size} 个，成功报价 ${quoteSuccessCount} 个，` +
      `失败 ${quoteFailureCount} 个，缺价 ${missingPriceCount} 个`,
  };
}

function round4(value) {
  return Math.round(value * 10000) / 10000;
}

/** 目录完整性文案 */
function catalogCompletenessText(catalogComplete) {
  if (catalogComplete === true) return '目录已完整取得';
  if (catalogComplete === 'unknown') return '目录完整性未知';
  return '目录不完整，仅本次已发现的套餐';
}

module.exports = {
  FAILURE_REASONS,
  isOrdinaryValidQuote,
  hasValidAmount,
  buildCoverage,
  catalogCompletenessText,
};
