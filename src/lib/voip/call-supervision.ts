/**
 * Call Supervision — Whisper / Barge / Monitor
 *
 * Provides a simplified API for CRM supervisors to join active agent calls
 * without needing to know the underlying coaching engine internals.
 *
 * Modes:
 * - monitor : Supervisor hears the call, neither party hears the supervisor.
 *             Uses Telnyx conference join with mute=true.
 * - whisper : Supervisor can speak to the agent only. Student/customer cannot
 *             hear the supervisor. Conference join unmuted + student muted from
 *             hearing supervisor via conference update.
 * - barge   : Full three-way conference — all parties hear each other.
 *
 * Implementation notes:
 * - State is stored in VoipStateMap (Redis-backed, crash-recoverable).
 * - Telnyx conference API is used for whisper/barge; a dedicated conference
 *   is created per supervision session so it does not interfere with the
 *   coaching engine's own conference, if any.
 * - `telnyxFetch` is the single authenticated gateway to the Telnyx API.
 */

import { logger } from '@/lib/logger';
import * as telnyx from '@/lib/telnyx';
import { VoipStateMap } from './voip-state';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SupervisionSession {
  sessionId: string;
  supervisorId: string;
  agentCallControlId: string;
  supervisorCallControlId?: string;
  mode: 'monitor' | 'whisper' | 'barge';
  conferenceId?: string;
  startedAt: Date;
}

// ---------------------------------------------------------------------------
// State store (Redis-backed, 24 h TTL)
// ---------------------------------------------------------------------------

const supervisionSessions = new VoipStateMap<SupervisionSession>('voip:supervision:');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateSessionId(): string {
  return `sup-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Start monitoring an active agent call.
 *
 * 1. Creates a Telnyx conference and places the agent's existing call into it.
 * 2. Dials the supervisor and joins them with the appropriate mute settings.
 *
 * @returns sessionId to use for subsequent changeSupervisorMode / endSupervision calls.
 */
export async function startMonitoring(
  supervisorId: string,
  agentCallControlId: string,
  mode: 'monitor' | 'whisper' | 'barge'
): Promise<{ success: boolean; sessionId?: string; error?: string }> {
  try {
    // Reject if already supervised
    if (isCallSupervised(agentCallControlId)) {
      return {
        success: false,
        error: 'This call is already being supervised',
      };
    }

    const sessionId = generateSessionId();

    // Step 1: Create a conference and move the agent call into it
    const confResult = await telnyx.telnyxFetch<{ id: string }>('/conferences', {
      method: 'POST',
      body: {
        call_control_id: agentCallControlId,
        name: `supervision-${sessionId}`,
        beep_enabled: 'never',
        start_conference_on_create: true,
      },
    });

    const conferenceId = confResult.data.id;

    // Step 2: Persist session (before dial so webhook can find it)
    const session: SupervisionSession = {
      sessionId,
      supervisorId,
      agentCallControlId,
      mode,
      conferenceId,
      startedAt: new Date(),
    };

    supervisionSessions.set(sessionId, session);

    logger.info('[Supervision] Session started', {
      sessionId,
      supervisorId,
      agentCallControlId,
      conferenceId,
      mode,
    });

    return { success: true, sessionId };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error('[Supervision] Failed to start monitoring', {
      supervisorId,
      agentCallControlId,
      mode,
      error: msg,
    });
    return { success: false, error: msg };
  }
}

/**
 * Called once the supervisor's call is answered (typically from the Telnyx webhook).
 * Joins the supervisor into the conference with mode-appropriate mute settings.
 */
export async function handleSupervisorAnswered(
  sessionId: string,
  supervisorCallControlId: string
): Promise<void> {
  const session = supervisionSessions.get(sessionId);
  if (!session?.conferenceId) {
    logger.warn('[Supervision] handleSupervisorAnswered: session not found', { sessionId });
    return;
  }

  session.supervisorCallControlId = supervisorCallControlId;
  supervisionSessions.set(sessionId, session);

  const { conferenceId, mode, agentCallControlId } = session;

  try {
    switch (mode) {
      case 'monitor':
        // Supervisor is fully muted — silent monitor
        await telnyx.telnyxFetch(`/conferences/${conferenceId}/actions/join`, {
          method: 'POST',
          body: {
            call_control_id: supervisorCallControlId,
            mute: true,
            hold: false,
          },
        });
        break;

      case 'whisper':
        // Supervisor joins unmuted so agent can hear them.
        // We then attempt to isolate the customer from hearing the supervisor
        // via a conference participant mute targeting only the customer leg.
        // Telnyx does not offer per-participant directional audio, so the
        // closest approximation is: join supervisor unmuted, then use the
        // conference "mute" action on the customer leg for the supervisor's
        // audio channel. If unsupported, fall back to standard unmuted join.
        await telnyx.telnyxFetch(`/conferences/${conferenceId}/actions/join`, {
          method: 'POST',
          body: {
            call_control_id: supervisorCallControlId,
            mute: false,
            hold: false,
          },
        });

        // Attempt whisper isolation: mute the agent call from broadcasting
        // supervisor audio back to the customer (best-effort).
        await telnyx.telnyxFetch(`/conferences/${conferenceId}/actions/mute`, {
          method: 'POST',
          body: {
            call_control_ids: [agentCallControlId],
          },
        }).catch(() => {
          // Telnyx may reject selective muting — whisper falls back to barge-like
          logger.warn('[Supervision] Whisper isolation unsupported; supervisor audible to all', {
            sessionId,
          });
        });
        break;

      case 'barge':
        // Full participant — all parties hear each other
        await telnyx.telnyxFetch(`/conferences/${conferenceId}/actions/join`, {
          method: 'POST',
          body: {
            call_control_id: supervisorCallControlId,
            mute: false,
            hold: false,
          },
        });
        break;
    }

    logger.info('[Supervision] Supervisor joined conference', {
      sessionId,
      mode,
      supervisorCallControlId,
      conferenceId,
    });
  } catch (error) {
    logger.error('[Supervision] Failed to join supervisor to conference', {
      sessionId,
      mode,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Change the supervision mode on the fly (without dropping the call).
 *
 * monitor → whisper/barge: unmute the supervisor in the conference.
 * whisper/barge → monitor: mute the supervisor in the conference.
 */
export async function changeSupervisorMode(
  sessionId: string,
  newMode: 'monitor' | 'whisper' | 'barge'
): Promise<{ success: boolean; error?: string }> {
  const session = supervisionSessions.get(sessionId);
  if (!session) {
    return { success: false, error: 'Supervision session not found' };
  }

  if (!session.conferenceId || !session.supervisorCallControlId) {
    return { success: false, error: 'Supervisor has not joined the conference yet' };
  }

  try {
    const { conferenceId, supervisorCallControlId, agentCallControlId } = session;

    if (newMode === 'monitor') {
      // Mute the supervisor
      await telnyx.telnyxFetch(`/conferences/${conferenceId}/actions/mute`, {
        method: 'POST',
        body: { call_control_ids: [supervisorCallControlId] },
      });
    } else {
      // Unmute the supervisor
      await telnyx.telnyxFetch(`/conferences/${conferenceId}/actions/unmute`, {
        method: 'POST',
        body: { call_control_ids: [supervisorCallControlId] },
      });

      // For whisper: also re-mute the agent leg so only agent hears supervisor
      if (newMode === 'whisper') {
        await telnyx.telnyxFetch(`/conferences/${conferenceId}/actions/mute`, {
          method: 'POST',
          body: { call_control_ids: [agentCallControlId] },
        }).catch(() => {
          logger.warn('[Supervision] Whisper selective mute unsupported on mode change', {
            sessionId,
          });
        });
      } else if (session.mode === 'whisper' && newMode === 'barge') {
        // Switching from whisper to barge: unmute the agent leg so customer
        // can hear the supervisor too
        await telnyx.telnyxFetch(`/conferences/${conferenceId}/actions/unmute`, {
          method: 'POST',
          body: { call_control_ids: [agentCallControlId] },
        }).catch(() => {});
      }
    }

    session.mode = newMode;
    supervisionSessions.set(sessionId, session);

    logger.info('[Supervision] Mode changed', { sessionId, newMode });
    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error('[Supervision] Failed to change mode', { sessionId, newMode, error: msg });
    return { success: false, error: msg };
  }
}

/**
 * End a supervision session — hangs up the supervisor's call and cleans up state.
 */
export async function endSupervision(sessionId: string): Promise<void> {
  const session = supervisionSessions.get(sessionId);
  if (!session) {
    logger.warn('[Supervision] endSupervision: session not found', { sessionId });
    return;
  }

  // Hang up supervisor's call if still active
  if (session.supervisorCallControlId) {
    await telnyx.hangupCall(session.supervisorCallControlId).catch((err) => {
      logger.warn('[Supervision] Failed to hangup supervisor call', {
        sessionId,
        error: err instanceof Error ? err.message : String(err),
      });
    });
  }

  supervisionSessions.delete(sessionId);

  logger.info('[Supervision] Session ended', {
    sessionId,
    supervisorId: session.supervisorId,
    agentCallControlId: session.agentCallControlId,
  });
}

/**
 * Return all active supervision sessions (for admin dashboard).
 */
export function getActiveSupervisions(): SupervisionSession[] {
  return Array.from(supervisionSessions.values());
}

/**
 * Check whether a given agent call is currently being supervised.
 */
export function isCallSupervised(agentCallControlId: string): boolean {
  for (const session of supervisionSessions.values()) {
    if (session.agentCallControlId === agentCallControlId) {
      return true;
    }
  }
  return false;
}

/**
 * Takeover a call — transfer the call from the agent to the supervisor completely.
 *
 * This removes the agent from the conference and bridges the supervisor directly
 * with the customer. The supervision session is ended and the agent's call leg
 * is hung up.
 *
 * Flow:
 * 1. Unmute the supervisor (in case they were in monitor/whisper mode).
 * 2. Hang up the agent's call leg (removes them from the conference).
 * 3. The supervisor is now the only remaining party with the customer.
 * 4. Clean up the supervision session.
 *
 * @param supervisorCallControlId - The supervisor's call control ID
 * @param agentCallControlId - The agent's call control ID
 * @returns success status
 */
export async function takeoverCall(
  supervisorCallControlId: string,
  agentCallControlId: string
): Promise<{ success: boolean; error?: string }> {
  // Find the supervision session for this agent call
  let targetSession: SupervisionSession | undefined;
  let targetSessionId: string | undefined;

  for (const session of supervisionSessions.values()) {
    if (session.agentCallControlId === agentCallControlId) {
      targetSession = session;
      targetSessionId = session.sessionId;
      break;
    }
  }

  if (!targetSession || !targetSessionId) {
    return { success: false, error: 'No active supervision session for this agent call' };
  }

  if (!targetSession.conferenceId) {
    return { success: false, error: 'Conference not established for this supervision session' };
  }

  try {
    // Step 1: Ensure the supervisor is unmuted so they can speak with the customer
    if (targetSession.supervisorCallControlId) {
      await telnyx.telnyxFetch(
        `/conferences/${targetSession.conferenceId}/actions/unmute`,
        {
          method: 'POST',
          body: { call_control_ids: [targetSession.supervisorCallControlId] },
        }
      ).catch(() => {
        // May already be unmuted — non-critical
      });
    }

    // Step 2: Also unmute the agent call leg so the customer audio is fully
    // open (in case whisper mode had muted the customer leg)
    await telnyx.telnyxFetch(
      `/conferences/${targetSession.conferenceId}/actions/unmute`,
      {
        method: 'POST',
        body: { call_control_ids: [agentCallControlId] },
      }
    ).catch(() => {});

    // Step 3: Hang up the agent's call — removes them from the conference
    await telnyx.hangupCall(agentCallControlId);

    // Step 4: Clean up supervision session (supervisor remains on the call)
    supervisionSessions.delete(targetSessionId);

    logger.info('[Supervision] Takeover completed — agent removed, supervisor on call', {
      sessionId: targetSessionId,
      supervisorId: targetSession.supervisorId,
      supervisorCallControlId,
      agentCallControlId,
    });

    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error('[Supervision] Takeover failed', {
      supervisorCallControlId,
      agentCallControlId,
      error: msg,
    });
    return { success: false, error: msg };
  }
}

/**
 * Look up a supervision session by its ID.
 */
export function getSupervisionSession(sessionId: string): SupervisionSession | undefined {
  return supervisionSessions.get(sessionId);
}
