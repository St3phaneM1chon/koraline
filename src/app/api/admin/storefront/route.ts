export const dynamic = 'force-dynamic';

/**
 * Admin — AI Storefront Toggle (G15)
 *
 * GET  — Returns current AI Storefront status
 * PUT  — Enable or disable the AI Storefront
 *
 * Uses SiteSetting key-value store with key "ff.ai_storefront".
 * Protected by admin guard (requires authenticated admin).
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { withAdminGuard } from '@/lib/admin-api-guard';
import { logAdminAction, getClientIpFromRequest } from '@/lib/admin-audit';
import { logger } from '@/lib/logger';

const FEATURE_KEY = 'ff.ai_storefront';

// ---------------------------------------------------------------------------
// GET — Current status
// ---------------------------------------------------------------------------

export const GET = withAdminGuard(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async (_request, _ctx) => {
    try {
      const setting = await prisma.siteSetting.findUnique({
        where: { key: FEATURE_KEY },
      });

      const enabled = setting?.value === 'true';

      return NextResponse.json({
        aiStorefrontEnabled: enabled,
        key: FEATURE_KEY,
        updatedAt: setting?.updatedAt?.toISOString() || null,
        updatedBy: setting?.updatedBy || null,
        endpoints: enabled
          ? {
              catalog: '/api/storefront',
              search: '/api/storefront/search',
              productDetail: '/api/storefront/product/{slug}',
              openapi: '/api/storefront/openapi.json',
              aiPlugin: '/.well-known/ai-plugin.json',
            }
          : null,
      });
    } catch (error) {
      logger.error('Failed to get AI Storefront status', {
        error: error instanceof Error ? error.message : String(error),
      });
      return NextResponse.json(
        { error: 'Failed to fetch AI Storefront status' },
        { status: 500 }
      );
    }
  },
  { skipCsrf: true }
);

// ---------------------------------------------------------------------------
// PUT — Toggle on/off
// ---------------------------------------------------------------------------

const toggleSchema = z.object({
  enabled: z.boolean(),
});

export const PUT = withAdminGuard(async (request: NextRequest, { session }) => {
  try {
    const body = await request.json();
    const parsed = toggleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'validation_error',
          message: 'Request body must contain { "enabled": true | false }',
          details: parsed.error.issues,
        },
        { status: 400 }
      );
    }

    const { enabled } = parsed.data;

    // Upsert the feature flag
    const setting = await prisma.siteSetting.upsert({
      where: { key: FEATURE_KEY },
      update: {
        value: String(enabled),
        updatedBy: session?.user?.id || 'admin',
      },
      create: {
        key: FEATURE_KEY,
        value: String(enabled),
        type: 'boolean',
        module: 'feature_flags',
        description:
          'Enable AI Storefront API for agentic commerce (G15). When enabled, AI agents can browse and search the product catalog via public API endpoints.',
        updatedBy: session?.user?.id || 'admin',
      },
    });

    // Audit log
    const ip = getClientIpFromRequest(request);
    await logAdminAction({
      adminUserId: session?.user?.id || 'unknown',
      action: enabled ? 'AI_STOREFRONT_ENABLED' : 'AI_STOREFRONT_DISABLED',
      targetType: 'SiteSetting',
      targetId: setting.id,
      newValue: { enabled },
      ipAddress: ip,
    }).catch(() => {
      // Non-critical
    });

    logger.info(`AI Storefront ${enabled ? 'enabled' : 'disabled'}`, {
      settingId: setting.id,
      adminUser: session?.user?.id,
    });

    return NextResponse.json({
      success: true,
      aiStorefrontEnabled: enabled,
      message: enabled
        ? 'AI Storefront is now live. AI agents can access your product catalog at /api/storefront'
        : 'AI Storefront has been disabled. AI agents will receive a 503 response.',
      endpoints: enabled
        ? {
            catalog: '/api/storefront',
            search: '/api/storefront/search',
            productDetail: '/api/storefront/product/{slug}',
            openapi: '/api/storefront/openapi.json',
            aiPlugin: '/.well-known/ai-plugin.json',
          }
        : null,
    });
  } catch (error) {
    logger.error('Failed to toggle AI Storefront', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: 'Failed to update AI Storefront setting' },
      { status: 500 }
    );
  }
});
