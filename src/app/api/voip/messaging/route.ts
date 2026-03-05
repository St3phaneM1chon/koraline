export const dynamic = 'force-dynamic';

/**
 * VoIP Messaging API — SMS / WhatsApp / MMS via Telnyx
 *
 * GET  /api/voip/messaging — List conversations or messages for a number
 * POST /api/voip/messaging — Send a message (SMS, WhatsApp, or MMS)
 *
 * Wires into: src/lib/voip/messaging-channel.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { auth } from '@/lib/auth-config';
import { MessagingChannel, type Message } from '@/lib/voip/messaging-channel';

/**
 * Lazy-initialized singleton instance.
 * Avoids top-level SDK init issues (KB-PP-BUILD-002 pattern).
 */
let messagingInstance: MessagingChannel | null = null;

function getMessaging(): MessagingChannel {
  if (!messagingInstance) {
    messagingInstance = new MessagingChannel();
  }
  return messagingInstance;
}

/**
 * GET - List conversations or messages for a specific phone number.
 *
 * Query params:
 * - phoneNumber: if provided, returns messages for that conversation
 * - (no param): returns all conversation summaries
 */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const phoneNumber = searchParams.get('phoneNumber');
    const messaging = getMessaging();

    if (phoneNumber) {
      const messages = messaging.getConversation(phoneNumber);
      return NextResponse.json({ data: messages });
    }

    // Return all conversations with last message summary
    const allConversations = messaging.getAllConversations();
    const summaries: Array<{
      phoneNumber: string;
      lastMessage: Message | undefined;
      messageCount: number;
    }> = [];

    for (const [number, messages] of allConversations) {
      summaries.push({
        phoneNumber: number,
        lastMessage: messages[messages.length - 1],
        messageCount: messages.length,
      });
    }

    // Sort by last message timestamp (most recent first)
    summaries.sort((a, b) => {
      const ta = a.lastMessage?.timestamp?.getTime() ?? 0;
      const tb = b.lastMessage?.timestamp?.getTime() ?? 0;
      return tb - ta;
    });

    return NextResponse.json({ data: summaries });
  } catch (error) {
    logger.error('[Messaging API] Failed to list messages', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Failed to list messages' }, { status: 500 });
  }
}

/**
 * POST - Send a message (SMS, WhatsApp, or MMS).
 *
 * Body:
 * - to: string (E.164 phone number)
 * - body: string (message text)
 * - channel: 'sms' | 'whatsapp' | 'mms' (default: 'sms')
 * - from?: string (override sender number)
 * - mediaUrls?: string[] (for MMS only)
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const reqBody = await request.json();
    const { to, body, channel = 'sms', from, mediaUrls } = reqBody as {
      to: string;
      body: string;
      channel?: 'sms' | 'whatsapp' | 'mms';
      from?: string;
      mediaUrls?: string[];
    };

    if (!to || !body) {
      return NextResponse.json(
        { error: 'Missing required fields: to, body' },
        { status: 400 },
      );
    }

    // Validate E.164 format
    if (!/^\+[1-9]\d{1,14}$/.test(to)) {
      return NextResponse.json(
        { error: 'Invalid phone number format. Must be E.164 (e.g., +15145551234)' },
        { status: 400 },
      );
    }

    const messaging = getMessaging();
    let message: Message;

    switch (channel) {
      case 'whatsapp':
        message = await messaging.sendWhatsApp(to, body);
        break;
      case 'mms':
        if (!mediaUrls || mediaUrls.length === 0) {
          return NextResponse.json(
            { error: 'MMS requires at least one mediaUrl' },
            { status: 400 },
          );
        }
        message = await messaging.sendMMS(to, body, mediaUrls);
        break;
      default:
        message = await messaging.sendSMS(to, body, from);
        break;
    }

    logger.info('[Messaging API] Message sent', {
      messageId: message.id,
      channel,
      to,
      userId: session.user.id,
    });

    return NextResponse.json({ data: message }, { status: 201 });
  } catch (error) {
    logger.error('[Messaging API] Failed to send message', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send message' },
      { status: 500 },
    );
  }
}
