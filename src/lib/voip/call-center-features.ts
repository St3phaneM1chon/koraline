/**
 * #48 After-Call Work Timer
 * Timer for agent to complete notes post-call.
 *
 * #49 IVR Callback Queue
 * Let caller request callback instead of waiting.
 *
 * #50 Predictive Hold Time
 * Estimate wait time based on queue length.
 */

import { logger } from '@/lib/logger';

// ── #48 After-Call Work (ACW) Timer ─────────────────────────

export interface ACWSession {
  callId: string;
  agentId: string;
  startedAt: Date;
  maxDuration: number; // seconds (default 120)
  completed: boolean;
  notes: string;
  disposition: string;
  wrapUpCodes: string[];
}

export const ACW_DISPOSITIONS = [
  { code: 'RESOLVED', label: 'Resolved', labelFr: 'Résolu' },
  { code: 'FOLLOW_UP', label: 'Follow Up Required', labelFr: 'Suivi requis' },
  { code: 'ESCALATED', label: 'Escalated', labelFr: 'Escaladé' },
  { code: 'VOICEMAIL', label: 'Left Voicemail', labelFr: 'Message vocal laissé' },
  { code: 'NO_ANSWER', label: 'No Answer', labelFr: 'Pas de réponse' },
  { code: 'WRONG_NUMBER', label: 'Wrong Number', labelFr: 'Mauvais numéro' },
  { code: 'CALLBACK_SCHEDULED', label: 'Callback Scheduled', labelFr: 'Rappel planifié' },
  { code: 'SALE_COMPLETED', label: 'Sale Completed', labelFr: 'Vente complétée' },
] as const;

export function createACWSession(callId: string, agentId: string, maxDuration: number = 120): ACWSession {
  return {
    callId,
    agentId,
    startedAt: new Date(),
    maxDuration,
    completed: false,
    notes: '',
    disposition: '',
    wrapUpCodes: [],
  };
}

export function isACWExpired(session: ACWSession): boolean {
  const elapsed = (Date.now() - session.startedAt.getTime()) / 1000;
  return elapsed >= session.maxDuration;
}

export function getRemainingACWTime(session: ACWSession): number {
  const elapsed = (Date.now() - session.startedAt.getTime()) / 1000;
  return Math.max(0, session.maxDuration - elapsed);
}

// ── #49 IVR Callback Queue ──────────────────────────────────

export interface CallbackRequest {
  id: string;
  callerPhone: string;
  callerName: string;
  requestedAt: Date;
  estimatedCallbackTime: Date;
  priority: 'normal' | 'vip' | 'urgent';
  reason: string;
  status: 'queued' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  attemptCount: number;
  maxAttempts: number;
  assignedAgentId: string | null;
}

/**
 * Create a new callback request.
 */
export function createCallbackRequest(
  callerPhone: string,
  callerName: string,
  reason: string,
  currentQueueLength: number,
  avgHandleTime: number = 300 // seconds
): CallbackRequest {
  // Estimate when we'll call back based on queue position
  const estimatedWaitSeconds = currentQueueLength * avgHandleTime;
  const estimatedCallbackTime = new Date(Date.now() + estimatedWaitSeconds * 1000);

  return {
    id: `cb-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    callerPhone,
    callerName,
    requestedAt: new Date(),
    estimatedCallbackTime,
    priority: 'normal',
    reason,
    status: 'queued',
    attemptCount: 0,
    maxAttempts: 3,
    assignedAgentId: null,
  };
}

/**
 * Get the next callback to process.
 */
export function getNextCallback(queue: CallbackRequest[]): CallbackRequest | null {
  return queue
    .filter(cb => cb.status === 'queued' && cb.attemptCount < cb.maxAttempts)
    .sort((a, b) => {
      // VIP/urgent first, then by request time
      const priorityOrder = { urgent: 0, vip: 1, normal: 2 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return a.requestedAt.getTime() - b.requestedAt.getTime();
    })[0] || null;
}

// ── #50 Predictive Hold Time ────────────────────────────────

export interface HoldTimeEstimate {
  estimatedSeconds: number;
  estimatedMinutes: number;
  displayText: string;
  confidence: 'high' | 'medium' | 'low';
  queuePosition: number;
  availableAgents: number;
}

/**
 * Predict hold time based on current queue metrics.
 */
export function predictHoldTime(
  queueLength: number,
  availableAgents: number,
  avgHandleTimeSeconds: number = 300,
  recentAHTSamples: number[] = []
): HoldTimeEstimate {
  // Use recent AHT if available, otherwise default
  let effectiveAHT = avgHandleTimeSeconds;
  if (recentAHTSamples.length >= 5) {
    // Weighted moving average (more recent = higher weight)
    const weights = recentAHTSamples.map((_, i) => i + 1);
    const weightSum = weights.reduce((s, w) => s + w, 0);
    effectiveAHT = recentAHTSamples.reduce((s, v, i) => s + v * weights[i], 0) / weightSum;
  }

  // If no agents available, use longer estimate
  const effectiveAgents = Math.max(1, availableAgents);

  // Erlang-C simplified: queue position / agents * AHT
  const estimatedSeconds = Math.ceil((queueLength / effectiveAgents) * effectiveAHT);
  const estimatedMinutes = Math.ceil(estimatedSeconds / 60);

  // Confidence based on data quality
  const confidence: HoldTimeEstimate['confidence'] =
    recentAHTSamples.length >= 10 ? 'high' :
    recentAHTSamples.length >= 5 ? 'medium' : 'low';

  // Friendly display text
  let displayText: string;
  if (estimatedMinutes <= 1) {
    displayText = 'Less than a minute';
  } else if (estimatedMinutes <= 5) {
    displayText = `About ${estimatedMinutes} minutes`;
  } else if (estimatedMinutes <= 15) {
    displayText = `Approximately ${estimatedMinutes} minutes`;
  } else if (estimatedMinutes <= 30) {
    displayText = `About ${Math.ceil(estimatedMinutes / 5) * 5} minutes`;
  } else {
    displayText = `More than 30 minutes`;
  }

  logger.debug(`[hold-time] Queue: ${queueLength}, Agents: ${availableAgents}, Est: ${estimatedMinutes}min`);

  return {
    estimatedSeconds,
    estimatedMinutes,
    displayText,
    confidence,
    queuePosition: queueLength,
    availableAgents,
  };
}
