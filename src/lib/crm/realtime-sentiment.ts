/**
 * REAL-TIME SENTIMENT ANALYSIS
 * Analyze text and call transcript sentiment using OpenAI.
 * Provides alerts when sentiment drops below threshold.
 */

import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

// ---------------------------------------------------------------------------
// Lazy OpenAI client
// ---------------------------------------------------------------------------

let _openai: any | null = null;

function getOpenAI(): any {
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
// Single text sentiment analysis
// ---------------------------------------------------------------------------

/**
 * Analyze the sentiment of a single text using OpenAI.
 * Returns a score (-1 to 1), label, and confidence.
 */
export async function analyzeSentiment(
  text: string,
): Promise<{
  score: number;
  label: 'positive' | 'neutral' | 'negative';
  confidence: number;
}> {
  if (!text.trim()) {
    return { score: 0, label: 'neutral', confidence: 1 };
  }

  try {
    const openai = getOpenAI();

    const completion = await openai.chat.completions.create({
      model: process.env.SENTIMENT_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are a sentiment analysis engine. Analyze the sentiment of the provided text. ' +
            'Respond ONLY with a JSON object containing exactly three fields:\n' +
            '- "score": a number between -1 (very negative) and 1 (very positive)\n' +
            '- "label": one of "positive", "neutral", or "negative"\n' +
            '- "confidence": a number between 0 and 1 indicating how confident you are\n' +
            'No other text or explanation.',
        },
        {
          role: 'user',
          content: text.slice(0, 2000), // Limit input size
        },
      ],
      max_tokens: 100,
      temperature: 0,
    });

    const responseText = completion.choices?.[0]?.message?.content?.trim();
    if (!responseText) {
      return { score: 0, label: 'neutral', confidence: 0.5 };
    }

    // Parse the JSON response
    const parsed = JSON.parse(responseText);
    const score = Math.max(-1, Math.min(1, Number(parsed.score) || 0));
    const confidence = Math.max(0, Math.min(1, Number(parsed.confidence) || 0.5));
    const label: 'positive' | 'neutral' | 'negative' =
      score > 0.2 ? 'positive' : score < -0.2 ? 'negative' : 'neutral';

    return { score, label, confidence };
  } catch (error) {
    logger.error('[Sentiment] Analysis failed', {
      error: error instanceof Error ? error.message : String(error),
      textLength: text.length,
    });

    // Fallback: simple keyword-based analysis
    return fallbackSentiment(text);
  }
}

// ---------------------------------------------------------------------------
// Call transcript sentiment stream
// ---------------------------------------------------------------------------

/**
 * Analyze sentiment across multiple transcript chunks (e.g., from a call).
 * Returns overall sentiment, a timeline of sentiment per chunk, and any alerts.
 */
export async function analyzeCallSentimentStream(
  transcriptChunks: string[],
): Promise<{
  overall: number;
  timeline: { chunk: number; score: number }[];
  alerts: string[];
}> {
  const timeline: { chunk: number; score: number }[] = [];
  const alerts: string[] = [];
  let totalScore = 0;

  for (let i = 0; i < transcriptChunks.length; i++) {
    const chunk = transcriptChunks[i];
    if (!chunk.trim()) {
      timeline.push({ chunk: i, score: 0 });
      continue;
    }

    const result = await analyzeSentiment(chunk);
    timeline.push({ chunk: i, score: result.score });
    totalScore += result.score;

    // Generate alerts for significant negative sentiment
    if (result.score < -0.5) {
      alerts.push(
        `Chunk ${i + 1}: Strong negative sentiment detected (score: ${result.score.toFixed(2)})`,
      );
    }

    // Detect rapid sentiment drop
    if (i > 0) {
      const prevScore = timeline[i - 1].score;
      const drop = prevScore - result.score;
      if (drop > 0.6) {
        alerts.push(
          `Chunk ${i + 1}: Rapid sentiment drop detected (${prevScore.toFixed(2)} -> ${result.score.toFixed(2)})`,
        );
      }
    }
  }

  const overall =
    transcriptChunks.length > 0 ? totalScore / transcriptChunks.length : 0;

  logger.info('[Sentiment] Call transcript analyzed', {
    chunks: transcriptChunks.length,
    overall: overall.toFixed(2),
    alertCount: alerts.length,
  });

  return {
    overall: Math.round(overall * 100) / 100,
    timeline,
    alerts,
  };
}

// ---------------------------------------------------------------------------
// Supervisor alert check
// ---------------------------------------------------------------------------

/**
 * Returns true if the sentiment score warrants alerting a supervisor.
 * Default threshold is -0.5.
 */
export function shouldAlertSupervisor(
  sentimentScore: number,
  threshold: number = -0.5,
): boolean {
  return sentimentScore < threshold;
}

// ---------------------------------------------------------------------------
// Sentiment trends
// ---------------------------------------------------------------------------

/**
 * Query CRM activity metadata for average sentiment scores per day
 * for a specific agent over the specified number of days.
 */
export async function getSentimentTrends(
  agentId: string,
  days: number,
): Promise<{ date: string; avgSentiment: number }[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const activities = await prisma.crmActivity.findMany({
    where: {
      performedById: agentId,
      createdAt: { gte: since },
      metadata: {
        path: ['sentimentScore'],
        not: null as unknown as undefined,
      },
    },
    select: {
      createdAt: true,
      metadata: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  // Group by date
  const dayMap = new Map<string, { sum: number; count: number }>();

  for (const activity of activities) {
    const dateKey = activity.createdAt.toISOString().split('T')[0];
    const metadata = activity.metadata as Record<string, any> | null;
    const score = Number(metadata?.sentimentScore);

    if (isNaN(score)) continue;

    const entry = dayMap.get(dateKey) || { sum: 0, count: 0 };
    entry.sum += score;
    entry.count++;
    dayMap.set(dateKey, entry);
  }

  // Build result with all days in range (fill gaps)
  const result: { date: string; avgSentiment: number }[] = [];
  const cursor = new Date(since);
  const today = new Date();

  while (cursor <= today) {
    const dateKey = cursor.toISOString().split('T')[0];
    const entry = dayMap.get(dateKey);

    result.push({
      date: dateKey,
      avgSentiment: entry
        ? Math.round((entry.sum / entry.count) * 100) / 100
        : 0,
    });

    cursor.setDate(cursor.getDate() + 1);
  }

  return result;
}

// ---------------------------------------------------------------------------
// Real-time streaming sentiment (K7)
// ---------------------------------------------------------------------------

interface RealtimeSession {
  callId: string;
  startedAt: Date;
  chunks: { text: string; score: number; timestamp: Date }[];
  rollingAverage: number;
  alerts: string[];
}

const _activeSessions = new Map<string, RealtimeSession>();

const ROLLING_WINDOW = 10;
const ALERT_THRESHOLD = -0.5;

/**
 * Initialize a streaming sentiment session for a live call.
 * Returns a sessionId used to push chunks and read state.
 */
export function startRealtimeSentimentStream(callId: string): string {
  const sessionId = `rs_${callId}_${Date.now()}`;

  _activeSessions.set(sessionId, {
    callId,
    startedAt: new Date(),
    chunks: [],
    rollingAverage: 0,
    alerts: [],
  });

  logger.info('[RealtimeSentiment] Session started', { sessionId, callId });
  return sessionId;
}

/**
 * Process a transcription chunk in real-time during a live call.
 * Returns the chunk sentiment plus any alert if the score drops below threshold.
 */
export async function processRealtimeChunk(
  sessionId: string,
  text: string,
): Promise<{
  score: number;
  label: 'positive' | 'neutral' | 'negative';
  rollingAverage: number;
  alert: string | null;
}> {
  const session = _activeSessions.get(sessionId);
  if (!session) {
    throw new Error(`Realtime session not found: ${sessionId}`);
  }

  const result = await analyzeSentiment(text);
  const entry = { text, score: result.score, timestamp: new Date() };
  session.chunks.push(entry);

  // Rolling average over last ROLLING_WINDOW chunks
  const recentChunks = session.chunks.slice(-ROLLING_WINDOW);
  const sum = recentChunks.reduce((acc, c) => acc + c.score, 0);
  session.rollingAverage = Math.round((sum / recentChunks.length) * 100) / 100;

  // Check for instant alert
  let alert: string | null = null;

  if (result.score < ALERT_THRESHOLD) {
    alert = `Negative sentiment detected (score: ${result.score.toFixed(2)}, rolling avg: ${session.rollingAverage.toFixed(2)})`;
    session.alerts.push(alert);
    logger.warn('[RealtimeSentiment] Alert triggered', {
      sessionId,
      callId: session.callId,
      score: result.score,
      rollingAverage: session.rollingAverage,
    });
  }

  // Detect rapid drop from previous chunk
  if (session.chunks.length >= 2) {
    const prev = session.chunks[session.chunks.length - 2];
    const drop = prev.score - result.score;
    if (drop > 0.6 && !alert) {
      alert = `Rapid sentiment drop (${prev.score.toFixed(2)} -> ${result.score.toFixed(2)})`;
      session.alerts.push(alert);
    }
  }

  return {
    score: result.score,
    label: result.label,
    rollingAverage: session.rollingAverage,
    alert,
  };
}

/**
 * Get current state of a realtime sentiment session.
 * Includes rolling average, total chunks processed, and all alerts.
 */
export function getRealtimeSentimentState(sessionId: string): {
  callId: string;
  startedAt: Date;
  totalChunks: number;
  rollingAverage: number;
  lastScore: number | null;
  alerts: string[];
} | null {
  const session = _activeSessions.get(sessionId);
  if (!session) return null;

  const lastChunk = session.chunks[session.chunks.length - 1];

  return {
    callId: session.callId,
    startedAt: session.startedAt,
    totalChunks: session.chunks.length,
    rollingAverage: session.rollingAverage,
    lastScore: lastChunk?.score ?? null,
    alerts: [...session.alerts],
  };
}

/**
 * End a realtime sentiment session and clean up.
 * Returns the final summary before deletion.
 */
export function endRealtimeSentimentStream(sessionId: string): {
  callId: string;
  totalChunks: number;
  overallAverage: number;
  alerts: string[];
} | null {
  const session = _activeSessions.get(sessionId);
  if (!session) return null;

  const total = session.chunks.length;
  const overallAverage = total > 0
    ? Math.round((session.chunks.reduce((s, c) => s + c.score, 0) / total) * 100) / 100
    : 0;

  const result = {
    callId: session.callId,
    totalChunks: total,
    overallAverage,
    alerts: [...session.alerts],
  };

  _activeSessions.delete(sessionId);
  logger.info('[RealtimeSentiment] Session ended', { sessionId, ...result });

  return result;
}

// ---------------------------------------------------------------------------
// Fallback keyword-based sentiment
// ---------------------------------------------------------------------------

function fallbackSentiment(text: string): {
  score: number;
  label: 'positive' | 'neutral' | 'negative';
  confidence: number;
} {
  const lower = text.toLowerCase();

  const negativeWords = [
    'angry', 'furious', 'terrible', 'horrible', 'worst', 'hate',
    'disappointed', 'frustrat', 'unacceptable', 'awful', 'problem',
    'issue', 'broken', 'fail', 'bad', 'poor', 'slow', 'wrong',
  ];

  const positiveWords = [
    'thank', 'great', 'excellent', 'wonderful', 'perfect', 'amazing',
    'awesome', 'love', 'appreciate', 'helpful', 'fantastic', 'best',
    'happy', 'satisfied', 'pleased', 'good', 'nice', 'well',
  ];

  let score = 0;
  for (const word of negativeWords) {
    if (lower.includes(word)) score -= 0.15;
  }
  for (const word of positiveWords) {
    if (lower.includes(word)) score += 0.15;
  }

  score = Math.max(-1, Math.min(1, score));
  const label: 'positive' | 'neutral' | 'negative' =
    score > 0.2 ? 'positive' : score < -0.2 ? 'negative' : 'neutral';

  return { score, label, confidence: 0.4 }; // Low confidence for fallback
}
