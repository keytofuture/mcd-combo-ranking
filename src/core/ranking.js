'use strict';

/**
 * 套餐折扣榜排名。
 * 对应 PRD：第 R03 节排序规则、第 R07 节资格、第 A14 条。
 *
 * 规则（PRD 明文）：
 * - 按未舍入的折扣比 R 升序排序（精确分数比较），不能按已显示的一位小数折数排序。
 * - 完全相同的比例视为同名次。
 * - 名次按竞争排名跳号，例如 1、1、3。
 * - 同名次内的展示顺序：A 降序 -> P 升序 -> 稳定标识升序。
 */

const { isCents, compareRational } = require('./money');

/**
 * @param {Array<{id:string, P:number, D:number, A:number, ratio:{num:number,den:number}}>} items
 *   只应传入已通过资格判定且可比的项（P、D 合法且 D > 0）。
 * @returns {Array<object>} 带 rank 字段的排序结果
 */
function rankCombos(items) {
  const list = (items || []).filter(
    (item) =>
      item &&
      item.ratio &&
      Number.isInteger(item.ratio.num) &&
      Number.isInteger(item.ratio.den) &&
      item.ratio.den > 0 &&
      isCents(item.P) &&
      isCents(item.D) &&
      item.D > 0
  );

  const sorted = list.slice().sort((a, b) => {
    // 1) 折扣比升序（精确、未舍入）
    const byRatio = compareRational(a.ratio.num, a.ratio.den, b.ratio.num, b.ratio.den);
    if (byRatio !== 0) return byRatio;
    // 2) 节省额降序
    if (a.A !== b.A) return b.A - a.A;
    // 3) 套餐价升序
    if (a.P !== b.P) return a.P - b.P;
    // 4) 稳定标识升序
    return String(a.id).localeCompare(String(b.id));
  });

  let currentRank = 0;
  return sorted.map((item, index) => {
    const prev = index === 0 ? null : sorted[index - 1];
    const sameAsPrev =
      prev !== null &&
      compareRational(item.ratio.num, item.ratio.den, prev.ratio.num, prev.ratio.den) === 0;
    if (!sameAsPrev) currentRank = index + 1; // 竞争排名，跳号
    return { ...item, rank: currentRank };
  });
}

module.exports = { rankCombos };
