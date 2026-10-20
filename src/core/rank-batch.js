'use strict';

/**
 * 渠道榜单构建管道（v1.1）。
 * 把「资格判定 -> 折扣计算 -> 排名 -> 覆盖统计」串成一条确定性链路。
 * 对应 PRD：R03 / R07 / 第 7.2 节。
 *
 * 单一事实来源：测试与原型构建脚本都调用本模块，
 * 避免出现「原型一套数、测试另一套数」。
 */

const { computeDiscount, describeDiscount } = require('./discount');
const { rankCombos } = require('./ranking');
const { evaluateComboEligibility } = require('./eligibility');
const { buildCoverage } = require('./coverage');
const { observedRange } = require('./clock');

/**
 * @param {object} input
 * @param {boolean|'unknown'} input.catalogComplete
 * @param {Array<object>} input.combos 每个套餐：
 *   { id, comboVariantId, name, comboPriceCents,
 *     components:[{variantId, name, variantLabel, quantity, unitPriceCents, quote}],
 *     observation, defaultConfigVerified }
 * @param {number} [input.nowTs]
 * @returns {{ ranking:Array, notComparable:Array, coverage:object, observedRange:object }}
 */
function buildChannelRanking({ catalogComplete, combos, nowTs = null }) {
  const list = combos || [];
  const similar = [];        // 可比，进入主榜
  const notComparable = [];  // 不可比，保留在同页并注明原因

  for (const combo of list) {
    const components = (combo.components || []).map((c) => ({ ...c }));
    const observation = combo.observation || null;

    // 1) 资格判定（R02 / R04 / R05 / R06 / R07）
    const eligibility = evaluateComboEligibility({
      name: combo.name,
      defaultConfigVerified: combo.defaultConfigVerified === true,
      components,
      observation,
    });

    // 2) 折扣计算（R03）：资格不足时不产出可被误读为正式排名的数字
    const discount = computeDiscount({
      comboPriceCents: combo.comboPriceCents ?? null,
      components,
    });

    const reasons = [...new Set([...eligibility.reasons, ...discount.reasons])];

    if (!eligibility.eligible || !discount.eligible) {
      notComparable.push({
        id: combo.id,
        comboVariantId: combo.comboVariantId,
        name: combo.name,
        configId: combo.configId ?? null,
        P: discount.P,
        D: discount.D,
        reasons,
        reasonText: reasons.join('、'),
      });
      continue;
    }

    // 3) 生成展示文案
    const display = describeDiscount({ P: discount.P, D: discount.D });
    similar.push({
      id: combo.id,
      comboVariantId: combo.comboVariantId,
      name: combo.name,
      configId: combo.configId ?? null,
      P: discount.P,
      D: discount.D,
      A: discount.A,
      ratio: discount.ratio,
      display,
      compositionSummary: components
        .map((c) => `${c.name || c.variantId}${c.variantLabel ? `(${c.variantLabel})` : ''}×${c.quantity}`)
        .join(' + '),
    });
  }

  // 4) 排名：按未舍入比值升序，竞争排名
  const ranked = rankCombos(similar).map((item) => ({
    ...item,
    display: {
      ...item.display,
      ratioText: `${item.ratio.num}/${item.ratio.den}`,
      savedAmountText: item.display.savedAmountText,
    },
  }));

  // 5) 覆盖统计（失败数与缺价数不相加）
  const coverage = buildCoverage({
    catalogComplete,
    combos: list.map((combo, index) => ({
      comboVariantId: combo.comboVariantId,
      eligible: similar.some((s) => s.comboVariantId === combo.comboVariantId),
      observation: combo.observation || null,
      components: (combo.components || []).map((c) => ({ variantId: c.variantId, quote: c.quote || null })),
      _index: index,
    })),
  });

  const observed = observedRange([
    ...list.map((c) => (c.observation ? c.observation.observedAt : null)),
    ...list.flatMap((c) => (c.components || []).map((x) => (x.quote ? x.quote.observedAt : null))),
  ]);

  return { ranking: ranked, notComparable, coverage, observedRange: observed, nowTs };
}

module.exports = { buildChannelRanking };
