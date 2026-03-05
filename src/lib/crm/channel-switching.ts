/**
 * SEAMLESS CHANNEL SWITCHING (E13)
 * Continue conversations across channels (email -> chat -> phone -> SMS)
 * Links InboxConversation records for the same contact, preserving context.
 */

import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Channel = 'EMAIL' | 'SMS' | 'PHONE' | 'CHAT' | 'WHATSAPP' | 'FACEBOOK' | 'INSTAGRAM';

interface ChannelSwitchConfig {
  /** Copy last N messages as context into the new channel conversation */
  contextMessageCount?: number;
  /** Carry forward the same agent assignment */
  preserveAssignment?: boolean;
  /** Transfer subject line */
  preserveSubject?: boolean;
}

interface ConversationHistoryEntry {
  id: string;
  channel: string;
  status: string;
  subject: string | null;
  lastMessageAt: Date | null;
  messageCount: number;
  createdAt: Date;
}

interface MergedContext {
  contactId: string | null;
  leadId: string | null;
  totalMessages: number;
  channels: string[];
  latestSubject: string | null;
  summarySnippets: string[];
}

// ---------------------------------------------------------------------------
// Switch channel
// ---------------------------------------------------------------------------

/**
 * Create a new InboxConversation on `newChannel` linked to the same contact/lead
 * as the source conversation. Optionally copies recent message context.
 *
 * Returns the new conversation ID and a flag indicating success.
 */
export async function switchChannel(
  conversationId: string,
  newChannel: Channel,
  config: ChannelSwitchConfig = {},
): Promise<{ newConversationId: string; contextCopied: number }> {
  const {
    contextMessageCount = 5,
    preserveAssignment = true,
    preserveSubject = true,
  } = config;

  const source = await prisma.inboxConversation.findUnique({
    where: { id: conversationId },
    include: {
      messages: {
        orderBy: { createdAt: 'desc' },
        take: contextMessageCount,
      },
    },
  });

  if (!source) {
    throw new Error(`Conversation ${conversationId} not found`);
  }

  if (source.channel === newChannel) {
    throw new Error(`Conversation is already on channel ${newChannel}`);
  }

  // Create the new conversation on the target channel
  const newConversation = await prisma.inboxConversation.create({
    data: {
      channel: newChannel,
      status: 'OPEN',
      subject: preserveSubject ? source.subject : null,
      contactId: source.contactId,
      leadId: source.leadId,
      assignedToId: preserveAssignment ? source.assignedToId : null,
      lastMessageAt: new Date(),
    },
  });

  // Copy recent messages as context into the new conversation
  let contextCopied = 0;
  if (contextMessageCount > 0 && source.messages.length > 0) {
    const contextMessages = source.messages.reverse(); // chronological order

    for (const msg of contextMessages) {
      await prisma.inboxMessage.create({
        data: {
          conversationId: newConversation.id,
          direction: msg.direction,
          content: msg.content,
          senderName: msg.senderName,
          senderEmail: msg.senderEmail,
          senderPhone: msg.senderPhone,
          metadata: {
            copiedFrom: source.id,
            originalChannel: source.channel,
            originalCreatedAt: msg.createdAt.toISOString(),
            isContextCopy: true,
          },
        },
      });
      contextCopied++;
    }
  }

  // Mark the source conversation as pending (agent switched channel)
  await prisma.inboxConversation.update({
    where: { id: conversationId },
    data: { status: 'PENDING' },
  });

  logger.info('[ChannelSwitch] Channel switched', {
    sourceId: conversationId,
    sourceChannel: source.channel,
    newId: newConversation.id,
    newChannel,
    contextCopied,
    contactId: source.contactId,
    leadId: source.leadId,
  });

  return { newConversationId: newConversation.id, contextCopied };
}

// ---------------------------------------------------------------------------
// Get conversation history for a contact
// ---------------------------------------------------------------------------

/**
 * Retrieve all InboxConversation records for a given contact (User or CrmLead),
 * across all channels. Useful for seeing the full communication history.
 */
export async function getConversationHistory(
  contactId: string,
): Promise<ConversationHistoryEntry[]> {
  const conversations = await prisma.inboxConversation.findMany({
    where: {
      OR: [
        { contactId },
        { leadId: contactId },
      ],
    },
    include: {
      _count: { select: { messages: true } },
    },
    orderBy: { lastMessageAt: 'desc' },
  });

  return conversations.map((c) => ({
    id: c.id,
    channel: c.channel,
    status: c.status,
    subject: c.subject,
    lastMessageAt: c.lastMessageAt,
    messageCount: c._count.messages,
    createdAt: c.createdAt,
  }));
}

// ---------------------------------------------------------------------------
// Merge channel contexts
// ---------------------------------------------------------------------------

/**
 * Build a merged view of multiple conversations belonging to the same contact.
 * Extracts the latest subject, total message count, and a snippet from each
 * conversation for agent context.
 */
export async function mergeChannelContexts(
  conversationIds: string[],
): Promise<MergedContext> {
  if (conversationIds.length === 0) {
    return {
      contactId: null,
      leadId: null,
      totalMessages: 0,
      channels: [],
      latestSubject: null,
      summarySnippets: [],
    };
  }

  const conversations = await prisma.inboxConversation.findMany({
    where: { id: { in: conversationIds } },
    include: {
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 2, // last 2 messages per conversation for snippets
        select: { content: true, direction: true, createdAt: true },
      },
      _count: { select: { messages: true } },
    },
    orderBy: { lastMessageAt: 'desc' },
  });

  const channels = [...new Set(conversations.map((c) => c.channel))];
  const totalMessages = conversations.reduce((sum, c) => sum + c._count.messages, 0);
  const latestSubject = conversations[0]?.subject ?? null;
  const contactId = conversations[0]?.contactId ?? null;
  const leadId = conversations[0]?.leadId ?? null;

  const summarySnippets = conversations.map((c) => {
    const lastMsg = c.messages[0];
    const snippet = lastMsg ? lastMsg.content.slice(0, 120) : '(empty)';
    return `[${c.channel}] ${snippet}`;
  });

  logger.debug('[ChannelSwitch] Contexts merged', {
    conversationIds,
    channels,
    totalMessages,
  });

  return {
    contactId,
    leadId,
    totalMessages,
    channels,
    latestSubject,
    summarySnippets,
  };
}
