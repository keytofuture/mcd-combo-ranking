'use strict';

/**
 * 按需更新状态机（v1.1）。
 * 对应 PRD：R08（唯一触发入口）、R09（一次执行）、R11（有界执行和错误）、第 8 节接口。
 *
 * 核心约束（PRD 明文）：
 * - **只有**用户明确点击「更新榜单」（`requestRankingUpdate`）才可启动新报价请求。
 *   读操作、应用启动、页面刷新、缓存过期、返回前台、重新登录均不能启动新查询。
 * - 客户端防连点；服务端用幂等键 + 原子机制。相同 用户 + mode + 固定上下文组合
 *   **至多存在一个活动更新请求**；已有活动请求时返回其标识与状态，不再建一轮。
 * - 同幂等键的终态请求返回原结果。用户完成后**主动**再次更新才创建新键。
 * - 一次请求为两个渠道**分别**登记唯一批次（唯一键 requestId + contextVersion），
 *   一方失败不抹掉另一方结果。
 * - 进程中断不自动创建新轮或重放整批；未终结批次按已记录证据收尾为 partial / failed。
 * - **迟到响应不得改写终态和已发布结果。**
 */

const {
  BATCH_STATUS,
  TERMINAL_STATUS,
  MODE,
} = require('./contracts');

/** 只有该操作是「新报价入口」（PRD 第 8 节） */
const TRIGGER_OPERATION = 'requestRankingUpdate';

/** 只读操作清单：绝不触发麦当劳调用 */
const READ_OPERATIONS = new Set([
  'readPriceContexts',
  'readComboRanking',
  'readComboDetail',
  'readUpdateStatus',
]);

/** 哪些事件**不能**启动新报价查询（R08） */
const NON_TRIGGER_EVENTS = [
  'app_launch',
  'page_open',
  'page_refresh',
  'pull_to_refresh',
  'foreground',
  'cache_expired',
  'relogin',
];

/**
 * 该操作是否可启动新的报价查询。
 * @returns {boolean}
 */
function canStartUpdate(operation) {
  return operation === TRIGGER_OPERATION;
}

/** 幂等键必须由客户端生成并随传输重试保持一致 */
function makeIdempotencyKey(seed) {
  const text = String(seed ?? '').trim();
  if (text.length === 0) throw new TypeError('幂等键不能为空');
  return `idem-${text}`;
}

/** 上下文组合的规范化键：与顺序无关，避免同一组合被判成两个请求 */
function contextKeyOf(contextVersions) {
  return (contextVersions || []).slice().sort().join('|');
}

/** 查找该 用户 + mode + 上下文组合的活动（未终态）请求 */
function findActiveRequest(requests, { ownerRef, mode, contextVersions }) {
  const key = contextKeyOf(contextVersions);
  return (
    (requests || []).find(
      (r) =>
        r.ownerRef === ownerRef &&
        r.mode === mode &&
        contextKeyOf(r.contextVersions) === key &&
        r.finishedAt === null
    ) || null
  );
}

/**
 * 登记一次更新请求（服务端幂等）。
 * @param {object} input
 * @param {Array<object>} input.requests  现有请求（只读）
 * @param {string} input.idempotencyKey
 * @param {function():string} input.nextId  生成新 requestId 的工厂（避免本模块依赖随机源）
 * @param {string} input.ownerRef
 * @param {'demo'|'live'} input.mode
 * @param {string[]} input.contextVersions
 * @param {string} input.requestedAt
 * @returns {{ request: object, created: boolean, reason: string }}
 */
function requestUpdate({ requests, idempotencyKey, nextId, ownerRef, mode, contextVersions, requestedAt }) {
  const list = requests || [];

  // 1) 同幂等键已存在（终态或活动）-> 返回原请求，不重复创建核价批次
  const sameKey = list.find((r) => r.idempotencyKey === idempotencyKey);
  if (sameKey) {
    return { request: sameKey, created: false, reason: 'SAME_IDEMPOTENCY_KEY' };
  }

  // 2) 已有活动请求 -> 返回其标识与状态，不再建一轮
  const active = findActiveRequest(list, { ownerRef, mode, contextVersions });
  if (active) {
    return { request: active, created: false, reason: 'ACTIVE_REQUEST_EXISTS' };
  }

  // 3) 全新请求
  if (typeof nextId !== 'function') throw new TypeError('缺少 requestId 工厂');
  const request = {
    id: nextId(),
    idempotencyKey,
    ownerRef,
    mode,
    contextVersions: (contextVersions || []).slice(),
    requestedAt,
    finishedAt: null,
  };
  return { request, created: true, reason: 'CREATED' };
}

/**
 * 为一次请求的每个渠道上下文登记唯一批次。
 * 唯一键 requestId + contextVersion —— 一个请求内每个上下文唯一。
 * @returns {Array<object>} 新批次（running）
 */
function registerBatches(request, contexts, { idFactory }) {
  const existing = new Set(); // 本请求内已注册的 contextVersion
  const batches = [];
  for (const context of contexts || []) {
    const contextVersion = `${context.id}@v${context.version}`;
    if (existing.has(contextVersion)) {
      throw new Error(`同一请求内上下文重复：${contextVersion}`);
    }
    existing.add(contextVersion);
    batches.push({
      id: idFactory(contextVersion),
      requestId: request.id,
      contextVersion,
      channel: context.channel,
      startedAt: request.requestedAt,
      finishedAt: null,
      status: BATCH_STATUS.RUNNING,
      coverage: null,
    });
  }
  return batches;
}

/** 前提不满足（许可/凭据/环境/预算）-> blocked，不发 MCP 请求 */
function markBlocked(batch, reasonCode, finishedAt = null) {
  if (TERMINAL_STATUS.has(batch.status)) return batch; // 终态不可改写
  return { ...batch, status: BATCH_STATUS.BLOCKED, finishedAt, reasonCode };
}

/**
 * 判定批次结束状态（R09第5步、R11）。
 * @param {object} input
 * @param {boolean} input.started        是否已开始执行（发了请求）
 * @param {boolean} input.hasEvidence    是否有可发布有效证据
 * @param {boolean} input.complete       必要发现/查询是否完整结束
 * @param {boolean} [input.blocked]
 */
function resolveBatchFinalStatus({ started, hasEvidence, complete, blocked = false }) {
  if (blocked) return BATCH_STATUS.BLOCKED;
  if (!started || !hasEvidence) return BATCH_STATUS.FAILED;
  return complete ? BATCH_STATUS.COMPLETED : BATCH_STATUS.PARTIAL;
}

/** 结束一个批次（只有非终态可结束；已终态保持不变，避免迟到响应改写） */
function finishBatch(batch, { status, coverage = null, finishedAt }) {
  if (TERMINAL_STATUS.has(batch.status)) {
    return { batch, applied: false, reason: 'ALREADY_TERMINAL' };
  }
  return {
    batch: { ...batch, status, coverage, finishedAt: finishedAt ?? batch.finishedAt ?? null },
    applied: true,
    reason: 'FINALIZED',
  };
}

/**
 * 进程中断 / 超时的收尾：按已记录证据结束，**不重放整批**。
 */
function finalizeInterrupted(batch, { hadEvidence }) {
  if (TERMINAL_STATUS.has(batch.status)) {
    return { batch, applied: false, reason: 'ALREADY_TERMINAL' };
  }
  const status = hadEvidence ? BATCH_STATUS.PARTIAL : BATCH_STATUS.FAILED;
  return {
    batch: { ...batch, status, finishedAt: batch.finishedAt ?? null },
    applied: true,
    reason: 'INTERRUPTED_FINALIZED',
  };
}

/**
 * 应用一个晚到的响应。终态批次不得被改写。
 * @returns {{ batch: object, applied: boolean, reason: string }}
 */
function applyLateResponse(batch, _response) {
  if (TERMINAL_STATUS.has(batch.status)) {
    return { batch, applied: false, reason: 'TERMINAL_NOT_OVERWRITTEN' };
  }
  return { batch, applied: true, reason: 'APPLIED' };
}

/**
 * 有界执行判定：预算 / 执行截止 / 重试上限。
 * @returns {{ stop: boolean, reasonCode: string|null }}
 */
function shouldStop({ startedAt, nowTs, deadline, requestsUsed = 0, retryCount = 0, budget = {}, maxRetries = 2 }) {
  if (budget.maxRequests != null && requestsUsed >= budget.maxRequests) {
    return { stop: true, reasonCode: 'BUDGET_EXCEEDED' };
  }
  if (deadline != null && nowTs != null && nowTs >= deadline) {
    return { stop: true, reasonCode: 'EXECUTION_TIMEOUT' };
  }
  if (retryCount >= maxRetries) {
    return { stop: true, reasonCode: 'REQUEST_FAILED' };
  }
  return { stop: false, reasonCode: null };
}

/** 汇总一次请求的状态：由各渠道批次汇总，**不掩盖单渠道失败** */
function summarizeRequest(request, batches) {
  const list = (batches || []).filter((b) => b.requestId === request.id);
  const byChannel = {};
  for (const b of list) byChannel[b.channel] = b.status;

  const allTerminal = list.length > 0 && list.every((b) => TERMINAL_STATUS.has(b.status));
  return {
    requestId: request.id,
    // 未全部终态时不提前下结论
    finishedAt: allTerminal ? request.finishedAt || maxOf(list.map((b) => b.finishedAt)) : null,
    running: !allTerminal,
    byChannel,
  };
}

function maxOf(values) {
  const list = values.filter((v) => typeof v === 'string');
  if (list.length === 0) return null;
  return list.slice().sort().at(-1);
}

module.exports = {
  TRIGGER_OPERATION,
  READ_OPERATIONS,
  NON_TRIGGER_EVENTS,
  MODE,
  canStartUpdate,
  makeIdempotencyKey,
  contextKeyOf,
  findActiveRequest,
  requestUpdate,
  registerBatches,
  markBlocked,
  resolveBatchFinalStatus,
  finishBatch,
  finalizeInterrupted,
  applyLateResponse,
  shouldStop,
  summarizeRequest,
};
