export const dynamic = 'force-dynamic';

/**
 * Speech Analytics Page - Keyword trends and sentiment analysis.
 */

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth-config';
import { prisma } from '@/lib/db';
import { UserRole } from '@/types';
import SpeechClient from './SpeechClient';

export default async function SpeechAnalyticsPage() {
  const session = await auth();
  if (!session?.user || (session.user.role !== UserRole.EMPLOYEE && session.user.role !== UserRole.OWNER)) {
    redirect('/auth/signin');
  }

  // Fetch transcription data
  const transcriptions = await prisma.callTranscription.findMany({
    select: {
      id: true,
      sentiment: true,
      sentimentScore: true,
      keywords: true,
      language: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 500,
  });

  // Compute sentiment breakdown
  const sentimentCounts = { positive: 0, negative: 0, neutral: 0 };
  for (const tr of transcriptions) {
    if (tr.sentiment === 'positive') sentimentCounts.positive++;
    else if (tr.sentiment === 'negative') sentimentCounts.negative++;
    else sentimentCounts.neutral++;
  }
  const totalTranscriptions = transcriptions.length;

  // Compute keyword frequency
  const keywordMap = new Map<string, number>();
  for (const tr of transcriptions) {
    if (tr.keywords && Array.isArray(tr.keywords)) {
      for (const kw of tr.keywords) {
        keywordMap.set(kw, (keywordMap.get(kw) || 0) + 1);
      }
    }
  }
  const topKeywords = Array.from(keywordMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([keyword, count]) => ({ keyword, count }));

  // Compute average sentiment score
  const sentimentScores = transcriptions
    .filter((tr) => tr.sentimentScore !== null)
    .map((tr) => tr.sentimentScore as number);
  const avgSentimentScore = sentimentScores.length > 0
    ? Math.round((sentimentScores.reduce((a, b) => a + b, 0) / sentimentScores.length) * 100) / 100
    : 0;

  // Compliance score (placeholder - would come from QA system)
  const complianceScore = totalTranscriptions > 0 ? 92 : 0;

  const stats = {
    totalTranscriptions,
    sentiment: sentimentCounts,
    sentimentPercentages: {
      positive: totalTranscriptions > 0 ? Math.round((sentimentCounts.positive / totalTranscriptions) * 100) : 0,
      negative: totalTranscriptions > 0 ? Math.round((sentimentCounts.negative / totalTranscriptions) * 100) : 0,
      neutral: totalTranscriptions > 0 ? Math.round((sentimentCounts.neutral / totalTranscriptions) * 100) : 0,
    },
    avgSentimentScore,
    topKeywords,
    complianceScore,
  };

  return <SpeechClient stats={JSON.parse(JSON.stringify(stats))} />;
}
