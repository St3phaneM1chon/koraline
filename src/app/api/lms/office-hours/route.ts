export const dynamic = 'force-dynamic';

/**
 * #19 Aurelia Office Hours API
 * GET /api/lms/office-hours?courseId=xxx&cohortId=yyy
 * Returns scheduled Q&A sessions.
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');

    if (!courseId) {
      return NextResponse.json({ error: 'courseId required' }, { status: 400 });
    }

    // Sessions would be stored in DB — return empty for now
    // until the OfficeHoursSession model is added to schema
    return NextResponse.json({
      data: {
        sessions: [],
        courseId,
      },
    });
  } catch (error) {
    logger.error('[office-hours] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }
}
