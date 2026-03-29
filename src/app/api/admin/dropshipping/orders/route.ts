export const dynamic = 'force-dynamic';
/**
 * API Admin — Dropship Order Management (G11)
 *
 * GET  /api/admin/dropshipping/orders — List dropship orders with status
 * POST /api/admin/dropshipping/orders — Sync order statuses from provider
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAdminGuard } from '@/lib/admin-api-guard';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import { logAdminAction, getClientIpFromRequest } from '@/lib/admin-audit';
import { PrintfulClient } from '@/lib/dropship/printful';

const syncOrdersSchema = z.object({
  providerId: z.string().min(1),
});

export const GET = withAdminGuard(async (request: NextRequest, { session }) => {
  try {
    const tenantId = session.user.tenantId || 'default';
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const providerId = searchParams.get('providerId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const skip = (page - 1) * limit;

    const where = {
      tenantId,
      ...(status ? { status } : {}),
      ...(providerId ? { providerId } : {}),
    };

    const [orders, total] = await Promise.all([
      prisma.dropshipOrder.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.dropshipOrder.count({ where }),
    ]);

    return NextResponse.json({
      orders,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    logger.error('[Dropship] Error listing orders', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Failed to list orders' }, { status: 500 });
  }
});

export const POST = withAdminGuard(async (request: NextRequest, { session }) => {
  try {
    const body = await request.json();
    const parsed = syncOrdersSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'providerId is required' }, { status: 400 });
    }

    const { providerId } = parsed.data;
    const tenantId = session.user.tenantId || 'default';

    const provider = await prisma.dropshipProvider.findFirst({
      where: { id: providerId, tenantId },
    });
    if (!provider || !provider.apiKey) {
      return NextResponse.json({ error: 'Provider not found or missing API key' }, { status: 404 });
    }

    const client = new PrintfulClient(provider.apiKey, provider.id, provider.tenantId);
    const result = await client.syncOrderStatuses();

    logAdminAction({
      adminUserId: session.user.id,
      action: 'SYNC_DROPSHIP_ORDERS',
      targetType: 'DropshipProvider',
      targetId: providerId,
      newValue: result,
      ipAddress: getClientIpFromRequest(request),
      userAgent: request.headers.get('user-agent') || undefined,
    }).catch(err => logger.error('[Dropship] Audit log error', { error: String(err) }));

    return NextResponse.json({
      message: 'Order status sync completed',
      ...result,
    });
  } catch (error) {
    logger.error('[Dropship] Error syncing orders', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Failed to sync orders' }, { status: 500 });
  }
});
