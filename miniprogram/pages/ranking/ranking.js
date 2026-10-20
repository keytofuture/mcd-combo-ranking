// pages/ranking/ranking.js — P01 套餐榜
// 体验版：只渲染 services/data.js 里的抓取快照，不发起任何网络请求。
const data = require('../../services/data.js');
const { describeAge } = require('../../utils/freshness.js');

Page({
  data: {
    src: data.source,
    coverage: data.coverage,
    ranking: data.ranking,
    hero: data.ranking[0] || null,
    rest: data.ranking.slice(1),
    unfavorable: data.unfavorable || [],
    notComparable: data.notComparable,
    notComparableNote: data.notComparableNote,
    showOff: false,
    age: { level: 'unknown', text: '时间未知' },
  },

  onLoad() {
    this.setData({ age: describeAge(this.data.src.observedISO, Date.now()) });
  },

  onShow() {
    // 自定义 tabBar 的选中态要各页自己同步
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 });
    }
  },

  onToggleOff() {
    this.setData({ showOff: !this.data.showOff });
  },

  onOpenCombo(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    wx.navigateTo({ url: '/pages/detail/detail?id=' + id });
  },

  onGoSource() {
    wx.switchTab({ url: '/pages/source/source' });
  },
});
