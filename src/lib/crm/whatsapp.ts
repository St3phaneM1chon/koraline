/**
 * WHATSAPP BUSINESS API INTEGRATION
 * Send/receive WhatsApp messages via Twilio WhatsApp API.
 * Lazy-initializes Twilio client. Falls back to mock when credentials are missing.
 */

import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

// ---------------------------------------------------------------------------
// Lazy Twilio client
// ---------------------------------------------------------------------------

let _twilioClient: any | null = null;

function getTwilioClient(): any | null {
  if (_twilioClient) return _twilioClient;

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    logger.warn('[WhatsApp] TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN not set - using mock mode');
    return null;
  }

  try {
    // Dynamic require to avoid build failure if twilio not installed
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const twilio = require('twilio');
    _twilioClient = twilio(accountSid, authToken);
    return _twilioClient;
  } catch {
    logger.warn('[WhatsApp] twilio package not installed - using mock mode');
    return null;
  }
}

// ---------------------------------------------------------------------------
// Send WhatsApp message
// ---------------------------------------------------------------------------

/**
 * Send a WhatsApp message via Twilio.
 * If Twilio credentials are not configured, logs a warning and returns a mock response.
 */
export async function sendWhatsAppMessage(
  to: string,
  body: string,
  templateId?: string,
): Promise<{ messageId: string; status: string }> {
  const client = getTwilioClient();
  const fromNumber = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';

  if (!client) {
    const mockId = `mock_wa_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    logger.info('[WhatsApp] Mock send', { to, bodyLength: body.length, templateId, mockId });
    return { messageId: mockId, status: 'mock_sent' };
  }

  try {
    const toWhatsApp = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
    const msgPayload: Record<string, string> = {
      from: fromNumber.startsWith('whatsapp:') ? fromNumber : `whatsapp:${fromNumber}`,
      to: toWhatsApp,
      body,
    };

    if (templateId) {
      msgPayload.contentSid = templateId;
    }

    const message = await client.messages.create(msgPayload);

    logger.info('[WhatsApp] Message sent', {
      messageId: message.sid,
      to,
      status: message.status,
    });

    return { messageId: message.sid, status: message.status };
  } catch (error) {
    logger.error('[WhatsApp] Failed to send message', {
      to,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Send WhatsApp template
// ---------------------------------------------------------------------------

/**
 * Send an approved WhatsApp template message via Twilio Content API.
 */
export async function sendWhatsAppTemplate(
  to: string,
  templateName: string,
  params: Record<string, string>,
): Promise<{ messageId: string }> {
  const client = getTwilioClient();
  const fromNumber = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';

  if (!client) {
    const mockId = `mock_wa_tpl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    logger.info('[WhatsApp] Mock template send', { to, templateName, params, mockId });
    return { messageId: mockId };
  }

  try {
    const toWhatsApp = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

    // Build content variables from params
    const contentVariables = JSON.stringify(params);

    const message = await client.messages.create({
      from: fromNumber.startsWith('whatsapp:') ? fromNumber : `whatsapp:${fromNumber}`,
      to: toWhatsApp,
      contentSid: templateName,
      contentVariables,
    });

    logger.info('[WhatsApp] Template sent', {
      messageId: message.sid,
      to,
      templateName,
    });

    return { messageId: message.sid };
  } catch (error) {
    logger.error('[WhatsApp] Failed to send template', {
      to,
      templateName,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Process incoming webhook
// ---------------------------------------------------------------------------

/**
 * Parse an incoming Twilio WhatsApp webhook payload.
 * Returns normalized message data.
 */
export async function processWhatsAppWebhook(
  payload: any,
): Promise<{ from: string; body: string; messageId: string }> {
  // Twilio sends URL-encoded form data converted to object
  const from = payload.From || payload.WaId || '';
  const body = payload.Body || '';
  const messageId = payload.MessageSid || payload.SmsSid || `wa_${Date.now()}`;

  // Strip whatsapp: prefix for storage
  const normalizedFrom = from.replace('whatsapp:', '');

  logger.info('[WhatsApp] Webhook received', {
    from: normalizedFrom,
    messageId,
    bodyLength: body.length,
  });

  return {
    from: normalizedFrom,
    body,
    messageId,
  };
}

// ---------------------------------------------------------------------------
// Create WhatsApp conversation
// ---------------------------------------------------------------------------

/**
 * Create a new InboxConversation with channel WHATSAPP and an initial inbound message.
 * Attempts to match the sender phone to an existing CrmLead.
 * Returns the conversation ID.
 */
export async function createWhatsAppConversation(
  from: string,
  body: string,
): Promise<string> {
  // Try to find existing lead by phone
  const normalizedPhone = from.replace(/^\+/, '');
  const lead = await prisma.crmLead.findFirst({
    where: {
      OR: [
        { phone: from },
        { phone: `+${normalizedPhone}` },
        { phone: normalizedPhone },
        { phone: `+1${normalizedPhone}` },
      ],
    },
    select: { id: true, contactName: true, assignedToId: true },
  });

  // Check for existing open conversation on this channel + lead
  let conversation = await prisma.inboxConversation.findFirst({
    where: {
      channel: 'WHATSAPP',
      status: { not: 'RESOLVED' },
      ...(lead ? { leadId: lead.id } : {}),
    },
    orderBy: { lastMessageAt: 'desc' },
  });

  if (!conversation) {
    conversation = await prisma.inboxConversation.create({
      data: {
        channel: 'WHATSAPP',
        status: 'OPEN',
        subject: `WhatsApp from ${lead?.contactName || from}`,
        leadId: lead?.id,
        assignedToId: lead?.assignedToId,
        lastMessageAt: new Date(),
      },
    });
  }

  // Create the inbound message
  await prisma.inboxMessage.create({
    data: {
      conversationId: conversation.id,
      direction: 'INBOUND',
      content: body,
      senderName: lead?.contactName || from,
      senderPhone: from,
      metadata: { channel: 'whatsapp' },
    },
  });

  // Update conversation timestamp
  await prisma.inboxConversation.update({
    where: { id: conversation.id },
    data: { lastMessageAt: new Date(), status: 'OPEN' },
  });

  // Create CRM activity if lead found
  if (lead) {
    await prisma.crmActivity.create({
      data: {
        type: 'SMS', // closest available enum for WhatsApp
        title: 'Inbound WhatsApp message',
        description: body.slice(0, 500),
        leadId: lead.id,
        performedById: lead.assignedToId,
        metadata: {
          direction: 'inbound',
          channel: 'whatsapp',
          fromPhone: from,
          conversationId: conversation.id,
        },
      },
    });

    await prisma.crmLead.update({
      where: { id: lead.id },
      data: { lastContactedAt: new Date() },
    });
  }

  logger.info('[WhatsApp] Conversation created/updated', {
    conversationId: conversation.id,
    leadId: lead?.id,
    from,
  });

  return conversation.id;
}

// ---------------------------------------------------------------------------
// Validate Twilio signature
// ---------------------------------------------------------------------------

/**
 * Validate the X-Twilio-Signature header for webhook authenticity.
 */
export function validateTwilioSignature(
  url: string,
  params: Record<string, string>,
  signature: string,
): boolean {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken) {
    logger.warn('[WhatsApp] No TWILIO_AUTH_TOKEN - skipping signature validation');
    return true; // Allow in dev/unconfigured mode
  }

  try {
    // Dynamic require
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const twilio = require('twilio');
    return twilio.validateRequest(authToken, signature, url, params);
  } catch {
    logger.warn('[WhatsApp] twilio package not installed - skipping signature validation');
    return true;
  }
}
