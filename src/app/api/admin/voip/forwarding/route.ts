export const dynamic = 'force-dynamic';

/**
 * VoIP Call Forwarding Rules API
 *
 * GET    /api/admin/voip/forwarding — Get forwarding config for current user
 * POST   /api/admin/voip/forwarding — Set forwarding rules
 * PUT    /api/admin/voip/forwarding — Toggle a rule or global forwarding
 * DELETE /api/admin/voip/forwarding — Remove a forwarding rule
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { auth } from '@/lib/auth-config';
import {
  getForwardingConfig,
  setForwardingRules,
  toggleRule,
  toggleGlobalForwarding,
  removeRule,
  clearForwarding,
  type ForwardingRule,
} from '@/lib/voip/call-forwarding';

/**
 * GET - Get call forwarding configuration for the current user.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const config = getForwardingConfig(session.user.id);

    return NextResponse.json({
      data: config ?? {
        userId: session.user.id,
        extensionId: null,
        rules: [],
        globalEnabled: false,
      },
    });
  } catch (error) {
    logger.error('[VoIP Forwarding] Failed to get forwarding config', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Failed to get forwarding config' }, { status: 500 });
  }
}

/**
 * POST - Set forwarding rules for the current user.
 * Body: { rules: ForwardingRule[] }
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { rules } = body as { rules: ForwardingRule[] };

    if (!rules || !Array.isArray(rules)) {
      return NextResponse.json(
        { error: 'Missing or invalid rules array' },
        { status: 400 }
      );
    }

    const config = await setForwardingRules(session.user.id, rules);

    return NextResponse.json({ data: config });
  } catch (error) {
    logger.error('[VoIP Forwarding] Failed to set forwarding rules', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Failed to set forwarding rules' }, { status: 500 });
  }
}

/**
 * PUT - Toggle a specific rule or global forwarding.
 * Body: { ruleId?: string, enabled: boolean } or { globalEnabled: boolean }
 */
export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { ruleId, enabled, globalEnabled } = body as {
      ruleId?: string;
      enabled?: boolean;
      globalEnabled?: boolean;
    };

    if (typeof globalEnabled === 'boolean') {
      toggleGlobalForwarding(session.user.id, globalEnabled);
    } else if (ruleId && typeof enabled === 'boolean') {
      toggleRule(session.user.id, ruleId, enabled);
    } else {
      return NextResponse.json(
        { error: 'Provide { ruleId, enabled } or { globalEnabled }' },
        { status: 400 }
      );
    }

    const config = getForwardingConfig(session.user.id);
    return NextResponse.json({ data: config });
  } catch (error) {
    logger.error('[VoIP Forwarding] Failed to toggle forwarding', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Failed to toggle forwarding' }, { status: 500 });
  }
}

/**
 * DELETE - Remove a forwarding rule or clear all rules.
 * Query: ?ruleId=xxx or ?clearAll=true
 */
export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const ruleId = searchParams.get('ruleId');
    const clearAll = searchParams.get('clearAll');

    if (clearAll === 'true') {
      clearForwarding(session.user.id);
      return NextResponse.json({ data: { cleared: true } });
    }

    if (!ruleId) {
      return NextResponse.json(
        { error: 'Missing ruleId query parameter' },
        { status: 400 }
      );
    }

    removeRule(session.user.id, ruleId);
    const config = getForwardingConfig(session.user.id);

    return NextResponse.json({ data: config });
  } catch (error) {
    logger.error('[VoIP Forwarding] Failed to remove forwarding rule', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Failed to remove forwarding rule' }, { status: 500 });
  }
}
