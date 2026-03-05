/**
 * CRM Virtual Hold - C33
 *
 * Estimated Wait Time (EWT) calculation using Erlang-C model and virtual
 * hold with callback option. When callers face long wait times, they can
 * opt to receive a callback instead of waiting on hold.
 *
 * Functions:
 * - calculateEWT: Erlang-C based estimated wait time
 * - offerVirtualHold: Offer a callback option to a waiting caller
 * - scheduleVirtualHoldCallback: Schedule a callback for a caller
 */

import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EWTResult {
  estimatedWaitSec: number;
  queueSize: number;
  agentCount: number;
  avgHandleTimeSec: number;
  utilizationPct: number;
}

interface VirtualHoldOffer {
  offered: boolean;
  estimatedWaitSec: number;
  callbackEstimatedAt?: Date;
  reason?: string;
}

interface ScheduledCallback {
  id: string;
  phone: string;
  queueId: string;
  estimatedCallbackAt: Date;
  createdAt: Date;
}

// ---------------------------------------------------------------------------
// In-memory callback queue
// In production, this should be backed by Redis + a persistent job queue.
// ---------------------------------------------------------------------------

const callbackQueue: ScheduledCallback[] = [];

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Minimum wait time (seconds) before offering virtual hold */
const VIRTUAL_HOLD_THRESHOLD_SEC = 120;

// ---------------------------------------------------------------------------
// erlangCProbability
// ---------------------------------------------------------------------------

/**
 * Calculate Erlang-C probability (probability a caller must wait).
 *
 * Erlang-C formula:
 *   P(wait) = (A^N / N!) * (N / (N - A)) / (sum(A^k / k!, k=0..N-1) + (A^N / N!) * (N / (N - A)))
 *
 * Where:
 *   A = traffic intensity (arrival rate * average handle time)
 *   N = number of agents
 *
 * @param trafficIntensity - A = arrivalRate * avgHandleTime
 * @param agents - Number of agents
 * @returns Probability (0-1) that a caller must wait
 */
function erlangCProbability(trafficIntensity: number, agents: number): number {
  if (agents <= 0 || trafficIntensity <= 0) return 0;
  if (trafficIntensity >= agents) return 1; // System is overloaded

  const A = trafficIntensity;
  const N = agents;

  // Calculate A^N / N!
  let aNoverNfact = 1;
  for (let i = 1; i <= N; i++) {
    aNoverNfact *= A / i;
  }

  // Factor: N / (N - A)
  const factor = N / (N - A);
  const numerator = aNoverNfact * factor;

  // Sum: sum(A^k / k!, k=0..N-1)
  let sum = 0;
  let term = 1;
  for (let k = 0; k < N; k++) {
    if (k > 0) {
      term *= A / k;
    }
    sum += term;
  }

  const denominator = sum + numerator;

  return denominator > 0 ? numerator / denominator : 0;
}

// ---------------------------------------------------------------------------
// calculateEWT
// ---------------------------------------------------------------------------

/**
 * Calculate Estimated Wait Time using Erlang-C model.
 *
 * Uses recent call data to derive:
 * - Arrival rate (calls per second)
 * - Average handle time (seconds per call)
 * - Number of available agents
 *
 * @param queueId - The CallQueue ID
 * @returns EWT result with estimated wait and supporting metrics
 */
export async function calculateEWT(queueId: string): Promise<EWTResult> {
  // Get recent call data for arrival rate and handle time
  const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000);

  const recentCalls = await prisma.callLog.findMany({
    where: {
      queue: queueId,
      startedAt: { gte: thirtyMinAgo },
    },
    select: {
      duration: true,
      startedAt: true,
      status: true,
    },
    orderBy: { startedAt: 'desc' },
  });

  // Calculate arrival rate (calls per second over last 30 min)
  const windowSec = 30 * 60;
  const arrivalRate = recentCalls.length > 0
    ? recentCalls.length / windowSec
    : 1 / 300; // Default: 1 call every 5 min

  // Calculate average handle time
  const completedCalls = recentCalls.filter(
    (c) => c.status === 'COMPLETED' && c.duration && c.duration > 0
  );
  const avgHandleTimeSec = completedCalls.length > 0
    ? completedCalls.reduce((sum, c) => sum + (c.duration ?? 0), 0) / completedCalls.length
    : 180; // Default: 3 minutes

  // Count available agents
  const queueMembers = await prisma.callQueueMember.findMany({
    where: { queueId },
    select: { userId: true },
  });

  let agentCount = 1;
  if (queueMembers.length > 0) {
    agentCount = Math.max(1, await prisma.sipExtension.count({
      where: {
        userId: { in: queueMembers.map((m) => m.userId) },
        status: { in: ['ONLINE', 'BUSY'] },
      },
    }));
  }

  // Traffic intensity (Erlang)
  const trafficIntensity = arrivalRate * avgHandleTimeSec;
  const utilization = Math.min(99, Math.round((trafficIntensity / agentCount) * 100));

  // Erlang-C: probability of waiting
  const pWait = erlangCProbability(trafficIntensity, agentCount);

  // EWT = P(wait) * avgHandleTime / (agents - trafficIntensity)
  const denominator = agentCount - trafficIntensity;
  const ewt = denominator > 0
    ? Math.round(pWait * avgHandleTimeSec / denominator)
    : Math.round(avgHandleTimeSec * 3); // Fallback for overloaded system

  // Count current queue size
  const queueSize = await prisma.callLog.count({
    where: {
      queue: queueId,
      status: 'RINGING',
    },
  });

  logger.info('Virtual hold: EWT calculated', {
    event: 'ewt_calculated',
    queueId,
    estimatedWaitSec: ewt,
    queueSize,
    agentCount,
    avgHandleTimeSec: Math.round(avgHandleTimeSec),
    utilization: `${utilization}%`,
    pWait: Math.round(pWait * 100),
  });

  return {
    estimatedWaitSec: ewt,
    queueSize,
    agentCount,
    avgHandleTimeSec: Math.round(avgHandleTimeSec),
    utilizationPct: utilization,
  };
}

// ---------------------------------------------------------------------------
// offerVirtualHold
// ---------------------------------------------------------------------------

/**
 * Determine whether to offer virtual hold (callback) to a waiting caller.
 *
 * Virtual hold is offered when the estimated wait exceeds the threshold.
 * The caller can press a DTMF key to opt for a callback instead of waiting.
 *
 * @param callLogId - The CallLog ID of the waiting call
 * @param queueId - The queue the caller is waiting in
 * @returns Whether to offer virtual hold and the estimated wait
 */
export async function offerVirtualHold(
  callLogId: string,
  queueId: string
): Promise<VirtualHoldOffer> {
  const ewt = await calculateEWT(queueId);

  if (ewt.estimatedWaitSec < VIRTUAL_HOLD_THRESHOLD_SEC) {
    return {
      offered: false,
      estimatedWaitSec: ewt.estimatedWaitSec,
      reason: `Wait time (${ewt.estimatedWaitSec}s) below threshold (${VIRTUAL_HOLD_THRESHOLD_SEC}s)`,
    };
  }

  const callbackEstimatedAt = new Date(Date.now() + ewt.estimatedWaitSec * 1000);

  logger.info('Virtual hold: offering callback', {
    event: 'virtual_hold_offered',
    callLogId,
    queueId,
    estimatedWaitSec: ewt.estimatedWaitSec,
    callbackEstimatedAt: callbackEstimatedAt.toISOString(),
  });

  return {
    offered: true,
    estimatedWaitSec: ewt.estimatedWaitSec,
    callbackEstimatedAt,
  };
}

// ---------------------------------------------------------------------------
// scheduleVirtualHoldCallback
// ---------------------------------------------------------------------------

/**
 * Schedule a virtual hold callback for a caller who opted out of waiting.
 *
 * The callback is queued and should be processed by the dialer system
 * at the estimated time when an agent would have been available.
 *
 * @param phone - The caller's phone number in E.164 format
 * @param queueId - The queue the caller was waiting in
 * @param estimatedCallbackAt - When the callback should be placed
 * @returns The scheduled callback details
 */
export async function scheduleVirtualHoldCallback(
  phone: string,
  queueId: string,
  estimatedCallbackAt: Date
): Promise<ScheduledCallback> {
  const callback: ScheduledCallback = {
    id: `vh-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    phone,
    queueId,
    estimatedCallbackAt,
    createdAt: new Date(),
  };

  callbackQueue.push(callback);

  // Sort by estimated callback time
  callbackQueue.sort(
    (a, b) => a.estimatedCallbackAt.getTime() - b.estimatedCallbackAt.getTime()
  );

  logger.info('Virtual hold: callback scheduled', {
    event: 'virtual_hold_callback_scheduled',
    callbackId: callback.id,
    phone,
    queueId,
    estimatedCallbackAt: estimatedCallbackAt.toISOString(),
    pendingCallbacks: callbackQueue.length,
  });

  return callback;
}
