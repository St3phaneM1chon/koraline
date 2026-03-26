/**
 * API: /api/admin/platform/clients/[id]/onboarding
 * Super-admin only — Compute and return onboarding status.
 * GET: Returns onboarding steps + progress.
 */

export const dynamic = 'force-dynamic';

import { NextResponse, type NextRequest } from 'next/server';
import { withAdminGuard } from '@/lib/admin-api-guard';
import { logger } from '@/lib/logger';
import { computeOnboardingStatus } from '@/lib/tenant-onboarding';

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
    const status = await computeOnboardingStatus(tenantId);
    return NextResponse.json(status);
  } catch (error) {
    logger.error('Failed to compute onboarding status', {
      tenantId,
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}, { skipCsrf: true });
