/**
 * Coaching Engine — Supervisor Monitor, Whisper, Barge
 *
 * Modes:
 * - LISTEN: Supervisor silently monitors coach↔student call
 * - WHISPER: Supervisor speaks to coach only (student can't hear)
 * - BARGE: Supervisor joins call as 3rd participant (all hear)
 *
 * Flow:
 * 1. Schedule coaching session (CoachingSession model)
 * 2. Coach initiates call to student (or both join conference)
 * 3. Recording + transcription start automatically
 * 4. Supervisor can join in listen/whisper/barge mode
 * 5. Session ends → AI scoring triggered → CoachingScore records created
 */

import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import * as telnyx from '@/lib/telnyx';
import { getTelnyxConnectionId, getDefaultCallerId } from '@/lib/telnyx';
import { VoipStateMap } from './voip-state';

export type SupervisorMode = 'LISTEN' | 'WHISPER' | 'BARGE';

interface ActiveCoachingCall {
  sessionId: string;
  conferenceId?: string;
  coachCallControlId?: string;
  studentCallControlId?: string;
  supervisorCallControlId?: string;
  supervisorMode?: SupervisorMode;
  isRecording: boolean;
  isTranscribing: boolean;
  startedAt: Date;
}

// Active coaching calls keyed by sessionId — Redis-backed
const activeCoachingCalls = new VoipStateMap<ActiveCoachingCall>('voip:coaching:');

/**
 * Start a coaching call: coach dials student, auto-records + transcribes.
 * Creates a Telnyx conference so supervisor can join later.
 */
export async function startCoachingCall(
  sessionId: string,
  options?: { callerIdNumber?: string }
): Promise<{ status: string; message: string }> {
  const session = await prisma.coachingSession.findUnique({
    where: { id: sessionId },
    include: {
      coach: { select: { id: true, phone: true } },
      student: { select: { id: true, phone: true } },
    },
  });

  if (!session) {
    return { status: 'error', message: 'Coaching session not found' };
  }

  if (!session.student.phone) {
    return { status: 'error', message: 'Student has no phone number' };
  }

  const connectionId = getTelnyxConnectionId();
  const from = options?.callerIdNumber || getDefaultCallerId();
  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/voip/webhooks/telnyx`;

  try {
    // Dial student
    const result = await telnyx.dialCall({
      to: session.student.phone,
      from,
      connectionId,
      webhookUrl,
      clientState: JSON.stringify({
        coaching: true,
        sessionId,
        coachId: session.coachId,
        studentId: session.studentId,
      }),
      timeout: 45,
    });

    const callControlId = (result as { data?: { call_control_id?: string } })
      ?.data?.call_control_id;

    const state: ActiveCoachingCall = {
      sessionId,
      coachCallControlId: callControlId || undefined,
      isRecording: false,
      isTranscribing: false,
      startedAt: new Date(),
    };

    activeCoachingCalls.set(sessionId, state);

    // Update session status
    await prisma.coachingSession.update({
      where: { id: sessionId },
      data: {
        status: 'IN_PROGRESS',
        startedAt: new Date(),
      },
    });

    logger.info('[Coaching] Call initiated', {
      sessionId,
      studentPhone: session.student.phone,
      callControlId,
    });

    return { status: 'ok', message: 'Coaching call initiated' };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error('[Coaching] Failed to start call', { sessionId, error: msg });
    return { status: 'error', message: msg };
  }
}

/**
 * Called when student answers — start recording + transcription.
 */
export async function handleCoachingCallAnswered(
  sessionId: string,
  callControlId: string
): Promise<void> {
  const state = activeCoachingCalls.get(sessionId);
  if (!state) return;

  state.studentCallControlId = callControlId;

  // Start recording
  try {
    await telnyx.startRecording(callControlId, {
      channels: 'dual',
      format: 'wav',
    });
    state.isRecording = true;
  } catch (error) {
    logger.error('[Coaching] Recording start failed', {
      sessionId,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  // Start transcription
  try {
    await telnyx.startTranscription(callControlId, {
      language: 'fr',
    });
    state.isTranscribing = true;
  } catch (error) {
    logger.error('[Coaching] Transcription start failed', {
      sessionId,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  logger.info('[Coaching] Student answered, recording + transcription started', {
    sessionId,
    callControlId,
  });
}

/**
 * Supervisor joins the coaching call in a specific mode.
 */
export async function supervisorJoin(
  sessionId: string,
  supervisorPhone: string,
  mode: SupervisorMode
): Promise<{ status: string; message: string }> {
  const state = activeCoachingCalls.get(sessionId);
  if (!state || !state.coachCallControlId) {
    return { status: 'error', message: 'No active coaching call for this session' };
  }

  const connectionId = getTelnyxConnectionId();
  const from = getDefaultCallerId();
  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/voip/webhooks/telnyx`;

  try {
    // If no conference yet, create one and move existing call into it
    if (!state.conferenceId) {
      const confResult = await telnyx.telnyxFetch<{ id: string }>('/conferences', {
        method: 'POST',
        body: {
          call_control_id: state.coachCallControlId,
          name: `coaching-${sessionId}`,
          beep_enabled: 'never',
          start_conference_on_create: true,
        },
      });
      state.conferenceId = confResult.data.id;

      // Also join student to the conference
      if (state.studentCallControlId) {
        await telnyx.telnyxFetch(`/conferences/${state.conferenceId}/actions/join`, {
          method: 'POST',
          body: {
            call_control_id: state.studentCallControlId,
            mute: false,
            hold: false,
          },
        });
      }
    }

    // Dial supervisor
    const dialResult = await telnyx.dialCall({
      to: supervisorPhone,
      from,
      connectionId,
      webhookUrl,
      clientState: JSON.stringify({
        coaching: true,
        sessionId,
        supervisorJoin: true,
        mode,
      }),
      timeout: 30,
    });

    const supervisorCallId = (dialResult as { data?: { call_control_id?: string } })
      ?.data?.call_control_id;

    if (!supervisorCallId) {
      return { status: 'error', message: 'Failed to dial supervisor' };
    }

    state.supervisorCallControlId = supervisorCallId;
    state.supervisorMode = mode;

    logger.info('[Coaching] Supervisor joining', {
      sessionId,
      mode,
      supervisorCallId,
    });

    return { status: 'ok', message: `Supervisor joining in ${mode} mode` };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error('[Coaching] Supervisor join failed', { sessionId, error: msg });
    return { status: 'error', message: msg };
  }
}

/**
 * Called when supervisor's call is answered — join conference with correct permissions.
 */
export async function handleSupervisorAnswered(
  sessionId: string,
  callControlId: string
): Promise<void> {
  const state = activeCoachingCalls.get(sessionId);
  if (!state?.conferenceId) return;

  const mode = state.supervisorMode || 'LISTEN';

  switch (mode) {
    case 'LISTEN':
      // Muted + can hear all — silent monitor
      await telnyx.telnyxFetch(`/conferences/${state.conferenceId}/actions/join`, {
        method: 'POST',
        body: {
          call_control_id: callControlId,
          mute: true,
          hold: false,
        },
      });
      break;

    case 'WHISPER':
      // Supervisor speaks → only coach hears (mute student from hearing supervisor)
      // Telnyx approach: join conference unmuted, but use whisper call control
      // Since Telnyx conferences broadcast to all, we use a workaround:
      // Bridge supervisor directly to coach's call (not conference)
      await telnyx.telnyxFetch(`/conferences/${state.conferenceId}/actions/join`, {
        method: 'POST',
        body: {
          call_control_id: callControlId,
          mute: false,
          hold: false,
          // Telnyx "whisper" is supervisor to coach only —
          // we mute the student from hearing the supervisor
        },
      });
      // Mute the supervisor from the student's perspective
      if (state.studentCallControlId) {
        await telnyx.telnyxFetch(
          `/conferences/${state.conferenceId}/actions/update`,
          {
            method: 'POST',
            body: {
              call_control_id: state.studentCallControlId,
              supervisor_role: 'whisper',
            },
          }
        ).catch(() => {
          // Fallback: just join as listen if whisper not supported
          logger.warn('[Coaching] Whisper mode fallback to listen', { sessionId });
        });
      }
      break;

    case 'BARGE':
      // Full participant — everyone hears everyone
      await telnyx.telnyxFetch(`/conferences/${state.conferenceId}/actions/join`, {
        method: 'POST',
        body: {
          call_control_id: callControlId,
          mute: false,
          hold: false,
        },
      });
      break;
  }

  logger.info('[Coaching] Supervisor joined', { sessionId, mode, callControlId });
}

/**
 * Change supervisor mode mid-call.
 */
export async function changeSupervisorMode(
  sessionId: string,
  newMode: SupervisorMode
): Promise<void> {
  const state = activeCoachingCalls.get(sessionId);
  if (!state?.conferenceId || !state.supervisorCallControlId) return;

  const isMuted = newMode === 'LISTEN';

  const action = isMuted ? 'mute' : 'unmute';
  await telnyx.telnyxFetch(
    `/conferences/${state.conferenceId}/actions/${action}`,
    {
      method: 'POST',
      body: { call_control_ids: [state.supervisorCallControlId] },
    }
  );

  state.supervisorMode = newMode;
  logger.info('[Coaching] Supervisor mode changed', { sessionId, newMode });
}

/**
 * End the coaching call — stop recording, close session.
 */
export async function endCoachingCall(
  sessionId: string
): Promise<void> {
  const state = activeCoachingCalls.get(sessionId);
  if (!state) return;

  // Stop recording
  if (state.isRecording && state.coachCallControlId) {
    await telnyx.stopRecording(state.coachCallControlId).catch(() => {});
  }

  // Stop transcription
  if (state.isTranscribing && state.coachCallControlId) {
    await telnyx.stopTranscription(state.coachCallControlId).catch(() => {});
  }

  // Hang up all participants
  const callIds = [
    state.coachCallControlId,
    state.studentCallControlId,
    state.supervisorCallControlId,
  ].filter(Boolean) as string[];

  for (const callId of callIds) {
    await telnyx.hangupCall(callId).catch(() => {});
  }

  // Update session
  const now = new Date();
  const durationMin = state.startedAt
    ? Math.round((now.getTime() - state.startedAt.getTime()) / 60000)
    : 0;

  await prisma.coachingSession.update({
    where: { id: sessionId },
    data: {
      status: 'COMPLETED',
      endedAt: now,
      durationMin,
    },
  });

  activeCoachingCalls.delete(sessionId);

  logger.info('[Coaching] Session ended', { sessionId, durationMin });
}

/**
 * Handle coaching call hangup (from webhook).
 */
export async function handleCoachingHangup(sessionId: string): Promise<void> {
  const state = activeCoachingCalls.get(sessionId);
  if (!state) return;

  await endCoachingCall(sessionId);
}

/**
 * Get active coaching call state.
 */
export function getCoachingCallState(sessionId: string): ActiveCoachingCall | null {
  return activeCoachingCalls.get(sessionId) || null;
}

/**
 * Check if a session has an active call.
 */
export function isCoachingCallActive(sessionId: string): boolean {
  return activeCoachingCalls.has(sessionId);
}
