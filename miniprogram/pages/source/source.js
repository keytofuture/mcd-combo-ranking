// pages/source/source.js — P03 数据来源
// 把「这个榜单凭什么是真的」讲清楚：怎么算、拿什么验证、哪些没算进来、为什么不实时。
const data = require('../../services/data.js');
const { describeAge } = require('../../utils/freshness.js');

Page({
  data: {
    src: data.source,
    coverage: data.coverage,
    hero: data.ranking[0] || null,
    devs: [],
    tightCount: 0,
    notComparableCount: data.notComparable.length,
    rankingCount: data.ranking.length,
    nameMatchedCount: data.honesty.nameMatchedCount,
    componentCount: data.honesty.componentCount,
    age: { level: 'unknown', text: '时间未知' },
    showOff: false,
    showPolicy: false,
    showRealtime: false,
  },

  onLoad() {
    const devs = data.ranking.filter((r) => r.devPctText);
    this.setData({
      devs,
      tightCount: devs.filter((r) => !r.devWarn).length,
      age: describeAge(data.source.observedISO, Date.now()),
    });
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 });
    }
  },

  onToggleOff() {
    this.setData({ showOff: !this.data.showOff });
  },

  onTogglePolicy() {
    this.setData({ showPolicy: !this.data.showPolicy });
  },

  onToggleRealtime() {
    this.setData({ showRealtime: !this.data.showRealtime });
  },
});
