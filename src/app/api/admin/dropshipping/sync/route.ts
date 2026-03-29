export const dynamic = 'force-dynamic';
/**
 * API Admin — Dropship Product Sync (G11)
 *
 * POST /api/admin/dropshipping/sync — Trigger product sync from a provider
 * Body: { providerId: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAdminGuard } from '@/lib/admin-api-guard';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import { logAdminAction, getClientIpFromRequest } from '@/lib/admin-audit';
import { PrintfulClient } from '@/lib/dropship/printful';

const syncSchema = z.object({
  providerId: z.string().min(1),
});

export const POST = withAdminGuard(async (request: NextRequest, { session }) => {
  try {
    const body = await request.json();
    const parsed = syncSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'providerId is required' }, { status: 400 });
    }

    const { providerId } = parsed.data;
    const tenantId = session.user.tenantId || 'default';

    // Verify provider belongs to tenant
    const provider = await prisma.dropshipProvider.findFirst({
      where: { id: providerId, tenantId },
    });
    if (!provider || !provider.apiKey) {
      return NextResponse.json({ error: 'Provider not found or missing API key' }, { status: 404 });
    }

    const client = new PrintfulClient(provider.apiKey, provider.id, provider.tenantId);
    const result = await client.syncProducts();

    logAdminAction({
      adminUserId: session.user.id,
      action: 'SYNC_DROPSHIP_PRODUCTS',
      targetType: 'DropshipProvider',
      targetId: providerId,
      newValue: result,
      ipAddress: getClientIpFromRequest(request),
      userAgent: request.headers.get('user-agent') || undefined,
    }).catch(err => logger.error('[Dropship] Audit log error', { error: String(err) }));

    return NextResponse.json({
      message: 'Product sync completed',
      ...result,
    });
  } catch (error) {
    logger.error('[Dropship] Error syncing products', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Failed to sync products' }, { status: 500 });
  }
});
