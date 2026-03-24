/**
 * API: POST /api/admin/platform/impersonate
 * Super-admin impersonation — temporarily become a tenant owner for support.
 *
 * C1-SEC-S-052 FIX: Verify super-admin via DB (tenantId in session) instead of spoofable header.
 * Audit-logged for security.
 */

export const dynamic = 'force-dynamic';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth-config';
import { logger } from '@/lib/logger';
import { UserRole } from '@/types';

const impersonateSchema = z.object({
  tenantId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // C1-SEC-S-052 FIX: Verify super-admin via actual tenant ownership in DB
  // The user must belong to the "attitudes" tenant AND be an OWNER
  const userTenantId = session.user.tenantId;
  if (!userTenantId) {
    return NextResponse.json({ error: 'No tenant context' }, { status: 403 });
  }

  const userTenant = await prisma.tenant.findUnique({
    where: { id: userTenantId },
    select: { slug: true },
  });

  if (userTenant?.slug !== 'attitudes' || session.user.role !== UserRole.OWNER) {
    logger.warn('Unauthorized impersonation attempt', {
      userId: session.user.id,
      tenantSlug: userTenant?.slug,
      role: session.user.role,
    });
    return NextResponse.json({ error: 'Super-admin access required' }, { status: 403 });
  }

  // Validate body
  const body = await request.json();
  const parsed = impersonateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'tenantId requis' }, { status: 400 });
  }

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: parsed.data.tenantId },
      select: { id: true, slug: true, ownerUserId: true, domainKoraline: true },
    });

    if (!tenant || !tenant.ownerUserId) {
      return NextResponse.json({ error: 'Tenant ou propriétaire introuvable' }, { status: 404 });
    }

    // Audit log the impersonation
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'IMPERSONATE_TENANT',
        entityType: 'Tenant',
        entityId: parsed.data.tenantId,
        details: JSON.stringify({
          impersonatedTenantSlug: tenant.slug,
          impersonatedOwnerId: tenant.ownerUserId,
          superAdminEmail: session.user.email,
          expiresAt: new Date(Date.now() + 3600000).toISOString(),
        }),
      },
    });

    logger.warn('Super-admin impersonation', {
      superAdmin: session.user.email,
      tenantSlug: tenant.slug,
      tenantId: parsed.data.tenantId,
    });

    const url = `https://${tenant.domainKoraline || tenant.slug + '.koraline.app'}/admin`;

    return NextResponse.json({
      url,
      tenantSlug: tenant.slug,
      message: 'Session d\'impersonation créée (1h)',
    });
  } catch (error) {
    logger.error('Impersonation failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
