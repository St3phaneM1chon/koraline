/**
 * CRM Screen Recording + Playback - F10
 *
 * Server-side metadata and storage management for agent screen recordings
 * during calls. The actual screen capture uses browser MediaRecorder API
 * on the agent side, uploading chunks to Azure Blob Storage.
 * This module manages the lifecycle: start, stop, retrieve, list, delete,
 * and gather statistics.
 *
 * Functions:
 * - startScreenRecording: Initiate a screen recording session (store metadata)
 * - stopScreenRecording: End recording, finalize metadata
 * - getScreenRecording: Retrieve recording metadata + playback URL
 * - listScreenRecordings: Paginated list with filters
 * - deleteScreenRecording: Soft delete with retention policy check
 * - getScreenRecordingStats: Aggregate stats over a period
 */

import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ScreenRecordingSession {
  sessionId: string;
  callLogId: string;
  agentId: string;
  status: 'recording' | 'completed' | 'failed' | 'deleted';
  startedAt: string;
  stoppedAt: string | null;
  durationSec: number | null;
  blobUrl: string | null;
  thumbnailUrl: string | null;
  fileSizeBytes: number | null;
  format: string;
  resolution: string | null;
}

export interface ScreenRecordingFilters {
  agentId?: string;
  callLogId?: string;
  dateRange?: { start: Date; end: Date };
  status?: string;
  page?: number;
  pageSize?: number;
}

export interface ScreenRecordingStats {
  totalRecordings: number;
  completedRecordings: number;
  failedRecordings: number;
  totalStorageBytes: number;
  avgDurationSec: number;
  recordingsByDay: Array<{ date: string; count: number }>;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const METADATA_KEY = 'screenRecording';
const DEFAULT_FORMAT = 'webm';
const DEFAULT_PAGE_SIZE = 20;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseScreenMeta(metadata: unknown): Record<string, unknown> | null {
  if (!metadata || typeof metadata !== 'object') return null;
  const meta = metadata as Record<string, unknown>;
  const sr = meta[METADATA_KEY];
  if (!sr || typeof sr !== 'object') return null;
  return sr as Record<string, unknown>;
}

function generateSessionId(): string {
  return `scr_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

// ---------------------------------------------------------------------------
// startScreenRecording
// ---------------------------------------------------------------------------

/**
 * Initiate a screen recording session for an agent during a call.
 * Creates metadata on the CrmActivity so the recording lifecycle is tracked.
 *
 * @param agentId - The agent performing the call
 * @param callLogId - The call log this recording is associated with
 * @returns The new screen recording session metadata
 */
export async function startScreenRecording(
  agentId: string,
  callLogId: string,
): Promise<ScreenRecordingSession> {
  // Verify the call log exists
  const callLog = await prisma.callLog.findUnique({
    where: { id: callLogId },
    select: { id: true, agentId: true },
  });

  if (!callLog) {
    throw new Error(`CallLog ${callLogId} not found`);
  }

  const sessionId = generateSessionId();
  const now = new Date().toISOString();

  const sessionData: Record<string, unknown> = {
    sessionId,
    agentId,
    callLogId,
    status: 'recording',
    startedAt: now,
    stoppedAt: null,
    durationSec: null,
    blobUrl: null,
    thumbnailUrl: null,
    fileSizeBytes: null,
    format: DEFAULT_FORMAT,
    resolution: null,
  };

  // Store as a CRM activity with screen recording metadata
  await prisma.crmActivity.create({
    data: {
      type: 'NOTE',
      title: 'Screen Recording Started',
      description: `Screen recording session ${sessionId} for call ${callLogId}`,
      performedById: agentId,
      metadata: {
        [METADATA_KEY]: sessionData,
        source: 'screen_recording',
        callLogId,
      } as unknown as Prisma.InputJsonValue,
    },
  });

  logger.info('[screen-recording] Session started', {
    sessionId,
    agentId,
    callLogId,
  });

  return {
    sessionId,
    callLogId,
    agentId,
    status: 'recording',
    startedAt: now,
    stoppedAt: null,
    durationSec: null,
    blobUrl: null,
    thumbnailUrl: null,
    fileSizeBytes: null,
    format: DEFAULT_FORMAT,
    resolution: null,
  };
}

// ---------------------------------------------------------------------------
// stopScreenRecording
// ---------------------------------------------------------------------------

/**
 * End a screen recording session. Updates metadata with final duration,
 * blob URL, and file size once the agent-side upload completes.
 *
 * @param sessionId - The screen recording session ID
 * @param uploadData - Optional upload result data from the agent client
 * @returns The updated session metadata
 */
export async function stopScreenRecording(
  sessionId: string,
  uploadData?: {
    blobUrl?: string;
    thumbnailUrl?: string;
    fileSizeBytes?: number;
    resolution?: string;
    format?: string;
  },
): Promise<ScreenRecordingSession> {
  // Find the activity with this session
  const activity = await prisma.crmActivity.findFirst({
    where: {
      type: 'NOTE',
      metadata: {
        path: [METADATA_KEY, 'sessionId'],
        equals: sessionId,
      },
    },
  });

  if (!activity) {
    throw new Error(`Screen recording session ${sessionId} not found`);
  }

  const meta = activity.metadata as Record<string, unknown>;
  const existing = meta[METADATA_KEY] as Record<string, unknown>;

  const stoppedAt = new Date().toISOString();
  const startedAt = existing.startedAt as string;
  const durationSec = Math.round(
    (new Date(stoppedAt).getTime() - new Date(startedAt).getTime()) / 1000,
  );

  const updatedSession: Record<string, unknown> = {
    ...existing,
    status: 'completed',
    stoppedAt,
    durationSec,
    blobUrl: uploadData?.blobUrl ?? null,
    thumbnailUrl: uploadData?.thumbnailUrl ?? null,
    fileSizeBytes: uploadData?.fileSizeBytes ?? null,
    format: uploadData?.format ?? existing.format ?? DEFAULT_FORMAT,
    resolution: uploadData?.resolution ?? null,
  };

  await prisma.crmActivity.update({
    where: { id: activity.id },
    data: {
      title: 'Screen Recording Completed',
      description: `Screen recording session ${sessionId} completed (${durationSec}s)`,
      metadata: {
        ...meta,
        [METADATA_KEY]: updatedSession,
      } as unknown as Prisma.InputJsonValue,
    },
  });

  logger.info('[screen-recording] Session stopped', {
    sessionId,
    durationSec,
    blobUrl: uploadData?.blobUrl,
  });

  return {
    sessionId,
    callLogId: existing.callLogId as string,
    agentId: existing.agentId as string,
    status: 'completed',
    startedAt,
    stoppedAt,
    durationSec,
    blobUrl: uploadData?.blobUrl ?? null,
    thumbnailUrl: uploadData?.thumbnailUrl ?? null,
    fileSizeBytes: uploadData?.fileSizeBytes ?? null,
    format: updatedSession.format as string,
    resolution: uploadData?.resolution ?? null,
  };
}

// ---------------------------------------------------------------------------
// getScreenRecording
// ---------------------------------------------------------------------------

/**
 * Retrieve metadata and playback information for a screen recording session.
 *
 * @param sessionId - The screen recording session ID
 * @returns The session metadata or null if not found
 */
export async function getScreenRecording(
  sessionId: string,
): Promise<ScreenRecordingSession | null> {
  const activity = await prisma.crmActivity.findFirst({
    where: {
      type: 'NOTE',
      metadata: {
        path: [METADATA_KEY, 'sessionId'],
        equals: sessionId,
      },
    },
  });

  if (!activity) return null;

  const sr = parseScreenMeta(activity.metadata);
  if (!sr) return null;

  return {
    sessionId: sr.sessionId as string,
    callLogId: sr.callLogId as string,
    agentId: sr.agentId as string,
    status: sr.status as ScreenRecordingSession['status'],
    startedAt: sr.startedAt as string,
    stoppedAt: (sr.stoppedAt as string) ?? null,
    durationSec: (sr.durationSec as number) ?? null,
    blobUrl: (sr.blobUrl as string) ?? null,
    thumbnailUrl: (sr.thumbnailUrl as string) ?? null,
    fileSizeBytes: (sr.fileSizeBytes as number) ?? null,
    format: (sr.format as string) ?? DEFAULT_FORMAT,
    resolution: (sr.resolution as string) ?? null,
  };
}

// ---------------------------------------------------------------------------
// listScreenRecordings
// ---------------------------------------------------------------------------

/**
 * List screen recording sessions with pagination and filters.
 *
 * @param filters - Optional filters for agent, call, date range, and status
 * @returns Paginated list of screen recording sessions
 */
export async function listScreenRecordings(
  filters: ScreenRecordingFilters = {},
): Promise<{ recordings: ScreenRecordingSession[]; total: number; page: number; pageSize: number }> {
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? DEFAULT_PAGE_SIZE;
  const skip = (page - 1) * pageSize;

  const where: Prisma.CrmActivityWhereInput = {
    type: 'NOTE',
    metadata: { path: ['source'], equals: 'screen_recording' },
  };

  // Apply agent filter
  if (filters.agentId) {
    where.performedById = filters.agentId;
  }

  // Apply date range filter
  if (filters.dateRange) {
    where.createdAt = {
      gte: filters.dateRange.start,
      lte: filters.dateRange.end,
    };
  }

  const [activities, total] = await Promise.all([
    prisma.crmActivity.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.crmActivity.count({ where }),
  ]);

  const recordings: ScreenRecordingSession[] = [];

  for (const activity of activities) {
    const sr = parseScreenMeta(activity.metadata);
    if (!sr) continue;

    // Apply status filter client-side (JSON path filtering is limited)
    if (filters.status && sr.status !== filters.status) continue;

    // Apply callLogId filter client-side
    if (filters.callLogId && sr.callLogId !== filters.callLogId) continue;

    recordings.push({
      sessionId: sr.sessionId as string,
      callLogId: sr.callLogId as string,
      agentId: sr.agentId as string,
      status: sr.status as ScreenRecordingSession['status'],
      startedAt: sr.startedAt as string,
      stoppedAt: (sr.stoppedAt as string) ?? null,
      durationSec: (sr.durationSec as number) ?? null,
      blobUrl: (sr.blobUrl as string) ?? null,
      thumbnailUrl: (sr.thumbnailUrl as string) ?? null,
      fileSizeBytes: (sr.fileSizeBytes as number) ?? null,
      format: (sr.format as string) ?? DEFAULT_FORMAT,
      resolution: (sr.resolution as string) ?? null,
    });
  }

  return { recordings, total, page, pageSize };
}

// ---------------------------------------------------------------------------
// deleteScreenRecording
// ---------------------------------------------------------------------------

/**
 * Soft-delete a screen recording session. Marks the session as deleted
 * and checks retention policy before allowing deletion.
 *
 * @param sessionId - The screen recording session ID
 * @returns true if deleted, false if retention policy prevents deletion
 */
export async function deleteScreenRecording(sessionId: string): Promise<boolean> {
  // Check retention policy
  const policy = await prisma.dataRetentionPolicy.findFirst({
    where: { entityType: 'recording', isActive: true },
  });

  const activity = await prisma.crmActivity.findFirst({
    where: {
      type: 'NOTE',
      metadata: {
        path: [METADATA_KEY, 'sessionId'],
        equals: sessionId,
      },
    },
  });

  if (!activity) {
    throw new Error(`Screen recording session ${sessionId} not found`);
  }

  // Check if within retention period
  if (policy) {
    const createdAt = activity.createdAt;
    const retentionEnd = new Date(
      createdAt.getTime() + policy.retentionDays * 24 * 60 * 60 * 1000,
    );
    if (new Date() < retentionEnd) {
      logger.warn('[screen-recording] Deletion blocked by retention policy', {
        sessionId,
        retentionDays: policy.retentionDays,
        retentionEnd: retentionEnd.toISOString(),
      });
      return false;
    }
  }

  const meta = activity.metadata as Record<string, unknown>;
  const existing = meta[METADATA_KEY] as Record<string, unknown>;

  await prisma.crmActivity.update({
    where: { id: activity.id },
    data: {
      title: 'Screen Recording Deleted',
      metadata: {
        ...meta,
        [METADATA_KEY]: {
          ...existing,
          status: 'deleted',
          deletedAt: new Date().toISOString(),
        },
      } as unknown as Prisma.InputJsonValue,
    },
  });

  logger.info('[screen-recording] Session soft-deleted', { sessionId });
  return true;
}

// ---------------------------------------------------------------------------
// getScreenRecordingStats
// ---------------------------------------------------------------------------

/**
 * Get aggregate statistics for screen recordings over a time period.
 *
 * @param period - The date range to compute stats over
 * @returns Aggregate statistics including counts, storage, and daily breakdown
 */
export async function getScreenRecordingStats(
  period: { start: Date; end: Date },
): Promise<ScreenRecordingStats> {
  const activities = await prisma.crmActivity.findMany({
    where: {
      type: 'NOTE',
      metadata: { path: ['source'], equals: 'screen_recording' },
      createdAt: { gte: period.start, lte: period.end },
    },
    orderBy: { createdAt: 'asc' },
  });

  let totalRecordings = 0;
  let completedRecordings = 0;
  let failedRecordings = 0;
  let totalStorageBytes = 0;
  let totalDurationSec = 0;
  let durationCount = 0;
  const dailyCounts = new Map<string, number>();

  for (const activity of activities) {
    const sr = parseScreenMeta(activity.metadata);
    if (!sr) continue;

    totalRecordings++;
    const status = sr.status as string;

    if (status === 'completed') {
      completedRecordings++;
    } else if (status === 'failed') {
      failedRecordings++;
    }

    const fileSize = sr.fileSizeBytes as number | null;
    if (fileSize && fileSize > 0) {
      totalStorageBytes += fileSize;
    }

    const duration = sr.durationSec as number | null;
    if (duration && duration > 0) {
      totalDurationSec += duration;
      durationCount++;
    }

    // Daily breakdown
    const dateKey = activity.createdAt.toISOString().split('T')[0];
    dailyCounts.set(dateKey, (dailyCounts.get(dateKey) ?? 0) + 1);
  }

  const recordingsByDay = Array.from(dailyCounts.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    totalRecordings,
    completedRecordings,
    failedRecordings,
    totalStorageBytes,
    avgDurationSec: durationCount > 0 ? Math.round(totalDurationSec / durationCount) : 0,
    recordingsByDay,
  };
}
