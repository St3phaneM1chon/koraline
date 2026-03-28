/**
 * Admin API — White-Label Configuration
 * GET  /api/admin/white-label  — get current config
 * POST /api/admin/white-label  — create or update config
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAdminGuard } from '@/lib/admin-api-guard';
import { prisma } from '@/lib/db';

const WhiteLabelSchema = z.object({
  loginLogoUrl: z.string().url().max(500).optional().nullable(),
  loginBackgroundUrl: z.string().url().max(500).optional().nullable(),
  loginBackgroundColor: z.string().max(20).optional().nullable(),
  loginTagline: z.string().max(200).optional().nullable(),
  faviconUrl: z.string().url().max(500).optional().nullable(),
  customCss: z.string().max(10000).optional().nullable(),
  emailDomain: z.string().max(200).optional().nullable(),
  emailFromName: z.string().max(100).optional().nullable(),
  removePoweredBy: z.boolean().optional(),
  custom404Title: z.string().max(200).optional().nullable(),
  custom404Message: z.string().max(1000).optional().nullable(),
  custom404ImageUrl: z.string().url().max(500).optional().nullable(),
});

export const GET = withAdminGuard(async (request: NextRequest) => {
  const tenantId = request.headers.get('x-tenant-id') || 'default';

  const config = await prisma.whiteLabelConfig.findUnique({
    where: { tenantId },
  });

  // Also fetch tenant plan to check premium features
  let plan = 'pro';
  try {
    const tenant = await prisma.tenant.findFirst({
      where: { id: tenantId },
      select: { plan: true },
    });
    if (tenant) plan = tenant.plan;
  } catch {
    // Graceful: default to pro
  }

  return NextResponse.json({
    config: config || null,
    plan,
    premiumFeatures: {
      removePoweredBy: plan === 'enterprise',
      customCss: ['pro', 'enterprise'].includes(plan),
      emailDomain: ['pro', 'enterprise'].includes(plan),
    },
  });
}, { skipCsrf: true });

export const POST = withAdminGuard(async (request: NextRequest) => {
  const body = await request.json();
  const parsed = WhiteLabelSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
  }

  const tenantId = request.headers.get('x-tenant-id') || 'default';
  const data = parsed.data;

  // Check premium: removePoweredBy only for enterprise
  if (data.removePoweredBy) {
    try {
      const tenant = await prisma.tenant.findFirst({
        where: { id: tenantId },
        select: { plan: true },
      });
      if (tenant?.plan !== 'enterprise') {
        return NextResponse.json(
          { error: 'Remove "Powered by" is only available on the Enterprise plan' },
          { status: 403 },
        );
      }
    } catch {
      // Allow — graceful
    }
  }

  const config = await prisma.whiteLabelConfig.upsert({
    where: { tenantId },
    create: {
      tenantId,
      ...data,
    },
    update: data,
  });

  return NextResponse.json({ config }, { status: 200 });
});
