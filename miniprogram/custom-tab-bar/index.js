// custom-tab-bar — 自定义 tabBar：原生 tabBar 无法定制到与页面一致的视觉，这里自己画。
// 选中态由各 tab 页在 onShow 里调用 this.getTabBar().setData({ selected }) 同步。
Component({
  data: {
    selected: 0,
    list: [
      {
        pagePath: '/pages/ranking/ranking',
        text: '套餐榜',
        icon: 'list',
      },
      {
        pagePath: '/pages/source/source',
        text: '数据来源',
        icon: 'db',
      },
    ],
  },

  methods: {
    onTap(e) {
      const index = Number(e.currentTarget.dataset.index);
      const target = this.data.list[index];
      if (!target || index === this.data.selected) return;
      wx.switchTab({ url: target.pagePath });
    },
  },
});
