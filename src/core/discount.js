'use strict';

/**
 * 套餐折扣公式与显示文案。
 * 对应 PRD：第 R03 节（公式及排序）、第 R04 节（默认组成与可比性）、第 13.1 节示例。
 *
 *   D = Σ(qᵢ × pᵢ)      单买合计（分）
 *   R = P / D           折扣比，越低越划算
 *   Z = 10 × R          折数
 *   A = D − P           节省金额
 *   S = 1 − R           节省比例
 *
 * 关键约束（PRD 明文）：
 * - 金额存整数分，缺失存 null，不得以 0 代替。
 * - 按未舍入比例排序（见 ranking.js），不能按已显示的一位小数折数排序。
 * - 显示：金额固定 2 位；折数固定 1 位；百分比舍入到 1 位后去掉末尾 ".0"。
 * - P > D 时不显示折数，显示「比单买贵 X%」及金额差。
 * - P = D 显示「与单买同价」。
 * - P ≠ D 但百分比舍入为 0 时显示「比单买便宜/贵不足 0.1%」及金额差。
 * - P < D 而折数舍入为 10.0 时，以「接近单买价」代替 10.0 折，仍显示真实节省额与比例文案。
 * - 不得使用划线原价；不得写「优惠 60%」这类反向文案。
 */

const { isCents, formatCents, roundRationalHalfUp } = require('./money');

/**
 * 计算单买合计 D。
 * @param {Array<{variantId:string, quantity:number, unitPriceCents:number|null, isGift?:boolean}>} components
 * @returns {{ denominatorCents: number|null, missing: string[] }}
 *   - 任一分量 unitPriceCents 为 null -> denominatorCents = null（不计算，不以 0 补齐）
 */
function computeDenominator(components) {
  let sum = 0;
  const missing = [];
  for (const component of components || []) {
    if (!Number.isInteger(component.quantity) || component.quantity <= 0) {
      throw new TypeError(`组件数量必须为正整数：${JSON.stringify(component.variantId)}`);
    }
    if (!isCents(component.unitPriceCents)) {
      missing.push(component.variantId);
      continue;
    }
    // 赠品若来源标明包含且可单买，按实际规格和数量计入 D（R04）
    sum += component.quantity * component.unitPriceCents;
  }
  return { denominatorCents: missing.length > 0 ? null : sum, missing };
}

/**
 * 计算折扣结果（不做资格判定，资格见 eligibility.js）。
 * @returns {{
 *   eligible: boolean,
 *   P: number|null, D: number|null, A: number|null,
 *   ratio: {num:number, den:number}|null,
 *   missing: string[],
 *   reasons: string[]
 * }}
 *   不可比时不得给出可被误解为正式排名的数字（PRD 7.3）。
 */
function computeDiscount({ comboPriceCents, components }) {
  const { denominatorCents: D, missing } = computeDenominator(components);
  const P = isCents(comboPriceCents) ? comboPriceCents : null;

  const reasons = [];
  if (missing.length > 0) reasons.push('COMPONENT_PRICE_MISSING');
  if (P === null) reasons.push('AMOUNT_MISSING');
  if (D !== null && D <= 0) reasons.push('DENOMINATOR_NOT_POSITIVE');

  const eligible = P !== null && D !== null && D > 0;
  if (!eligible) {
    return { eligible: false, P, D, A: null, ratio: null, missing, reasons };
  }
  return {
    eligible: true,
    P,
    D,
    A: D - P,                        // 可为负（P > D 时为「比单买贵」）
    ratio: { num: P, den: D },       // 未舍入，供排序与显示
    missing,
    reasons,
  };
}

/** 百分比文案：value 为 0—100 的数值，舍入 1 位后去掉末尾 ".0" */
function formatPercentText(value) {
  const rounded = Math.round(value * 10) / 10;
  const text = rounded.toFixed(1);
  return text.endsWith('.0') ? text.slice(0, -2) : text;
}

/**
 * 由折扣结果生成显示文案。
 * @returns {{
 *   discountText: string|null,
 *   savedPercentText: string,
 *   savedAmountText: string,
 *   comparisonText: string|null
 * }}
 */
function describeDiscount({ P, D }) {
  if (!isCents(P) || !isCents(D) || D <= 0) {
    throw new TypeError('describeDiscount 需要合法的 P 与非零分母 D');
  }

  // 折数：Z = 10 × P / D，half-up 到 1 位
  const zRounded = roundRationalHalfUp(10 * P, D, 1);
  // 节省比例绝对值：|D − P| / D × 100，half-up 到 1 位
  const percentAbs = roundRationalHalfUp(Math.abs(D - P) * 100, D, 1);

  const absDiffText = formatCents(Math.abs(D - P));

  // P = D：与单买同价
  if (P === D) {
    return {
      discountText: null,
      savedPercentText: '与单买同价',
      savedAmountText: '¥0.00',
      comparisonText: '与单买同价',
    };
  }

  // P > D：比单买贵，不给折数、不用优惠色、不用「省」字伪装
  if (P > D) {
    const percentText = percentAbs === 0
      ? '比单买贵不足 0.1%'
      : `比单买贵 ${formatPercentText(percentAbs)}%`;
    return {
      discountText: null,
      savedPercentText: percentText,
      savedAmountText: `多花${absDiffText}`,
      comparisonText: percentText,
    };
  }

  // P < D：正常折扣
  // 折数舍入为 10.0 时，用「接近单买价」替代，仍给出真实节省额与比例文案
  const nearParity = zRounded === 10;
  const discountText = nearParity ? '接近单买价' : `${zRounded.toFixed(1)}折`;
  const percentText = percentAbs === 0
    ? '比单买便宜不足 0.1%'
    : `节省${formatPercentText(percentAbs)}%`;

  return {
    discountText,
    savedPercentText: percentText,
    savedAmountText: `少花${absDiffText}`,
    comparisonText: null,
  };
}

module.exports = {
  computeDenominator,
  computeDiscount,
  describeDiscount,
  formatPercentText,
};
