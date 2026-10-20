'use strict';

const test = require('node:test');
const assert = require('node:assert');

const {
  VALIDITY_STATE,
  resolveValidityState,
  validityText,
  shouldPromptManualUpdate,
  resolveDisplayState,
  displayStateText,
} = require('../src/core/validity');
const { DISPLAY_STATE } = require('../src/core/contracts');

const NOW = Date.parse('2026-10-16T04:00:00.000Z');

test('T23 全部区间已核实且当前位于其中 -> within_known_window', () => {
  const state = resolveValidityState(
    [{ validFrom: '2026-10-16T00:00:00.000Z', validTo: '2026-10-16T08:00:00.000Z' }],
    NOW
  );
  assert.strictEqual(state, VALIDITY_STATE.WITHIN_KNOWN_WINDOW);
});

test('T30 任一报价过期 -> expired，且只提示手动更新（不自动查询）', () => {
  const state = resolveValidityState(
    [
      { validFrom: '2026-10-16T00:00:00.000Z', validTo: '2026-10-16T08:00:00.000Z' },
      { validFrom: '2026-10-16T00:00:00.000Z', validTo: '2026-10-16T03:00:00.000Z' }, // 已过
    ],
    NOW
  );
  assert.strictEqual(state, VALIDITY_STATE.EXPIRED);
  assert.strictEqual(shouldPromptManualUpdate(state), true);
  assert.match(validityText(state), /过期/);
});

test('R05 有效期未知 -> unknown，不自动否定已核实观测价', () => {
  const state = resolveValidityState(
    [{ validFrom: '2026-10-16T00:00:00.000Z', validTo: null, amountCents: 2760 }],
    NOW
  );
  assert.strictEqual(state, VALIDITY_STATE.UNKNOWN);
  assert.strictEqual(shouldPromptManualUpdate(state), false, '未知不等于过期');
  assert.match(validityText(state), /有效期未知/);
});

test('供餐条件已知变化 -> 按过期处理', () => {
  const state = resolveValidityState([{ conditionState: 'mismatch' }], NOW);
  assert.strictEqual(state, VALIDITY_STATE.EXPIRED);
});

test('没有任何报价 -> unknown', () => {
  assert.strictEqual(resolveValidityState([], NOW), VALIDITY_STATE.UNKNOWN);
});

test('R10 展示状态：无已发布 -> 空态；有活动请求 -> 上次结果', () => {
  assert.strictEqual(
    resolveDisplayState({ publishedBatch: null }).state,
    DISPLAY_STATE.EMPTY
  );
  assert.strictEqual(
    resolveDisplayState({ publishedBatch: { status: 'completed' }, hasActiveRequest: true }).state,
    DISPLAY_STATE.PREVIOUS_RESULT
  );
  assert.strictEqual(
    resolveDisplayState({ publishedBatch: { status: 'partial' }, hasActiveRequest: false }).state,
    DISPLAY_STATE.CURRENT_SNAPSHOT
  );
});

test('未发布的 running 批次不能冒充已发布结果', () => {
  const r = resolveDisplayState({ publishedBatch: { status: 'running' } });
  assert.strictEqual(r.state, DISPLAY_STATE.EMPTY);
});

test('榜首文案区分本次/上次/空，并带真实报价时间', () => {
  assert.match(displayStateText(DISPLAY_STATE.CURRENT_SNAPSHOT, '2026-10-16 12:00'), /本次报价结果/);
  assert.match(displayStateText(DISPLAY_STATE.PREVIOUS_RESULT, '2026-10-16 12:00'), /上次结果/);
  assert.match(displayStateText(DISPLAY_STATE.PREVIOUS_RESULT, null), /报价时间未知/);
  assert.match(displayStateText(DISPLAY_STATE.EMPTY, null), /暂无报价/);
});
