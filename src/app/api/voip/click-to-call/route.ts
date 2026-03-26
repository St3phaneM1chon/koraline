export const dynamic = 'force-dynamic';

/**
 * VoIP Click-to-Call — Initiate outbound call from CRM/email
 *
 * POST   /api/voip/click-to-call — Initiate an outbound call
 *
 * Flow:
 * 1. Verify auth and get agent's SIP extension
 * 2. Dial the agent's softphone first
 * 3. Bridge to the target number once agent answers
 * 4. Return call control ID for tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/db';
import { withAdminGuard } from '@/lib/admin-api-guard';
import { checkRateLimit } from '@/lib/security';

/**
 * POST - Initiate a click-to-call outbound call.
 */
// VOIP-F6 FIX: Strict per-user rate limit for outbound call initiation (toll fraud prevention)
const CALL_RATE_LIMIT = 5;
const CALL_RATE_WINDOW_MS = 60_000;

export const POST = withAdminGuard(async (request: NextRequest, { session }) => {
  try {
    // VOIP-F6 FIX: Per-user rate limit for call initiation (toll fraud prevention)
    const callRateKey = `voip:click-to-call:${session.user.id}`;
    const rateResult = checkRateLimit(callRateKey, CALL_RATE_LIMIT, CALL_RATE_WINDOW_MS);
    if (!rateResult.allowed) {
      const retryAfter = String(Math.ceil(rateResult.resetIn / 1000));
      return new NextResponse(
        JSON.stringify({ error: 'Call rate limit exceeded. Maximum 5 calls per minute.' }),
        { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': retryAfter } }
      );
    }

    const raw = await request.json();
    const parsed = z.object({
      to: z.string().regex(/^\+[1-9]\d{1,14}$/, 'Must be E.164 format (e.g., +15145551234)'),
      from: z.string().optional(),
      agentId: z.string().optional(),
    }).safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input' },
        { status: 400 }
      );
    }
    const { to, from, agentId } = parsed.data;

    // Determine which agent is making the call
    const effectiveAgentId = agentId || session.user.id;

    // Get the agent's SIP extension
    const sipExtension = await prisma.sipExtension.findFirst({
      where: {
        userId: effectiveAgentId,
        isRegistered: true,
      },
    });

    if (!sipExtension) {
      return NextResponse.json(
        { error: 'No registered SIP extension found for agent. Please register your softphone first.' },
        { status: 404 }
      );
    }

    // Lazy-import telnyx to avoid top-level init issues (KB-PP-BUILD-002)
    let dialCall: typeof import('@/lib/telnyx').dialCall;
    let getTelnyxConnectionId: typeof import('@/lib/telnyx').getTelnyxConnectionId;
    let getDefaultCallerId: typeof import('@/lib/telnyx').getDefaultCallerId;

    try {
      const telnyxModule = await import('@/lib/telnyx');
      dialCall = telnyxModule.dialCall;
      getTelnyxConnectionId = telnyxModule.getTelnyxConnectionId;
      getDefaultCallerId = telnyxModule.getDefaultCallerId;
    } catch (importError) {
      logger.error('[VoIP ClickToCall] Failed to load Telnyx module', {
        error: importError instanceof Error ? importError.message : String(importError),
      });
      return NextResponse.json(
        { error: 'Telephony service unavailable' },
        { status: 503 }
      );
    }

    const connectionId = getTelnyxConnectionId();
    const callerId = from || getDefaultCallerId();

    // VOIP-F12 FIX: Verify the "from" number belongs to the tenant (prevent caller ID spoofing)
    if (from) {
      const ownedNumber = await prisma.phoneNumber.findFirst({
        where: { number: callerId, isActive: true },
        select: { id: true },
      });
      if (!ownedNumber) {
        return NextResponse.json(
          { error: 'Caller ID number not authorized for this account' },
          { status: 403 }
        );
      }
    }

    // Step 1: Dial the agent's extension first (ring their softphone)
    const agentCallResult = await dialCall({
      to: `sip:${sipExtension.extension}@${sipExtension.sipDomain}`,
      from: callerId,
      connectionId,
      clientState: JSON.stringify({
        type: 'click_to_call',
        targetNumber: to,
        agentId: effectiveAgentId,
        initiatedBy: session.user.id,
      }),
      timeout: 30,
    });

    logger.info('[VoIP ClickToCall] Call initiated', {
      agentId: effectiveAgentId,
      targetNumber: to,
      callControlId: agentCallResult.data.call_control_id,
      extension: sipExtension.extension,
    });

    return NextResponse.json({
      data: {
        callControlId: agentCallResult.data.call_control_id,
        callSessionId: agentCallResult.data.call_session_id,
        status: 'initiating',
        agentExtension: sipExtension.extension,
        targetNumber: to,
      },
    });
  } catch (error) {
    logger.error('[VoIP ClickToCall] Failed to initiate call', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Failed to initiate call' }, { status: 500 });
  }
});
