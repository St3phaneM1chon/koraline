/**
 * Call Recording Upload Service
 * Handles uploading call recordings from PBX local storage to Azure Blob Storage.
 * Processes pending recordings and updates CallRecording records.
 */

import { prisma } from '@/lib/db';
import { StorageService } from '@/lib/storage';
import { logger } from '@/lib/logger';

const storage = new StorageService();
const RECORDINGS_FOLDER = 'call-recordings';

// VOIP-F13 FIX: Allowed audio/video formats and maximum file size for recordings
const ALLOWED_FORMATS = new Set(['wav', 'mp3', 'ogg', 'mp4', 'webm']);
const MAX_RECORDING_SIZE_BYTES = 500 * 1024 * 1024; // 500 MB

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RecordingUploadResult {
  id: string;
  callLogId: string;
  blobUrl: string;
  fileSize: number;
}

// ---------------------------------------------------------------------------
// Upload Service
// ---------------------------------------------------------------------------

/**
 * Process a single recording: fetch from PBX, upload to Azure Blob, update DB.
 */
export async function uploadRecording(
  recordingId: string
): Promise<RecordingUploadResult | null> {
  const recording = await prisma.callRecording.findUnique({
    where: { id: recordingId },
    include: {
      callLog: { select: { id: true, startedAt: true, callerNumber: true } },
    },
  });

  if (!recording) {
    logger.warn(`[Recording] Recording ${recordingId} not found`);
    return null;
  }

  if (recording.isUploaded && recording.blobUrl) {
    logger.debug(`[Recording] ${recordingId} already uploaded`);
    return {
      id: recording.id,
      callLogId: recording.callLogId!,
      blobUrl: recording.blobUrl,
      fileSize: recording.fileSize || 0,
    };
  }

  if (!recording.callLogId) {
    logger.warn(`[Recording] ${recordingId} has no callLogId`);
    return null;
  }

  if (!recording.localPath) {
    logger.warn(`[Recording] ${recordingId} has no local path`);
    return null;
  }

  try {
    // Fetch recording from PBX server via HTTP
    const pbxConnection = await prisma.voipConnection.findFirst({
      where: { provider: 'fusionpbx', isEnabled: true },
    });

    if (!pbxConnection?.pbxHost) {
      logger.error('[Recording] No FusionPBX connection configured');
      return null;
    }

    // VOIP-F13 FIX: Validate recording format before fetching
    if (!ALLOWED_FORMATS.has(recording.format)) {
      logger.error(`[Recording] Invalid format "${recording.format}" for ${recordingId}`);
      return null;
    }

    const recordingUrl = `https://${pbxConnection.pbxHost}/recordings/${recording.localPath}`;
    const response = await fetch(recordingUrl);

    if (!response.ok) {
      logger.error(`[Recording] Failed to fetch from PBX: ${response.status}`);
      return null;
    }

    // VOIP-F13 FIX: Validate content-type from PBX response
    const responseContentType = response.headers.get('content-type') || '';
    const validContentTypes = ['audio/', 'video/', 'application/octet-stream'];
    if (!validContentTypes.some(t => responseContentType.startsWith(t))) {
      logger.error(`[Recording] Unexpected content-type "${responseContentType}" for ${recordingId}`);
      return null;
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    // VOIP-F13 FIX: Validate file size
    if (buffer.length > MAX_RECORDING_SIZE_BYTES) {
      logger.error(`[Recording] File too large (${buffer.length} bytes) for ${recordingId}`);
      return null;
    }

    if (buffer.length === 0) {
      logger.error(`[Recording] Empty file for ${recordingId}`);
      return null;
    }

    const filename = `call-${recording.callLogId}-${Date.now()}.${recording.format}`;
    const contentType = recording.format === 'mp3' ? 'audio/mpeg' : 'audio/wav';

    const result = await storage.upload(buffer, filename, contentType, {
      folder: RECORDINGS_FOLDER,
    });

    // Update DB
    await prisma.callRecording.update({
      where: { id: recordingId },
      data: {
        blobUrl: result.url,
        fileSize: result.size,
        isUploaded: true,
      },
    });

    logger.info(`[Recording] Uploaded ${recordingId} → ${result.url}`);

    return {
      id: recording.id,
      callLogId: recording.callLogId!,
      blobUrl: result.url,
      fileSize: result.size,
    };
  } catch (error) {
    logger.error(`[Recording] Upload failed for ${recordingId}`, {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Process all pending recordings (not yet uploaded).
 * Called by cron or after CDR ingest.
 */
export async function processPendingRecordings(
  limit: number = 10
): Promise<number> {
  const pending = await prisma.callRecording.findMany({
    where: {
      isUploaded: false,
      localPath: { not: null },
    },
    select: { id: true },
    take: limit,
    orderBy: { createdAt: 'asc' },
  });

  let uploaded = 0;
  for (const rec of pending) {
    const result = await uploadRecording(rec.id);
    if (result) uploaded++;
  }

  if (uploaded > 0) {
    logger.info(`[Recording] Processed ${uploaded}/${pending.length} pending recordings`);
  }

  return uploaded;
}

/**
 * Get a streaming URL for a recording (Azure SAS or local path).
 */
export async function getRecordingStreamUrl(
  recordingId: string
): Promise<string | null> {
  const recording = await prisma.callRecording.findUnique({
    where: { id: recordingId },
    select: { blobUrl: true, localPath: true, isUploaded: true },
  });

  if (!recording) return null;

  if (recording.isUploaded && recording.blobUrl) {
    return recording.blobUrl;
  }

  return null;
}

/**
 * Delete a recording from storage and DB.
 */
export async function deleteRecording(recordingId: string): Promise<void> {
  const recording = await prisma.callRecording.findUnique({
    where: { id: recordingId },
    select: { id: true, blobUrl: true },
  });

  if (!recording) return;

  if (recording.blobUrl) {
    try {
      await storage.delete(recording.blobUrl);
    } catch (error) {
      logger.warn(`[Recording] Failed to delete blob for ${recordingId}`, {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  await prisma.callRecording.delete({ where: { id: recordingId } });
}
