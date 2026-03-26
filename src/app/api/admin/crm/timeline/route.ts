export const dynamic = 'force-dynamic';

/**
 * #33 Activity Timeline API
 * GET /api/admin/crm/timeline?contactId=xxx
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAdminGuard } from '@/lib/admin-api-guard';
import { getContactTimeline } from '@/lib/crm/activity-timeline';
import { logger } from '@/lib/logger';

async function handler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contactId = searchParams.get('contactId');

    if (!contactId) {
      return NextResponse.json({ error: 'contactId is required' }, { status: 400 });
    }

    const timeline = await getContactTimeline(contactId);
    return NextResponse.json({ data: { events: timeline } });
  } catch (error) {
    logger.error('[timeline] API error:', error);
    return NextResponse.json({ error: 'Failed to fetch timeline' }, { status: 500 });
  }
}

export const GET = withAdminGuard(handler);
