/**
 * Voicemail Engine — Recording, Storage, Transcription
 *
 * Features:
 * - Per-extension greeting (TTS or custom audio)
 * - Recording via Telnyx (WAV format)
 * - Auto-transcription on recording saved
 * - Prisma Voicemail record creation
 * - CRM linking (match caller to existing client)
 */

import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import * as telnyx from '@/lib/telnyx';
import { VoipStateMap } from './voip-state';

// Track active voicemail recordings — Redis-backed
const activeVoicemails = new VoipStateMap<{
  extensionId: string;
  callerNumber: string;
  callerName?: string;
}>('voip:voicemail:');

/**
 * Start voicemail recording for a call.
 * Target can be an extension number or extension ID.
 */
export async function startVoicemail(
  callControlId: string,
  target: string,
  callerInfo?: { from?: string; callerName?: string }
): Promise<void> {
  // Find the extension
  const extension = await prisma.sipExtension.findFirst({
    where: {
      OR: [
        { id: target },
        { extension: target },
      ],
    },
    include: {
      user: { select: { name: true } },
    },
  });

  const extensionId = extension?.id || target;
  const agentName = extension?.user?.name || 'notre équipe';

  // Play voicemail greeting
  const greeting = `Vous avez joint la boîte vocale de ${agentName}. `
    + `Veuillez laisser votre message après le bip. `
    + `Appuyez sur la touche dièse lorsque vous avez terminé.`;

  await telnyx.speakText(callControlId, greeting);

  // Track the voicemail
  activeVoicemails.set(callControlId, {
    extensionId,
    callerNumber: callerInfo?.from || 'unknown',
    callerName: callerInfo?.callerName,
  });

  // Start recording (single channel for voicemail)
  await telnyx.startRecording(callControlId, {
    channels: 'single',
    format: 'wav',
  });

  logger.info('[Voicemail] Recording started', {
    callControlId,
    extensionId,
    callerNumber: callerInfo?.from,
  });
}

/**
 * Handle voicemail recording saved event.
 * Creates Voicemail record and triggers transcription.
 */
export async function handleVoicemailSaved(
  callControlId: string,
  recordingUrls: { mp3?: string; wav?: string },
  durationSec?: number
): Promise<void> {
  const vmInfo = activeVoicemails.get(callControlId);
  if (!vmInfo) return;

  const blobUrl = recordingUrls.wav || recordingUrls.mp3;

  // Try to match caller to existing client
  const client = vmInfo.callerNumber !== 'unknown'
    ? await prisma.user.findFirst({
        where: {
          OR: [
            { phone: vmInfo.callerNumber },
            { phone: vmInfo.callerNumber.replace(/^\+1/, '') },
          ],
        },
        select: { id: true },
      })
    : null;

  // Create voicemail record
  const voicemail = await prisma.voicemail.create({
    data: {
      extensionId: vmInfo.extensionId,
      callerNumber: vmInfo.callerNumber,
      callerName: vmInfo.callerName,
      blobUrl,
      durationSec,
      isRead: false,
      isArchived: false,
      ...(client ? { clientId: client.id } : {}),
    },
  });

  logger.info('[Voicemail] Saved', {
    voicemailId: voicemail.id,
    extensionId: vmInfo.extensionId,
    callerNumber: vmInfo.callerNumber,
    duration: durationSec,
  });

  // Trigger transcription in background
  if (blobUrl) {
    transcribeVoicemail(voicemail.id, blobUrl).catch(err => {
      logger.error('[Voicemail] Transcription failed', {
        voicemailId: voicemail.id,
        error: err instanceof Error ? err.message : String(err),
      });
    });
  }

  // Cleanup
  activeVoicemails.delete(callControlId);
}

/**
 * Transcribe a voicemail recording using OpenAI Whisper.
 * Downloads the audio, transcribes via Whisper, updates the Voicemail record.
 */
async function transcribeVoicemail(voicemailId: string, audioUrl: string): Promise<void> {
  logger.info('[Voicemail] Starting Whisper transcription', { voicemailId, audioUrl });

  try {
    // Lazy-load OpenAI to avoid top-level init (KB-PP-BUILD-002)
    const { default: OpenAI } = await import('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    if (!process.env.OPENAI_API_KEY) {
      logger.warn('[Voicemail] OPENAI_API_KEY not configured, skipping transcription', { voicemailId });
      return;
    }

    // Download the audio file
    const audioResponse = await fetch(audioUrl);
    if (!audioResponse.ok) {
      throw new Error(`Failed to download voicemail audio: ${audioResponse.status}`);
    }

    const audioBuffer = Buffer.from(await audioResponse.arrayBuffer());

    // Create a File-like object for Whisper API
    const audioFile = new File([audioBuffer], 'voicemail.wav', { type: 'audio/wav' });

    // Transcribe with Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'fr', // French-first (Quebec business)
      response_format: 'text',
    });

    const transcriptText = typeof transcription === 'string'
      ? transcription
      : (transcription as { text?: string }).text ?? '';

    if (!transcriptText.trim()) {
      logger.info('[Voicemail] Empty transcription (silence or noise)', { voicemailId });
      return;
    }

    // Update the Voicemail record with transcription
    await prisma.voicemail.update({
      where: { id: voicemailId },
      data: { transcription: transcriptText },
    });

    logger.info('[Voicemail] Transcription completed', {
      voicemailId,
      textLength: transcriptText.length,
      preview: transcriptText.substring(0, 100),
    });
  } catch (error) {
    logger.error('[Voicemail] Whisper transcription failed', {
      voicemailId,
      error: error instanceof Error ? error.message : String(error),
    });
    // Non-critical: voicemail is still saved without transcription
  }
}

/**
 * Mark a voicemail as read.
 */
export async function markVoicemailRead(voicemailId: string): Promise<void> {
  await prisma.voicemail.update({
    where: { id: voicemailId },
    data: { isRead: true },
  });
}

/**
 * Archive a voicemail.
 */
export async function archiveVoicemail(voicemailId: string): Promise<void> {
  await prisma.voicemail.update({
    where: { id: voicemailId },
    data: { isArchived: true },
  });
}

/**
 * Get unread voicemail count for an extension.
 */
export async function getUnreadCount(extensionId: string): Promise<number> {
  return prisma.voicemail.count({
    where: {
      extensionId,
      isRead: false,
      isArchived: false,
    },
  });
}

/**
 * Check if a call is currently recording a voicemail.
 */
export function isVoicemailActive(callControlId: string): boolean {
  return activeVoicemails.has(callControlId);
}

/**
 * Cleanup voicemail state on hangup.
 */
export function cleanupVoicemail(callControlId: string): void {
  activeVoicemails.delete(callControlId);
}
