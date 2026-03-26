/**
 * API: /api/platform/domain
 * Custom domain management for Koraline tenants.
 *
 * GET:    Current domain config + live DNS status
 * PUT:    Register a custom domain (generates verification token)
 * POST:   Verify domain ownership via DNS TXT record
 * DELETE: Remove custom domain
 */

export const dynamic = 'force-dynamic';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { randomBytes } from 'crypto';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth-config';
import { logger } from '@/lib/logger';
import { validateCsrf } from '@/lib/csrf-middleware';
import { clearTenantCache } from '@/lib/tenant';
import dns from 'dns/promises';

const domainSchema = z.object({
  domain: z.string().min(4).max(253).regex(
    /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,}$/i,
    { message: 'Format de domaine invalide' }
  ).transform((val) => val.toLowerCase()),
});

const DNS_LOOKUP_TIMEOUT_MS = 5000;

async function getAuthenticatedOwner() {
  const session = await auth();
  if (!session?.user || session.user.role !== 'OWNER') return null;
  return session.user;
}

function generateVerificationToken(): string {
  return `attitudes-verify=${randomBytes(16).toString('hex')}`;
}

async function checkDnsTxt(domain: string, expectedToken: string): Promise<boolean> {
  const txtHost = `_attitudes-verify.${domain}`;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), DNS_LOOKUP_TIMEOUT_MS);
    const records = await dns.resolveTxt(txtHost);
    clearTimeout(timeout);
    return records.some(chunks => chunks.join('') === expectedToken);
  } catch {
    return false;
  }
}

async function checkDnsCname(domain: string): Promise<{ verified: boolean; target: string | null }> {
  try {
    const records = await dns.resolveCname(domain);
    const match = records.find(r =>
      r.endsWith('.koraline.app') || r.endsWith('.attitudes.vip')
    );
    return { verified: !!match, target: match || records[0] || null };
  } catch {
    return { verified: false, target: null };
  }
}

/**
 * GET -- Current domain configuration with live DNS status.
 */
export async function GET() {
  const user = await getAuthenticatedOwner();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const tenant = await prisma.tenant.findFirst({
      where: { ownerUserId: user.id },
      select: {
        domainKoraline: true,
        domainCustom: true,
        domainVerified: true,
        domainVerificationToken: true,
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    let cnameStatus = { verified: false, target: null as string | null };
    let txtVerified = false;

    if (tenant.domainCustom) {
      cnameStatus = await checkDnsCname(tenant.domainCustom);
      if (tenant.domainVerificationToken) {
        txtVerified = await checkDnsTxt(tenant.domainCustom, tenant.domainVerificationToken);
      }
    }

    return NextResponse.json({
      domainKoraline: tenant.domainKoraline,
      domainCustom: tenant.domainCustom,
      domainVerified: tenant.domainVerified,
      verificationToken: tenant.domainVerificationToken,
      cnameVerified: cnameStatus.verified,
      cnameTarget: cnameStatus.target,
      txtVerified,
    });
  } catch (error) {
    logger.error('Failed to get domain config', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

/**
 * PUT -- Register a custom domain and generate a verification token.
 * The domain is NOT verified yet -- tenant must add a DNS TXT record
 * and then call POST to complete verification.
 */
export async function PUT(request: NextRequest) {
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

    const existing = await prisma.tenant.findFirst({
      where: { domainCustom: domain },
    });
    if (existing && existing.ownerUserId !== user.id) {
      return NextResponse.json({ error: 'Ce domaine est déjà utilisé' }, { status: 409 });
    }

    const tenant = await prisma.tenant.findFirst({
      where: { ownerUserId: user.id },
      select: { id: true, slug: true, domainKoraline: true, domainCustom: true, domainVerificationToken: true },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Keep existing token if domain hasn't changed, otherwise generate new one
    const token = (tenant.domainCustom === domain && tenant.domainVerificationToken)
      ? tenant.domainVerificationToken
      : generateVerificationToken();

    await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        domainCustom: domain,
        domainVerified: false,
        domainVerificationToken: token,
      },
    });

    clearTenantCache(domain);

    const cnameTarget = tenant.domainKoraline || `${tenant.slug}.koraline.app`;

    logger.info('Custom domain registered (pending verification)', { tenantId: tenant.id, domain });

    return NextResponse.json({
      domain,
      domainVerified: false,
      verificationToken: token,
      txtRecord: {
        host: `_attitudes-verify.${domain}`,
        type: 'TXT',
        value: token,
      },
      cnameRecord: {
        host: domain.split('.')[0],
        type: 'CNAME',
        value: cnameTarget,
      },
    });
  } catch (error) {
    logger.error('Failed to configure domain', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

/**
 * POST -- Verify domain ownership via DNS TXT record lookup.
 * Checks _attitudes-verify.{domain} for the expected token.
 * If valid, marks the domain as verified.
 */
export async function POST(request: NextRequest) {
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
      select: {
        id: true,
        domainCustom: true,
        domainVerificationToken: true,
        domainKoraline: true,
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    if (!tenant.domainCustom || !tenant.domainVerificationToken) {
      return NextResponse.json(
        { error: 'Aucun domaine en attente de vérification' },
        { status: 400 }
      );
    }

    const txtVerified = await checkDnsTxt(tenant.domainCustom, tenant.domainVerificationToken);
    if (!txtVerified) {
      return NextResponse.json({
        verified: false,
        message: 'Enregistrement TXT introuvable. Vérifiez vos DNS et réessayez.',
        expectedRecord: {
          host: `_attitudes-verify.${tenant.domainCustom}`,
          type: 'TXT',
          value: tenant.domainVerificationToken,
        },
      }, { status: 422 });
    }

    const cname = await checkDnsCname(tenant.domainCustom);

    await prisma.tenant.update({
      where: { id: tenant.id },
      data: { domainVerified: true },
    });

    clearTenantCache(tenant.domainCustom);

    logger.info('Custom domain verified', { tenantId: tenant.id, domain: tenant.domainCustom });

    return NextResponse.json({
      verified: true,
      domain: tenant.domainCustom,
      cnameVerified: cname.verified,
      message: cname.verified
        ? 'Domaine vérifié et CNAME configuré.'
        : 'Propriété vérifiée. Configurez votre CNAME pour activer le domaine.',
    });
  } catch (error) {
    logger.error('Failed to verify domain', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

/**
 * DELETE -- Remove custom domain.
 */
export async function DELETE(request: NextRequest) {
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
      select: { id: true, domainCustom: true },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const oldDomain = tenant.domainCustom;

    await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        domainCustom: null,
        domainVerified: false,
        domainVerificationToken: null,
      },
    });

    if (oldDomain) {
      clearTenantCache(oldDomain);
    }

    logger.info('Custom domain removed', { tenantId: tenant.id });

    return NextResponse.json({ message: 'Domaine personnalisé retiré' });
  } catch (error) {
    logger.error('Failed to remove domain', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
