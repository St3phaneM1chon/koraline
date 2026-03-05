export const dynamic = 'force-dynamic';

/**
 * Inbound SMS Webhook
 * Receives incoming SMS from Telnyx and creates/updates InboxConversation records.
 * Enables 2-way SMS conversations in the CRM unified inbox.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Telnyx webhook format
    const event = body.data;
    if (!event || event.event_type !== 'message.received') {
      return NextResponse.json({ success: true }); // Acknowledge non-message events
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
