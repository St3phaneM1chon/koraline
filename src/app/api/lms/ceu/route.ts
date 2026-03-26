export const dynamic = 'force-dynamic';

/**
 * #21 CEU Tracking API
 * GET /api/lms/ceu — Get CEU summary for current user
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { getCEUSummary } from '@/lib/lms/ceu-tracking';
import { logger } from '@/lib/logger';

export async function GET(_request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const summary = await getCEUSummary(session.user.id);
    return NextResponse.json({ data: summary });
  } catch (error) {
    logger.error('[ceu] API error:', error);
    return NextResponse.json({ error: 'Failed to fetch CEU summary' }, { status: 500 });
  }
}
