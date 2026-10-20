/**
 * 「这份数据有多旧」的文案。
 *
 * 为什么要有这个东西：之前的界面写「19:49 现查」——但数据是三天前抓的，
 * 这是不实陈述。小程序确实拿不到实时价格（见 pages/source 的说明），
 * 所以唯一诚实的做法是把「旧」这件事直接摆在用户眼前，而不是藏起来。
 *
 * 纯函数：不读 Date.now()，由调用方传入现在的时间，便于测试。
 */

function describeAge(observedISO, nowMs) {
  const t = Date.parse(observedISO);
  if (!Number.isFinite(t)) {
    return { level: 'unknown', text: '时间未知' };
  }

  const mins = Math.floor((nowMs - t) / 60000);

  // 手机时钟比服务器慢时会得到负数，按「刚刚」处理，不显示负数
  if (mins < 5) return { level: 'fresh', text: '刚刚' };
  if (mins < 60) return { level: 'fresh', text: mins + ' 分钟前' };

  const hours = Math.floor(mins / 60);
  if (hours < 24) return { level: 'fresh', text: hours + ' 小时前' };

  const days = Math.floor(hours / 24);
  if (days === 1) return { level: 'aging', text: '昨天' };
  if (days < 3) return { level: 'aging', text: days + ' 天前' };
  if (days < 7) return { level: 'stale', text: days + ' 天前' };
  if (days < 60) return { level: 'stale', text: Math.floor(days / 7) + ' 周前' };
  return { level: 'stale', text: Math.floor(days / 30) + ' 个月前' };
}

module.exports = { describeAge };
