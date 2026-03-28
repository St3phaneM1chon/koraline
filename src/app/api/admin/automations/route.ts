/**
 * Admin API — Workflow Automations
 * GET  /api/admin/automations  — list automations + stats
 * POST /api/admin/automations  — create/update automation
 * (DELETE handled via POST with _method=delete)
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAdminGuard } from '@/lib/admin-api-guard';
import { prisma } from '@/lib/db';

const AutomationSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  type: z.enum(['welcome', 'abandoned_cart', 'birthday', 'review_request', 'reengagement', 'custom']),
  trigger: z.string().min(1),
  conditions: z.array(z.object({
    field: z.string(),
    operator: z.enum(['equals', 'not_equals', 'greater_than', 'less_than', 'contains']),
    value: z.string(),
  })).default([]),
  actions: z.array(z.object({
    type: z.enum(['email', 'sms', 'push', 'discount', 'tag', 'webhook']),
    templateId: z.string().optional(),
    delay: z.string().optional(),
    config: z.record(z.unknown()).optional(),
  })).min(1),
  isActive: z.boolean().default(true),
});

export const GET = withAdminGuard(async (request: NextRequest) => {
  const tenantId = request.headers.get('x-tenant-id') || 'default';

  const automations = await prisma.workflowAutomation.findMany({
    where: { tenantId },
    orderBy: [{ isActive: 'desc' }, { updatedAt: 'desc' }],
    include: {
      _count: {
        select: { logs: true },
      },
    },
  });

  // Recent logs for activity feed
  const recentLogs = await prisma.workflowAutomationLog.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: {
      automation: { select: { name: true } },
    },
  });

  // Summary stats
  const totalRuns = automations.reduce((a, au) => a + au.runCount, 0);
  const totalSuccess = automations.reduce((a, au) => a + au.successCount, 0);
  const totalFails = automations.reduce((a, au) => a + au.failCount, 0);

  return NextResponse.json({
    automations: automations.map((a) => ({
      ...a,
      conditions: safeParseJson(a.conditions),
      actions: safeParseJson(a.actions),
      logCount: a._count.logs,
    })),
    recentLogs: recentLogs.map((l) => ({
      id: l.id,
      automationName: l.automation.name,
      status: l.status,
      targetEmail: l.targetEmail,
      error: l.error,
      createdAt: l.createdAt,
    })),
    stats: {
      total: automations.length,
      active: automations.filter((a) => a.isActive).length,
      totalRuns,
      totalSuccess,
      totalFails,
      successRate: totalRuns > 0 ? Math.round((totalSuccess / totalRuns) * 100) : 0,
    },
  });
}, { skipCsrf: true });

export const POST = withAdminGuard(async (request: NextRequest) => {
  const body = await request.json();

  // Handle delete
  if (body._method === 'delete' && body.id) {
    await prisma.workflowAutomation.delete({ where: { id: body.id } });
    return NextResponse.json({ ok: true });
  }

  // Handle toggle active
  if (body._method === 'toggle' && body.id) {
    const current = await prisma.workflowAutomation.findUnique({
      where: { id: body.id },
      select: { isActive: true },
    });
    if (!current) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    const updated = await prisma.workflowAutomation.update({
      where: { id: body.id },
      data: { isActive: !current.isActive },
    });
    return NextResponse.json({ automation: updated });
  }

  const parsed = AutomationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
  }

  const tenantId = request.headers.get('x-tenant-id') || 'default';
  const data = parsed.data;

  if (data.id) {
    // Update
    const automation = await prisma.workflowAutomation.update({
      where: { id: data.id },
      data: {
        name: data.name,
        description: data.description,
        type: data.type,
        trigger: data.trigger,
        conditions: JSON.stringify(data.conditions),
        actions: JSON.stringify(data.actions),
        isActive: data.isActive,
      },
    });
    return NextResponse.json({ automation }, { status: 200 });
  }

  // Create
  const automation = await prisma.workflowAutomation.create({
    data: {
      tenantId,
      name: data.name,
      description: data.description,
      type: data.type,
      trigger: data.trigger,
      conditions: JSON.stringify(data.conditions),
      actions: JSON.stringify(data.actions),
      isActive: data.isActive,
    },
  });

  return NextResponse.json({ automation }, { status: 201 });
});

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

function safeParseJson(val: unknown): unknown {
  if (!val) return [];
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch { return []; }
  }
  return val;
}
