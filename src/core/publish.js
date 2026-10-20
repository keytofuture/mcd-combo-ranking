'use strict';

/**
 * 发布与缓存显示（v1.1）。
 * 对应 PRD：R10（发布和缓存显示）、第 8 节（分页游标）、T20 / T21 / T25。
 *
 * 规则：
 * - 初次无已发布结果 -> 空态；更新中不用演示数据代替真实空数据。
 * - completed / partial 结束后**整体发布**本批结果与覆盖摘要；0 个可比也发布空榜及原因。
 * - failed / blocked **不发布**新榜单，保留上次快照并标「上次结果」；无旧快照则空态。
 * - 每个套餐的 P、D、组成、名次和详情都属于**同一发布批次**，不得混批。
 * - 分页游标绑定上下文 + 已选批次 + 筛选条件；新批发布后旧游标继续旧快照，或明确报失效。
 * - 所点快照已清理时明确报失效，**不悄悄换成另一批数字**。
 */

const { PUBLISHED_STATUS, BATCH_STATUS, DISPLAY_STATE } = require('./contracts');

/** 创建某渠道的初始状态 */
function initChannelState(channel) {
  return { channel, published: null, activeBatch: null, lastStatus: null };
}

/**
 * 结束一个批次并按 R10 决定是否发布。
 * @param {object} channelState { published, activeBatch, ... }
 * @param {object} batch 已结束的批次（含 status、snapshot、coverage）
 * @returns {{ channelState: object, published: boolean, displayState: string, note: string }}
 */
function concludeBatch(channelState, batch) {
  // 未终结（running）不是「结束」：不发布、不清旧榜、不改写状态
  if (batch.status === BATCH_STATUS.RUNNING) {
    return {
      channelState: { ...channelState, activeBatch: batch },
      published: false,
      displayState: channelState.published ? DISPLAY_STATE.PREVIOUS_RESULT : DISPLAY_STATE.EMPTY,
      note: '更新进行中，以下仍为上次已发布结果',
    };
  }

  const state = { ...channelState, lastStatus: batch.status, activeBatch: null };

  if (PUBLISHED_STATUS.has(batch.status)) {
    // 整体切换：可发布批次一次性替换该渠道结果
    state.published = {
      batchId: batch.id,
      status: batch.status,
      coverage: batch.coverage ?? null,
      snapshot: batch.snapshot ?? null,
      publishedAt: batch.finishedAt ?? null,
    };
    return {
      channelState: state,
      published: true,
      displayState: DISPLAY_STATE.CURRENT_SNAPSHOT,
      note: batch.status === BATCH_STATUS.PARTIAL ? '本次为局部结果，目录不完整' : '本次结果已发布',
    };
  }

  // failed / blocked：保留上次快照，不发布新榜单
  const hasPrevious = Boolean(state.published);
  return {
    channelState: state,
    published: false,
    displayState: hasPrevious ? DISPLAY_STATE.PREVIOUS_RESULT : DISPLAY_STATE.EMPTY,
    note: hasPrevious
      ? '本次更新失败/未执行，以下为上次结果'
      : '本次更新失败/未执行，暂无历史结果',
  };
}

/**
 * 校验榜单所有行属于同一发布批次（防止混批，R10）。
 * @param {Array<{batchId:string}>} rows
 * @returns {{ consistent: boolean, batchIds: string[] }}
 */
function assertSingleBatch(rows) {
  const ids = [...new Set((rows || []).map((r) => r && r.batchId).filter(Boolean))];
  return { consistent: ids.length <= 1, batchIds: ids };
}

/** 创建分页游标：绑定上下文 + 已选批次 + 筛选条件 */
function makeCursor({ contextVersion, batchId, filters = {} }) {
  return {
    contextVersion,
    batchId,
    filters: Object.fromEntries(Object.entries(filters).sort()),
  };
}

/**
 * 解析游标是否仍可用。
 * 新批发布后：旧游标**继续旧快照**（若旧批次仍保留），否则明确报失效——不得混排名。
 * @returns {{ valid: boolean, useBatchId: string|null, reason: string }}
 */
function resolveCursor({ cursor, latestBatchId, retainedBatchIds = [] }) {
  if (!cursor) return { valid: false, useBatchId: null, reason: 'NO_CURSOR' };
  const retained = new Set(retainedBatchIds);
  if (cursor.batchId && retained.has(cursor.batchId)) {
    // 旧批次仍保留：继续读旧快照，避免换批混排名
    return { valid: true, useBatchId: cursor.batchId, reason: 'CONTINUE_OLD_SNAPSHOT' };
  }
  if (cursor.batchId === latestBatchId) {
    return { valid: true, useBatchId: latestBatchId, reason: 'CURRENT_BATCH' };
  }
  return { valid: false, useBatchId: null, reason: 'CURSOR_EXPIRED' };
}

/**
 * 解析详情引用的快照。（R10：已清理则明确报失效，不替换数据）
 * @returns {{ state: 'ok'|'expired', snapshot: object|null, reason: string }}
 */
function resolveDetailSnapshot({ snapshotId, snapshots }) {
  const hit = (snapshots || []).find((s) => s.id === snapshotId);
  if (!hit) {
    return { state: 'expired', snapshot: null, reason: 'SNAPSHOT_EXPIRED' };
  }
  return { state: 'ok', snapshot: hit, reason: 'OK' };
}

module.exports = {
  initChannelState,
  concludeBatch,
  assertSingleBatch,
  makeCursor,
  resolveCursor,
  resolveDetailSnapshot,
};
