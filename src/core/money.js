'use strict';

/**
 * 金额与数值基础工具。
 * 对应 PRD：第 7.1 节「金额校验」、第 R03 节显示舍入。
 *
 * 约定（PRD 强制）：
 * - 所有金额以人民币「分」为单位的非负整数存储。
 * - 缺失记 null，且 null 与 0 严格不同，不得以 0 代替 null。
 * - 金额显示固定 2 位小数；折数固定 1 位小数。
 */

/** 是否为合法的分值（非负整数） */
function isCents(value) {
  return Number.isInteger(value) && value >= 0;
}

/** 断言并返回合法分值，否则抛错（金额无法判断单位时失败，不猜元/分） */
function assertCents(value, label) {
  if (!isCents(value)) {
    throw new TypeError(`${label} 必须是非负整数分，实际收到：${JSON.stringify(value)}`);
  }
  return value;
}

/** 固定 2 位的金额文本：1840 -> "¥18.40"；缺失返回 null（不是 "¥0.00"） */
function formatCents(cents) {
  if (!isCents(cents)) return null;
  return '¥' + (cents / 100).toFixed(2);
}

/**
 * 把有理数 num/den 以 half-up 规则舍入到 digits 位小数，返回 Number。
 * 用整数算术实现，规避二进制浮点误差（例如 6.05 用 Math.round 会得到 6.0）。
 * 仅用于「显示」与「阈值判断」，不改变内部金额或排名。
 */
function roundRationalHalfUp(num, den, digits) {
  if (!Number.isInteger(num) || !Number.isInteger(den) || den <= 0) {
    throw new TypeError('roundRationalHalfUp 需要整数分子与非负整数分母');
  }
  const negative = num < 0;
  const n = Math.abs(num);
  const scale = Math.pow(10, digits);
  const scaled = n * scale;
  const q = Math.floor(scaled / den);
  const remainder = scaled - q * den;
  const rounded = 2 * remainder >= den ? q + 1 : q;
  const value = rounded / scale;
  return negative ? -value : value;
}

/** 精确比较两个有理数：a/b 与 c/d。返回 -1 / 0 / 1。交叉相乘，整数比较。 */
function compareRational(aNum, aDen, bNum, bDen) {
  const left = aNum * bDen;
  const right = bNum * aDen;
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

module.exports = {
  isCents,
  assertCents,
  formatCents,
  roundRationalHalfUp,
  compareRational,
};
