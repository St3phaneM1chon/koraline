/**
 * GENERATIVE AI FOR CRM (K16)
 * AI content generation for proposals, call scripts, reports, and emails.
 * Uses lazy OpenAI initialization with gpt-4o.
 */

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

const GENERATIVE_MODEL = 'gpt-4o';

// ---------------------------------------------------------------------------
// Generate business proposal
// ---------------------------------------------------------------------------

/**
 * Generate a business proposal for a deal.
 * Loads deal context from DB and produces structured proposal text.
 */
export async function generateProposal(
  dealId: string,
  template: 'standard' | 'enterprise' | 'research' = 'standard',
): Promise<{ title: string; content: string; sections: string[] }> {
  const deal = await prisma.crmDeal.findUnique({
    where: { id: dealId },
    include: {
      lead: { select: { companyName: true, contactName: true } },
      products: {
        include: { product: { select: { name: true, price: true } } },
      },
      stage: { select: { name: true } },
      pipeline: { select: { name: true } },
    },
  });

  if (!deal) throw new Error('Deal not found');

  const productList = deal.products
    .map((p: { product: { name: string; price: number | string }; quantity: number }) => `- ${p.product.name}: $${Number(p.product.price).toFixed(2)} x ${p.quantity}`)
    .join('\n') || 'No products specified';

  const openai = getOpenAI();

  const completion = await openai.chat.completions.create({
    model: GENERATIVE_MODEL,
    messages: [
      {
        role: 'system',
        content:
          `You are a professional business proposal writer for BioCycle Peptides, a research peptide supplier. ` +
          `Generate a ${template} business proposal. ` +
          'Return a JSON object with:\n' +
          '- "title": proposal title\n' +
          '- "content": full proposal text (Markdown formatted)\n' +
          '- "sections": array of section headings\n' +
          'The proposal should be professional, include company value propositions, ' +
          'and reference the specific products and deal value.',
      },
      {
        role: 'user',
        content:
          `Deal: ${deal.title}\n` +
          `Client: ${deal.lead?.companyName || 'N/A'} (${deal.lead?.contactName || 'N/A'})\n` +
          `Value: $${Number(deal.value).toFixed(2)} ${deal.currency}\n` +
          `Stage: ${deal.stage.name}\n` +
          `Products:\n${productList}`,
      },
    ],
    max_tokens: 2000,
    temperature: 0.7,
  });

  const raw = completion.choices?.[0]?.message?.content?.trim();
  if (!raw) throw new Error('Empty response from AI');

  try {
    const parsed = JSON.parse(raw);
    logger.info('[GenerativeAI] Proposal generated', { dealId, template });
    return parsed;
  } catch {
    // If JSON parse fails, wrap raw text
    return {
      title: `Proposal for ${deal.title}`,
      content: raw,
      sections: ['Overview'],
    };
  }
}

// ---------------------------------------------------------------------------
// Generate call script
// ---------------------------------------------------------------------------

/**
 * Generate a personalized call script for a campaign.
 * Incorporates campaign context and lead information.
 */
export async function generateCallScript(
  campaignId: string,
  context: {
    leadName?: string;
    companyName?: string;
    previousInteraction?: string;
    objective?: string;
  },
): Promise<{ script: string; talkingPoints: string[]; objectionHandlers: Record<string, string> }> {
  const campaign = await prisma.crmCampaign.findUnique({
    where: { id: campaignId },
    select: { name: true, type: true, description: true },
  });

  if (!campaign) throw new Error('Campaign not found');

  const openai = getOpenAI();

  const completion = await openai.chat.completions.create({
    model: GENERATIVE_MODEL,
    messages: [
      {
        role: 'system',
        content:
          'You are a sales script writer for BioCycle Peptides, a research peptide supplier. ' +
          'Generate a natural, conversational call script. ' +
          'Return a JSON object with:\n' +
          '- "script": the full call script with speaker labels (Agent: / Customer:)\n' +
          '- "talkingPoints": array of key points to cover\n' +
          '- "objectionHandlers": object mapping common objections to suggested responses\n' +
          'The script should feel natural, not robotic. Include discovery questions.',
      },
      {
        role: 'user',
        content:
          `Campaign: ${campaign.name} (${campaign.type})\n` +
          `Description: ${campaign.description || 'N/A'}\n` +
          `Lead: ${context.leadName || 'Unknown'} at ${context.companyName || 'Unknown'}\n` +
          `Previous interaction: ${context.previousInteraction || 'None'}\n` +
          `Objective: ${context.objective || 'Discovery call'}`,
      },
    ],
    max_tokens: 1500,
    temperature: 0.7,
  });

  const raw = completion.choices?.[0]?.message?.content?.trim();
  if (!raw) throw new Error('Empty response from AI');

  try {
    const parsed = JSON.parse(raw);
    logger.info('[GenerativeAI] Call script generated', { campaignId });
    return parsed;
  } catch {
    return {
      script: raw,
      talkingPoints: [],
      objectionHandlers: {},
    };
  }
}

// ---------------------------------------------------------------------------
// Generate narrative report
// ---------------------------------------------------------------------------

/**
 * Generate a narrative report from structured data.
 * Transforms raw metrics into human-readable insights.
 */
export async function generateReport(
  reportType: 'pipeline' | 'campaign' | 'agent' | 'calls' | 'weekly',
  data: Record<string, unknown>,
): Promise<{ title: string; summary: string; body: string; recommendations: string[] }> {
  const openai = getOpenAI();

  const completion = await openai.chat.completions.create({
    model: GENERATIVE_MODEL,
    messages: [
      {
        role: 'system',
        content:
          `You are a CRM analytics report writer for BioCycle Peptides. ` +
          `Generate a ${reportType} performance report. ` +
          'Return a JSON object with:\n' +
          '- "title": report title with date\n' +
          '- "summary": 2-3 sentence executive summary\n' +
          '- "body": detailed narrative analysis (Markdown, 3-5 paragraphs)\n' +
          '- "recommendations": array of actionable recommendations (max 5)\n' +
          'Be specific with numbers. Highlight trends and anomalies.',
      },
      {
        role: 'user',
        content: `Report data:\n${JSON.stringify(data, null, 2).slice(0, 3000)}`,
      },
    ],
    max_tokens: 1500,
    temperature: 0.5,
  });

  const raw = completion.choices?.[0]?.message?.content?.trim();
  if (!raw) throw new Error('Empty response from AI');

  try {
    const parsed = JSON.parse(raw);
    logger.info('[GenerativeAI] Report generated', { reportType });
    return parsed;
  } catch {
    return {
      title: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`,
      summary: raw.slice(0, 200),
      body: raw,
      recommendations: [],
    };
  }
}

// ---------------------------------------------------------------------------
// Generate email draft
// ---------------------------------------------------------------------------

/**
 * Draft an email based on conversation context and purpose.
 */
export async function generateEmailDraft(context: {
  recipientName: string;
  recipientCompany?: string;
  purpose: 'follow_up' | 'proposal' | 'introduction' | 'thank_you' | 're_engage';
  previousConversation?: string;
  dealValue?: number;
  products?: string[];
}): Promise<{ subject: string; body: string; tone: string }> {
  const openai = getOpenAI();

  const completion = await openai.chat.completions.create({
    model: GENERATIVE_MODEL,
    messages: [
      {
        role: 'system',
        content:
          'You are a professional email writer for BioCycle Peptides, a research peptide supplier. ' +
          `Draft a ${context.purpose.replace('_', ' ')} email. ` +
          'Return a JSON object with:\n' +
          '- "subject": email subject line\n' +
          '- "body": email body (plain text with paragraph breaks)\n' +
          '- "tone": the tone used (e.g., "professional", "friendly", "urgent")\n' +
          'Keep it concise and professional. Use the recipient name. Include a clear CTA.',
      },
      {
        role: 'user',
        content:
          `Recipient: ${context.recipientName}${context.recipientCompany ? ` at ${context.recipientCompany}` : ''}\n` +
          `Purpose: ${context.purpose}\n` +
          `Previous conversation: ${context.previousConversation || 'None'}\n` +
          `Deal value: ${context.dealValue ? `$${context.dealValue}` : 'N/A'}\n` +
          `Products: ${context.products?.join(', ') || 'N/A'}`,
      },
    ],
    max_tokens: 800,
    temperature: 0.7,
  });

  const raw = completion.choices?.[0]?.message?.content?.trim();
  if (!raw) throw new Error('Empty response from AI');

  try {
    const parsed = JSON.parse(raw);
    logger.info('[GenerativeAI] Email draft generated', { purpose: context.purpose });
    return parsed;
  } catch {
    return {
      subject: `${context.purpose.replace('_', ' ')} - BioCycle Peptides`,
      body: raw,
      tone: 'professional',
    };
  }
}

// ---------------------------------------------------------------------------
// Improve/rewrite existing content
// ---------------------------------------------------------------------------

/**
 * Rewrite or improve existing content with a specific tone and goal.
 */
export async function improveContent(
  content: string,
  tone: 'professional' | 'friendly' | 'persuasive' | 'concise' | 'formal' = 'professional',
  goal: string = 'Improve clarity and impact',
): Promise<{ improved: string; changes: string[] }> {
  if (!content.trim()) {
    return { improved: '', changes: [] };
  }

  const openai = getOpenAI();

  const completion = await openai.chat.completions.create({
    model: GENERATIVE_MODEL,
    messages: [
      {
        role: 'system',
        content:
          `You are a content editor. Improve the provided text with a ${tone} tone. ` +
          `Goal: ${goal}. ` +
          'Return a JSON object with:\n' +
          '- "improved": the rewritten text\n' +
          '- "changes": array of changes made (max 5)\n' +
          'Preserve the original meaning and key information.',
      },
      {
        role: 'user',
        content: content.slice(0, 3000),
      },
    ],
    max_tokens: 1500,
    temperature: 0.5,
  });

  const raw = completion.choices?.[0]?.message?.content?.trim();
  if (!raw) throw new Error('Empty response from AI');

  try {
    const parsed = JSON.parse(raw);
    logger.info('[GenerativeAI] Content improved', { tone, goal });
    return parsed;
  } catch {
    return { improved: raw, changes: ['General improvements applied'] };
  }
}
