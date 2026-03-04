/**
 * Training Conference Engine — Multi-Student Virtual Rooms
 *
 * Features:
 * - Create training room (conference) for a class
 * - Instructor as moderator (unmuted, controls)
 * - Students join muted by default
 * - Q&A: student raises hand → instructor unmutes
 * - Auto-record for replay
 * - Session linked to CoachingSession for tracking
 */

import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import * as telnyx from '@/lib/telnyx';

interface TrainingRoom {
  conferenceId: string;
  name: string;
  sessionId?: string; // CoachingSession link
  instructorCallControlId?: string;
  participants: Map<string, {
    callControlId: string;
    userId: string;
    name: string;
    isMuted: boolean;
    handRaised: boolean;
    joinedAt: Date;
  }>;
  isRecording: boolean;
  createdAt: Date;
}

// Active training rooms keyed by conferenceId
const trainingRooms = new Map<string, TrainingRoom>();

/**
 * Create a training room and dial the instructor in.
 */
export async function createTrainingRoom(options: {
  name: string;
  instructorPhone: string;
  instructorUserId: string;
  sessionId?: string;
  callerIdNumber?: string;
}): Promise<{ conferenceId?: string; error?: string }> {
  const connectionId = process.env.TELNYX_CONNECTION_ID || '';
  const from = options.callerIdNumber || process.env.TELNYX_DEFAULT_CALLER_ID || '';
  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/voip/webhooks/telnyx`;

  try {
    // Dial instructor first
    const dialResult = await telnyx.dialCall({
      to: options.instructorPhone,
      from,
      connectionId,
      webhookUrl,
      clientState: JSON.stringify({
        trainingRoom: true,
        roomName: options.name,
        sessionId: options.sessionId,
        isInstructor: true,
        userId: options.instructorUserId,
      }),
      timeout: 45,
    });

    const instructorCallId = (dialResult as { data?: { call_control_id?: string } })
      ?.data?.call_control_id;

    if (!instructorCallId) {
      return { error: 'Failed to dial instructor' };
    }

    // Create conference with instructor's call
    const confResult = await telnyx.telnyxFetch<{ id: string }>('/conferences', {
      method: 'POST',
      body: {
        call_control_id: instructorCallId,
        name: `training-${options.name}`,
        beep_enabled: 'onEnterAndExit',
        start_conference_on_create: true,
      },
    });

    const conferenceId = confResult.data.id;

    // Start recording
    let isRecording = false;
    try {
      await telnyx.startRecording(instructorCallId, {
        channels: 'single',
        format: 'wav',
      });
      isRecording = true;
    } catch {
      logger.warn('[Training] Recording start failed', { conferenceId });
    }

    const room: TrainingRoom = {
      conferenceId,
      name: options.name,
      sessionId: options.sessionId,
      instructorCallControlId: instructorCallId,
      participants: new Map(),
      isRecording,
      createdAt: new Date(),
    };

    room.participants.set(instructorCallId, {
      callControlId: instructorCallId,
      userId: options.instructorUserId,
      name: 'Instructor',
      isMuted: false,
      handRaised: false,
      joinedAt: new Date(),
    });

    trainingRooms.set(conferenceId, room);

    logger.info('[Training] Room created', {
      conferenceId,
      name: options.name,
      instructor: options.instructorUserId,
    });

    return { conferenceId };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error('[Training] Room creation failed', { error: msg });
    return { error: msg };
  }
}

/**
 * Dial a student into the training room (muted by default).
 */
export async function addStudent(
  conferenceId: string,
  studentPhone: string,
  studentUserId: string,
  studentName: string
): Promise<{ status: string }> {
  const room = trainingRooms.get(conferenceId);
  if (!room) {
    return { status: 'error: room not found' };
  }

  const connectionId = process.env.TELNYX_CONNECTION_ID || '';
  const from = process.env.TELNYX_DEFAULT_CALLER_ID || '';
  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/voip/webhooks/telnyx`;

  try {
    const dialResult = await telnyx.dialCall({
      to: studentPhone,
      from,
      connectionId,
      webhookUrl,
      clientState: JSON.stringify({
        trainingRoom: true,
        conferenceId,
        isStudent: true,
        userId: studentUserId,
        studentName,
      }),
      timeout: 30,
    });

    const studentCallId = (dialResult as { data?: { call_control_id?: string } })
      ?.data?.call_control_id;

    if (studentCallId) {
      room.participants.set(studentCallId, {
        callControlId: studentCallId,
        userId: studentUserId,
        name: studentName,
        isMuted: true, // Students start muted
        handRaised: false,
        joinedAt: new Date(),
      });
    }

    return { status: 'dialing' };
  } catch (error) {
    logger.error('[Training] Add student failed', {
      conferenceId,
      studentPhone,
      error: error instanceof Error ? error.message : String(error),
    });
    return { status: 'error' };
  }
}

/**
 * Called when a student answers — join them to conference (muted).
 */
export async function handleStudentAnswered(
  conferenceId: string,
  callControlId: string
): Promise<void> {
  const room = trainingRooms.get(conferenceId);
  if (!room) return;

  await telnyx.telnyxFetch(`/conferences/${conferenceId}/actions/join`, {
    method: 'POST',
    body: {
      call_control_id: callControlId,
      mute: true, // Students join muted
      hold: false,
    },
  });

  logger.info('[Training] Student joined', {
    conferenceId,
    callControlId,
    totalParticipants: room.participants.size,
  });
}

/**
 * Student raises hand (flag in state, notify instructor).
 */
export function raiseHand(
  conferenceId: string,
  callControlId: string
): { handsRaised: string[] } {
  const room = trainingRooms.get(conferenceId);
  if (!room) return { handsRaised: [] };

  const participant = room.participants.get(callControlId);
  if (participant) {
    participant.handRaised = true;
  }

  const handsRaised = [...room.participants.values()]
    .filter(p => p.handRaised)
    .map(p => p.name);

  logger.info('[Training] Hand raised', {
    conferenceId,
    callControlId,
    handsRaised,
  });

  return { handsRaised };
}

/**
 * Instructor unmutes a student (e.g., for Q&A).
 */
export async function unmuteStudent(
  conferenceId: string,
  studentCallControlId: string
): Promise<void> {
  const room = trainingRooms.get(conferenceId);
  if (!room) return;

  await telnyx.telnyxFetch(`/conferences/${conferenceId}/actions/unmute`, {
    method: 'POST',
    body: { call_control_ids: [studentCallControlId] },
  });

  const participant = room.participants.get(studentCallControlId);
  if (participant) {
    participant.isMuted = false;
    participant.handRaised = false;
  }
}

/**
 * Instructor mutes a student back.
 */
export async function muteStudent(
  conferenceId: string,
  studentCallControlId: string
): Promise<void> {
  const room = trainingRooms.get(conferenceId);
  if (!room) return;

  await telnyx.telnyxFetch(`/conferences/${conferenceId}/actions/mute`, {
    method: 'POST',
    body: { call_control_ids: [studentCallControlId] },
  });

  const participant = room.participants.get(studentCallControlId);
  if (participant) {
    participant.isMuted = true;
  }
}

/**
 * Mute all students (instructor-only mode).
 */
export async function muteAllStudents(conferenceId: string): Promise<void> {
  const room = trainingRooms.get(conferenceId);
  if (!room) return;

  const studentCallIds = [...room.participants.entries()]
    .filter(([callId]) => callId !== room.instructorCallControlId)
    .map(([callId]) => callId);

  if (studentCallIds.length > 0) {
    await telnyx.telnyxFetch(`/conferences/${conferenceId}/actions/mute`, {
      method: 'POST',
      body: { call_control_ids: studentCallIds },
    });

    for (const callId of studentCallIds) {
      const p = room.participants.get(callId);
      if (p) p.isMuted = true;
    }
  }
}

/**
 * Get room status for the instructor dashboard.
 */
export function getRoomStatus(conferenceId: string): {
  name: string;
  participantCount: number;
  participants: Array<{
    userId: string;
    name: string;
    isMuted: boolean;
    handRaised: boolean;
    joinedAt: Date;
  }>;
  isRecording: boolean;
  duration: number;
} | null {
  const room = trainingRooms.get(conferenceId);
  if (!room) return null;

  return {
    name: room.name,
    participantCount: room.participants.size,
    participants: [...room.participants.values()].map(p => ({
      userId: p.userId,
      name: p.name,
      isMuted: p.isMuted,
      handRaised: p.handRaised,
      joinedAt: p.joinedAt,
    })),
    isRecording: room.isRecording,
    duration: Math.round((Date.now() - room.createdAt.getTime()) / 1000),
  };
}

/**
 * End training room — hang up all, stop recording.
 */
export async function endTrainingRoom(conferenceId: string): Promise<void> {
  const room = trainingRooms.get(conferenceId);
  if (!room) return;

  // Stop recording
  if (room.isRecording && room.instructorCallControlId) {
    await telnyx.stopRecording(room.instructorCallControlId).catch(() => {});
  }

  // Hang up all participants
  for (const [callId] of room.participants) {
    await telnyx.hangupCall(callId).catch(() => {});
  }

  trainingRooms.delete(conferenceId);

  logger.info('[Training] Room ended', {
    conferenceId,
    name: room.name,
    totalParticipants: room.participants.size,
  });
}

/**
 * List all active training rooms.
 */
export function listActiveRooms(): Array<{
  conferenceId: string;
  name: string;
  participantCount: number;
  isRecording: boolean;
  createdAt: Date;
}> {
  return [...trainingRooms.values()].map(r => ({
    conferenceId: r.conferenceId,
    name: r.name,
    participantCount: r.participants.size,
    isRecording: r.isRecording,
    createdAt: r.createdAt,
  }));
}

/**
 * Cleanup on participant hangup.
 */
export function handleParticipantLeft(
  conferenceId: string,
  callControlId: string
): void {
  const room = trainingRooms.get(conferenceId);
  if (!room) return;

  room.participants.delete(callControlId);

  // If instructor left, end the room
  if (callControlId === room.instructorCallControlId) {
    endTrainingRoom(conferenceId).catch(() => {});
  }

  // If no participants left, clean up
  if (room.participants.size === 0) {
    trainingRooms.delete(conferenceId);
  }
}
