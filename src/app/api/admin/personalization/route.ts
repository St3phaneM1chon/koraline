/**
 * Admin API — Personalization Rules + Visitor Stats
 * GET  /api/admin/personalization          — list rules + stats
 * POST /api/admin/personalization          — create/update rule
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAdminGuard } from '@/lib/admin-api-guard';
import { prisma } from '@/lib/db';
import { getVisitorStats } from '@/lib/personalization/engine';

const RuleSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  segment: z.string().min(1),
  action: z.string().min(1),
  config: z.record(z.unknown()).default({}),
  isActive: z.boolean().default(true),
  priority: z.number().int().min(0).max(100).default(0),
  startsAt: z.string().datetime().optional().nullable(),
  endsAt: z.string().datetime().optional().nullable(),
});

export const GET = withAdminGuard(async (request: NextRequest) => {
  const tenantId = request.headers.get('x-tenant-id') || 'default';

  const [rules, stats, recentEvents] = await Promise.all([
    prisma.personalizationRule.findMany({
      where: { tenantId },
      orderBy: { priority: 'desc' },
    }),
    getVisitorStats(tenantId),
    prisma.visitorEvent.count({
      where: {
        tenantId,
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    }),
  ]);

  return NextResponse.json({
    rules,
    stats: { ...stats, eventsLast24h: recentEvents },
  });
}, { skipCsrf: true });

export const POST = withAdminGuard(async (request: NextRequest) => {
  const body = await request.json();
  const parsed = RuleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
  }

  const tenantId = request.headers.get('x-tenant-id') || 'default';
  const data = parsed.data;

  if (data.id) {
    // Update existing rule
    const rule = await prisma.personalizationRule.update({
      where: { id: data.id },
      data: {
        name: data.name,
        description: data.description,
        segment: data.segment,
        action: data.action,
        config: JSON.stringify(data.config),
        isActive: data.isActive,
        priority: data.priority,
        startsAt: data.startsAt ? new Date(data.startsAt) : null,
        endsAt: data.endsAt ? new Date(data.endsAt) : null,
      },
    });
    return NextResponse.json({ rule }, { status: 200 });
  }

  // Create new rule
  const rule = await prisma.personalizationRule.create({
    data: {
      tenantId,
      name: data.name,
      description: data.description,
      segment: data.segment,
      action: data.action,
      config: JSON.stringify(data.config),
      isActive: data.isActive,
      priority: data.priority,
      startsAt: data.startsAt ? new Date(data.startsAt) : null,
      endsAt: data.endsAt ? new Date(data.endsAt) : null,
    },
  });

  return NextResponse.json({ rule }, { status: 201 });
});
