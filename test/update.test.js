'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const update = require('../src/core/update');
const publish = require('../src/core/publish');
const { BATCH_STATUS, DISPLAY_STATE } = require('../src/core/contracts');

const fixture = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../src/fixtures/demo-update-scenarios.json'), 'utf8')
);
const base = fixture.base;
const caseOf = (id) => fixture.cases.find((c) => c.id === id);

/** 一个自增 id 工厂，避免依赖随机源 */
function counter(prefix = 'id') {
  let n = 0;
  return () => `${prefix}-${++n}`;
}

test('T16 打开/刷新/下拉/切渠道/进详情只读，MCP 增量为 0；只有更新按钮能发起', () => {
  const c = caseOf('T16');
  for (const op of c.operations) {
    assert.strictEqual(update.canStartUpdate(op), false, `${op} 不得发起核价`);
  }
  assert.strictEqual(update.canStartUpdate(c.expected.triggerOperationCanStart ? 'requestRankingUpdate' : ''), true);
  // 非触发事件本身不是操作；确认它们不在触发清单里
  for (const evt of c.events) {
    assert.strictEqual(update.canStartUpdate(evt), false, `${evt} 不得发起核价`);
  }
});

test('T17 一次更新 -> 一个请求 + 两个独立渠道批次', () => {
  const nextId = counter('req');
  const r = update.requestUpdate({
    requests: [], idempotencyKey: 'idem-20261016-0001', nextId,
    ownerRef: base.ownerRef, mode: base.mode,
    contextVersions: base.contexts.map((c) => `${c.id}@v${c.version}`),
    requestedAt: base.requestedAt,
  });
  assert.strictEqual(r.created, true);

  const batches = update.registerBatches(r.request, base.contexts, { idFactory: counter('batch') });
  assert.strictEqual(batches.length, 2);
  const keys = new Set(batches.map((b) => `${b.requestId}|${b.contextVersion}`));
  assert.strictEqual(keys.size, 2, '唯一键 requestId + contextVersion 不得重复');
  assert.deepStrictEqual(batches.map((b) => b.channel), ['pickup', 'delivery']);
});

test('T18 同幂等键重试 -> 返回原请求，不重复创建批次', () => {
  const first = update.requestUpdate({
    requests: [], idempotencyKey: 'idem-20261016-0001', nextId: counter('req'),
    ownerRef: base.ownerRef, mode: base.mode, contextVersions: ['ctx-pickup-demo@v1', 'ctx-delivery-demo@v1'],
    requestedAt: base.requestedAt,
  });
  const again = update.requestUpdate({
    requests: [first.request], idempotencyKey: 'idem-20261016-0001', nextId: counter('req2'),
    ownerRef: base.ownerRef, mode: base.mode, contextVersions: ['ctx-pickup-demo@v1', 'ctx-delivery-demo@v1'],
    requestedAt: '2026-10-16T04:05:00.000Z',
  });
  assert.strictEqual(again.created, false);
  assert.strictEqual(again.reason, 'SAME_IDEMPOTENCY_KEY');
  assert.strictEqual(again.request.id, first.request.id, '必须返回原请求');
});

test('T18 已有活动请求（不同键）-> 返回其标识与状态，不新建一轮', () => {
  const first = update.requestUpdate({
    requests: [], idempotencyKey: 'idem-A', nextId: counter('req'),
    ownerRef: base.ownerRef, mode: base.mode, contextVersions: ['ctx-pickup-demo@v1', 'ctx-delivery-demo@v1'],
    requestedAt: base.requestedAt,
  });
  const second = update.requestUpdate({
    requests: [first.request], idempotencyKey: 'idem-B', nextId: counter('req2'),
    ownerRef: base.ownerRef, mode: base.mode, contextVersions: ['ctx-delivery-demo@v1', 'ctx-pickup-demo@v1'],
    requestedAt: '2026-10-16T04:03:00.000Z',
  });
  assert.strictEqual(second.created, false);
  assert.strictEqual(second.reason, 'ACTIVE_REQUEST_EXISTS');
  assert.strictEqual(second.request.id, first.request.id);
});

test('T18 幂等键必须非空', () => {
  assert.throws(() => update.makeIdempotencyKey('   '), /幂等键/);
});

test('T19 自取成功、外送失败：各渠道独立发布，不串价', () => {
  const pickup = publish.initChannelState('pickup');
  const delivery = publish.initChannelState('delivery');
  // 两渠道各有上一次已发布结果
  pickup.published = { batchId: 'old-p', status: BATCH_STATUS.COMPLETED, snapshot: { rows: ['旧自取'] }, coverage: null };

  const r1 = publish.concludeBatch(pickup, {
    id: 'b-p', status: BATCH_STATUS.COMPLETED, snapshot: { rows: ['新自取'] }, coverage: { eligibleComboCount: 3 }, finishedAt: base.finishedAt,
  });
  const r2 = publish.concludeBatch(delivery, { id: 'b-d', status: BATCH_STATUS.FAILED, finishedAt: base.finishedAt });

  assert.strictEqual(r1.published, true);
  assert.strictEqual(r1.displayState, DISPLAY_STATE.CURRENT_SNAPSHOT);
  assert.strictEqual(r1.channelState.published.batchId, 'b-p');

  assert.strictEqual(r2.published, false);
  assert.strictEqual(r2.displayState, DISPLAY_STATE.EMPTY, '外送无旧结果 -> 空态');
  assert.strictEqual(r2.channelState.published, null);
});

test('T19 外送失败但有旧结果 -> 保留自己的上次结果', () => {
  const delivery = publish.initChannelState('delivery');
  delivery.published = { batchId: 'old-d', status: BATCH_STATUS.COMPLETED, snapshot: { rows: ['旧外送'] }, coverage: null };
  const r = publish.concludeBatch(delivery, { id: 'b-d2', status: BATCH_STATUS.FAILED, finishedAt: base.finishedAt });
  assert.strictEqual(r.published, false);
  assert.strictEqual(r.displayState, DISPLAY_STATE.PREVIOUS_RESULT);
  assert.strictEqual(r.channelState.published.batchId, 'old-d', '不得覆盖旧结果');
  assert.match(r.note, /上次结果/);
});

test('T20 运行中只显示旧完整快照，运行中报价不混入', () => {
  const state = publish.initChannelState('pickup');
  state.published = { batchId: 'b-old', status: BATCH_STATUS.COMPLETED, snapshot: { rows: ['完整旧榜'] }, coverage: null };
  const r = publish.concludeBatch(state, { id: 'b-new', status: BATCH_STATUS.RUNNING });
  // running 未终结：不发布、不清除旧榜
  assert.strictEqual(r.channelState.published.batchId, 'b-old');
  assert.strictEqual(r.published, false);
});

test('T21 failed/blocked 有旧榜保留、无旧榜空态，都不声称更新成功', () => {
  const withPrev = caseOf('T21-with-previous');
  const noPrev = caseOf('T21-no-previous');

  const s1 = publish.initChannelState('pickup');
  s1.published = { batchId: 'old', status: BATCH_STATUS.COMPLETED, snapshot: {}, coverage: null };
  const r1 = publish.concludeBatch(s1, { id: 'n1', status: withPrev.hasPrevious ? BATCH_STATUS.FAILED : BATCH_STATUS.BLOCKED });
  assert.strictEqual(r1.published, false);
  assert.strictEqual(r1.displayState, 'previous_result');

  const s2 = publish.initChannelState('pickup');
  const r2 = publish.concludeBatch(s2, { id: 'n2', status: BATCH_STATUS.BLOCKED });
  assert.strictEqual(r2.displayState, noPrev.expected.displayState);
});

test('T25 翻页中发布新批：旧游标继续旧快照，不混排名', () => {
  const c = caseOf('T25-cursor');
  const cursor = publish.makeCursor({ contextVersion: 'ctx-pickup-demo@v1', batchId: c.cursorBatch, filters: { kind: 'all' } });
  const r = publish.resolveCursor({ cursor, latestBatchId: c.latestBatch, retainedBatchIds: c.retainedBatchIds });
  assert.strictEqual(r.valid, true);
  assert.strictEqual(r.useBatchId, c.cursorBatch);
  assert.strictEqual(r.reason, 'CONTINUE_OLD_SNAPSHOT');
});

test('T25 新批发布且旧批已清理 -> 明确报失效', () => {
  const cursor = publish.makeCursor({ contextVersion: 'ctx-pickup-demo@v1', batchId: 'b-gone', filters: {} });
  const r = publish.resolveCursor({ cursor, latestBatchId: 'b-new', retainedBatchIds: ['b-new'] });
  assert.strictEqual(r.valid, false);
  assert.strictEqual(r.reason, 'CURSOR_EXPIRED');
});

test('T25 所点快照已清理 -> 报失效，不悄悄替换', () => {
  const c = caseOf('T25-snapshot');
  const r = publish.resolveDetailSnapshot({ snapshotId: c.snapshotId, snapshots: c.available.map((id) => ({ id })) });
  assert.strictEqual(r.state, 'expired');
  assert.strictEqual(r.reason, 'SNAPSHOT_EXPIRED');
  assert.strictEqual(r.snapshot, null, '不得返回另一批数字顶替');
});

test('T29 预算耗尽 / 超时：不再发新请求', () => {
  const budget = update.shouldStop({ requestsUsed: 6, budget: { maxRequests: 6 } });
  assert.strictEqual(budget.stop, true);
  assert.strictEqual(budget.reasonCode, 'BUDGET_EXCEEDED');

  const timeout = update.shouldStop({
    startedAt: base.requestedAt, nowTs: Date.parse('2026-10-16T04:10:00.000Z'),
    deadline: Date.parse('2026-10-16T04:05:00.000Z'),
  });
  assert.strictEqual(timeout.stop, true);
  assert.strictEqual(timeout.reasonCode, 'EXECUTION_TIMEOUT');
});

test('T29 进程中断：按已记录证据收尾为 partial/failed，不重放整批', () => {
  const running = { id: 'b1', requestId: 'r1', contextVersion: 'ctx@v1', channel: 'pickup', startedAt: base.requestedAt, finishedAt: null, status: BATCH_STATUS.RUNNING };
  const a = update.finalizeInterrupted(running, { hadEvidence: true });
  assert.strictEqual(a.batch.status, BATCH_STATUS.PARTIAL);
  const b = update.finalizeInterrupted(running, { hadEvidence: false });
  assert.strictEqual(b.batch.status, BATCH_STATUS.FAILED);
});

test('T29 迟到响应不得改写终态和已发布结果', () => {
  const terminal = { id: 'b1', requestId: 'r1', status: BATCH_STATUS.COMPLETED };
  const r = update.applyLateResponse(terminal, { status: BATCH_STATUS.FAILED });
  assert.strictEqual(r.applied, false);
  assert.strictEqual(r.reason, 'TERMINAL_NOT_OVERWRITTEN');
  assert.strictEqual(r.batch.status, BATCH_STATUS.COMPLETED);
});

test('批次终态判定：blocked > failed > partial > completed', () => {
  assert.strictEqual(update.resolveBatchFinalStatus({ started: false, hasEvidence: false, complete: false, blocked: true }), BATCH_STATUS.BLOCKED);
  assert.strictEqual(update.resolveBatchFinalStatus({ started: true, hasEvidence: false, complete: false }), BATCH_STATUS.FAILED);
  assert.strictEqual(update.resolveBatchFinalStatus({ started: true, hasEvidence: true, complete: false }), BATCH_STATUS.PARTIAL);
  assert.strictEqual(update.resolveBatchFinalStatus({ started: true, hasEvidence: true, complete: true }), BATCH_STATUS.COMPLETED);
});

test('0 个可比也发布空榜及原因，不借上次套餐补榜', () => {
  const state = publish.initChannelState('pickup');
  state.published = { batchId: 'old', status: BATCH_STATUS.COMPLETED, snapshot: { rows: ['旧'] }, coverage: null };
  const r = publish.concludeBatch(state, {
    id: 'empty-batch', status: BATCH_STATUS.COMPLETED, snapshot: { rows: [] },
    coverage: { eligibleComboCount: 0 }, finishedAt: base.finishedAt,
  });
  assert.strictEqual(r.published, true);
  assert.deepStrictEqual(r.channelState.published.snapshot.rows, []);
});

test('T27 blocked 前提不满足时：不发请求，记安全原因', () => {
  const batch = { id: 'b1', requestId: 'r1', status: BATCH_STATUS.RUNNING, finishedAt: null };
  const blocked = update.markBlocked(batch, 'AUTH_EXPIRED', base.finishedAt);
  assert.strictEqual(blocked.status, BATCH_STATUS.BLOCKED);
  assert.strictEqual(blocked.reasonCode, 'AUTH_EXPIRED');
});

test('T19 两渠道均被阻止 -> 本次请求结束，仍可查询未执行原因', () => {
  const nextId = counter('req');
  const r = update.requestUpdate({
    requests: [], idempotencyKey: 'idem-block', nextId,
    ownerRef: base.ownerRef, mode: base.mode, contextVersions: ['ctx-pickup-demo@v1', 'ctx-delivery-demo@v1'],
    requestedAt: base.requestedAt,
  });
  let batches = update.registerBatches(r.request, base.contexts, { idFactory: counter('b') });
  batches = batches.map((b) => update.markBlocked(b, 'AUTH_EXPIRED', base.finishedAt));
  const summary = update.summarizeRequest(r.request, batches);
  assert.strictEqual(summary.running, false, '两渠道均终态 -> 请求结束');
  assert.deepStrictEqual(summary.byChannel, { pickup: 'blocked', delivery: 'blocked' });
});
