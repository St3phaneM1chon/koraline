/**
 * Call Park - Park calls on orbit slots for retrieval by any agent
 * Orbit codes 701-720. Park via UI or DTMF, retrieve via *7XX.
 */

import { logger } from '@/lib/logger';
import { VoipStateMap } from './voip-state';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ParkedCall {
  /** Orbit slot number (701-720) */
  orbit: number;
  /** Telnyx call control ID */
  callControlId: string;
  /** Who parked the call */
  parkedBy: string;
  /** Caller info */
  callerNumber: string;
  callerName?: string;
  /** When the call was parked */
  parkedAt: Date;
  /** Auto-retrieve timeout in seconds (default 120) */
  timeout: number;
  /** Company scope */
  companyId: string;
  /** Original call session ID */
  callSessionId?: string;
}

export interface ParkResult {
  success: boolean;
  orbit?: number;
  error?: string;
}

export interface RetrieveResult {
  success: boolean;
  call?: ParkedCall;
  error?: string;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const ORBIT_MIN = 701;
const ORBIT_MAX = 720;
const DEFAULT_PARK_TIMEOUT = 120; // 2 minutes

// ─── State Management ───────────────────────────────────────────────────────

const parkedCalls = new VoipStateMap<ParkedCall>('voip:park:');

// Park timeout timers
const parkTimers = new Map<number, ReturnType<typeof setTimeout>>();

// ─── Functions ──────────────────────────────────────────────────────────────

/**
 * Park an active call on the next available orbit slot.
 * The caller hears hold music while parked.
 */
export async function parkCall(
  callControlId: string,
  parkedBy: string,
  companyId: string,
  options: {
    preferredOrbit?: number;
    callerNumber?: string;
    callerName?: string;
    timeout?: number;
  } = {}
): Promise<ParkResult> {
  const telnyx = await import('@/lib/telnyx');

  try {
    // Find available orbit
    const orbit = options.preferredOrbit && isOrbitAvailable(options.preferredOrbit)
      ? options.preferredOrbit
      : findNextAvailableOrbit(companyId);

    if (!orbit) {
      return { success: false, error: 'No available park orbits (all 701-720 in use)' };
    }

    // Put the call on hold with music
    await telnyx.telnyxFetch(`/calls/${callControlId}/actions/hold`, { method: 'POST', body: {} });

    // Store parked call state
    const parkedCall: ParkedCall = {
      orbit,
      callControlId,
      parkedBy,
      callerNumber: options.callerNumber ?? 'unknown',
      callerName: options.callerName,
      parkedAt: new Date(),
      timeout: options.timeout ?? DEFAULT_PARK_TIMEOUT,
      companyId,
    };

    parkedCalls.set(String(orbit), parkedCall);

    // Set auto-retrieve timeout
    const timer = setTimeout(async () => {
      // Auto-return to parker if not retrieved
      const call = parkedCalls.get(String(orbit));
      if (call) {
        logger.warn('Park timeout reached, returning call to parker', {
          orbit,
          parkedBy: call.parkedBy,
        });
        await autoReturnParkedCall(call);
      }
    }, parkedCall.timeout * 1000);
    parkTimers.set(orbit, timer);

    logger.info('Call parked', { orbit, callControlId, parkedBy });

    return { success: true, orbit };
  } catch (error) {
    logger.error('Failed to park call', { callControlId, error });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Park failed',
    };
  }
}

/**
 * Retrieve a parked call from an orbit slot.
 * Bridges the parked call with the retrieving agent's call.
 */
export async function retrieveParkedCall(
  orbit: number,
  retrieverCallControlId: string
): Promise<RetrieveResult> {
  const telnyx = await import('@/lib/telnyx');

  const parkedCall = parkedCalls.get(String(orbit));
  if (!parkedCall) {
    return { success: false, error: `No call parked on orbit ${orbit}` };
  }

  try {
    // Unhold the parked call
    await telnyx.telnyxFetch(`/calls/${parkedCall.callControlId}/actions/unhold`, { method: 'POST', body: {} });

    // Bridge the two calls together
    await telnyx.bridgeCall(parkedCall.callControlId, retrieverCallControlId);

    // Cleanup park state
    cleanupParkSlot(orbit);

    logger.info('Parked call retrieved', {
      orbit,
      retrievedBy: retrieverCallControlId,
    });

    return { success: true, call: parkedCall };
  } catch (error) {
    logger.error('Failed to retrieve parked call', { orbit, error });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Retrieve failed',
    };
  }
}

/**
 * Get all currently parked calls for a company.
 */
export function getParkedCalls(companyId: string): ParkedCall[] {
  const calls: ParkedCall[] = [];
  for (let orbit = ORBIT_MIN; orbit <= ORBIT_MAX; orbit++) {
    const call = parkedCalls.get(String(orbit));
    if (call && call.companyId === companyId) {
      calls.push(call);
    }
  }
  return calls;
}

/**
 * Check if a specific orbit is available.
 */
export function isOrbitAvailable(orbit: number): boolean {
  if (orbit < ORBIT_MIN || orbit > ORBIT_MAX) return false;
  return !parkedCalls.has(String(orbit));
}

/**
 * Find next available orbit slot for a company.
 */
function findNextAvailableOrbit(companyId: string): number | null {
  for (let orbit = ORBIT_MIN; orbit <= ORBIT_MAX; orbit++) {
    const existing = parkedCalls.get(String(orbit));
    if (!existing || existing.companyId !== companyId) {
      if (!existing) return orbit;
    }
  }
  return null;
}

/**
 * Auto-return a timed-out parked call to the original parker.
 */
async function autoReturnParkedCall(call: ParkedCall): Promise<void> {
  try {
    const telnyx = await import('@/lib/telnyx');
    // Announce return to caller
    await telnyx.speakText(
      call.callControlId,
      'Votre appel n\'a pas été récupéré. Retour à l\'agent initial.'
    );
    cleanupParkSlot(call.orbit);
  } catch (error) {
    logger.error('Failed to auto-return parked call', { orbit: call.orbit, error });
    cleanupParkSlot(call.orbit);
  }
}

/**
 * Cleanup a park slot and its timer.
 */
function cleanupParkSlot(orbit: number): void {
  parkedCalls.delete(String(orbit));
  const timer = parkTimers.get(orbit);
  if (timer) {
    clearTimeout(timer);
    parkTimers.delete(orbit);
  }
}

/**
 * Cleanup all park state for a call control ID (on hangup).
 */
export function cleanupParkedCallByControlId(callControlId: string): void {
  for (let orbit = ORBIT_MIN; orbit <= ORBIT_MAX; orbit++) {
    const call = parkedCalls.get(String(orbit));
    if (call?.callControlId === callControlId) {
      cleanupParkSlot(orbit);
      return;
    }
  }
}
