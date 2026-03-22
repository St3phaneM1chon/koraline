/**
 * Callback Scheduler
 *
 * Manages automatic callbacks for callers who opted out of waiting in a queue.
 * When a caller presses a DTMF key to request a callback (instead of holding),
 * their number is stored here. When an agent becomes available, the next
 * pending callback is initiated via Telnyx Call Control.
 *
 * In-memory store — suitable for single-process deployments.
 * For multi-instance, replace with Redis-backed queue.
 */

import { logger } from '@/lib/logger';
import * as telnyx from '@/lib/telnyx';

// ── Types ─────────────────────────

interface PendingCallback {
  id: string;
  phoneNumber: string;
  queueName: string;
  requestedAt: Date;
  attempts: number;
  maxAttempts: number;
}

// ── In-memory store ─────────────────────────

const pendingCallbacks: PendingCallback[] = [];

// ── Public API ─────────────────────────

/**
 * Request a callback — called when caller presses the callback DTMF option.
 * Returns a unique callback ID for tracking.
 */
export function requestCallback(phoneNumber: string, queueName: string): string {
  const id = `cb-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  pendingCallbacks.push({
    id,
    phoneNumber,
    queueName,
    requestedAt: new Date(),
    attempts: 0,
    maxAttempts: 3,
  });

  logger.info('[Callback] Callback requested', { id, phoneNumber, queueName });
  return id;
}

/**
 * Process the next pending callback for a given queue.
 * Call this when an agent becomes available in the queue.
 *
 * Returns true if a callback was initiated, false if none pending.
 */
export async function processNextCallback(queueName: string): Promise<boolean> {
  const idx = pendingCallbacks.findIndex(
    (cb) => cb.queueName === queueName && cb.attempts < cb.maxAttempts,
  );
  if (idx === -1) return false;

  const callback = pendingCallbacks[idx];
  callback.attempts++;

  try {
    const connectionId = process.env.TELNYX_CONNECTION_ID;
    if (!connectionId) {
      throw new Error('TELNYX_CONNECTION_ID not set');
    }

    const callerIdNumber = process.env.TELNYX_DEFAULT_CALLER_ID || '+14388030370';
    const webhookUrl = process.env.NEXTAUTH_URL
      ? `${process.env.NEXTAUTH_URL}/api/voip/webhooks/telnyx`
      : undefined;

    // Encode callback context into clientState so the call-control handler
    // can identify this as a callback when the call connects.
    const clientState = JSON.stringify({
      type: 'callback',
      callbackId: callback.id,
      queueName: callback.queueName,
    });

    await telnyx.dialCall({
      connectionId,
      to: callback.phoneNumber,
      from: callerIdNumber,
      clientState,
      webhookUrl,
      timeout: 30,
    });

    // Successfully initiated — remove from pending list
    pendingCallbacks.splice(idx, 1);

    logger.info('[Callback] Callback initiated', {
      id: callback.id,
      phoneNumber: callback.phoneNumber,
      attempt: callback.attempts,
    });

    return true;
  } catch (error) {
    logger.error('[Callback] Failed to initiate callback', {
      id: callback.id,
      error: error instanceof Error ? error.message : String(error),
    });

    // If max attempts reached, remove and log
    if (callback.attempts >= callback.maxAttempts) {
      pendingCallbacks.splice(idx, 1);
      logger.warn('[Callback] Max attempts reached, removing', { id: callback.id });
    }

    return false;
  }
}

/**
 * Get count of pending callbacks, optionally filtered by queue.
 */
export function getPendingCount(queueName?: string): number {
  if (queueName) {
    return pendingCallbacks.filter((cb) => cb.queueName === queueName).length;
  }
  return pendingCallbacks.length;
}

/**
 * Get all pending callbacks for a queue (for admin display).
 */
export function getPendingCallbacks(queueName?: string): ReadonlyArray<{
  id: string;
  phoneNumber: string;
  queueName: string;
  requestedAt: Date;
  attempts: number;
}> {
  const list = queueName
    ? pendingCallbacks.filter((cb) => cb.queueName === queueName)
    : pendingCallbacks;

  return list.map(({ id, phoneNumber, queueName: q, requestedAt, attempts }) => ({
    id,
    phoneNumber,
    queueName: q,
    requestedAt,
    attempts,
  }));
}

/**
 * Cancel a pending callback by ID.
 * Returns true if found and removed, false if not found.
 */
export function cancelCallback(id: string): boolean {
  const idx = pendingCallbacks.findIndex((cb) => cb.id === id);
  if (idx !== -1) {
    pendingCallbacks.splice(idx, 1);
    logger.info('[Callback] Callback cancelled', { id });
    return true;
  }
  return false;
}
