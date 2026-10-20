'use strict';

/**
 * 测试时间辅助。全部基于固定基准时刻，保证离线可复现。
 * 基准：北京时间 2026-10-16 12:00（= UTC 2026-10-16 04:00）。
 * 放在 test/ 之外，避免被 node --test 的目录匹配规则误当作测试文件加载。
 */

const BASE_NOW_TS = Date.UTC(2026, 9, 16, 4, 0, 0);

/** 北京日期键 -> 时间戳（北京 12:00） */
function bjDateToTs(dateKey) {
  const [year, month, day] = dateKey.split('-').map(Number);
  return Date.UTC(year, month - 1, day, 4, 0, 0); // 北京 12:00 = UTC 04:00
}

/**
 * 以基准北京日期起算，构造某个 dayOffset 与北京时刻的时间戳。
 * @param {number} dayOffset 0 = 2026-10-16
 * @param {string} timeOfDay 'HH:mm'（北京时间）
 */
function bjTs(dayOffset, timeOfDay) {
  const [hour, minute] = timeOfDay.split(':').map(Number);
  const base = new Date(Date.UTC(2026, 9, 16));
  base.setUTCDate(base.getUTCDate() + dayOffset);
  return Date.UTC(
    base.getUTCFullYear(),
    base.getUTCMonth(),
    base.getUTCDate(),
    hour - 8, // 北京 -> UTC
    minute,
    0
  );
}

module.exports = { BASE_NOW_TS, bjDateToTs, bjTs };
