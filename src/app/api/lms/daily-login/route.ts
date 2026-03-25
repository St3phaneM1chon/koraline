export const dynamic = 'force-dynamic';

/**
 * POST /api/lms/daily-login — Award daily login XP
 *
 * P7-12 finding: daily_login XP type was defined in xp-service but never triggered.
 * This endpoint allows the client to claim daily login XP once per calendar day.
 * Uses date-based sourceId for deduplication: daily_login_{userId}_{YYYY-MM-DD}
 *
 * SEC-HARDENING: Wrapped with withUserGuard for centralized auth + CSRF + rate limiting.
 */
import { NextRequest, NextResponse } from 'next/server';
import { withUserGuard } from '@/lib/user-api-guard';
import { awardXp } from '@/lib/lms/xp-service';
import { logger } from '@/lib/logger';

export const POST = withUserGuard(async (_request: NextRequest, { session }) => {
  const tenantId = session.user.tenantId;
  if (!tenantId) {
    return NextResponse.json({ error: 'No tenant context' }, { status: 403 });
  }

  const userId = session.user.id;
  if (!userId) {
    return NextResponse.json({ error: 'User ID missing' }, { status: 401 });
  }

  try {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const sourceId = `daily_login_${userId}_${today}`;

    const result = await awardXp(tenantId, userId, 'daily_login', sourceId);

    // result.amount === 0 means dedup hit (already claimed today)
    return NextResponse.json({
      awarded: result.amount > 0,
      xp: result.amount,
      newBalance: result.newBalance,
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error('Daily login XP award failed', { userId, error: errorMsg });
    return NextResponse.json({ error: 'Failed to award daily login XP' }, { status: 500 });
  }
}, { rateLimit: 10 });
