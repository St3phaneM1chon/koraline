export const dynamic = 'force-dynamic';

/**
 * Push Token Registration API
 * POST /api/auth/push-token — Register iOS device token for push notifications
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withMobileGuard } from '@/lib/mobile-guard';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

const schema = z.object({
  token: z.string().min(10).max(200),
  platform: z.enum(['ios', 'ios-voip', 'android']).default('ios'),
});

/**
 * POST — Register or update a device token for push notifications.
 */
export const POST = withMobileGuard(async (request, { session }) => {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const { token, platform } = parsed.data;

    // Upsert: create or reactivate the device
    await prisma.userDevice.upsert({
      where: { token },
      update: {
        userId: session.user.id,
        platform,
        isActive: true,
        updatedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        token,
        platform,
        isActive: true,
      },
    });

    logger.info('[PushToken] Device registered', {
      userId: session.user.id,
      platform,
      tokenPrefix: token.slice(0, 8),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('[PushToken] Registration failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Failed to register token' }, { status: 500 });
  }
});
