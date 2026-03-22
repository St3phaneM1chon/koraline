/**
 * Recording Retention Policy — PIPEDA Compliance
 *
 * Automatically purges old call recordings based on configurable retention periods.
 * Default: 90 days standard, 365 days for flagged/litigation, 1095 days for training.
 *
 * PIPEDA Principle 5 (Limiting Use, Disclosure, and Retention):
 * "Personal information shall not be used or disclosed for purposes other than
 * those for which it was collected, except with consent or as required by law.
 * Personal information shall be retained only as long as necessary."
 *
 * This module:
 * - Purges call recording audio (blobUrl) after standard retention (90 days)
 * - Extends retention for litigation/dispute flagged calls (365 days)
 * - Extends retention for training-flagged calls (1095 days / 3 years)
 * - Purges voicemail audio (blobUrl) after standard retention
 * - Clears transcription full text after retention, keeping summary/sentiment/keywords
 * - Should be invoked nightly via a cron job or scheduled task
 */

import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RetentionPolicy {
  /** Default retention in days */
  standardDays: number;
  /** Flagged for litigation/dispute — extended retention */
  litigationDays: number;
  /** Marked for training purposes — longest retention */
  trainingDays: number;
}

export interface PurgeResult {
  /** Number of recordings whose audio was purged */
  purgedRecordings: number;
  /** Number of recordings kept due to flags or not yet expired */
  keptRecordings: number;
  /** Number of voicemails whose audio was purged */
  purgedVoicemails: number;
  /** Number of transcription full texts cleared */
  purgedTranscriptions: number;
  /** Number of errors encountered during purge */
  errors: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_POLICY: RetentionPolicy = {
  standardDays: 90,
  litigationDays: 365,
  trainingDays: 1095, // 3 years
};

const LITIGATION_TAGS = ['litigation', 'dispute', 'litige'];
const TRAINING_TAGS = ['training', 'formation'];

// ---------------------------------------------------------------------------
// Core purge function
// ---------------------------------------------------------------------------

/**
 * Run the recording retention cleanup.
 * Should be called by a nightly cron job.
 *
 * Purges:
 * 1. Call recording audio (blobUrl) past retention period
 * 2. Voicemail audio (blobUrl) past standard retention
 * 3. Transcription full text past standard retention (keeps summary/sentiment/keywords)
 *
 * Does NOT delete database rows — only nullifies audio URLs and full text.
 * Metadata (duration, format, sentiment, keywords) is preserved for analytics.
 */
export async function purgeExpiredRecordings(
  policy: RetentionPolicy = DEFAULT_POLICY
): Promise<PurgeResult> {
  let purgedRecordings = 0;
  let keptRecordings = 0;
  let purgedVoicemails = 0;
  let purgedTranscriptions = 0;
  let errors = 0;

  try {
    const now = new Date();
    const standardCutoff = new Date(now.getTime() - policy.standardDays * 24 * 60 * 60 * 1000);
    const litigationCutoff = new Date(now.getTime() - policy.litigationDays * 24 * 60 * 60 * 1000);
    const trainingCutoff = new Date(now.getTime() - policy.trainingDays * 24 * 60 * 60 * 1000);

    // ----- Phase 1: Call Recordings -----
    // Find recordings older than standard cutoff that still have audio
    const recordings = await prisma.callRecording.findMany({
      where: {
        createdAt: { lt: standardCutoff },
        blobUrl: { not: null },
      },
      select: {
        id: true,
        createdAt: true,
        blobUrl: true,
        callLog: {
          select: {
            id: true,
            tags: true,
            metadata: true,
          },
        },
      },
      take: 1000, // Process in batches
    });

    for (const recording of recordings) {
      try {
        const tags = recording.callLog?.tags || [];
        const metadata = (recording.callLog?.metadata as Record<string, unknown>) || {};

        // Check litigation flag
        const isLitigation =
          tags.some(t => LITIGATION_TAGS.includes(t.toLowerCase())) ||
          metadata.retentionFlag === 'litigation';

        if (isLitigation && recording.createdAt > litigationCutoff) {
          keptRecordings++;
          continue;
        }

        // Check training flag
        const isTraining =
          tags.some(t => TRAINING_TAGS.includes(t.toLowerCase())) ||
          metadata.retentionFlag === 'training';

        if (isTraining && recording.createdAt > trainingCutoff) {
          keptRecordings++;
          continue;
        }

        // Purge: nullify the blob URL (keep metadata for stats)
        await prisma.callRecording.update({
          where: { id: recording.id },
          data: {
            blobUrl: null,
            localPath: null,
            isUploaded: false,
          },
        });

        purgedRecordings++;
      } catch (err) {
        errors++;
        logger.warn('[RecordingRetention] Failed to purge recording', {
          recordingId: recording.id,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    // ----- Phase 2: Voicemail Audio -----
    // Purge voicemail audio past standard retention (keep transcription text)
    const voicemailResult = await prisma.voicemail.updateMany({
      where: {
        createdAt: { lt: standardCutoff },
        blobUrl: { not: null },
      },
      data: {
        blobUrl: null,
        localPath: null,
      },
    });
    purgedVoicemails = voicemailResult.count;

    // ----- Phase 3: Transcription Full Text -----
    // Clear full text but keep summary, sentiment, keywords for analytics.
    // Note: fullText is a required String field, so we set it to empty string.
    const transcriptionResult = await prisma.callTranscription.updateMany({
      where: {
        createdAt: { lt: standardCutoff },
        fullText: { not: '' },
      },
      data: {
        fullText: '', // Required field — cannot be null, use empty string
      },
    });
    purgedTranscriptions = transcriptionResult.count;

    logger.info('[RecordingRetention] Purge complete', {
      purgedRecordings,
      keptRecordings,
      purgedVoicemails,
      purgedTranscriptions,
      errors,
      policy,
    });

    return { purgedRecordings, keptRecordings, purgedVoicemails, purgedTranscriptions, errors };
  } catch (error) {
    logger.error('[RecordingRetention] Purge failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return { purgedRecordings, keptRecordings, purgedVoicemails, purgedTranscriptions, errors: errors + 1 };
  }
}

// ---------------------------------------------------------------------------
// Flag management
// ---------------------------------------------------------------------------

/**
 * Flag a call log for extended retention.
 *
 * @param callLogId - The call log ID to flag
 * @param flag - 'litigation' (365 days), 'training' (1095 days), or 'standard' (90 days, removes flag)
 */
export async function flagRecordingRetention(
  callLogId: string,
  flag: 'litigation' | 'training' | 'standard'
): Promise<void> {
  const callLog = await prisma.callLog.findUnique({
    where: { id: callLogId },
    select: { metadata: true, tags: true },
  });

  if (!callLog) {
    throw new Error(`CallLog ${callLogId} not found`);
  }

  const existingMeta = (callLog.metadata as Record<string, unknown>) || {};
  const existingTags = callLog.tags || [];

  // Remove old retention tags
  const cleanedTags = existingTags.filter(
    t => !LITIGATION_TAGS.includes(t.toLowerCase()) && !TRAINING_TAGS.includes(t.toLowerCase())
  );

  // Add new tag if not standard
  if (flag === 'litigation') {
    cleanedTags.push('litigation');
  } else if (flag === 'training') {
    cleanedTags.push('training');
  }

  await prisma.callLog.update({
    where: { id: callLogId },
    data: {
      metadata: {
        ...existingMeta,
        retentionFlag: flag === 'standard' ? null : flag,
        retentionFlaggedAt: flag === 'standard' ? null : new Date().toISOString(),
      },
      tags: cleanedTags,
    },
  });

  logger.info('[RecordingRetention] Recording retention flagged', { callLogId, flag });
}

// ---------------------------------------------------------------------------
// Statistics
// ---------------------------------------------------------------------------

/**
 * Get retention statistics — useful for admin dashboard and compliance reports.
 */
export async function getRetentionStats(
  policy: RetentionPolicy = DEFAULT_POLICY
): Promise<{
  totalRecordings: number;
  recordingsWithAudio: number;
  eligibleForPurge: number;
  flaggedLitigation: number;
  flaggedTraining: number;
  totalVoicemails: number;
  voicemailsWithAudio: number;
  voicemailsEligibleForPurge: number;
  oldestRecordingDate: string | null;
  retentionPolicy: RetentionPolicy;
}> {
  const now = new Date();
  const standardCutoff = new Date(now.getTime() - policy.standardDays * 24 * 60 * 60 * 1000);

  const [
    totalRecordings,
    recordingsWithAudio,
    eligibleForPurge,
    oldest,
    totalVoicemails,
    voicemailsWithAudio,
    voicemailsEligibleForPurge,
  ] = await Promise.all([
    prisma.callRecording.count(),
    prisma.callRecording.count({ where: { blobUrl: { not: null } } }),
    prisma.callRecording.count({
      where: {
        createdAt: { lt: standardCutoff },
        blobUrl: { not: null },
      },
    }),
    prisma.callRecording.findFirst({
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true },
    }),
    prisma.voicemail.count(),
    prisma.voicemail.count({ where: { blobUrl: { not: null } } }),
    prisma.voicemail.count({
      where: {
        createdAt: { lt: standardCutoff },
        blobUrl: { not: null },
      },
    }),
  ]);

  // Count flagged recordings via call log tags
  // These are approximate — uses tag-based detection
  const [flaggedLitigation, flaggedTraining] = await Promise.all([
    prisma.callLog.count({
      where: {
        tags: { hasSome: LITIGATION_TAGS },
        recording: { isNot: null },
      },
    }),
    prisma.callLog.count({
      where: {
        tags: { hasSome: TRAINING_TAGS },
        recording: { isNot: null },
      },
    }),
  ]);

  return {
    totalRecordings,
    recordingsWithAudio,
    eligibleForPurge,
    flaggedLitigation,
    flaggedTraining,
    totalVoicemails,
    voicemailsWithAudio,
    voicemailsEligibleForPurge,
    oldestRecordingDate: oldest?.createdAt.toISOString() || null,
    retentionPolicy: policy,
  };
}
