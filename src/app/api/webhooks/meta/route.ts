export const dynamic = 'force-dynamic';

/**
 * Meta Webhook (Facebook + Instagram)
 * GET:  Meta webhook verification (hub.verify_token, hub.challenge).
 * POST: Handle incoming Facebook Messenger and Instagram DM messages.
 *
 * NO auth guard - this is a webhook endpoint.
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import {
  processFacebookMessage,
  processInstagramMessage,
} from '@/lib/crm/social-inbox';

// ---------------------------------------------------------------------------
// GET: Webhook verification
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get('hub.mode');
  const token = request.nextUrl.searchParams.get('hub.verify_token');
  const challenge = request.nextUrl.searchParams.get('hub.challenge');

  const verifyToken =
    process.env.META_WEBHOOK_VERIFY_TOKEN || 'biocycle_meta_verify';

  if (mode === 'subscribe' && token === verifyToken) {
    logger.info('[Meta Webhook] Verification successful');
    // Meta expects the challenge value as plain text response
    return new NextResponse(challenge || '', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  logger.warn('[Meta Webhook] Verification failed', {
    mode,
    tokenMatch: token === verifyToken,
  });
  return NextResponse.json(
    { error: 'Verification failed' },
    { status: 403 },
  );
}

// ---------------------------------------------------------------------------
// POST: Handle incoming messages
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();

    // Determine the source: Facebook Messenger or Instagram
    const objectType = payload.object;

    if (objectType === 'page') {
      // Facebook Messenger webhook
      await processFacebookMessage(payload);
      logger.info('[Meta Webhook] Facebook message processed');
    } else if (objectType === 'instagram') {
      // Instagram DM webhook
      await processInstagramMessage(payload);
      logger.info('[Meta Webhook] Instagram message processed');
    } else {
      // Unknown object type - could be comments, reactions, etc.
      // Log and acknowledge
      logger.info('[Meta Webhook] Unhandled object type', {
        object: objectType,
      });
    }

    // Meta requires a 200 response within 20 seconds
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('[Meta Webhook] Error processing webhook', {
      error: error instanceof Error ? error.message : String(error),
    });
    // Always return 200 for Meta webhooks to prevent retries
    return NextResponse.json({ success: true });
  }
}
