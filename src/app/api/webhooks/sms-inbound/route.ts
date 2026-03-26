export const dynamic = 'force-dynamic';

/**
 * Inbound SMS Webhook
 * Receives incoming SMS from Telnyx and creates/updates InboxConversation records.
 * Enables 2-way SMS conversations in the CRM unified inbox.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verify } from 'crypto';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import { getRedisClient } from '@/lib/redis';

const smsInboundSchema = z.object({
  data: z.object({
    event_type: z.string(),
    id: z.string().optional(),
    payload: z.object({
      from: z.object({ phone_number: z.string() }).optional(),
      to: z.array(z.object({ phone_number: z.string() })).optional(),
      text: z.string().optional(),
    }).passthrough(),
  }).passthrough(),
}).passthrough();

/**
 * VOIP-F9 FIX: Verify Telnyx webhook signature using Ed25519 (not HMAC-SHA256).
 * Telnyx signs webhooks with Ed25519. The public key is the TELNYX_WEBHOOK_SECRET (base64-encoded).
 */
function verifyTelnyxEd25519(
  rawBody: string,
  signature: string | null,
  timestamp: string | null,
  publicKeyBase64: string
): boolean {
  if (!signature || !timestamp) return false;
  try {
    const signedPayload = `${timestamp}|${rawBody}`;
    const signatureBuffer = Buffer.from(signature, 'base64');
    const publicKeyDer = Buffer.concat([
      Buffer.from('302a300506032b6570032100', 'hex'),
      Buffer.from(publicKeyBase64, 'base64'),
    ]);
    return verify(
      null,
      Buffer.from(signedPayload),
      { key: publicKeyDer, format: 'der', type: 'spki' },
      signatureBuffer,
    );
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();

    // VOIP-F9 FIX: Verify Telnyx webhook signature using Ed25519 (consistent with voip/webhooks/telnyx)
    const publicKeyBase64 = process.env.TELNYX_WEBHOOK_SECRET;
    if (!publicKeyBase64) {
      logger.error('[SMS Inbound] TELNYX_WEBHOOK_SECRET not set — REJECTING request');
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 });
    } else {
      const signature = request.headers.get('telnyx-signature-ed25519');
      const timestamp = request.headers.get('telnyx-timestamp');

      // Replay protection: reject timestamps older than 5 minutes
      if (!timestamp || Math.abs(Date.now() / 1000 - parseInt(timestamp)) > 300) {
        logger.warn('[SMS Inbound] Missing or stale timestamp header');
        return NextResponse.json({ error: 'Invalid timestamp' }, { status: 403 });
      }

      if (!verifyTelnyxEd25519(rawBody, signature, timestamp, publicKeyBase64)) {
        logger.warn('[SMS Inbound] Invalid Ed25519 signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const rawParsed = JSON.parse(rawBody);
    const parsed = smsInboundSchema.safeParse(rawParsed);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const body = parsed.data;

    // Telnyx webhook format
    const event = body.data;
    if (!event || event.event_type !== 'message.received') {
      return NextResponse.json({ success: true }); // Acknowledge non-message events
    }

    // Idempotency check: skip if this event was already processed (Redis-based, TTL 24h)
    const smsEventId = event.id;
    if (smsEventId) {
      try {
        const redis = await getRedisClient();
        if (redis) {
          const idempotencyKey = `webhook:sms-inbound:${smsEventId}`;
          const alreadyProcessed = await redis.get(idempotencyKey);
          if (alreadyProcessed) {
            logger.info('[SMS Inbound] Duplicate event skipped', { eventId: smsEventId });
            return NextResponse.json({ success: true });
          }
          await redis.set(idempotencyKey, '1', 'EX', 86400);
        }
      } catch (redisErr) {
        // Redis unavailable — proceed without idempotency (prefer processing over skipping)
        logger.debug('[SMS Inbound] Redis idempotency check unavailable, proceeding', {
          error: redisErr instanceof Error ? redisErr.message : String(redisErr),
        });
      }
    }

    const payload = event.payload;
    const fromPhone = payload.from?.phone_number;
    const toPhone = payload.to?.[0]?.phone_number;
    const messageText = payload.text;

    if (!fromPhone || !messageText) {
      return NextResponse.json({ success: true });
    }

    // Check for opt-out keywords
    const optOutKeywords = ['stop', 'unsubscribe', 'cancel', 'arret', 'arreter'];
    if (optOutKeywords.includes(messageText.trim().toLowerCase())) {
      // Handle opt-out
      await prisma.smsOptOut.upsert({
        where: { phone: fromPhone },
        create: { phone: fromPhone, reason: 'STOP keyword' },
        update: { reason: 'STOP keyword' },
      });

      logger.info('SMS opt-out received', { phone: fromPhone });
      return NextResponse.json({ success: true });
    }

    // Find lead by phone
    const lead = await prisma.crmLead.findFirst({
      where: {
        OR: [
          { phone: fromPhone },
          { phone: fromPhone.replace(/^\+1/, '') },
          { phone: `+1${fromPhone.replace(/^\+/, '')}` },
        ],
      },
      select: { id: true, contactName: true, assignedToId: true },
    });

    // Find or create inbox conversation
    let conversation = await prisma.inboxConversation.findFirst({
      where: {
        channel: 'SMS',
        status: { not: 'RESOLVED' },
        ...(lead ? { leadId: lead.id } : {}),
      },
      orderBy: { lastMessageAt: 'desc' },
    });

    if (!conversation) {
      conversation = await prisma.inboxConversation.create({
        data: {
          channel: 'SMS',
          status: 'OPEN',
          subject: `SMS from ${lead?.contactName || fromPhone}`,
          leadId: lead?.id,
          assignedToId: lead?.assignedToId,
          lastMessageAt: new Date(),
        },
      });
    }

    // Create inbox message
    await prisma.inboxMessage.create({
      data: {
        conversationId: conversation.id,
        direction: 'INBOUND',
        content: messageText,
        senderName: lead?.contactName || fromPhone,
        senderPhone: fromPhone,
        metadata: {
          telnyxMessageId: event.id,
          toPhone,
        },
      },
    });

    // Update conversation
    await prisma.inboxConversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: new Date(), status: 'OPEN' },
    });

    // Create CRM activity if lead found
    if (lead) {
      await prisma.crmActivity.create({
        data: {
          type: 'SMS',
          title: 'Inbound SMS received',
          description: messageText.slice(0, 500),
          leadId: lead.id,
          performedById: lead.assignedToId,
          metadata: {
            direction: 'inbound',
            fromPhone,
            conversationId: conversation.id,
          },
        },
      });

      // Update lead last contacted
      await prisma.crmLead.update({
        where: { id: lead.id },
        data: { lastContactedAt: new Date() },
      });
    }

    logger.info('Inbound SMS processed', {
      from: fromPhone,
      leadId: lead?.id,
      conversationId: conversation.id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('SMS inbound webhook error', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ success: true }); // Always 200 for webhooks to prevent retries
  }
}
