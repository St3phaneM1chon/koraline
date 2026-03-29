export const dynamic = 'force-dynamic';
/**
 * API Admin — Dropship Provider Management (G11)
 *
 * GET  /api/admin/dropshipping/providers — List all dropship providers for the tenant
 * POST /api/admin/dropshipping/providers — Connect a new dropship provider
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAdminGuard } from '@/lib/admin-api-guard';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import { logAdminAction, getClientIpFromRequest } from '@/lib/admin-audit';
import { PrintfulClient } from '@/lib/dropship/printful';

const createProviderSchema = z.object({
  provider: z.enum(['printful', 'printify', 'spocket', 'dsers']),
  apiKey: z.string().min(1, 'API key is required'),
  config: z.record(z.unknown()).optional().default({}),
});

export const GET = withAdminGuard(async (_request: NextRequest, { session }) => {
  try {
    const providers = await prisma.dropshipProvider.findMany({
      where: { tenantId: session.user.tenantId || 'default' },
      include: {
        _count: { select: { products: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Count orders per provider
    const providerIds = providers.map(p => p.id);
    const orderCounts = await prisma.dropshipOrder.groupBy({
      by: ['providerId'],
      where: { providerId: { in: providerIds } },
      _count: { id: true },
    });
    const orderMap = new Map(orderCounts.map(o => [o.providerId, o._count.id]));

    const result = providers.map(p => ({
      id: p.id,
      provider: p.provider,
      isActive: p.isActive,
      config: p.config,
      syncedAt: p.syncedAt,
      createdAt: p.createdAt,
      productCount: p._count.products,
      orderCount: orderMap.get(p.id) || 0,
      // Never expose the full API key
      hasApiKey: !!p.apiKey,
      apiKeyPreview: p.apiKey ? `...${p.apiKey.slice(-4)}` : null,
    }));

    return NextResponse.json({ providers: result });
  } catch (error) {
    logger.error('[Dropship] Error listing providers', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Failed to list providers' }, { status: 500 });
  }
});

export const POST = withAdminGuard(async (request: NextRequest, { session }) => {
  try {
    const body = await request.json();
    const parsed = createProviderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid data', details: parsed.error.flatten() }, { status: 400 });
    }

    const { provider, apiKey, config } = parsed.data;
    const tenantId = session.user.tenantId || 'default';

    // Validate API key before saving (only for Printful for now)
    if (provider === 'printful') {
      const client = new PrintfulClient(apiKey, '', tenantId);
      const valid = await client.validateApiKey();
      if (!valid) {
        return NextResponse.json({ error: 'Invalid Printful API key' }, { status: 400 });
      }
    }

    // Upsert: if tenant already has this provider, update the key
    const existing = await prisma.dropshipProvider.findUnique({
      where: { tenantId_provider: { tenantId, provider } },
    });

    let result;
    if (existing) {
      result = await prisma.dropshipProvider.update({
        where: { id: existing.id },
        data: { apiKey, config: config as unknown as Record<string, string>, isActive: true },
      });
    } else {
      result = await prisma.dropshipProvider.create({
        data: { tenantId, provider, apiKey, config: config as unknown as Record<string, string>, isActive: true },
      });
    }

    logAdminAction({
      adminUserId: session.user.id,
      action: existing ? 'UPDATE_DROPSHIP_PROVIDER' : 'CREATE_DROPSHIP_PROVIDER',
      targetType: 'DropshipProvider',
      targetId: result.id,
      newValue: { provider },
      ipAddress: getClientIpFromRequest(request),
      userAgent: request.headers.get('user-agent') || undefined,
    }).catch(err => logger.error('[Dropship] Audit log error', { error: String(err) }));

    return NextResponse.json({
      provider: {
        id: result.id,
        provider: result.provider,
        isActive: result.isActive,
        createdAt: result.createdAt,
      },
      message: existing ? 'Provider updated' : 'Provider connected',
    }, { status: existing ? 200 : 201 });
  } catch (error) {
    logger.error('[Dropship] Error creating provider', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Failed to create provider' }, { status: 500 });
  }
});
