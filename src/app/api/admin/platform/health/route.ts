/**
 * API: /api/admin/platform/health
 * Super-admin only — Batch health scores for all tenants.
 * GET: Returns health scores keyed by tenantId.
 */

export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { withAdminGuard } from '@/lib/admin-api-guard';
import { logger } from '@/lib/logger';
import { computeHealthScoresBatch, type TenantHealth } from '@/lib/tenant-health';

function isSuperAdmin(session: { user: { role?: string; tenantId?: string } }): boolean {
  return session.user.role === 'OWNER' && session.user.tenantId === process.env.PLATFORM_TENANT_ID;
}

export const GET = withAdminGuard(async (_request, { session }) => {
  if (!isSuperAdmin(session)) {
    return NextResponse.json({ error: 'Super-admin access required' }, { status: 403 });
  }

  try {
    const healthMap = await computeHealthScoresBatch();

    // Convert Map to plain object for JSON serialization
    const scores: Record<string, TenantHealth> = {};
    for (const [id, health] of healthMap) {
      scores[id] = health;
    }

    // Count at-risk clients
    const atRisk = Object.values(scores).filter(h => h.score < 40).length;

    return NextResponse.json({ scores, atRisk });
  } catch (error) {
    logger.error('Failed to compute batch health scores', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}, { skipCsrf: true });
