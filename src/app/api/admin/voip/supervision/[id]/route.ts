export const dynamic = 'force-dynamic';

/**
 * Single Supervision Session API
 *
 * PATCH /api/admin/voip/supervision/[id]
 *   Body: { mode: 'monitor' | 'whisper' | 'barge' }
 *   Change the supervision mode on the fly.
 *
 * DELETE /api/admin/voip/supervision/[id]
 *   End the supervision session (hangs up supervisor's call).
 *
 * Authentication: Admin guard (EMPLOYEE | OWNER).
 * CSRF: Required for PATCH and DELETE (mutations).
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAdminGuard } from '@/lib/admin-api-guard';
import { apiSuccess, apiError, apiNoContent } from '@/lib/api-response';
import { ErrorCode } from '@/lib/error-codes';
import { logger } from '@/lib/logger';
import {
  changeSupervisorMode,
  endSupervision,
  getSupervisionSession,
} from '@/lib/voip/call-supervision';

// ---------------------------------------------------------------------------
// Validation schema
// ---------------------------------------------------------------------------

const changeModeSchema = z.object({
  mode: z.enum(['monitor', 'whisper', 'barge']),
});

// ---------------------------------------------------------------------------
// PATCH: Change supervision mode
// ---------------------------------------------------------------------------

export const PATCH = withAdminGuard(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const sessionId = params?.id;
    if (!sessionId) {
      return apiError('Session ID is required', ErrorCode.VALIDATION_ERROR, {
        request,
        status: 400,
      });
    }

    // Verify session exists
    const existing = getSupervisionSession(sessionId);
    if (!existing) {
      return apiError('Supervision session not found', ErrorCode.NOT_FOUND, {
        request,
        status: 404,
      });
    }

    const body = await request.json();
    const parsed = changeModeSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(
        'Invalid mode',
        ErrorCode.VALIDATION_ERROR,
        { request, details: parsed.error.flatten(), status: 400 }
      );
    }

    const { mode } = parsed.data;

    logger.info('[supervision/[id]] Changing mode', { sessionId, newMode: mode });

    const result = await changeSupervisorMode(sessionId, mode);

    if (!result.success) {
      return apiError(
        result.error || 'Failed to change supervision mode',
        ErrorCode.INTERNAL_ERROR,
        { request, status: 400 }
      );
    }

    return apiSuccess(
      {
        sessionId,
        mode,
        updatedAt: new Date().toISOString(),
      },
      { request }
    );
  } catch (error) {
    logger.error('[supervision/[id]] PATCH error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return apiError('Failed to change supervision mode', ErrorCode.INTERNAL_ERROR, { request });
  }
});

// ---------------------------------------------------------------------------
// DELETE: End supervision session
// ---------------------------------------------------------------------------

export const DELETE = withAdminGuard(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const sessionId = params?.id;
    if (!sessionId) {
      return apiError('Session ID is required', ErrorCode.VALIDATION_ERROR, {
        request,
        status: 400,
      });
    }

    // Verify session exists before ending
    const existing = getSupervisionSession(sessionId);
    if (!existing) {
      return apiError('Supervision session not found', ErrorCode.NOT_FOUND, {
        request,
        status: 404,
      });
    }

    logger.info('[supervision/[id]] Ending session', {
      sessionId,
      supervisorId: existing.supervisorId,
    });

    await endSupervision(sessionId);

    return apiNoContent({ request });
  } catch (error) {
    logger.error('[supervision/[id]] DELETE error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return apiError('Failed to end supervision session', ErrorCode.INTERNAL_ERROR, { request });
  }
});
