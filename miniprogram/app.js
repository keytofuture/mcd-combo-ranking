// app.js — 体验版：页面只读渲染 services/data.js 的快照，不发起任何网络请求。
App({
  globalData: {
    // 体验版数据是抓取快照，页面之间只传「看哪个套餐」
    currentChannel: 'pickup',
  },
});
