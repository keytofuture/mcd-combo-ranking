'use strict';

/**
 * 时间辅助（v1.1）。
 * 对应 PRD：第 7 节（时间保存与显示）、R10（报价时间范围与过期提示）。
 *
 * v1.1 明确取消「历史窗口 / 7d / 30d 走势」。
 * 本模块只保留展示与过期判定所需的最小能力：
 * - 存储用 UTC 或带偏移的 ISO 8601；展示统一转北京时间。
 * - generatedAt（服务响应时间）不是价格采集时间，调用方不得混用。
 * - 本模块**不含**任何窗口统计、按日聚合或采样计划函数。
 */

const TIMEZONE = 'Asia/Shanghai';

const dateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const timeFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: TIMEZONE,
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

/** 解析 ISO 8601 时间戳（UTC 或带偏移），非法返回 null（不猜当前时间） */
function parseInstant(value) {
  if (typeof value !== 'string' || value.length === 0) return null;
  const ts = Date.parse(value);
  return Number.isNaN(ts) ? null : ts;
}

/** 北京时间日期键 'YYYY-MM-DD' */
function beijingDateKey(ts) {
  return dateFormatter.format(new Date(ts));
}

/** 北京时间时刻键 'HH:mm' */
function beijingTimeKey(ts) {
  return timeFormatter.format(new Date(ts));
}

/** 北京时间展示串 'YYYY-MM-DD HH:mm'；未知返回 null */
function beijingDisplay(instant) {
  const ts = typeof instant === 'number' ? instant : parseInstant(instant);
  if (ts === null) return null;
  return `${beijingDateKey(ts)} ${beijingTimeKey(ts)}`;
}

/** 当前时刻的带偏移 ISO 8601（毫秒），用于写入 observedAt */
function toIso(ts) {
  return new Date(ts).toISOString();
}

/** 在日期键上加减自然日 */
function addDays(dateKey, delta) {
  const [year, month, day] = dateKey.split('-').map(Number);
  const dt = new Date(Date.UTC(year, month - 1, day));
  dt.setUTCDate(dt.getUTCDate() + delta);
  return dt.toISOString().slice(0, 10);
}

/**
 * 由已核实报价的观测时刻组成展示范围。
 * 不使用请求创建时间或页面响应时间代替真实观测时刻（R10）。
 * @param {Array<string|number|null>} observedAts
 * @returns {{ start: string|null, end: string|null, display: string|null }}
 *   全部未知时三者均为 null，界面显示「报价时间未知」。
 */
function observedRange(observedAts) {
  const tsList = (observedAts || [])
    .map((value) => (typeof value === 'number' ? value : parseInstant(value)))
    .filter((ts) => ts !== null);
  if (tsList.length === 0) return { start: null, end: null, display: null };
  const start = Math.min(...tsList);
  const end = Math.max(...tsList);
  const startText = beijingDisplay(start);
  const endText = beijingDisplay(end);
  return {
    start: toIso(start),
    end: toIso(end),
    display: start === end ? startText : `${startText} — ${endText}`,
  };
}

module.exports = {
  TIMEZONE,
  parseInstant,
  beijingDateKey,
  beijingTimeKey,
  beijingDisplay,
  toIso,
  addDays,
  observedRange,
};
