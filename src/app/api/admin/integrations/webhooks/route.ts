export const dynamic = 'force-dynamic';

/**
 * G27 — Integration Webhooks (Zapier/Make) CRUD
 * GET  - List all integration webhooks (with delivery stats)
 * POST - Create a new integration webhook
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAdminGuard } from '@/lib/admin-api-guard';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { randomBytes } from 'crypto';
import { logger } from '@/lib/logger';
import { INTEGRATION_EVENT_TYPES } from '@/lib/integrations/webhook-dispatcher';

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const createSchema = z.object({
  name: z.string().min(1).max(100),
  url: z.string().url().max(2000),
  events: z.array(z.string()).min(1),
  secret: z.string().optional(), // auto-generated if not provided
  isActive: z.boolean().optional().default(true),
});

// ---------------------------------------------------------------------------
// GET — List webhooks
// ---------------------------------------------------------------------------

export const GET = withAdminGuard(async (request: NextRequest) => {
  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit')) || 25));
  const skip = (page - 1) * limit;

  const [webhooks, total] = await Promise.all([
    prisma.integrationWebhook.findMany({
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        _count: {
          select: { deliveryLogs: true },
        },
      },
    }),
    prisma.integrationWebhook.count(),
  ]);

  // Aggregate delivery stats per webhook
  const enriched = await Promise.all(
    webhooks.map(async (wh) => {
      const successCount = await prisma.integrationWebhookLog.count({
        where: { webhookId: wh.id, success: true },
      });
      const failedCount = await prisma.integrationWebhookLog.count({
        where: { webhookId: wh.id, success: false },
      });
      return {
        ...wh,
        secret: wh.secret ? '***' : null, // Never expose secret
        stats: {
          totalDeliveries: wh._count.deliveryLogs,
          successCount,
          failedCount,
        },
      };
    }),
  );

  return NextResponse.json({
    webhooks: enriched,
    eventTypes: INTEGRATION_EVENT_TYPES,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

// ---------------------------------------------------------------------------
// POST — Create webhook
// ---------------------------------------------------------------------------

export const POST = withAdminGuard(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { name, url: webhookUrl, events, secret, isActive } = parsed.data;

    // Auto-generate a signing secret if not provided
    const signingSecret = secret || randomBytes(32).toString('hex');

    // TODO: In multi-tenant context, get tenantId from session
    const tenantId = 'default';

    const webhook = await prisma.integrationWebhook.create({
      data: {
        tenantId,
        name,
        url: webhookUrl,
        events,
        secret: signingSecret,
        isActive,
      },
    });

    logger.info('[Integrations] Webhook created', {
      webhookId: webhook.id,
      name,
      events,
      tenantId,
    });

    return NextResponse.json(
      {
        webhook: {
          ...webhook,
          secret: signingSecret, // Return once at creation for the user to copy
        },
      },
      { status: 201 },
    );
  } catch (error) {
    logger.error('[Integrations] Error creating webhook', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Failed to create webhook' }, { status: 500 });
  }
});
