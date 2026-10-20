'use strict';

/**
 * 有效区间状态与展示状态（v1.1）。
 * 对应 PRD：第 7.1 节「有效区间状态」、R10（发布与缓存显示）、R05（有效期未知）。
 *
 * 关键规则：
 * - `within_known_window / expired / unknown` 三值。
 * - 相关报价**任一过期即 expired**；全部区间已核实且当前位于其中才 within_known_window；其余 unknown。
 * - 该状态**不等于实时成交确认**，只说明「报价时点结果」。
 * - 有效期未知不得自动否定已核实的观测价格（R05）：保留观测事实，标「有效期未知」。
 * - 过期只提示用户主动更新，**不自动调用接口**（R10）——本模块不做任何触发，只产出文案。
 */

const { parseInstant } = require('./clock');
const { DISPLAY_STATE, PUBLISHED_STATUS } = require('./contracts');

const VALIDITY_STATE = {
  WITHIN_KNOWN_WINDOW: 'within_known_window',
  EXPIRED: 'expired',
  UNKNOWN: 'unknown',
};

/** 供餐条件「已知变化」时，同样按过期处理（R10） */
const CONDITION_CHANGED = 'mismatch';

/**
 * 由一组报价解析有效区间状态。
 * @param {Array<{validFrom?:string|null, validTo?:string|null, conditionState?:string}>} quotes
 * @param {number} nowTs
 * @returns {'within_known_window'|'expired'|'unknown'}
 */
function resolveValidityState(quotes, nowTs) {
  const list = (quotes || []).filter(Boolean);
  if (list.length === 0) return VALIDITY_STATE.UNKNOWN;

  // 已知条件变化 -> 视为过期（不静默放行）
  if (list.some((q) => q.conditionState === CONDITION_CHANGED)) return VALIDITY_STATE.EXPIRED;

  const hasKnownWindow = list.some((q) => q.validFrom != null || q.validTo != null);
  if (!hasKnownWindow) return VALIDITY_STATE.UNKNOWN; // 无任何已核实区间

  // 任一已核实区间已过 -> expired
  for (const q of list) {
    const validTo = parseInstant(q.validTo);
    if (validTo !== null && nowTs > validTo) return VALIDITY_STATE.EXPIRED;
    const validFrom = parseInstant(q.validFrom);
    if (validFrom !== null && nowTs < validFrom) return VALIDITY_STATE.EXPIRED; // 尚未生效，本批不可用
  }

  // 全部区间已核实且当前位于其中才 within_known_window
  const allWindowsKnown = list.every(
    (q) => parseInstant(q.validFrom) !== null && parseInstant(q.validTo) !== null
  );
  if (!allWindowsKnown) return VALIDITY_STATE.UNKNOWN;
  return VALIDITY_STATE.WITHIN_KNOWN_WINDOW;
}

/** 有效区间状态 -> 界面文案（不承诺此后持续可购） */
function validityText(state) {
  switch (state) {
    case VALIDITY_STATE.WITHIN_KNOWN_WINDOW:
      return '在已核实的有效区间内';
    case VALIDITY_STATE.EXPIRED:
      return '报价已过期，请手动更新榜单';
    default:
      return '有效期未知，仅为报价时点结果';
  }
}

/**
 * 是否应提示用户主动更新。
 * 注意：只返回一个布尔，调用方据此**显示提示**，不得据此自动发起查询（R10）。
 * @returns {boolean}
 */
function shouldPromptManualUpdate(state) {
  return state === VALIDITY_STATE.EXPIRED;
}

/**
 * 解析某个渠道的展示状态。
 * @param {object} input
 * @param {object|null} input.publishedBatch  该渠道最近**已发布**批次
 * @param {boolean} [input.hasActiveRequest]  该渠道是否有正在执行的批次
 * @returns {{ state: 'current_snapshot'|'previous_result'|'empty', isStale: boolean }}
 *   运行中仍展示上次已发布快照，标 previous_result；不得把运行中报价混入。
 */
function resolveDisplayState({ publishedBatch, hasActiveRequest = false }) {
  if (!publishedBatch || !PUBLISHED_STATUS.has(publishedBatch.status)) {
    return { state: DISPLAY_STATE.EMPTY, isStale: false };
  }
  if (hasActiveRequest) {
    return { state: DISPLAY_STATE.PREVIOUS_RESULT, isStale: true };
  }
  return { state: DISPLAY_STATE.CURRENT_SNAPSHOT, isStale: false };
}

/** 展示状态 -> 榜首/状态页前缀文案 */
function displayStateText(state, observedDisplay) {
  const timeText = observedDisplay ? `（报价时间 ${observedDisplay}）` : '（报价时间未知）';
  switch (state) {
    case DISPLAY_STATE.CURRENT_SNAPSHOT:
      return `本次报价结果${timeText}`;
    case DISPLAY_STATE.PREVIOUS_RESULT:
      return `上次结果，正在更新${timeText}`;
    default:
      return '暂无报价';
  }
}

module.exports = {
  VALIDITY_STATE,
  resolveValidityState,
  validityText,
  shouldPromptManualUpdate,
  resolveDisplayState,
  displayStateText,
};
