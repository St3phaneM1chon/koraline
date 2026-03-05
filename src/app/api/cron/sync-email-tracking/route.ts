export const dynamic = 'force-dynamic';

/**
 * Cron: Sync email engagement events to CRM activities
 * Runs every 15 minutes to bridge email opens/clicks to CRM lead activities.
 */

import { NextRequest, NextResponse } from 'next/server';
import { syncEmailEngagementsToCrm } from '@/lib/crm/email-tracking';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const synced = await syncEmailEngagementsToCrm(15);
    return NextResponse.json({ success: true, synced });
  } catch (error) {
    logger.error('Cron sync-email-tracking error', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
