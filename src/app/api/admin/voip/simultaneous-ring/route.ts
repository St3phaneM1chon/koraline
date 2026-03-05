export const dynamic = 'force-dynamic';

/**
 * VoIP Simultaneous Ring Configuration API
 *
 * GET /api/admin/voip/simultaneous-ring — Get sim-ring config for current user
 * PUT /api/admin/voip/simultaneous-ring — Update sim-ring config (endpoints, settings)
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { auth } from '@/lib/auth-config';
import {
  getSimRingConfig,
  configureSimultaneousRing,
  autoConfigureEndpoints,
  type SimultaneousRingConfig,
} from '@/lib/voip/simultaneous-ring';

/**
 * GET - Get simultaneous ring configuration for the current user.
 * Query: ?autoDetect=true — auto-discover endpoints from user's devices
 */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const autoDetect = searchParams.get('autoDetect');

    const config = getSimRingConfig(session.user.id);

    // If requested, auto-discover available endpoints
    let detectedEndpoints = null;
    if (autoDetect === 'true') {
      detectedEndpoints = await autoConfigureEndpoints(session.user.id);
    }

    return NextResponse.json({
      data: {
        config: config ?? {
          userId: session.user.id,
          enabled: false,
          endpoints: [],
          voicemailFallback: true,
          totalTimeout: 25,
        },
        ...(detectedEndpoints ? { detectedEndpoints } : {}),
      },
    });
  } catch (error) {
    logger.error('[VoIP SimRing] Failed to get sim-ring config', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Failed to get sim-ring config' }, { status: 500 });
  }
}

/**
 * PUT - Update simultaneous ring configuration.
 * Body: Partial<SimultaneousRingConfig>
 *   { enabled?, endpoints?, voicemailFallback?, totalTimeout? }
 *   or { autoSetup: true } — auto-configure from user's devices
 */
export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Auto-setup from user's registered devices
    if (body.autoSetup === true) {
      const endpoints = await autoConfigureEndpoints(session.user.id);
      const config = await configureSimultaneousRing(session.user.id, {
        enabled: true,
        endpoints,
      });
      return NextResponse.json({ data: config });
    }

    // Manual config update
    const { enabled, endpoints, voicemailFallback, totalTimeout } =
      body as Partial<SimultaneousRingConfig>;

    const updates: Partial<SimultaneousRingConfig> = {};
    if (typeof enabled === 'boolean') updates.enabled = enabled;
    if (endpoints) updates.endpoints = endpoints;
    if (typeof voicemailFallback === 'boolean') updates.voicemailFallback = voicemailFallback;
    if (typeof totalTimeout === 'number') updates.totalTimeout = totalTimeout;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update. Provide enabled, endpoints, voicemailFallback, totalTimeout, or autoSetup.' },
        { status: 400 }
      );
    }

    const config = await configureSimultaneousRing(session.user.id, updates);

    return NextResponse.json({ data: config });
  } catch (error) {
    logger.error('[VoIP SimRing] Failed to update sim-ring config', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Failed to update sim-ring config' }, { status: 500 });
  }
}
