export const dynamic = 'force-dynamic';

/**
 * G28 — Social Media Scheduler Cron
 * POST - Process all scheduled social posts that are due for publication
 *
 * This cron endpoint can be called by:
 *   - Railway/Vercel cron (with CRON_SECRET Bearer token)
 *   - Admin manually (with valid admin session)
 *
 * Security: Timing-safe comparison for CRON_SECRET to prevent timing attacks.
 */

import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { auth } from '@/lib/auth-config';
import { processScheduledPosts } from '@/lib/social/social-scheduler-cron';
import { logger } from '@/lib/logger';

/** Timing-safe comparison to prevent timing attacks on cron secret. */
function timingSafeSecretMatch(provided: string, expected: string): boolean {
  try {
    const a = Buffer.from(expected, 'utf8');
    const b = Buffer.from(provided, 'utf8');
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  // Allow cron secret OR admin session
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization') || '';
  const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  const isCronAuth = !!cronSecret && !!bearerToken && timingSafeSecretMatch(bearerToken, cronSecret);

  if (!isCronAuth) {
    const session = await auth();
    if (!session?.user?.id || !['OWNER', 'EMPLOYEE'].includes(session.user.role)) {
      logger.warn('[Cron/PublishSocial] Unauthorized request', {
        event: 'cron_auth_denied',
        hasCronHeader: !!bearerToken,
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const result = await processScheduledPosts();

    logger.info('[Cron/PublishSocial] Completed', {
      processed: result.processed,
      succeeded: result.succeeded,
      failed: result.failed,
    });

    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('[Cron/PublishSocial] Fatal error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: 'Cron processing failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
