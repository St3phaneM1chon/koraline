/**
 * API: /api/platform/domain
 * Custom domain management for Koraline tenants.
 *
 * GET: Current domain config
 * PUT: Configure custom domain
 * DELETE: Remove custom domain
 */

export const dynamic = 'force-dynamic';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth-config';
import { logger } from '@/lib/logger';
import { validateCsrf } from '@/lib/csrf-middleware';
import dns from 'dns/promises';

const domainSchema = z.object({
  domain: z.string().min(4).max(253).regex(
    /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,}$/i,
    { message: 'Format de domaine invalide' }
  ).transform((val) => val.toLowerCase()),
});

async function getAuthenticatedOwner() {
  const session = await auth();
  if (!session?.user || session.user.role !== 'OWNER') return null;
  return session.user;
}

/**
 * GET — Current domain configuration.
 */
export async function GET() {
  const user = await getAuthenticatedOwner();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const tenant = await prisma.tenant.findFirst({
      where: { ownerUserId: user.id },
      select: { domainKoraline: true, domainCustom: true },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Check DNS if custom domain configured
    let dnsVerified = false;
    if (tenant.domainCustom) {
      try {
        const records = await dns.resolveCname(tenant.domainCustom);
        dnsVerified = records.some(r =>
          r.endsWith('.koraline.app') || r.endsWith('.attitudes.vip')
        );
      } catch {
        dnsVerified = false;
      }
    }

    return NextResponse.json({
      domainKoraline: tenant.domainKoraline,
      domainCustom: tenant.domainCustom,
      dnsVerified,
    });
  } catch (error) {
    logger.error('Failed to get domain config', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

/**
 * PUT — Configure custom domain.
 */
export async function PUT(request: NextRequest) {
  // CSRF validation
  const csrfValid = await validateCsrf(request);
  if (!csrfValid) {
    return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
  }

  const user = await getAuthenticatedOwner();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = domainSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const { domain } = parsed.data;

    // Check not already used by another tenant
    const existing = await prisma.tenant.findFirst({
      where: { domainCustom: domain },
    });
    if (existing && existing.ownerUserId !== user.id) {
      return NextResponse.json({ error: 'Ce domaine est déjà utilisé' }, { status: 409 });
    }

    const tenant = await prisma.tenant.findFirst({
      where: { ownerUserId: user.id },
      select: { id: true, slug: true, domainKoraline: true },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Verify DNS CNAME points to koraline subdomain
    let dnsVerified = false;
    try {
      const records = await dns.resolveCname(domain);
      dnsVerified = records.some(r =>
        r === tenant.domainKoraline || r.endsWith('.koraline.app') || r.endsWith('.attitudes.vip')
      );
    } catch {
      // DNS not configured yet — save domain anyway
    }

    await prisma.tenant.update({
      where: { id: tenant.id },
      data: { domainCustom: domain },
    });

    logger.info('Custom domain configured', { tenantId: tenant.id, domain, dnsVerified });

    return NextResponse.json({
      domain: domain,
      dnsVerified,
      cnameTarget: tenant.domainKoraline || `${tenant.slug}.koraline.app`,
      message: dnsVerified
        ? 'Domaine configuré et DNS vérifié'
        : 'Domaine enregistré. Configurez votre DNS CNAME pour compléter.',
    });
  } catch (error) {
    logger.error('Failed to configure domain', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

/**
 * DELETE — Remove custom domain.
 */
export async function DELETE(request: NextRequest) {
  // CSRF validation
  const csrfValid = await validateCsrf(request);
  if (!csrfValid) {
    return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
  }

  const user = await getAuthenticatedOwner();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const tenant = await prisma.tenant.findFirst({
      where: { ownerUserId: user.id },
      select: { id: true },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    await prisma.tenant.update({
      where: { id: tenant.id },
      data: { domainCustom: null },
    });

    logger.info('Custom domain removed', { tenantId: tenant.id });

    return NextResponse.json({ message: 'Domaine personnalisé retiré' });
  } catch (error) {
    logger.error('Failed to remove domain', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
