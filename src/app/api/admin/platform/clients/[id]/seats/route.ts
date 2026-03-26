/**
 * API: /api/admin/platform/clients/[id]/seats
 * Super-admin only — Seat/license usage for a tenant.
 * GET: Returns seat usage broken down by role.
 */

export const dynamic = 'force-dynamic';

import { NextResponse, type NextRequest } from 'next/server';
import { withAdminGuard } from '@/lib/admin-api-guard';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

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
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, maxEmployees: true },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Count users grouped by role
    const roleCounts = await prisma.user.groupBy({
      by: ['role'],
      where: { tenantId },
      _count: { id: true },
    });

    const byRole: Record<string, number> = {};
    let total = 0;
    for (const rc of roleCounts) {
      byRole[rc.role] = rc._count.id;
      total += rc._count.id;
    }

    return NextResponse.json({
      total,
      max: tenant.maxEmployees,
      byRole,
      overLimit: total > tenant.maxEmployees,
    });
  } catch (error) {
    logger.error('Failed to fetch seats', {
      tenantId,
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}, { skipCsrf: true });
