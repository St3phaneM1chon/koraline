/**
 * CONVERSATION INTELLIGENCE (Base)
 * Post-call analysis: keyword extraction, sentiment detection, summary.
 * Integrates with existing transcription service and stores results in CrmActivity.
 */

import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ConversationAnalysis {
  summary: string;
  sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  sentimentScore: number; // -1 to 1
  keywords: string[];
  topics: string[];
  actionItems: string[];
  talkRatio: { agent: number; customer: number } | null;
}

// ---------------------------------------------------------------------------
// Keyword / Sentiment dictionaries
// ---------------------------------------------------------------------------

const POSITIVE_KEYWORDS = new Set([
  'great', 'excellent', 'perfect', 'wonderful', 'happy', 'love', 'thank',
  'appreciate', 'awesome', 'satisfied', 'pleased', 'yes', 'agree', 'deal',
  'interested', 'buy', 'purchase', 'order', 'sign up', 'super', 'formidable',
  'parfait', 'merci', 'content', 'satisfait',
]);

const NEGATIVE_KEYWORDS = new Set([
  'problem', 'issue', 'complaint', 'unhappy', 'disappointed', 'frustrated',
  'angry', 'cancel', 'refund', 'terrible', 'worst', 'bad', 'no', 'never',
  'expensive', 'waste', 'horrible', 'problème', 'plainte', 'mécontent',
  'déçu', 'annuler', 'remboursement', 'cher',
]);

const TOPIC_KEYWORDS: Record<string, string[]> = {
  pricing: ['price', 'cost', 'expensive', 'discount', 'deal', 'budget', 'affordable', 'prix', 'coût'],
  product: ['product', 'peptide', 'quality', 'feature', 'spec', 'produit', 'qualité'],
  shipping: ['shipping', 'delivery', 'track', 'arrive', 'livraison', 'expédition'],
  support: ['help', 'support', 'assist', 'issue', 'problem', 'fix', 'aide', 'support'],
  billing: ['invoice', 'payment', 'charge', 'bill', 'facture', 'paiement'],
  return: ['return', 'refund', 'exchange', 'retour', 'remboursement', 'échange'],
  competitor: ['competitor', 'alternative', 'compare', 'other', 'compétiteur', 'autre'],
};

const ACTION_PHRASES = [
  'follow up', 'call back', 'send email', 'schedule', 'meeting',
  'send proposal', 'provide quote', 'check availability', 'verify',
  'rappeler', 'envoyer', 'planifier', 'vérifier',
];

// ---------------------------------------------------------------------------
// Analysis functions
// ---------------------------------------------------------------------------

function extractKeywords(text: string): string[] {
  const words = text.toLowerCase().split(/\s+/);
  const wordFreq = new Map<string, number>();
  const stopWords = new Set([
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'can', 'shall', 'to', 'of', 'in', 'for',
    'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during',
    'before', 'after', 'above', 'below', 'and', 'but', 'or', 'not', 'so',
    'if', 'then', 'than', 'too', 'very', 'just', 'because', 'about',
    'le', 'la', 'les', 'un', 'une', 'des', 'de', 'du', 'et', 'est',
    'que', 'qui', 'dans', 'pour', 'pas', 'sur', 'avec', 'ce', 'il',
    'je', 'vous', 'nous', 'mais', 'ou', 'donc', 'car', 'si', 'ne',
    'i', 'me', 'my', 'we', 'our', 'you', 'your', 'he', 'she', 'it',
    'they', 'them', 'this', 'that', 'these', 'those', 'what', 'which',
  ]);

  for (const w of words) {
    const clean = w.replace(/[^a-zà-ÿ]/g, '');
    if (clean.length > 3 && !stopWords.has(clean)) {
      wordFreq.set(clean, (wordFreq.get(clean) || 0) + 1);
    }
  }

  return Array.from(wordFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([word]) => word);
}

function analyzeSentiment(text: string): { sentiment: ConversationAnalysis['sentiment']; score: number } {
  const words = text.toLowerCase().split(/\s+/);
  let positiveCount = 0;
  let negativeCount = 0;

  for (const word of words) {
    const clean = word.replace(/[^a-zà-ÿ]/g, '');
    if (POSITIVE_KEYWORDS.has(clean)) positiveCount++;
    if (NEGATIVE_KEYWORDS.has(clean)) negativeCount++;
  }

  const total = positiveCount + negativeCount;
  if (total === 0) return { sentiment: 'NEUTRAL', score: 0 };

  const score = (positiveCount - negativeCount) / total;
  const sentiment: ConversationAnalysis['sentiment'] =
    score > 0.2 ? 'POSITIVE' : score < -0.2 ? 'NEGATIVE' : 'NEUTRAL';

  return { sentiment, score: Math.round(score * 100) / 100 };
}

function detectTopics(text: string): string[] {
  const lower = text.toLowerCase();
  const detected: string[] = [];

  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      detected.push(topic);
    }
  }

  return detected;
}

function extractActionItems(text: string): string[] {
  const lower = text.toLowerCase();
  const items: string[] = [];

  for (const phrase of ACTION_PHRASES) {
    if (lower.includes(phrase)) {
      // Find the sentence containing this phrase
      const sentences = text.split(/[.!?]+/);
      const match = sentences.find((s) => s.toLowerCase().includes(phrase));
      if (match) {
        items.push(match.trim());
      }
    }
  }

  return items.slice(0, 5);
}

function generateSummary(
  text: string,
  sentiment: ConversationAnalysis['sentiment'],
  topics: string[],
): string {
  const wordCount = text.split(/\s+/).length;
  const topicStr = topics.length > 0 ? topics.join(', ') : 'general';
  const sentimentLabel = sentiment === 'POSITIVE' ? 'positive' :
    sentiment === 'NEGATIVE' ? 'negative' : 'neutral';

  // Simple extractive summary: first 2 sentences
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 10);
  const extract = sentences.slice(0, 2).map((s) => s.trim()).join('. ');

  return `Call about ${topicStr} (${sentimentLabel} tone, ${wordCount} words). ${extract}${extract ? '.' : ''}`;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Analyze a call transcription and return structured insights.
 */
export function analyzeTranscription(transcriptionText: string): ConversationAnalysis {
  const keywords = extractKeywords(transcriptionText);
  const { sentiment, score } = analyzeSentiment(transcriptionText);
  const topics = detectTopics(transcriptionText);
  const actionItems = extractActionItems(transcriptionText);
  const summary = generateSummary(transcriptionText, sentiment, topics);

  return {
    summary,
    sentiment,
    sentimentScore: score,
    keywords,
    topics,
    actionItems,
    talkRatio: null, // Requires speaker diarization data
  };
}

/**
 * Analyze a call log's transcription and store results as a CrmActivity.
 */
export async function analyzeCallAndLog(callLogId: string, performedById: string): Promise<ConversationAnalysis | null> {
  const callLog = await prisma.callLog.findUnique({
    where: { id: callLogId },
    include: {
      transcription: { select: { fullText: true } },
    },
  });

  if (!callLog?.transcription?.fullText) {
    logger.debug('No transcription available for analysis', { callLogId });
    return null;
  }

  const analysis = analyzeTranscription(callLog.transcription.fullText);

  // Store as CrmActivity
  await prisma.crmActivity.create({
    data: {
      type: 'CALL',
      title: `Call Analysis: ${analysis.sentiment} sentiment`,
      description: analysis.summary,
      metadata: {
        callLogId,
        sentiment: analysis.sentiment,
        sentimentScore: analysis.sentimentScore,
        keywords: analysis.keywords,
        topics: analysis.topics,
        actionItems: analysis.actionItems,
        talkRatio: analysis.talkRatio,
      },
      performedById,
    },
  });

  logger.info('Call analysis complete', {
    callLogId,
    sentiment: analysis.sentiment,
    topics: analysis.topics,
    actionItems: analysis.actionItems.length,
  });

  return analysis;
}
