'use strict';

/**
 * 资格判定：判断一条报价是否有资格成为「普通价有效点」或进入套餐主榜。
 * 对应 PRD：第 R02 节（普通可购价）、R04（默认组成可比性）、R05（报价同时性/三值判定）、
 *          R06（外送费用）、R07（异常与结果资格）、第 7.2 节（状态与原因码）。
 *
 * 原则：未知不等于一致；null 与 null 不能当作一致；请求失败记为 unknown 而非下架。
 */

/** 权益状态（PRD 7.2） */
const PRICE_POLICY_STATE = {
  VERIFIED_ORDINARY: 'verified_ordinary',
  REQUIRES_ENTITLEMENT: 'requires_entitlement',
  UNKNOWN: 'unknown',
};

/** 售卖状态（PRD 7.2） */
const SALE_STATE = {
  AVAILABLE: 'available',
  SOLD_OUT: 'sold_out',
  OUTSIDE_SERVICE: 'outside_service',
  WITHDRAWN: 'withdrawn',
  UNKNOWN: 'unknown',
};

/** 供餐/促销条件三值判定（PRD R05） */
const CONDITION_STATE = {
  VERIFIED_SAME: 'verified_same',
  MISMATCH: 'mismatch',
  UNKNOWN: 'unknown',
};

/** 费用可拆分状态（PRD 7.1） */
const FEE_SPLIT_STATE = {
  FOOD_ONLY_VERIFIED: 'food_only_verified',
  NOT_SEPARABLE: 'not_separable',
  UNKNOWN: 'unknown',
};

/** 报价金额语义（PRD 7.1） */
const AMOUNT_SCOPE = {
  SINGLE_UNIT_FOOD: 'single_unit_food',
  DEFAULT_COMBO_FOOD: 'default_combo_food',
  UNKNOWN: 'unknown',
};

/**
 * 判定一条报价是否满足「普通价有效点」口径。
 * @param {object} observation
 * @param {'single'|'combo'} [targetKind='single']
 * @returns {{ eligible: boolean, reasons: string[] }}
 */
function evaluateObservation(observation, targetKind = 'single') {
  const reasons = [];
  const o = observation || {};

  // 权益口径：必须可核实为普通可购价（不含个人券、不含付费会员）
  if (o.pricePolicyState !== PRICE_POLICY_STATE.VERIFIED_ORDINARY) {
    reasons.push('ENTITLEMENT_UNKNOWN');
  }

  // 金额：缺失不猜；无法判断单位时失败
  if (!Number.isInteger(o.amountCents) || o.amountCents < 0) {
    reasons.push('AMOUNT_MISSING');
  }

  // 必须是核价所得，展示价不能作为核价依据
  if (o.evidenceType !== 'verified_quote') {
    reasons.push('PRICE_POLICY_UNVERIFIED');
  }

  // 单份基准必须 quotedQuantity = 1
  if (o.quotedQuantity !== 1) {
    reasons.push('QUOTE_NOT_SINGLE_UNIT');
  }

  // 金额语义必须匹配目标
  const expectedScope =
    targetKind === 'combo' ? AMOUNT_SCOPE.DEFAULT_COMBO_FOOD : AMOUNT_SCOPE.SINGLE_UNIT_FOOD;
  if (o.amountScope !== expectedScope) {
    reasons.push('UNIT_UNKNOWN');
  }

  // 费用必须可拆分为纯餐品金额
  if (o.feeSplitState !== FEE_SPLIT_STATE.FOOD_ONLY_VERIFIED) {
    reasons.push('FEE_NOT_SEPARABLE');
  }

  // 售卖状态
  if (o.saleState !== SALE_STATE.AVAILABLE) {
    reasons.push('SALE_NOT_AVAILABLE');
  }

  return { eligible: reasons.length === 0, reasons };
}

/**
 * 判定一个默认套餐是否有资格进入折扣主榜。
 * @param {object} combo
 * @param {object} combo.observation   套餐自身报价观测
 * @param {Array<object>} combo.components 组件报价观测
 * @returns {{ eligible: boolean, reasons: string[] }}
 */
function evaluateComboEligibility(combo) {
  const reasons = [];
  const c = combo || {};

  // 默认组成必须来源可核实（R04）
  if (c.defaultConfigVerified !== true) {
    reasons.push('DEFAULT_CONFIG_UNKNOWN');
  }

  // 组成必须非空且数量为正整数
  const components = Array.isArray(c.components) ? c.components : [];
  if (components.length === 0) {
    reasons.push('DEFAULT_CONFIG_UNKNOWN');
  }

  // 自选类套餐（「随心选 / 随心配」）的默认组成是平台给的示例，不是真实的打包内容。
  // 实测「学生专享汉堡小食随心选」只返回「中薯条×2」、饮品随心选只返回「可乐中杯×1」——
  // 名称说的和组成给的完全不是一回事。这种组成拿来算 D，算出来的「折扣」是假的。
  if (/随心选|随心配/.test(String(c.name || '')) && components.length <= 1) {
    reasons.push('DEFAULT_CONFIG_INCOMPLETE');
  }

  // 套餐自身必须可核价为默认套餐纯餐品金额（R02、R05）
  const comboObs = evaluateObservation(c.observation, 'combo');
  reasons.push(...comboObs.reasons);

  // 组件必须同批、同条件、可核价为独立单份（R05、R02）
  for (const component of components) {
    if (component.quotedQuantity !== 1) {
      reasons.push('QUOTE_NOT_SINGLE_UNIT');
    }
    if (component.feeSplitState !== FEE_SPLIT_STATE.FOOD_ONLY_VERIFIED) {
      reasons.push('FEE_NOT_SEPARABLE');
    }
    if (component.pricePolicyState !== PRICE_POLICY_STATE.VERIFIED_ORDINARY) {
      reasons.push('ENTITLEMENT_UNKNOWN');
    }
    if (!Number.isInteger(component.unitPriceCents) || component.unitPriceCents < 0) {
      reasons.push('COMPONENT_PRICE_MISSING');
    }
  }

  // 报价同时性：套餐与其全部组件必须属于同一渠道批次、同店、同权益、同供餐条件（R05）
  const conditionChecks = [c.observation, ...components];
  for (const obs of conditionChecks) {
    if (obs.conditionState === CONDITION_STATE.MISMATCH) {
      reasons.push('CONDITION_MISMATCH');
    } else if (obs.conditionState !== CONDITION_STATE.VERIFIED_SAME) {
      // 证据不足（含 null）都按 unknown 处理，退出主榜，不使用「静默放行」
      reasons.push('CONDITION_UNKNOWN');
    }
  }

  const unique = [...new Set(reasons)];
  return { eligible: unique.length === 0, reasons: unique };
}

module.exports = {
  PRICE_POLICY_STATE,
  SALE_STATE,
  CONDITION_STATE,
  FEE_SPLIT_STATE,
  AMOUNT_SCOPE,
  evaluateObservation,
  evaluateComboEligibility,
};
