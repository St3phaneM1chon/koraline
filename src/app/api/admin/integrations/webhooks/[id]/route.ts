export const dynamic = 'force-dynamic';

/**
 * G27 — Integration Webhook single-item routes
 * GET    - Get webhook details + delivery log
 * PATCH  - Update webhook (name, url, events, active)
 * DELETE - Delete webhook
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAdminGuard } from '@/lib/admin-api-guard';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { logger } from '@/lib/logger';

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  url: z.string().url().max(2000).optional(),
  events: z.array(z.string()).min(1).optional(),
  isActive: z.boolean().optional(),
});

// ---------------------------------------------------------------------------
// GET — Webhook detail + recent deliveries
// ---------------------------------------------------------------------------

export const GET = withAdminGuard(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const { id } = await params;

  const webhook = await prisma.integrationWebhook.findUnique({
    where: { id },
    include: {
      deliveryLogs: {
        orderBy: { createdAt: 'desc' },
        take: 50,
      },
    },
  });

  if (!webhook) {
    return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
  }

  return NextResponse.json({
    webhook: {
      ...webhook,
      secret: webhook.secret ? '***' : null,
    },
  });
});

// ---------------------------------------------------------------------------
// PATCH — Update webhook
// ---------------------------------------------------------------------------

export const PATCH = withAdminGuard(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const existing = await prisma.integrationWebhook.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
    }

    const updated = await prisma.integrationWebhook.update({
      where: { id },
      data: {
        ...parsed.data,
        // Reset fail count when re-activating
        ...(parsed.data.isActive === true && existing.failCount > 0 ? { failCount: 0 } : {}),
      },
    });

    logger.info('[Integrations] Webhook updated', { webhookId: id, changes: Object.keys(parsed.data) });

    return NextResponse.json({
      webhook: {
        ...updated,
        secret: updated.secret ? '***' : null,
      },
    });
  } catch (error) {
    logger.error('[Integrations] Error updating webhook', {
      webhookId: id,
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Failed to update webhook' }, { status: 500 });
  }
});

// ---------------------------------------------------------------------------
// DELETE — Delete webhook
// ---------------------------------------------------------------------------

export const DELETE = withAdminGuard(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const { id } = await params;

  try {
    const existing = await prisma.integrationWebhook.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
    }

    // Cascade deletes delivery logs automatically
    await prisma.integrationWebhook.delete({ where: { id } });

    logger.info('[Integrations] Webhook deleted', { webhookId: id });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('[Integrations] Error deleting webhook', {
      webhookId: id,
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Failed to delete webhook' }, { status: 500 });
  }
});
