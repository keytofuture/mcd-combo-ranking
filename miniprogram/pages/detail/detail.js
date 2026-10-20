// pages/detail/detail.js — P02 套餐详情
// 只读渲染快照里的单个套餐；不查任何接口。
const data = require('../../services/data.js');

const PRICE_SOURCE_TEXT = {
  'calculate-price': 'MCP 核价接口',
  'menu-price': '菜单价',
  'menu-price-override': '菜单价（接口价格偏离已覆盖）',
};

/**
 * 不可比的原因不同，解释就得不同。
 * 统一写成「有单品不单独卖」会把「自选套餐组成不完整」也说错，
 * 用户点进来看原因，看到的是错的解释，比不解释更糟。
 */
const REASON_EXPLAIN = {
  COMPONENT_PRICE_MISSING:
    '组成里有单品麦当劳不单独卖（多数是套餐专属的饮料编码），拿不到独立售价。硬算出来的 D 就是编的，所以宁可不上榜。',
  DEFAULT_CONFIG_INCOMPLETE:
    '这类「随心选」套餐是自己挑东西的，麦当劳给的默认组成只有一项，代表不了你实际会拿到什么。组成都不确定，D 就没法算——所以不上榜，也不给一个假数字。',
  DEFAULT_CONFIG_UNKNOWN: '拿不到这个套餐的默认组成，没法拆开逐项核价。',
  AMOUNT_MISSING: '套餐本身没取到有效报价，所以没有 P，算不了折扣。',
  ENTITLEMENT_UNKNOWN: '价格口径核实不了（不确定有没有夹带会员价或券），不拿它跟别的一起比。',
  CONDITION_UNKNOWN: '供餐或促销条件不清楚，不能确认跟别的套餐是同一口径。',
  CONDITION_MISMATCH: '这个套餐的供餐或促销条件跟其它套餐不一致，放一起比会失真。',
  FEE_NOT_SEPARABLE: '费用没法拆成纯餐品金额（混了配送或包装费），折扣会算歪。',
};

function explainReasons(reasons) {
  const list = (reasons || []).map((r) => REASON_EXPLAIN[r]).filter(Boolean);
  if (!list.length) return '这个套餐的某些条件无法核实，所以没有放进榜单。';
  return list.join(' ');
}

function findItem(id) {
  const hit = data.ranking.filter((r) => r.id === id)[0];
  if (hit) return { item: hit, comparable: true };
  const miss = data.notComparable.filter((n) => n.id === id)[0];
  if (miss) return { item: miss, comparable: false };
  const unfav = (data.unfavorable || []).filter((u) => u.id === id)[0];
  if (unfav) return { item: unfav, comparable: true, unfavorable: true };
  return null;
}

Page({
  data: {
    src: data.source,
    item: null,
    comparable: false,
    unfavorable: false,
    reasonExplain: '',
    priceSourceText: '',
    showEvidence: false,
  },

  onLoad(query) {
    const found = query && query.id ? findItem(query.id) : null;
    if (!found) {
      wx.showToast({ title: '该套餐不在本次结果里', icon: 'none' });
      return;
    }
    this.setData({
      item: found.item,
      comparable: found.comparable,
      unfavorable: Boolean(found.unfavorable),
      reasonExplain: found.comparable ? '' : explainReasons(found.item.reasons),
      priceSourceText: PRICE_SOURCE_TEXT[found.item.comboPriceSource] || 'MCP 核价接口',
    });
  },

  onToggleEvidence() {
    this.setData({ showEvidence: !this.data.showEvidence });
  },
});
