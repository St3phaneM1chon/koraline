export const dynamic = 'force-dynamic';

/**
 * Call Supervision API
 *
 * POST /api/admin/voip/supervision
 *   Body: { agentCallControlId, mode, supervisorPhone? }
 *   Starts a supervision session on an active agent call.
 *   Returns: { sessionId, conferenceId, mode }
 *
 * GET /api/admin/voip/supervision
 *   Lists all active supervision sessions.
 *   Returns: SupervisionSession[]
 *
 * Authentication: Admin guard (EMPLOYEE | OWNER).
 * CSRF: Required for POST (mutation).
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAdminGuard } from '@/lib/admin-api-guard';
import { apiSuccess, apiError } from '@/lib/api-response';
import { ErrorCode } from '@/lib/error-codes';
import { logger } from '@/lib/logger';
import {
  startMonitoring,
  getActiveSupervisions,
} from '@/lib/voip/call-supervision';
import { LiveSentimentAnalyzer, type SentimentResult } from '@/lib/voip/live-sentiment';

// ---------------------------------------------------------------------------
// Validation schema
// ---------------------------------------------------------------------------

const startSupervisionSchema = z.object({
  agentCallControlId: z.string().min(1, 'agentCallControlId is required'),
  mode: z.enum(['monitor', 'whisper', 'barge']),
});

// ---------------------------------------------------------------------------
// POST: Start supervision
// ---------------------------------------------------------------------------

export const POST = withAdminGuard(async (
  request: NextRequest,
  { session }: { session: { user: { id: string } } }
) => {
  try {
    const body = await request.json();
    const parsed = startSupervisionSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(
        'Invalid supervision parameters',
        ErrorCode.VALIDATION_ERROR,
        { request, status: 400 }
      );
    }

    const { agentCallControlId, mode } = parsed.data;
    const supervisorId = session.user.id;

    logger.info('[supervision] Starting supervision session', {
      supervisorId,
      agentCallControlId,
      mode,
    });

    const result = await startMonitoring(supervisorId, agentCallControlId, mode);

    if (!result.success) {
      return apiError(
        result.error || 'Failed to start supervision',
        ErrorCode.INTERNAL_ERROR,
        { request, status: 400 }
      );
    }

    return apiSuccess(
      {
        sessionId: result.sessionId,
        agentCallControlId,
        mode,
        supervisorId,
        startedAt: new Date().toISOString(),
      },
      { request, status: 201 }
    );
  } catch (error) {
    logger.error('[supervision] POST error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return apiError('Failed to start supervision', ErrorCode.INTERNAL_ERROR, { request });
  }
});

// ---------------------------------------------------------------------------
// GET: List active supervision sessions
// ---------------------------------------------------------------------------

export const GET = withAdminGuard(async (request: NextRequest) => {
  try {
    const sessions = getActiveSupervisions();

    return apiSuccess(
      {
        sessions,
        total: sessions.length,
      },
      { request }
    );
  } catch (error) {
    logger.error('[supervision] GET error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return apiError('Failed to list supervision sessions', ErrorCode.INTERNAL_ERROR, { request });
  }
}, { skipCsrf: true });

// ---------------------------------------------------------------------------
// Validation schema for sentiment analysis
// ---------------------------------------------------------------------------

const sentimentSchema = z.object({
  text: z.string().min(1, 'text is required'),
});

// ---------------------------------------------------------------------------
// PUT: Analyze live sentiment for a supervision session
// ---------------------------------------------------------------------------

export const PUT = withAdminGuard(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const parsed = sentimentSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(
        'Invalid sentiment parameters',
        ErrorCode.VALIDATION_ERROR,
        { request, status: 400 }
      );
    }

    const { text } = parsed.data;

    const analyzer = new LiveSentimentAnalyzer();
    await analyzer.feedText(text);

    const overall = analyzer.getOverallSentiment();
    const timeline: SentimentResult[] = analyzer.getTimeline();

    return apiSuccess(
      {
        overall,
        timeline,
        analyzedAt: new Date().toISOString(),
      },
      { request }
    );
  } catch (error) {
    logger.error('[supervision] PUT sentiment error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return apiError('Sentiment analysis failed', ErrorCode.INTERNAL_ERROR, { request });
  }
});
