/**
 * API: POST /api/admin/platform/assisted-setup
 * Assisted tenant provisioning — Used by Attitudes VIP employees/sellers
 * to create a complete tenant setup in one call.
 *
 * Auth: super-admin only (attitudes.vip domain).
 */

export const dynamic = 'force-dynamic';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth-config';
import {
  getStripeAttitudes,
  getStripePriceId,
  KORALINE_MODULES,
} from '@/lib/stripe-attitudes';
import {
  KORALINE_PLANS,
  KORALINE_FREE_ACCUMULATION_MONTHS,
  type KoralinePlan,
} from '@/lib/stripe-constants';
import { logger } from '@/lib/logger';
import bcrypt from 'bcryptjs';
import { tenantWelcomeEmail } from '@/lib/email/templates/tenant-emails';
import { sendEmail } from '@/lib/email/email-service';

const assistedSetupSchema = z.object({
  slug: z.string().min(3).max(30).regex(/^[a-z0-9-]+$/, {
    message: 'Slug invalide (lettres minuscules, chiffres, tirets)',
  }),
  name: z.string().min(1).max(200),
  email: z.string().email().max(255),
  phone: z.string().max(30).optional(),
  plan: z.string().min(1).max(50),
  modules: z.array(z.string().max(50)).max(20).optional(),
  branding: z.object({
    primaryColor: z.string().max(20).optional(),
    secondaryColor: z.string().max(20).optional(),
    logoUrl: z.string().url().max(500).optional(),
  }).optional(),
  sendWelcomeEmail: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  // Auth: super-admin only
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // C1-SEC-S-053 FIX: Verify super-admin via DB, not spoofable header
  const userTenantId = session.user.tenantId;
  if (!userTenantId) {
    return NextResponse.json({ error: 'No tenant context' }, { status: 403 });
  }
  const userTenant = await prisma.tenant.findUnique({
    where: { id: userTenantId },
    select: { slug: true },
  });
  if (userTenant?.slug !== 'attitudes' || session.user.role !== 'OWNER') {
    return NextResponse.json({ error: 'Super-admin access required' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = assistedSetupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const {
      slug, name, email, phone, plan, modules, branding, sendWelcomeEmail: shouldSendEmail,
    } = parsed.data;

    // Check slug
    const existing = await prisma.tenant.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: `Le slug "${slug}" est déjà pris` }, { status: 409 });
    }

    // Validate plan
    const isAlacarte = plan === 'alacarte';
    if (!isAlacarte && !(plan in KORALINE_PLANS)) {
      return NextResponse.json({ error: 'Plan invalide' }, { status: 400 });
    }

    // Validate modules
    const validModules: string[] = [];
    if (modules?.length) {
      for (const m of modules) {
        if (m in KORALINE_MODULES) validModules.push(m);
      }
    }

    // Determine modules enabled
    let modulesEnabled: string[];
    if (isAlacarte) {
      modulesEnabled = ['dashboard', 'systeme', 'permissions', ...validModules];
    } else {
      const planConfig = KORALINE_PLANS[plan as KoralinePlan];
      modulesEnabled = [...planConfig.includedModules, ...validModules];
    }
    modulesEnabled = [...new Set(modulesEnabled)];

    const planConfig = isAlacarte ? null : KORALINE_PLANS[plan as KoralinePlan];

    // C1-SEC-S-053 FIX: Generate cryptographically secure temporary password
    const { randomBytes } = await import('crypto');
    const tempPassword = `K-${randomBytes(12).toString('base64url')}`;
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    // Create Stripe customer + subscription
    const stripe = getStripeAttitudes();
    const customer = await stripe.customers.create({
      email,
      name,
      phone: phone || undefined,
      metadata: { tenant_slug: slug, plan },
    });

    // Build subscription items
    const items: Array<{ price: string; quantity: number; metadata?: Record<string, string> }> = [];

    if (isAlacarte) {
      const soclePriceId = await getStripePriceId('socle_mini', '');
      if (soclePriceId) {
        items.push({ price: soclePriceId, quantity: 1 });
      }
    } else {
      const planPriceId = await getStripePriceId('plan', plan);
      if (planPriceId) {
        items.push({ price: planPriceId, quantity: 1 });
      }
    }

    for (const modKey of validModules) {
      const modPriceId = await getStripePriceId('module', modKey);
      if (modPriceId) {
        items.push({
          price: modPriceId,
          quantity: 1,
          metadata: { koraline_module: modKey },
        });
      }
    }

    let subscription = null;
    if (items.length > 0) {
      subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items,
        metadata: { tenant_slug: slug, plan, checkout_mode: isAlacarte ? 'alacarte' : 'plan' },
      });
    }

    // Data accumulation setup
    const modulesAccumulating: Array<{ key: string; startedAt: string; freeUntil: string | null }> = [];
    if (!isAlacarte && planConfig) {
      const freeUntil = new Date();
      freeUntil.setMonth(freeUntil.getMonth() + KORALINE_FREE_ACCUMULATION_MONTHS);
      const allModules = ['commerce', 'catalogue', 'marketing', 'emails', 'comptabilite',
        'systeme', 'crm', 'communaute', 'media', 'loyalty', 'voip'];
      const inactive = allModules.filter(m => !modulesEnabled.includes(m));
      for (const m of inactive) {
        modulesAccumulating.push({
          key: m,
          startedAt: new Date().toISOString(),
          freeUntil: freeUntil.toISOString(),
        });
      }
    }

    // Create tenant + owner in transaction
    const result = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          slug,
          name,
          domainKoraline: `${slug}.koraline.app`,
          plan,
          status: 'ACTIVE',
          locale: 'fr',
          timezone: 'America/Toronto',
          currency: 'CAD',
          primaryColor: branding?.primaryColor || '#0066CC',
          secondaryColor: branding?.secondaryColor || '#003366',
          logoUrl: branding?.logoUrl || null,
          modulesEnabled: JSON.stringify(modulesEnabled),
          featuresFlags: JSON.stringify({ checkoutMode: isAlacarte ? 'alacarte' : 'plan', assistedSetup: true, modulesDataAccumulating: modulesAccumulating }),
          stripeCustomerId: customer.id,
          stripeSubscriptionId: subscription?.id || null,
          maxEmployees: planConfig ? planConfig.includedEmployees + 1 : 1,
        },
      });

      const owner = await tx.user.create({
        data: {
          email,
          name,
          password: hashedPassword,
          role: 'OWNER',
          tenantId: tenant.id,
          locale: 'fr',
          timezone: 'America/Toronto',
        },
      });

      await tx.tenant.update({
        where: { id: tenant.id },
        data: { ownerUserId: owner.id },
      });

      return { tenant, owner };
    });

    logger.info('Assisted tenant setup completed', {
      tenantId: result.tenant.id,
      slug,
      plan,
      modules: modulesEnabled,
      createdBy: session.user.email,
    });

    // Send welcome email if requested
    if (shouldSendEmail !== false) {
      const planName = planConfig ? planConfig.name : 'À la carte';
      const emailData = tenantWelcomeEmail({
        tenantName: name,
        ownerName: name,
        ownerEmail: email,
        plan,
        planName,
        domainKoraline: `${slug}.koraline.app`,
        adminUrl: `https://${slug}.koraline.app/admin`,
      });
      sendEmail({
        to: { email, name },
        subject: emailData.subject,
        html: emailData.html,
        emailType: 'transactional',
      }).catch(() => {});
    }

    return NextResponse.json({
      tenant: {
        id: result.tenant.id,
        slug: result.tenant.slug,
        name: result.tenant.name,
        plan: result.tenant.plan,
        domainKoraline: result.tenant.domainKoraline,
        adminUrl: `https://${slug}.koraline.app/admin`,
      },
      owner: {
        id: result.owner.id,
        email: result.owner.email,
        tempPassword: tempPassword,
      },
      subscription: subscription ? { id: subscription.id } : null,
      message: 'Tenant provisionné avec succès (setup assisté)',
    }, { status: 201 });
  } catch (error) {
    logger.error('Assisted setup failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Erreur lors du setup assisté' }, { status: 500 });
  }
}
