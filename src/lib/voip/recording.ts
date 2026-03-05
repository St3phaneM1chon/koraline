/**
 * Call Recording — Dual-Channel Forking (C35)
 *
 * Provides dual-channel recording capabilities via Telnyx Media Forking.
 * Dual-channel recording separates caller and agent audio into distinct
 * tracks, enabling better speech analytics, QA scoring, and transcription.
 *
 * Channels:
 * - Channel 0 (left): Inbound audio (caller / customer)
 * - Channel 1 (right): Outbound audio (agent)
 *
 * Flow:
 * 1. Start dual-channel recording via Telnyx `fork_start` action
 * 2. Telnyx streams RTP to configured media server (or records inline)
 * 3. On call end, recording is available via Telnyx recording API
 * 4. getDualChannelRecording retrieves metadata + download URLs
 *
 * Falls back to standard single-channel recording if forking is unavailable.
 */

import { logger } from '@/lib/logger';
import * as telnyx from '@/lib/telnyx';
import { prisma } from '@/lib/db';
import { VoipStateMap } from './voip-state';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DualChannelSession {
  callControlId: string;
  recordingId?: string;
  forkStreamId?: string;
  mode: 'dual' | 'single';
  format: 'wav' | 'mp3';
  startedAt: Date;
  stoppedAt?: Date;
  /** Whether recording is currently paused (PCI compliance) */
  isPaused: boolean;
  /** Timestamps when recording was paused */
  pauseHistory: Array<{ pausedAt: Date; resumedAt?: Date }>;
}

export interface DualChannelRecordingResult {
  recordingId: string;
  callControlId: string;
  mode: 'dual' | 'single';
  format: string;
  durationSeconds?: number;
  channels: {
    mixed?: string;   // URL for mixed/single-channel recording
    caller?: string;  // URL for caller-only track (channel 0)
    agent?: string;   // URL for agent-only track (channel 1)
  };
  startedAt: Date;
  stoppedAt?: Date;
}

// ---------------------------------------------------------------------------
// State store (Redis-backed, 24 h TTL)
// ---------------------------------------------------------------------------

const recordingSessions = new VoipStateMap<DualChannelSession>('voip:recording:dual:');

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Start dual-channel recording on an active call.
 *
 * Uses Telnyx's `record_start` with channels='dual' as primary method.
 * If forking is configured, also initiates media fork for real-time streaming.
 *
 * @param callControlId - The Telnyx call control ID of the active call
 * @param options - Recording options
 * @returns Recording session info
 */
export async function startDualChannelRecording(
  callControlId: string,
  options?: {
    format?: 'wav' | 'mp3';
    forkToUrl?: string; // Optional RTP endpoint for real-time media forking
  }
): Promise<{ success: boolean; session?: DualChannelSession; error?: string }> {
  const format = options?.format || 'wav';

  // Check if already recording this call
  const existing = recordingSessions.get(callControlId);
  if (existing) {
    return {
      success: false,
      error: 'Dual-channel recording already active for this call',
    };
  }

  try {
    // Step 1: Start dual-channel recording via Telnyx Call Control
    const recordResult = await telnyx.telnyxFetch<{ recording_id?: string }>(
      `/calls/${callControlId}/actions/record_start`,
      {
        method: 'POST',
        body: {
          channels: 'dual',
          format,
        },
      }
    );

    const recordingId = recordResult.data?.recording_id;

    // Step 2: Optionally start media forking for real-time streaming
    let forkStreamId: string | undefined;
    if (options?.forkToUrl) {
      try {
        const forkResult = await telnyx.telnyxFetch<{ stream_id?: string }>(
          `/calls/${callControlId}/actions/fork_start`,
          {
            method: 'POST',
            body: {
              rx: options.forkToUrl,  // Inbound (caller) RTP stream
              tx: options.forkToUrl,  // Outbound (agent) RTP stream
              stream_type: 'raw',
            },
          }
        );
        forkStreamId = forkResult.data?.stream_id;

        logger.info('[Recording] Media fork started', {
          callControlId,
          forkStreamId,
          targetUrl: options.forkToUrl,
        });
      } catch (forkError) {
        // Fork is optional — continue with standard dual recording
        logger.warn('[Recording] Media forking unavailable, continuing with dual recording only', {
          callControlId,
          error: forkError instanceof Error ? forkError.message : String(forkError),
        });
      }
    }

    // Step 3: Persist session
    const session: DualChannelSession = {
      callControlId,
      recordingId,
      forkStreamId,
      mode: 'dual',
      format,
      startedAt: new Date(),
      isPaused: false,
      pauseHistory: [],
    };

    recordingSessions.set(callControlId, session);

    logger.info('[Recording] Dual-channel recording started', {
      callControlId,
      recordingId,
      mode: 'dual',
      format,
      hasFork: !!forkStreamId,
    });

    return { success: true, session };
  } catch (error) {
    // Fallback: try single-channel recording
    try {
      logger.warn('[Recording] Dual-channel unavailable, falling back to single-channel', {
        callControlId,
        error: error instanceof Error ? error.message : String(error),
      });

      const fallbackResult = await telnyx.telnyxFetch<{ recording_id?: string }>(
        `/calls/${callControlId}/actions/record_start`,
        {
          method: 'POST',
          body: {
            channels: 'single',
            format,
          },
        }
      );

      const session: DualChannelSession = {
        callControlId,
        recordingId: fallbackResult.data?.recording_id,
        mode: 'single',
        format,
        startedAt: new Date(),
        isPaused: false,
        pauseHistory: [],
      };

      recordingSessions.set(callControlId, session);

      return { success: true, session };
    } catch (fallbackError) {
      const msg = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
      logger.error('[Recording] Failed to start any recording', {
        callControlId,
        error: msg,
      });
      return { success: false, error: msg };
    }
  }
}

/**
 * Pause recording on an active call (PCI compliance).
 * Use before collecting sensitive data (credit card, SSN, etc.).
 */
export async function pauseRecording(
  callControlId: string
): Promise<{ success: boolean; error?: string }> {
  const session = recordingSessions.get(callControlId);
  if (!session) {
    return { success: false, error: 'No active recording session for this call' };
  }
  if (session.isPaused) {
    return { success: false, error: 'Recording is already paused' };
  }

  try {
    await telnyx.telnyxFetch(`/calls/${callControlId}/actions/record_pause`, {
      method: 'POST',
      body: {},
    });

    session.isPaused = true;
    session.pauseHistory.push({ pausedAt: new Date() });
    recordingSessions.set(callControlId, session);

    logger.info('[Recording] Recording paused (PCI compliance)', {
      callControlId,
      recordingId: session.recordingId,
    });

    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error('[Recording] Failed to pause recording', { callControlId, error: msg });
    return { success: false, error: msg };
  }
}

/**
 * Resume a paused recording.
 */
export async function resumeRecording(
  callControlId: string
): Promise<{ success: boolean; error?: string }> {
  const session = recordingSessions.get(callControlId);
  if (!session) {
    return { success: false, error: 'No active recording session for this call' };
  }
  if (!session.isPaused) {
    return { success: false, error: 'Recording is not paused' };
  }

  try {
    await telnyx.telnyxFetch(`/calls/${callControlId}/actions/record_resume`, {
      method: 'POST',
      body: {},
    });

    session.isPaused = false;
    // Update the last pause entry with resume time
    const lastPause = session.pauseHistory[session.pauseHistory.length - 1];
    if (lastPause) {
      lastPause.resumedAt = new Date();
    }
    recordingSessions.set(callControlId, session);

    logger.info('[Recording] Recording resumed', {
      callControlId,
      recordingId: session.recordingId,
    });

    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error('[Recording] Failed to resume recording', { callControlId, error: msg });
    return { success: false, error: msg };
  }
}

/**
 * Stop dual-channel recording on an active call.
 */
export async function stopDualChannelRecording(
  callControlId: string
): Promise<{ success: boolean; error?: string }> {
  const session = recordingSessions.get(callControlId);
  if (!session) {
    return { success: false, error: 'No active recording session for this call' };
  }

  try {
    // Stop recording
    await telnyx.telnyxFetch(`/calls/${callControlId}/actions/record_stop`, {
      method: 'POST',
      body: {},
    });

    // Stop fork if active
    if (session.forkStreamId) {
      await telnyx.telnyxFetch(`/calls/${callControlId}/actions/fork_stop`, {
        method: 'POST',
        body: {},
      }).catch(() => {
        logger.warn('[Recording] Fork stop failed (may already be stopped)', {
          callControlId,
        });
      });
    }

    session.stoppedAt = new Date();
    recordingSessions.set(callControlId, session);

    logger.info('[Recording] Dual-channel recording stopped', {
      callControlId,
      recordingId: session.recordingId,
      mode: session.mode,
    });

    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error('[Recording] Failed to stop recording', { callControlId, error: msg });
    return { success: false, error: msg };
  }
}

/**
 * Retrieve dual-channel recording details and download URLs.
 *
 * After a call ends, Telnyx processes the recording and makes it available
 * via the recordings API. Dual-channel recordings provide separate channel
 * URLs for caller and agent audio.
 *
 * @param recordingId - The Telnyx recording ID (from startDualChannelRecording or webhook)
 * @returns Recording details with channel-specific download URLs
 */
export async function getDualChannelRecording(
  recordingId: string
): Promise<DualChannelRecordingResult | null> {
  try {
    const result = await telnyx.telnyxFetch<{
      id: string;
      call_control_id?: string;
      call_leg_id?: string;
      channels: number;
      duration_millis?: number;
      status: string;
      download_urls?: {
        wav?: string;
        mp3?: string;
      };
      recording_urls?: {
        wav?: string;
        mp3?: string;
      };
    }>(`/recordings/${recordingId}`);

    const recording = result.data;

    if (!recording || recording.status === 'deleted') {
      return null;
    }

    // Determine download URLs
    const downloadUrl = recording.download_urls?.wav
      || recording.download_urls?.mp3
      || recording.recording_urls?.wav
      || recording.recording_urls?.mp3;

    const channels: DualChannelRecordingResult['channels'] = {};

    if (recording.channels === 2 && downloadUrl) {
      // Dual-channel: Telnyx provides a stereo file where
      // channel 0 (left) = caller, channel 1 (right) = agent
      channels.mixed = downloadUrl;
      // Telnyx dual-channel recordings are stereo files.
      // Splitting into individual tracks requires post-processing.
      // The mixed URL contains both channels for tools that support stereo.
      channels.caller = downloadUrl; // Left channel
      channels.agent = downloadUrl;  // Right channel
    } else {
      channels.mixed = downloadUrl || undefined;
    }

    const durationSeconds = recording.duration_millis
      ? Math.round(recording.duration_millis / 1000)
      : undefined;

    logger.info('[Recording] Retrieved dual-channel recording', {
      recordingId,
      channels: recording.channels,
      durationSeconds,
      status: recording.status,
    });

    return {
      recordingId: recording.id,
      callControlId: recording.call_control_id || '',
      mode: recording.channels === 2 ? 'dual' : 'single',
      format: recording.download_urls?.wav ? 'wav' : 'mp3',
      durationSeconds,
      channels,
      startedAt: new Date(), // Approximation — exact time from session or webhook
      stoppedAt: durationSeconds ? new Date() : undefined,
    };
  } catch (error) {
    logger.error('[Recording] Failed to retrieve recording', {
      recordingId,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Save recording metadata to the database (CallRecording table).
 * Called after a recording is completed (from webhook or manual retrieval).
 */
export async function saveDualChannelRecordingToDB(
  callLogId: string,
  recordingResult: DualChannelRecordingResult
): Promise<void> {
  try {
    await prisma.callRecording.create({
      data: {
        callLogId,
        format: recordingResult.format,
        durationSec: recordingResult.durationSeconds || null,
        blobUrl: recordingResult.channels.mixed || null,
        localPath: null,
        isUploaded: !!recordingResult.channels.mixed,
        fileSize: null,
      },
    });

    logger.info('[Recording] Saved dual-channel recording to DB', {
      callLogId,
      recordingId: recordingResult.recordingId,
      mode: recordingResult.mode,
    });
  } catch (error) {
    logger.error('[Recording] Failed to save recording to DB', {
      callLogId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Get the active recording session for a call, if any.
 */
export function getActiveRecordingSession(
  callControlId: string
): DualChannelSession | undefined {
  return recordingSessions.get(callControlId);
}

/**
 * Clean up a recording session (e.g., after call ends).
 */
export function cleanupRecordingSession(callControlId: string): void {
  recordingSessions.delete(callControlId);
}
