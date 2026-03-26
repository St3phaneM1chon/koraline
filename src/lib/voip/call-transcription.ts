/**
 * #46 Call Recording Transcription
 * Auto-transcribe via Deepgram after call ends.
 *
 * #47 Call Sentiment Analysis
 * Detect positive/negative sentiment from transcript.
 */

import { logger } from '@/lib/logger';

// ── Types ────────────────────────────────────────────────────

export interface TranscriptionResult {
  callId: string;
  text: string;
  segments: TranscriptionSegment[];
  duration: number;
  language: string;
  confidence: number;
  sentiment: SentimentResult;
}

export interface TranscriptionSegment {
  start: number;
  end: number;
  text: string;
  speaker: string;
  confidence: number;
}

export interface SentimentResult {
  overall: 'positive' | 'neutral' | 'negative';
  score: number; // -1 to 1
  segments: { text: string; sentiment: 'positive' | 'neutral' | 'negative'; score: number }[];
  keywords: { positive: string[]; negative: string[] };
}

// ── Positive/Negative Keywords ──────────────────────────────

const POSITIVE_KEYWORDS = [
  'thank', 'thanks', 'great', 'excellent', 'perfect', 'wonderful', 'amazing',
  'appreciate', 'helpful', 'resolved', 'satisfied', 'happy', 'love', 'fantastic',
  'merci', 'parfait', 'excellent', 'super', 'genial',
];

const NEGATIVE_KEYWORDS = [
  'frustrated', 'angry', 'terrible', 'awful', 'worst', 'horrible', 'unacceptable',
  'disappointed', 'upset', 'complaint', 'cancel', 'refund', 'problem', 'issue',
  'frustre', 'decu', 'probleme', 'annuler', 'rembourser', 'inacceptable',
];

// ── Functions ───────────────────────────────────────────────

/**
 * Transcribe a call recording using Deepgram.
 * Falls back to a stub if DEEPGRAM_API_KEY is not set.
 */
export async function transcribeCallRecording(
  audioUrl: string,
  callId: string
): Promise<TranscriptionResult> {
  const apiKey = process.env.DEEPGRAM_API_KEY;

  if (!apiKey) {
    logger.warn('[call-transcription] DEEPGRAM_API_KEY not set — returning empty transcript');
    return {
      callId,
      text: '',
      segments: [],
      duration: 0,
      language: 'en',
      confidence: 0,
      sentiment: { overall: 'neutral', score: 0, segments: [], keywords: { positive: [], negative: [] } },
    };
  }

  try {
    const response = await fetch('https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&diarize=true&language=en', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: audioUrl }),
    });

    if (!response.ok) {
      throw new Error(`Deepgram error: ${response.status}`);
    }

    const data = await response.json();
    const result = data.results?.channels?.[0]?.alternatives?.[0];

    if (!result) {
      throw new Error('No transcription result');
    }

    const text = result.transcript || '';
    const segments: TranscriptionSegment[] = (result.paragraphs?.paragraphs || []).flatMap(
      (para: { sentences: { text: string; start: number; end: number }[]; speaker: number }) =>
        para.sentences.map((s: { text: string; start: number; end: number }) => ({
          start: s.start,
          end: s.end,
          text: s.text,
          speaker: `Speaker ${para.speaker + 1}`,
          confidence: result.confidence || 0.9,
        }))
    );

    const sentiment = analyzeSentiment(text);

    return {
      callId,
      text,
      segments,
      duration: data.metadata?.duration || 0,
      language: data.metadata?.language || 'en',
      confidence: result.confidence || 0,
      sentiment,
    };
  } catch (error) {
    logger.error('[call-transcription] Error:', error);
    return {
      callId,
      text: '',
      segments: [],
      duration: 0,
      language: 'en',
      confidence: 0,
      sentiment: { overall: 'neutral', score: 0, segments: [], keywords: { positive: [], negative: [] } },
    };
  }
}

/**
 * Analyze sentiment from text without external API.
 * Uses keyword-based analysis for speed and zero cost.
 */
export function analyzeSentiment(text: string): SentimentResult {
  if (!text.trim()) {
    return { overall: 'neutral', score: 0, segments: [], keywords: { positive: [], negative: [] } };
  }

  const lower = text.toLowerCase();
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);

  let positiveScore = 0;
  let negativeScore = 0;
  const foundPositive: string[] = [];
  const foundNegative: string[] = [];

  for (const kw of POSITIVE_KEYWORDS) {
    const count = (lower.match(new RegExp(`\\b${kw}\\b`, 'gi')) || []).length;
    if (count > 0) {
      positiveScore += count;
      foundPositive.push(kw);
    }
  }

  for (const kw of NEGATIVE_KEYWORDS) {
    const count = (lower.match(new RegExp(`\\b${kw}\\b`, 'gi')) || []).length;
    if (count > 0) {
      negativeScore += count;
      foundNegative.push(kw);
    }
  }

  const total = positiveScore + negativeScore;
  const normalizedScore = total > 0
    ? (positiveScore - negativeScore) / total
    : 0;

  const overall: SentimentResult['overall'] = normalizedScore > 0.2 ? 'positive'
    : normalizedScore < -0.2 ? 'negative'
    : 'neutral';

  // Sentence-level sentiment
  const sentenceAnalysis = sentences.slice(0, 10).map(sentence => {
    const sentLower = sentence.toLowerCase();
    const posCount = POSITIVE_KEYWORDS.filter(kw => sentLower.includes(kw)).length;
    const negCount = NEGATIVE_KEYWORDS.filter(kw => sentLower.includes(kw)).length;

    return {
      text: sentence.trim(),
      sentiment: posCount > negCount ? 'positive' as const
        : negCount > posCount ? 'negative' as const
        : 'neutral' as const,
      score: posCount - negCount,
    };
  });

  return {
    overall,
    score: Math.round(normalizedScore * 100) / 100,
    segments: sentenceAnalysis,
    keywords: { positive: foundPositive, negative: foundNegative },
  };
}
