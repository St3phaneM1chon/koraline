/**
 * CRM Conference Call - C22
 *
 * Multi-party conference calling via Telnyx Conference API.
 * Supports 3-way+ calls for warm transfers, supervisor barge-in,
 * and multi-participant meetings.
 *
 * Functions:
 * - createConference: Create a new conference room
 * - addParticipant: Add a participant by phone or existing call
 * - removeParticipant: Remove a participant from the conference
 * - muteParticipant: Mute a participant
 * - unmuteParticipant: Unmute a participant
 * - endConference: End the conference and disconnect all participants
 */

import { logger } from '@/lib/logger';
import { telnyxFetch, getTelnyxConnectionId, getDefaultCallerId } from '@/lib/telnyx';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ConferenceInfo {
  conferenceId: string;
  name: string;
  hostCallControlId: string;
  participants: Map<string, string>; // participantId -> callControlId
  createdAt: Date;
}

interface ConferenceCreateResult {
  conferenceId: string;
  name: string;
}

interface ParticipantResult {
  participantId: string;
  callControlId: string;
}

// ---------------------------------------------------------------------------
// In-memory conference state
// In production, this should be backed by Redis for multi-instance support.
// ---------------------------------------------------------------------------

const conferences = new Map<string, ConferenceInfo>();

// ---------------------------------------------------------------------------
// createConference
// ---------------------------------------------------------------------------

/**
 * Create a new conference room and add the host call as the first participant.
 *
 * The host call (typically the agent's current call) becomes the anchor
 * of the conference. Additional participants are added via addParticipant.
 *
 * @param hostCallControlId - The Telnyx call control ID of the host call
 * @param name - A descriptive name for the conference
 * @returns The conference ID and name
 */
export async function createConference(
  hostCallControlId: string,
  name: string
): Promise<ConferenceCreateResult> {
  // Create conference via Telnyx API
  const result = await telnyxFetch<{
    id: string;
    name: string;
  }>('/conferences', {
    method: 'POST',
    body: {
      call_control_id: hostCallControlId,
      name,
      beep_enabled: 'onEnterAndLeave',
      start_conference_on_create: true,
    },
  });

  const conferenceId = result.data.id;

  // Track conference state
  const participants = new Map<string, string>();
  participants.set(`host-${hostCallControlId}`, hostCallControlId);

  conferences.set(conferenceId, {
    conferenceId,
    name,
    hostCallControlId,
    participants,
    createdAt: new Date(),
  });

  logger.info('Conference: created', {
    event: 'conference_created',
    conferenceId,
    name,
    hostCallControlId,
  });

  return { conferenceId, name };
}

// ---------------------------------------------------------------------------
// addParticipant
// ---------------------------------------------------------------------------

/**
 * Add a participant to an existing conference.
 *
 * Can add either by phone number (dials a new call) or by existing
 * call control ID (joins an in-progress call to the conference).
 *
 * @param conferenceId - The conference ID
 * @param phoneOrCallId - E.164 phone number to dial, or existing call control ID
 * @returns The participant ID and call control ID
 */
export async function addParticipant(
  conferenceId: string,
  phoneOrCallId: string
): Promise<ParticipantResult> {
  const conference = conferences.get(conferenceId);

  if (!conference) {
    throw new Error(`Conference ${conferenceId} not found`);
  }

  const isPhoneNumber = phoneOrCallId.startsWith('+') || /^\d{10,}$/.test(phoneOrCallId);

  let callControlId: string;

  if (isPhoneNumber) {
    // Dial a new call and join it to the conference
    const connectionId = getTelnyxConnectionId();
    const callerId = getDefaultCallerId();

    const dialResult = await telnyxFetch<{
      call_control_id: string;
    }>('/calls', {
      method: 'POST',
      body: {
        to: phoneOrCallId,
        from: callerId,
        connection_id: connectionId,
        timeout_secs: 30,
      },
    });

    callControlId = dialResult.data.call_control_id;

    // Join the new call to the conference
    await telnyxFetch(`/conferences/${conferenceId}/actions/join`, {
      method: 'POST',
      body: {
        call_control_id: callControlId,
      },
    });
  } else {
    // Join an existing call to the conference
    callControlId = phoneOrCallId;

    await telnyxFetch(`/conferences/${conferenceId}/actions/join`, {
      method: 'POST',
      body: {
        call_control_id: callControlId,
      },
    });
  }

  const participantId = `p-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  conference.participants.set(participantId, callControlId);

  logger.info('Conference: participant added', {
    event: 'conference_participant_added',
    conferenceId,
    participantId,
    callControlId,
    isNewDial: isPhoneNumber,
    totalParticipants: conference.participants.size,
  });

  return { participantId, callControlId };
}

// ---------------------------------------------------------------------------
// removeParticipant
// ---------------------------------------------------------------------------

/**
 * Remove a participant from the conference.
 *
 * Hangs up the participant's call leg while keeping the conference active.
 *
 * @param conferenceId - The conference ID
 * @param participantId - The participant ID to remove
 */
export async function removeParticipant(
  conferenceId: string,
  participantId: string
): Promise<void> {
  const conference = conferences.get(conferenceId);

  if (!conference) {
    throw new Error(`Conference ${conferenceId} not found`);
  }

  const callControlId = conference.participants.get(participantId);

  if (!callControlId) {
    throw new Error(`Participant ${participantId} not found in conference ${conferenceId}`);
  }

  // Leave the conference
  await telnyxFetch(`/conferences/${conferenceId}/actions/leave`, {
    method: 'POST',
    body: { call_control_id: callControlId },
  });

  conference.participants.delete(participantId);

  logger.info('Conference: participant removed', {
    event: 'conference_participant_removed',
    conferenceId,
    participantId,
    callControlId,
    remainingParticipants: conference.participants.size,
  });
}

// ---------------------------------------------------------------------------
// muteParticipant
// ---------------------------------------------------------------------------

/**
 * Mute a participant in the conference.
 *
 * @param conferenceId - The conference ID
 * @param participantId - The participant ID to mute
 */
export async function muteParticipant(
  conferenceId: string,
  participantId: string
): Promise<void> {
  const conference = conferences.get(conferenceId);

  if (!conference) {
    throw new Error(`Conference ${conferenceId} not found`);
  }

  const callControlId = conference.participants.get(participantId);

  if (!callControlId) {
    throw new Error(`Participant ${participantId} not found in conference ${conferenceId}`);
  }

  await telnyxFetch(`/conferences/${conferenceId}/actions/mute`, {
    method: 'POST',
    body: { call_control_ids: [callControlId] },
  });

  logger.info('Conference: participant muted', {
    event: 'conference_participant_muted',
    conferenceId,
    participantId,
  });
}

// ---------------------------------------------------------------------------
// unmuteParticipant
// ---------------------------------------------------------------------------

/**
 * Unmute a participant in the conference.
 *
 * @param conferenceId - The conference ID
 * @param participantId - The participant ID to unmute
 */
export async function unmuteParticipant(
  conferenceId: string,
  participantId: string
): Promise<void> {
  const conference = conferences.get(conferenceId);

  if (!conference) {
    throw new Error(`Conference ${conferenceId} not found`);
  }

  const callControlId = conference.participants.get(participantId);

  if (!callControlId) {
    throw new Error(`Participant ${participantId} not found in conference ${conferenceId}`);
  }

  await telnyxFetch(`/conferences/${conferenceId}/actions/unmute`, {
    method: 'POST',
    body: { call_control_ids: [callControlId] },
  });

  logger.info('Conference: participant unmuted', {
    event: 'conference_participant_unmuted',
    conferenceId,
    participantId,
  });
}

// ---------------------------------------------------------------------------
// endConference
// ---------------------------------------------------------------------------

/**
 * End a conference and disconnect all participants.
 *
 * Hangs up all call legs and removes the conference from tracking.
 *
 * @param conferenceId - The conference ID to end
 */
export async function endConference(conferenceId: string): Promise<void> {
  const conference = conferences.get(conferenceId);

  if (!conference) {
    throw new Error(`Conference ${conferenceId} not found`);
  }

  // Hang up all participant calls
  const hangupPromises = Array.from(conference.participants.values()).map(
    async (callControlId) => {
      try {
        await telnyxFetch(`/calls/${callControlId}/actions/hangup`, {
          method: 'POST',
          body: {},
        });
      } catch (err) {
        // Some calls may have already ended
        logger.debug('Conference: hangup failed for participant (may have already ended)', {
          event: 'conference_hangup_error',
          conferenceId,
          callControlId,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  );

  await Promise.allSettled(hangupPromises);

  const participantCount = conference.participants.size;
  const durationSec = Math.round((Date.now() - conference.createdAt.getTime()) / 1000);

  conferences.delete(conferenceId);

  logger.info('Conference: ended', {
    event: 'conference_ended',
    conferenceId,
    name: conference.name,
    participantCount,
    durationSec,
  });
}
