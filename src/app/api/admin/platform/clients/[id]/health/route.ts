/**
 * API: /api/admin/platform/clients/[id]/health
 * Super-admin only — Compute and return health score.
 * GET: Returns health score, grade, and signal breakdown.
 */

export const dynamic = 'force-dynamic';

import { NextResponse, type NextRequest } from 'next/server';
import { withAdminGuard } from '@/lib/admin-api-guard';
import { logger } from '@/lib/logger';
import { computeHealthScore } from '@/lib/tenant-health';

function isSuperAdmin(session: { user: { role?: string; tenantId?: string } }): boolean {
  return session.user.role === 'OWNER' && session.user.tenantId === process.env.PLATFORM_TENANT_ID;
}

export const GET = withAdminGuard(async (_request: NextRequest, { session, params }) => {
  if (!isSuperAdmin(session)) {
    return NextResponse.json({ error: 'Super-admin access required' }, { status: 403 });
  }

  const tenantId = params?.id;
  if (!tenantId) {
    return NextResponse.json({ error: 'Missing tenant ID' }, { status: 400 });
  }

  try {
    const health = await computeHealthScore(tenantId);
    return NextResponse.json(health);
  } catch (error) {
    logger.error('Failed to compute health score', {
      tenantId,
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}, { skipCsrf: true });
