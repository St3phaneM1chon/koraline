/**
 * CUSTOMER EXPERIENCE MEMORY (K20)
 * Cross-session customer context graph that remembers everything about a customer.
 * Builds a unified profile from all touchpoints: calls, emails, chats, orders,
 * tickets, and activities. Stores memory in CrmLead.customFields JSON.
 * Queries CrmActivity, InboxConversation, CallLog, CrmTicket, and Order for data.
 */

import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

// ---------------------------------------------------------------------------
// Lazy OpenAI client
// ---------------------------------------------------------------------------

let _openai: ReturnType<typeof require> | null = null;

function getOpenAI(): { chat: { completions: { create: (params: Record<string, unknown>) => Promise<{ choices?: { message?: { content?: string } }[] }> } } } {
  if (_openai) return _openai;

  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not set');
  }

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { default: OpenAI } = require('openai');
  _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _openai;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CustomerMemory {
  leadId: string;
  contactName: string;
  email: string | null;
  phone: string | null;
  companyName: string | null;
  totalInteractions: number;
  firstContactDate: string | null;
  lastContactDate: string | null;
  sentimentTrend: SentimentPoint[];
  preferredChannel: string;
  communicationStyle: string;
  topics: string[];
  recentIssues: RecentIssue[];
  orderHistory: OrderSummary[];
  ticketHistory: TicketSummary[];
  preferences: Record<string, string>;
  healthScore: number;
  healthLevel: 'EXCELLENT' | 'GOOD' | 'AT_RISK' | 'CRITICAL';
  lastUpdated: string;
}

export interface SentimentPoint {
  date: string;
  score: number;
  channel: string;
}

export interface RecentIssue {
  date: string;
  subject: string;
  resolved: boolean;
  channel: string;
}

export interface OrderSummary {
  orderId: string;
  date: string;
  total: number;
  status: string;
  itemCount: number;
}

export interface TicketSummary {
  ticketId: string;
  number: string;
  subject: string;
  status: string;
  priority: string;
  createdAt: string;
  resolvedAt: string | null;
}

export interface CustomerContext {
  leadId: string;
  contactName: string;
  summary: string;
  preferredChannel: string;
  communicationStyle: string;
  sentimentTrend: 'improving' | 'stable' | 'declining';
  currentSentiment: number;
  lastIssues: RecentIssue[];
  recentOrders: OrderSummary[];
  openTickets: TicketSummary[];
  preferences: Record<string, string>;
  suggestedApproach: string;
  healthScore: number;
  lifetimeValue: number;
}

export interface InteractionRecord {
  channel: string;
  summary: string;
  sentiment: number;
  topics: string[];
  outcome: string;
}

export interface JourneyEvent {
  date: string;
  type: 'call' | 'email' | 'chat' | 'order' | 'ticket' | 'activity';
  title: string;
  description: string;
  sentiment: number | null;
  channel: string;
  outcome: string | null;
}

export interface PredictedNeed {
  need: string;
  confidence: number;
  reasoning: string;
  recommendedAction: string;
}

// ---------------------------------------------------------------------------
// Build Customer Memory
// ---------------------------------------------------------------------------

/**
 * Compile a full customer profile from all touchpoints.
 * Queries CrmActivity, InboxConversation, CallLog, CrmTicket, and Order
 * to build a comprehensive memory of all interactions.
 *
 * @param leadId - The CrmLead ID
 * @returns Full customer memory or null if lead not found
 */
export async function buildCustomerMemory(leadId: string): Promise<CustomerMemory | null> {
  try {
    // Load lead with all related data
    const lead = await prisma.crmLead.findUnique({
      where: { id: leadId },
      select: {
        id: true,
        contactName: true,
        email: true,
        phone: true,
        companyName: true,
        customFields: true,
        createdAt: true,
        activities: {
          select: {
            type: true,
            title: true,
            description: true,
            metadata: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 100,
        },
        inboxConversations: {
          select: {
            id: true,
            channel: true,
            status: true,
            subject: true,
            lastMessageAt: true,
            messages: {
              select: { direction: true, content: true },
              orderBy: { createdAt: 'desc' },
              take: 5,
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });

    if (!lead) {
      logger.debug('[ExperienceMemory] Lead not found', { leadId });
      return null;
    }

    // Load orders linked via email or contact
    const orders = lead.email
      ? await prisma.order.findMany({
          where: {
            user: { email: lead.email },
            status: { not: 'CANCELLED' },
          },
          select: {
            id: true,
            orderNumber: true,
            total: true,
            status: true,
            createdAt: true,
            items: { select: { id: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        })
      : [];

    // Load tickets linked to this contact
    const tickets = await prisma.crmTicket.findMany({
      where: {
        OR: [
          { contactEmail: lead.email || undefined },
          { contactName: lead.contactName },
        ],
      },
      select: {
        id: true,
        number: true,
        subject: true,
        status: true,
        priority: true,
        createdAt: true,
        resolvedAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    // Process sentiment data from activities
    const sentimentTrend: SentimentPoint[] = [];
    const topicsSet = new Set<string>();
    const channelCounts: Record<string, number> = {};

    for (const activity of lead.activities) {
      const meta = activity.metadata as Record<string, unknown> | null;

      if (typeof meta?.sentimentScore === 'number') {
        sentimentTrend.push({
          date: activity.createdAt.toISOString().split('T')[0],
          score: meta.sentimentScore,
          channel: (meta.channel as string) || activity.type,
        });
      }

      if (Array.isArray(meta?.topics)) {
        for (const topic of meta.topics) {
          topicsSet.add(topic);
        }
      }

      const channel = (meta?.channel as string) || activity.type;
      channelCounts[channel] = (channelCounts[channel] || 0) + 1;
    }

    // Count inbox conversations by channel
    for (const conv of lead.inboxConversations) {
      channelCounts[conv.channel] = (channelCounts[conv.channel] || 0) + 1;
    }

    // Determine preferred channel
    const preferredChannel = Object.entries(channelCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([ch]) => ch)[0] || 'unknown';

    // Recent issues from tickets and activities
    const recentIssues: RecentIssue[] = tickets.slice(0, 5).map((t) => ({
      date: t.createdAt.toISOString().split('T')[0],
      subject: t.subject,
      resolved: t.status === 'RESOLVED' || t.status === 'CLOSED',
      channel: 'ticket',
    }));

    // Order history
    const orderHistory: OrderSummary[] = orders.map((o) => ({
      orderId: o.id,
      date: o.createdAt.toISOString().split('T')[0],
      total: Number(o.total),
      status: o.status,
      itemCount: o.items.length,
    }));

    // Ticket history
    const ticketHistory: TicketSummary[] = tickets.map((t) => ({
      ticketId: t.id,
      number: t.number,
      subject: t.subject,
      status: t.status,
      priority: t.priority,
      createdAt: t.createdAt.toISOString(),
      resolvedAt: t.resolvedAt?.toISOString() || null,
    }));

    // Date calculations
    const allDates = [
      lead.createdAt,
      ...lead.activities.map((a) => a.createdAt),
      ...orders.map((o) => o.createdAt),
      ...tickets.map((t) => t.createdAt),
    ].sort((a, b) => a.getTime() - b.getTime());

    const firstContactDate = allDates.length > 0
      ? allDates[0].toISOString().split('T')[0]
      : null;
    const lastContactDate = allDates.length > 0
      ? allDates[allDates.length - 1].toISOString().split('T')[0]
      : null;

    // Total interactions
    const totalInteractions = lead.activities.length + lead.inboxConversations.length + orders.length + tickets.length;

    // Communication style detection
    const communicationStyle = detectCommunicationStyle(lead.activities as { type: string; description: string | null; metadata: Record<string, unknown> | null }[]);

    // Existing preferences from customFields
    const existingCustom = lead.customFields as Record<string, unknown> | null;
    const experienceMemoryData = (existingCustom?.experienceMemory as Record<string, unknown>) || {};
    const preferences = (experienceMemoryData.preferences as Record<string, string>) || {};

    // Health score
    const healthScore = calculateHealthScoreInternal(
      sentimentTrend,
      orders.length,
      tickets,
      lead.activities.length,
      allDates,
    );

    const healthLevel: CustomerMemory['healthLevel'] =
      healthScore >= 80 ? 'EXCELLENT'
        : healthScore >= 60 ? 'GOOD'
          : healthScore >= 40 ? 'AT_RISK'
            : 'CRITICAL';

    const memory: CustomerMemory = {
      leadId,
      contactName: lead.contactName,
      email: lead.email,
      phone: lead.phone,
      companyName: lead.companyName,
      totalInteractions,
      firstContactDate,
      lastContactDate,
      sentimentTrend: sentimentTrend.slice(0, 30),
      preferredChannel,
      communicationStyle,
      topics: Array.from(topicsSet).slice(0, 20),
      recentIssues,
      orderHistory,
      ticketHistory,
      preferences,
      healthScore,
      healthLevel,
      lastUpdated: new Date().toISOString(),
    };

    // Persist memory in CrmLead.customFields
    const updatedCustom = {
      ...(existingCustom || {}),
      experienceMemory: {
        lastBuilt: new Date().toISOString(),
        healthScore,
        healthLevel,
        preferredChannel,
        communicationStyle,
        topics: Array.from(topicsSet).slice(0, 20),
        totalInteractions,
        preferences,
      },
    };

    await prisma.crmLead.update({
      where: { id: leadId },
      data: {
        customFields: updatedCustom as unknown as Prisma.InputJsonValue,
      },
    });

    logger.info('[ExperienceMemory] Customer memory built', {
      leadId,
      totalInteractions,
      healthScore,
      healthLevel,
    });

    return memory;
  } catch (error) {
    logger.error('[ExperienceMemory] Failed to build customer memory', {
      leadId,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

// ---------------------------------------------------------------------------
// Get Customer Context (Screen Pop)
// ---------------------------------------------------------------------------

/**
 * Return structured context for an agent screen pop.
 * Shows preferences, history, sentiment trend, last issues, and communication style.
 *
 * @param leadId - The CrmLead ID
 * @returns Structured context for agent screen pop
 */
export async function getCustomerContext(leadId: string): Promise<CustomerContext | null> {
  try {
    const memory = await buildCustomerMemory(leadId);
    if (!memory) return null;

    // Determine sentiment trend direction
    const recentSentiments = memory.sentimentTrend.slice(0, 10);
    let sentimentTrend: 'improving' | 'stable' | 'declining' = 'stable';
    if (recentSentiments.length >= 3) {
      const first = recentSentiments.slice(-3).reduce((s, p) => s + p.score, 0) / 3;
      const last = recentSentiments.slice(0, 3).reduce((s, p) => s + p.score, 0) / 3;
      if (last - first > 0.2) sentimentTrend = 'improving';
      else if (first - last > 0.2) sentimentTrend = 'declining';
    }

    const currentSentiment = recentSentiments.length > 0
      ? Math.round(recentSentiments[0].score * 100) / 100
      : 0;

    // Lifetime value
    const lifetimeValue = memory.orderHistory.reduce((s, o) => s + o.total, 0);

    // Open tickets
    const openTickets = memory.ticketHistory.filter(
      (t) => t.status !== 'RESOLVED' && t.status !== 'CLOSED',
    );

    // Generate suggested approach
    const suggestedApproach = generateApproachSuggestion(
      memory.communicationStyle,
      sentimentTrend,
      openTickets.length,
      lifetimeValue,
    );

    // Brief summary
    const summary = [
      `${memory.contactName}`,
      memory.companyName ? `from ${memory.companyName}` : '',
      `| ${memory.totalInteractions} interactions`,
      `| Health: ${memory.healthLevel} (${memory.healthScore}/100)`,
      lifetimeValue > 0 ? `| LTV: $${lifetimeValue.toFixed(2)}` : '',
      openTickets.length > 0 ? `| ${openTickets.length} open ticket(s)` : '',
    ]
      .filter(Boolean)
      .join(' ');

    return {
      leadId,
      contactName: memory.contactName,
      summary,
      preferredChannel: memory.preferredChannel,
      communicationStyle: memory.communicationStyle,
      sentimentTrend,
      currentSentiment,
      lastIssues: memory.recentIssues.slice(0, 3),
      recentOrders: memory.orderHistory.slice(0, 3),
      openTickets,
      preferences: memory.preferences,
      suggestedApproach,
      healthScore: memory.healthScore,
      lifetimeValue: Math.round(lifetimeValue * 100) / 100,
    };
  } catch (error) {
    logger.error('[ExperienceMemory] Failed to get customer context', {
      leadId,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

// ---------------------------------------------------------------------------
// Record Interaction Memory
// ---------------------------------------------------------------------------

/**
 * Store a new interaction in the customer's memory graph.
 * Creates a CrmActivity and updates the experience memory in customFields.
 *
 * @param leadId - The CrmLead ID
 * @param interaction - Details of the interaction to record
 */
export async function recordInteractionMemory(
  leadId: string,
  interaction: InteractionRecord,
): Promise<void> {
  try {
    // Create CRM activity for the interaction
    await prisma.crmActivity.create({
      data: {
        type: 'NOTE',
        title: `${interaction.channel} interaction`,
        description: interaction.summary.slice(0, 500),
        leadId,
        metadata: {
          experienceMemory: true,
          channel: interaction.channel,
          sentiment: interaction.sentiment,
          sentimentScore: interaction.sentiment,
          topics: interaction.topics,
          outcome: interaction.outcome,
          recordedAt: new Date().toISOString(),
        } as unknown as Prisma.InputJsonValue,
      },
    });

    // Update the lead's customFields with latest interaction info
    const lead = await prisma.crmLead.findUnique({
      where: { id: leadId },
      select: { customFields: true },
    });

    const existingCustom = (lead?.customFields as Record<string, unknown>) || {};
    const memoryData = (existingCustom.experienceMemory as Record<string, unknown>) || {};

    // Merge new topics
    const existingTopics: string[] = Array.isArray(memoryData.topics) ? (memoryData.topics as string[]) : [];
    const mergedTopics = Array.from(
      new Set([...existingTopics, ...interaction.topics]),
    ).slice(0, 30);

    await prisma.crmLead.update({
      where: { id: leadId },
      data: {
        customFields: {
          ...existingCustom,
          experienceMemory: {
            ...memoryData,
            lastInteraction: {
              channel: interaction.channel,
              date: new Date().toISOString(),
              sentiment: interaction.sentiment,
              outcome: interaction.outcome,
            },
            topics: mergedTopics,
            totalInteractions: ((memoryData.totalInteractions as number) || 0) + 1,
          },
        } as unknown as Prisma.InputJsonValue,
        lastContactedAt: new Date(),
      },
    });

    logger.info('[ExperienceMemory] Interaction recorded', {
      leadId,
      channel: interaction.channel,
      sentiment: interaction.sentiment,
      topics: interaction.topics.length,
    });
  } catch (error) {
    logger.error('[ExperienceMemory] Failed to record interaction', {
      leadId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

// ---------------------------------------------------------------------------
// Get Customer Journey
// ---------------------------------------------------------------------------

/**
 * Build a chronological timeline of all customer touchpoints with sentiment overlay.
 *
 * @param leadId - The CrmLead ID
 * @returns Chronological list of journey events
 */
export async function getCustomerJourney(leadId: string): Promise<JourneyEvent[]> {
  try {
    const lead = await prisma.crmLead.findUnique({
      where: { id: leadId },
      select: {
        email: true,
        contactName: true,
        activities: {
          select: {
            type: true,
            title: true,
            description: true,
            metadata: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'asc' },
          take: 200,
        },
        inboxConversations: {
          select: {
            channel: true,
            subject: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'asc' },
          take: 100,
        },
      },
    });

    if (!lead) return [];

    const events: JourneyEvent[] = [];

    // Add activities
    for (const activity of lead.activities) {
      const meta = activity.metadata as Record<string, unknown> | null;
      events.push({
        date: activity.createdAt.toISOString(),
        type: 'activity',
        title: activity.title,
        description: activity.description?.slice(0, 200) || '',
        sentiment: typeof meta?.sentimentScore === 'number' ? meta.sentimentScore : null,
        channel: (meta?.channel as string) || activity.type,
        outcome: (meta?.outcome as string) || null,
      });
    }

    // Add inbox conversations
    for (const conv of lead.inboxConversations) {
      events.push({
        date: conv.createdAt.toISOString(),
        type: 'chat',
        title: conv.subject || `${conv.channel} conversation`,
        description: `Status: ${conv.status}`,
        sentiment: null,
        channel: conv.channel,
        outcome: conv.status,
      });
    }

    // Add orders
    if (lead.email) {
      const orders = await prisma.order.findMany({
        where: {
          user: { email: lead.email },
        },
        select: {
          orderNumber: true,
          total: true,
          status: true,
          createdAt: true,
          items: { select: { id: true } },
        },
        orderBy: { createdAt: 'asc' },
        take: 50,
      });

      for (const order of orders) {
        events.push({
          date: order.createdAt.toISOString(),
          type: 'order',
          title: `Order ${order.orderNumber || 'N/A'}`,
          description: `$${Number(order.total).toFixed(2)} - ${order.items.length} item(s) - ${order.status}`,
          sentiment: null,
          channel: 'ecommerce',
          outcome: order.status,
        });
      }
    }

    // Add tickets
    const tickets = await prisma.crmTicket.findMany({
      where: {
        OR: [
          { contactEmail: lead.email || undefined },
          { contactName: lead.contactName },
        ],
      },
      select: {
        number: true,
        subject: true,
        status: true,
        priority: true,
        createdAt: true,
        resolvedAt: true,
      },
      orderBy: { createdAt: 'asc' },
      take: 50,
    });

    for (const ticket of tickets) {
      events.push({
        date: ticket.createdAt.toISOString(),
        type: 'ticket',
        title: `Ticket ${ticket.number}: ${ticket.subject}`,
        description: `Priority: ${ticket.priority} | Status: ${ticket.status}`,
        sentiment: null,
        channel: 'support',
        outcome: ticket.status,
      });
    }

    // Sort chronologically
    events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    logger.info('[ExperienceMemory] Customer journey built', {
      leadId,
      totalEvents: events.length,
    });

    return events;
  } catch (error) {
    logger.error('[ExperienceMemory] Failed to build customer journey', {
      leadId,
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

// ---------------------------------------------------------------------------
// Predict Customer Needs
// ---------------------------------------------------------------------------

/**
 * Based on customer history, predict the likely reason for their contact
 * and suggest recommended actions. Uses OpenAI to analyze patterns.
 *
 * @param leadId - The CrmLead ID
 * @returns Array of predicted needs with confidence and recommended actions
 */
export async function predictCustomerNeeds(leadId: string): Promise<PredictedNeed[]> {
  try {
    const journey = await getCustomerJourney(leadId);
    if (journey.length === 0) {
      return [{
        need: 'New customer inquiry',
        confidence: 0.5,
        reasoning: 'No prior interaction history found',
        recommendedAction: 'Welcome the customer and learn about their research needs',
      }];
    }

    // Prepare recent history summary for AI analysis
    const recentEvents = journey.slice(-15);
    const historySummary = recentEvents
      .map((e) => `[${e.date.split('T')[0]}] ${e.type}: ${e.title} - ${e.description}`)
      .join('\n');

    const openai = getOpenAI();

    const completion = await openai.chat.completions.create({
      model: process.env.EXPERIENCE_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are a customer intelligence AI for BioCycle Peptides (research peptide supplier). ' +
            'Based on a customer\'s interaction history, predict their most likely reason for contacting us today ' +
            'and recommend actions for the agent. ' +
            'Respond ONLY with a JSON array of 2-4 predictions, each with:\n' +
            '- "need": what the customer likely wants (max 80 chars)\n' +
            '- "confidence": 0.0 to 1.0\n' +
            '- "reasoning": brief explanation (max 150 chars)\n' +
            '- "recommendedAction": what the agent should do (max 150 chars)\n' +
            'Sort by confidence descending.',
        },
        {
          role: 'user',
          content: `Customer interaction history:\n\n${historySummary}`,
        },
      ],
      max_tokens: 600,
      temperature: 0.3,
    });

    const responseText = completion.choices?.[0]?.message?.content?.trim();
    if (!responseText) {
      return fallbackPredictions(journey);
    }

    const parsed = JSON.parse(responseText);
    if (!Array.isArray(parsed)) {
      return fallbackPredictions(journey);
    }

    return parsed
      .filter((p: Record<string, unknown>) => p.need && typeof p.confidence === 'number')
      .map((p: Record<string, unknown>) => ({
        need: String(p.need).slice(0, 200),
        confidence: Math.max(0, Math.min(1, Number(p.confidence))),
        reasoning: String(p.reasoning || '').slice(0, 300),
        recommendedAction: String(p.recommendedAction || '').slice(0, 300),
      }))
      .slice(0, 5);
  } catch (error) {
    logger.error('[ExperienceMemory] Failed to predict customer needs', {
      leadId,
      error: error instanceof Error ? error.message : String(error),
    });

    return fallbackPredictions([]);
  }
}

// ---------------------------------------------------------------------------
// Customer Health Score
// ---------------------------------------------------------------------------

/**
 * Calculate a composite health score (0-100) from recency, frequency,
 * sentiment, and resolution rate.
 *
 * @param leadId - The CrmLead ID
 * @returns Health score and breakdown
 */
export async function getCustomerHealthScore(
  leadId: string,
): Promise<{
  score: number;
  level: 'EXCELLENT' | 'GOOD' | 'AT_RISK' | 'CRITICAL';
  factors: { name: string; score: number; weight: number; description: string }[];
} | null> {
  try {
    const memory = await buildCustomerMemory(leadId);
    if (!memory) return null;

    const factors: { name: string; score: number; weight: number; description: string }[] = [];

    // 1. Recency (30%) - How recently they interacted
    const lastDate = memory.lastContactDate ? new Date(memory.lastContactDate) : null;
    const daysSinceContact = lastDate
      ? Math.round((Date.now() - lastDate.getTime()) / 86400000)
      : 365;

    let recencyScore = 100;
    if (daysSinceContact > 180) recencyScore = 10;
    else if (daysSinceContact > 90) recencyScore = 30;
    else if (daysSinceContact > 30) recencyScore = 60;
    else if (daysSinceContact > 7) recencyScore = 80;

    factors.push({
      name: 'Recency',
      score: recencyScore,
      weight: 0.30,
      description: daysSinceContact === 365
        ? 'No contact recorded'
        : `Last contact ${daysSinceContact} day(s) ago`,
    });

    // 2. Frequency (20%) - How often they interact
    let frequencyScore = 50;
    if (memory.totalInteractions >= 20) frequencyScore = 100;
    else if (memory.totalInteractions >= 10) frequencyScore = 80;
    else if (memory.totalInteractions >= 5) frequencyScore = 60;
    else if (memory.totalInteractions >= 2) frequencyScore = 40;
    else frequencyScore = 20;

    factors.push({
      name: 'Frequency',
      score: frequencyScore,
      weight: 0.20,
      description: `${memory.totalInteractions} total interaction(s)`,
    });

    // 3. Sentiment (25%) - Overall sentiment trend
    let sentimentScore = 50;
    if (memory.sentimentTrend.length > 0) {
      const avgSentiment = memory.sentimentTrend.reduce((s, p) => s + p.score, 0) / memory.sentimentTrend.length;
      sentimentScore = Math.round((avgSentiment + 1) * 50); // Map -1..1 to 0..100
    }

    factors.push({
      name: 'Sentiment',
      score: Math.max(0, Math.min(100, sentimentScore)),
      weight: 0.25,
      description: memory.sentimentTrend.length > 0
        ? `Average sentiment from ${memory.sentimentTrend.length} data point(s)`
        : 'No sentiment data available',
    });

    // 4. Resolution (25%) - Issue resolution success rate
    const totalIssues = memory.recentIssues.length;
    const resolvedIssues = memory.recentIssues.filter((i) => i.resolved).length;
    let resolutionScore = 80; // Default good if no issues
    if (totalIssues > 0) {
      resolutionScore = Math.round((resolvedIssues / totalIssues) * 100);
    }

    factors.push({
      name: 'Resolution',
      score: resolutionScore,
      weight: 0.25,
      description: totalIssues > 0
        ? `${resolvedIssues}/${totalIssues} issue(s) resolved`
        : 'No issues reported',
    });

    // Weighted total
    const weightedScore = Math.round(
      factors.reduce((s, f) => s + f.score * f.weight, 0),
    );

    const level: 'EXCELLENT' | 'GOOD' | 'AT_RISK' | 'CRITICAL' =
      weightedScore >= 80 ? 'EXCELLENT'
        : weightedScore >= 60 ? 'GOOD'
          : weightedScore >= 40 ? 'AT_RISK'
            : 'CRITICAL';

    return { score: weightedScore, level, factors };
  } catch (error) {
    logger.error('[ExperienceMemory] Failed to calculate health score', {
      leadId,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Detect communication style from activity patterns.
 */
function detectCommunicationStyle(
  activities: { type: string; description: string | null; metadata: Record<string, unknown> | null }[],
): string {
  if (activities.length === 0) return 'Unknown';

  let totalWordCount = 0;
  let messageCount = 0;
  let formalIndicators = 0;
  let informalIndicators = 0;

  for (const activity of activities.slice(0, 20)) {
    if (!activity.description) continue;

    const words = activity.description.split(/\s+/).length;
    totalWordCount += words;
    messageCount++;

    const lower = activity.description.toLowerCase();
    if (lower.includes('dear') || lower.includes('regards') || lower.includes('sincerely')) {
      formalIndicators++;
    }
    if (lower.includes('hey') || lower.includes('thanks!') || lower.includes('lol') || lower.includes('btw')) {
      informalIndicators++;
    }
  }

  const avgWordCount = messageCount > 0 ? totalWordCount / messageCount : 0;

  if (formalIndicators > informalIndicators + 2) return 'Formal and detailed';
  if (informalIndicators > formalIndicators + 2) return 'Casual and brief';
  if (avgWordCount > 50) return 'Detailed and thorough';
  if (avgWordCount < 15) return 'Brief and direct';
  return 'Balanced';
}

/**
 * Internal health score calculation used during memory building.
 */
function calculateHealthScoreInternal(
  sentimentTrend: SentimentPoint[],
  orderCount: number,
  tickets: { status: string; resolvedAt: Date | null }[],
  activityCount: number,
  allDates: Date[],
): number {
  let score = 50; // Base

  // Sentiment factor
  if (sentimentTrend.length > 0) {
    const avgSentiment = sentimentTrend.reduce((s, p) => s + p.score, 0) / sentimentTrend.length;
    score += Math.round(avgSentiment * 20); // -20 to +20
  }

  // Order frequency factor
  if (orderCount >= 5) score += 15;
  else if (orderCount >= 2) score += 10;
  else if (orderCount >= 1) score += 5;

  // Recency factor
  if (allDates.length > 0) {
    const lastDate = allDates[allDates.length - 1];
    const daysSince = (Date.now() - lastDate.getTime()) / 86400000;
    if (daysSince < 7) score += 10;
    else if (daysSince < 30) score += 5;
    else if (daysSince > 90) score -= 10;
    else if (daysSince > 180) score -= 20;
  }

  // Open ticket penalty
  const openTickets = tickets.filter((t) => t.status !== 'RESOLVED' && t.status !== 'CLOSED');
  score -= openTickets.length * 5;

  // Activity bonus
  if (activityCount >= 10) score += 5;

  return Math.max(0, Math.min(100, score));
}

/**
 * Generate a suggested approach based on customer profile.
 */
function generateApproachSuggestion(
  style: string,
  sentimentTrend: 'improving' | 'stable' | 'declining',
  openTicketCount: number,
  ltv: number,
): string {
  const parts: string[] = [];

  if (sentimentTrend === 'declining') {
    parts.push('Sentiment is declining - approach with extra care and empathy.');
  } else if (sentimentTrend === 'improving') {
    parts.push('Sentiment is improving - maintain the positive momentum.');
  }

  if (openTicketCount > 0) {
    parts.push(`${openTicketCount} open ticket(s) - acknowledge and provide update.`);
  }

  if (ltv > 1000) {
    parts.push('High-value customer - prioritize retention and satisfaction.');
  }

  if (style.includes('Formal')) {
    parts.push('Use professional, formal tone.');
  } else if (style.includes('Casual')) {
    parts.push('Relaxed, friendly tone is preferred.');
  }

  if (parts.length === 0) {
    parts.push('Standard professional approach. Listen actively and address needs.');
  }

  return parts.join(' ');
}

/**
 * Fallback predictions when AI is unavailable.
 */
function fallbackPredictions(journey: JourneyEvent[]): PredictedNeed[] {
  const predictions: PredictedNeed[] = [];

  // Check for recent orders
  const recentOrders = journey.filter((e) => e.type === 'order').slice(-3);
  if (recentOrders.length > 0) {
    predictions.push({
      need: 'Order status inquiry',
      confidence: 0.6,
      reasoning: 'Customer has recent orders',
      recommendedAction: 'Check latest order status and offer tracking information',
    });
  }

  // Check for open tickets
  const openTickets = journey.filter(
    (e) => e.type === 'ticket' && e.outcome !== 'RESOLVED' && e.outcome !== 'CLOSED',
  );
  if (openTickets.length > 0) {
    predictions.push({
      need: 'Follow-up on open support ticket',
      confidence: 0.7,
      reasoning: `${openTickets.length} open ticket(s) found`,
      recommendedAction: 'Provide update on ticket status and expected resolution',
    });
  }

  // Default
  if (predictions.length === 0) {
    predictions.push({
      need: 'General product inquiry',
      confidence: 0.4,
      reasoning: 'No specific pattern detected',
      recommendedAction: 'Ask about research needs and recommend relevant peptides',
    });
  }

  return predictions;
}
