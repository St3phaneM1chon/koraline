/**
 * CRM Streaming Transcription - C18
 *
 * Real-time call transcription via Telnyx streaming API.
 * Receives transcription chunks as they are produced, stores them
 * in memory, and periodically flushes the accumulated text to the
 * CallTranscription database record.
 *
 * Functions:
 * - startStreamingTranscription: Begin real-time transcription on a call
 * - handleTranscriptionChunk: Process an incoming transcription chunk
 * - stopStreamingTranscription: Stop transcription and flush remaining data
 */

import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import { telnyxFetch } from '@/lib/telnyx';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TranscriptionConfig {
  language?: string;          // Default: 'fr'
  flushIntervalMs?: number;   // Default: 10000 (10s)
  interimResults?: boolean;   // Include non-final results (default: false)
}

interface TranscriptionChunk {
  text: string;
  isFinal: boolean;
  confidence: number;
  timestamp: number;          // ms from call start
  speaker?: string;           // 'caller' | 'agent' | undefined
}

interface ActiveTranscription {
  callLogId: string;
  callControlId: string;
  config: TranscriptionConfig;
  chunks: TranscriptionChunk[];
  fullText: string;
  startedAt: Date;
  lastFlushedAt: Date;
  flushTimer?: ReturnType<typeof setInterval>;
}

// ---------------------------------------------------------------------------
// In-memory transcription state
// In production, this should be backed by Redis for multi-instance support.
// ---------------------------------------------------------------------------

const activeTranscriptions = new Map<string, ActiveTranscription>();

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Default flush interval: write accumulated text to DB every 10 seconds */
const DEFAULT_FLUSH_INTERVAL_MS = 10_000;

// ---------------------------------------------------------------------------
// flushToDatabase
// ---------------------------------------------------------------------------

/**
 * Flush accumulated transcription text to the database.
 *
 * Upserts the CallTranscription record with the latest full text.
 *
 * @param callLogId - The call log ID
 * @param fullText - The complete transcription text so far
 * @param language - The transcription language
 * @param avgConfidence - Average confidence across all final chunks
 */
async function flushToDatabase(
  callLogId: string,
  fullText: string,
  language: string,
  avgConfidence: number
): Promise<void> {
  if (!fullText.trim()) return;

  // Check if transcription record exists
  const existing = await prisma.callTranscription.findUnique({
    where: { callLogId },
    select: { id: true },
  });

  if (existing) {
    await prisma.callTranscription.update({
      where: { callLogId },
      data: {
        fullText,
        confidence: avgConfidence,
      },
    });
  } else {
    await prisma.callTranscription.create({
      data: {
        callLogId,
        fullText,
        language,
        engine: 'telnyx_streaming',
        confidence: avgConfidence,
      },
    });
  }
}

// ---------------------------------------------------------------------------
// startStreamingTranscription
// ---------------------------------------------------------------------------

/**
 * Start real-time transcription on an active call.
 *
 * Sends the transcription_start command to Telnyx and sets up
 * periodic flushing of accumulated text to the database.
 *
 * @param callLogId - The CallLog ID in the database
 * @param callControlId - The Telnyx call control ID
 * @param config - Transcription configuration
 */
export async function startStreamingTranscription(
  callLogId: string,
  callControlId: string,
  config: TranscriptionConfig = {}
): Promise<void> {
  // Verify call exists
  const callLog = await prisma.callLog.findUnique({
    where: { id: callLogId },
    select: { id: true, status: true },
  });

  if (!callLog) {
    throw new Error(`CallLog ${callLogId} not found`);
  }

  if (callLog.status !== 'IN_PROGRESS' && callLog.status !== 'RINGING') {
    throw new Error(`CallLog ${callLogId} is not active (status: ${callLog.status})`);
  }

  const language = config.language ?? 'fr';
  const flushInterval = config.flushIntervalMs ?? DEFAULT_FLUSH_INTERVAL_MS;

  // Start transcription via Telnyx API
  await telnyxFetch(`/calls/${callControlId}/actions/transcription_start`, {
    method: 'POST',
    body: {
      language,
    },
  });

  // Set up periodic flush
  const state: ActiveTranscription = {
    callLogId,
    callControlId,
    config,
    chunks: [],
    fullText: '',
    startedAt: new Date(),
    lastFlushedAt: new Date(),
  };

  state.flushTimer = setInterval(async () => {
    try {
      const avgConf = calculateAverageConfidence(state.chunks);
      await flushToDatabase(callLogId, state.fullText, language, avgConf);
      state.lastFlushedAt = new Date();
    } catch (err) {
      logger.error('Streaming transcription: flush failed', {
        event: 'transcription_flush_error',
        callLogId,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }, flushInterval);

  activeTranscriptions.set(callControlId, state);

  logger.info('Streaming transcription: started', {
    event: 'transcription_started',
    callLogId,
    callControlId,
    language,
    flushIntervalMs: flushInterval,
  });
}

// ---------------------------------------------------------------------------
// handleTranscriptionChunk
// ---------------------------------------------------------------------------

/**
 * Process an incoming transcription chunk from Telnyx webhook.
 *
 * Final chunks are appended to the full text. Interim chunks (non-final)
 * are stored but not appended until finalized.
 *
 * @param callControlId - The Telnyx call control ID
 * @param chunk - The transcription chunk data
 */
export function handleTranscriptionChunk(
  callControlId: string,
  chunk: TranscriptionChunk
): void {
  const state = activeTranscriptions.get(callControlId);

  if (!state) {
    logger.warn('Streaming transcription: chunk for unknown session', {
      event: 'transcription_orphan_chunk',
      callControlId,
    });
    return;
  }

  state.chunks.push(chunk);

  // Only append final chunks to the full text
  if (chunk.isFinal && chunk.text.trim()) {
    if (state.fullText.length > 0) {
      state.fullText += ' ';
    }
    state.fullText += chunk.text.trim();
  }

  logger.debug('Streaming transcription: chunk received', {
    event: 'transcription_chunk',
    callControlId,
    isFinal: chunk.isFinal,
    confidence: chunk.confidence,
    textLength: chunk.text.length,
    totalLength: state.fullText.length,
  });
}

// ---------------------------------------------------------------------------
// stopStreamingTranscription
// ---------------------------------------------------------------------------

/**
 * Stop transcription on a call and flush all remaining data.
 *
 * Stops the Telnyx transcription, clears the flush timer, and writes
 * the final accumulated text to the database.
 *
 * @param callControlId - The Telnyx call control ID
 * @returns The complete transcription text
 */
export async function stopStreamingTranscription(
  callControlId: string
): Promise<string> {
  const state = activeTranscriptions.get(callControlId);

  if (!state) {
    logger.warn('Streaming transcription: stop called for unknown session', {
      event: 'transcription_stop_unknown',
      callControlId,
    });
    return '';
  }

  // Stop the flush timer
  if (state.flushTimer) {
    clearInterval(state.flushTimer);
  }

  // Stop Telnyx transcription
  try {
    await telnyxFetch(`/calls/${callControlId}/actions/transcription_stop`, {
      method: 'POST',
      body: {},
    });
  } catch (err) {
    // Call may have already ended
    logger.debug('Streaming transcription: stop API call failed (call may have ended)', {
      event: 'transcription_stop_api_error',
      callControlId,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  // Final flush to DB
  const language = state.config.language ?? 'fr';
  const avgConfidence = calculateAverageConfidence(state.chunks);
  await flushToDatabase(state.callLogId, state.fullText, language, avgConfidence);

  // Clean up
  activeTranscriptions.delete(callControlId);

  logger.info('Streaming transcription: stopped', {
    event: 'transcription_stopped',
    callLogId: state.callLogId,
    callControlId,
    totalChunks: state.chunks.length,
    finalTextLength: state.fullText.length,
    avgConfidence,
    durationSec: Math.round((Date.now() - state.startedAt.getTime()) / 1000),
  });

  return state.fullText;
}

// ---------------------------------------------------------------------------
// calculateAverageConfidence
// ---------------------------------------------------------------------------

/**
 * Calculate average confidence across all final transcription chunks.
 */
function calculateAverageConfidence(chunks: TranscriptionChunk[]): number {
  const finalChunks = chunks.filter((c) => c.isFinal);
  if (finalChunks.length === 0) return 0;

  const total = finalChunks.reduce((sum, c) => sum + c.confidence, 0);
  return Math.round((total / finalChunks.length) * 100) / 100;
}
