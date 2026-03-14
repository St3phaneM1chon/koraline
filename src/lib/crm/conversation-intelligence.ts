/**
 * CONVERSATION INTELLIGENCE (K13)
 * Advanced call conversation analysis (Gong-like).
 * Extracts topics, objections, questions, talk ratio, key moments, and sentiment.
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

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ConversationInsight {
  topics: string[];
  objections: { text: string; category: string }[];
  questions: { text: string; speaker: 'agent' | 'customer' }[];
  talkRatio: { agent: number; customer: number };
  longestMonologue: { speaker: 'agent' | 'customer'; durationSec: number; text: string };
  sentiment: { overall: number; label: 'positive' | 'neutral' | 'negative' };
  keyMoments: { timestamp: string; type: string; description: string }[];
}

export interface TranscriptSegment {
  speaker: 'agent' | 'customer';
  text: string;
  startSec?: number;
  endSec?: number;
}

// ---------------------------------------------------------------------------
// Topic extraction (OpenAI)
// ---------------------------------------------------------------------------

/**
 * Use OpenAI to identify discussion topics from conversation text.
 */
export async function extractTopics(text: string): Promise<string[]> {
  if (!text.trim()) return [];

  try {
    const openai = getOpenAI();

    const completion = await openai.chat.completions.create({
      model: process.env.CONVERSATION_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'Extract the main discussion topics from this conversation transcript. ' +
            'Return ONLY a JSON array of topic strings (max 10). Example: ["pricing","shipping","product quality"]. ' +
            'No other text.',
        },
        { role: 'user', content: text.slice(0, 4000) },
      ],
      max_tokens: 200,
      temperature: 0,
    });

    const raw = completion.choices?.[0]?.message?.content?.trim();
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (error) {
    logger.error('[ConversationIntelligence] extractTopics failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

// ---------------------------------------------------------------------------
// Objection detection (OpenAI)
// ---------------------------------------------------------------------------

/**
 * Detect customer objections in the conversation.
 */
export async function detectObjections(
  text: string,
): Promise<{ text: string; category: string }[]> {
  if (!text.trim()) return [];

  try {
    const openai = getOpenAI();

    const completion = await openai.chat.completions.create({
      model: process.env.CONVERSATION_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'Identify customer objections in this sales/support conversation transcript. ' +
            'Return ONLY a JSON array of objects with "text" (the objection quote) and "category" ' +
            '(one of: "price", "timing", "competitor", "need", "authority", "trust", "other"). ' +
            'Max 10 objections. Example: [{"text":"That seems too expensive","category":"price"}]. ' +
            'If none found, return [].',
        },
        { role: 'user', content: text.slice(0, 4000) },
      ],
      max_tokens: 500,
      temperature: 0,
    });

    const raw = completion.choices?.[0]?.message?.content?.trim();
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (error) {
    logger.error('[ConversationIntelligence] detectObjections failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

// ---------------------------------------------------------------------------
// Talk ratio calculation
// ---------------------------------------------------------------------------

/**
 * Calculate the percentage of talk time for agent vs customer.
 */
export function calculateTalkRatio(
  segments: TranscriptSegment[],
): { agent: number; customer: number } {
  if (segments.length === 0) return { agent: 50, customer: 50 };

  let agentWords = 0;
  let customerWords = 0;

  for (const seg of segments) {
    const wordCount = seg.text.split(/\s+/).filter(Boolean).length;
    if (seg.speaker === 'agent') {
      agentWords += wordCount;
    } else {
      customerWords += wordCount;
    }
  }

  const total = agentWords + customerWords;
  if (total === 0) return { agent: 50, customer: 50 };

  return {
    agent: Math.round((agentWords / total) * 100),
    customer: Math.round((customerWords / total) * 100),
  };
}

// ---------------------------------------------------------------------------
// Full conversation analysis
// ---------------------------------------------------------------------------

/**
 * Analyze a full conversation transcription for insights (Gong-like analysis).
 * Accepts raw text or structured segments.
 */
export async function analyzeConversation(
  transcription: string | TranscriptSegment[],
): Promise<ConversationInsight> {
  const isSegmented = Array.isArray(transcription);
  const fullText = isSegmented
    ? transcription.map((s) => `[${s.speaker}]: ${s.text}`).join('\n')
    : transcription;

  const segments: TranscriptSegment[] = isSegmented
    ? transcription
    : parseSegments(fullText);

  // Run topic extraction and objection detection in parallel
  const [topics, objections] = await Promise.all([
    extractTopics(fullText),
    detectObjections(fullText),
  ]);

  // Calculate talk ratio
  const talkRatio = calculateTalkRatio(segments);

  // Find longest monologue
  const longestMonologue = findLongestMonologue(segments);

  // Extract questions
  const questions = extractQuestions(segments);

  // Simple sentiment from keywords
  const sentiment = computeSentiment(fullText);

  // Identify key moments
  const keyMoments = identifyKeyMoments(segments, objections);

  logger.info('[ConversationIntelligence] Analysis complete', {
    topics: topics.length,
    objections: objections.length,
    questions: questions.length,
    talkRatio,
  });

  return {
    topics,
    objections,
    questions,
    talkRatio,
    longestMonologue,
    sentiment,
    keyMoments,
  };
}

// ---------------------------------------------------------------------------
// Get conversation insights for a stored call log
// ---------------------------------------------------------------------------

/**
 * Load a call log's transcription from DB and run full analysis.
 */
export async function getConversationInsights(
  callLogId: string,
): Promise<ConversationInsight | null> {
  const callLog = await prisma.callLog.findUnique({
    where: { id: callLogId },
    include: {
      transcription: { select: { fullText: true } },
    },
  });

  if (!callLog?.transcription?.fullText) {
    logger.debug('[ConversationIntelligence] No transcription for call', { callLogId });
    return null;
  }

  return analyzeConversation(callLog.transcription.fullText);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseSegments(text: string): TranscriptSegment[] {
  const lines = text.split('\n').filter((l) => l.trim());
  const segments: TranscriptSegment[] = [];

  for (const line of lines) {
    const match = line.match(/^\[?(agent|customer|caller|rep)\]?:\s*(.+)/i);
    if (match) {
      const speaker = match[1].toLowerCase();
      segments.push({
        speaker: speaker === 'customer' || speaker === 'caller' ? 'customer' : 'agent',
        text: match[2].trim(),
      });
    } else {
      // Assign alternating speakers if unstructured
      const lastSpeaker = segments.length > 0 ? segments[segments.length - 1].speaker : 'customer';
      segments.push({
        speaker: lastSpeaker === 'agent' ? 'customer' : 'agent',
        text: line.trim(),
      });
    }
  }

  return segments;
}

function findLongestMonologue(
  segments: TranscriptSegment[],
): ConversationInsight['longestMonologue'] {
  let longest: ConversationInsight['longestMonologue'] = {
    speaker: 'agent',
    durationSec: 0,
    text: '',
  };

  for (const seg of segments) {
    const wordCount = seg.text.split(/\s+/).length;
    // Approximate: ~2.5 words per second of speech
    const approxDuration = Math.round(wordCount / 2.5);

    if (approxDuration > longest.durationSec) {
      longest = {
        speaker: seg.speaker,
        durationSec: approxDuration,
        text: seg.text.slice(0, 200),
      };
    }
  }

  return longest;
}

function extractQuestions(
  segments: TranscriptSegment[],
): ConversationInsight['questions'] {
  const questions: ConversationInsight['questions'] = [];

  for (const seg of segments) {
    const sentences = seg.text.split(/[.!]+/);
    for (const sentence of sentences) {
      if (sentence.trim().endsWith('?')) {
        questions.push({
          text: sentence.trim(),
          speaker: seg.speaker,
        });
      }
    }
  }

  return questions.slice(0, 20);
}

function computeSentiment(text: string): ConversationInsight['sentiment'] {
  const lower = text.toLowerCase();
  const positive = ['great', 'excellent', 'thank', 'appreciate', 'love', 'perfect', 'happy', 'good', 'wonderful'];
  const negative = ['problem', 'issue', 'frustrated', 'angry', 'disappointed', 'terrible', 'bad', 'hate', 'worst'];

  let score = 0;
  for (const w of positive) if (lower.includes(w)) score += 0.12;
  for (const w of negative) if (lower.includes(w)) score -= 0.12;
  score = Math.max(-1, Math.min(1, score));

  const label: 'positive' | 'neutral' | 'negative' =
    score > 0.2 ? 'positive' : score < -0.2 ? 'negative' : 'neutral';

  return { overall: Math.round(score * 100) / 100, label };
}

function identifyKeyMoments(
  segments: TranscriptSegment[],
  objections: { text: string; category: string }[],
): ConversationInsight['keyMoments'] {
  const moments: ConversationInsight['keyMoments'] = [];

  // Mark objections as key moments
  for (const obj of objections) {
    moments.push({
      timestamp: 'N/A',
      type: 'objection',
      description: `${obj.category}: "${obj.text.slice(0, 100)}"`,
    });
  }

  // Mark questions from customer
  for (const seg of segments) {
    if (seg.text.includes('?') && seg.speaker === 'customer') {
      const question = seg.text.split('?')[0] + '?';
      if (question.length > 15) {
        moments.push({
          timestamp: 'N/A',
          type: 'customer_question',
          description: question.slice(0, 120),
        });
      }
    }
  }

  // Mark commitment signals
  const commitWords = ['yes', 'deal', 'agree', 'sign', 'buy', 'purchase', 'order', 'proceed'];
  for (const seg of segments) {
    if (seg.speaker === 'customer') {
      const lower = seg.text.toLowerCase();
      for (const word of commitWords) {
        if (lower.includes(word)) {
          moments.push({
            timestamp: 'N/A',
            type: 'buying_signal',
            description: seg.text.slice(0, 120),
          });
          break;
        }
      }
    }
  }

  return moments.slice(0, 15);
}
