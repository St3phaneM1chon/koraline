export const dynamic = 'force-dynamic';

/**
 * Analytics Hub Page - Links to sub-analytics pages.
 */

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth-config';
import { prisma } from '@/lib/db';
import { UserRole } from '@/types';
import AnalyticsHubClient from './AnalyticsHubClient';

export default async function AnalyticsHubPage() {
  const session = await auth();
  if (!session?.user || (session.user.role !== UserRole.EMPLOYEE && session.user.role !== UserRole.OWNER)) {
    redirect('/auth/signin');
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Fetch summary stats for each card
  const [totalCalls, agentCount, queueCount, transcriptionCount] = await Promise.all([
    prisma.callLog.count({
      where: { startedAt: { gte: thirtyDaysAgo } },
    }),
    prisma.sipExtension.count(),
    prisma.callQueue.count({ where: { isActive: true } }),
    prisma.callTranscription.count(),
  ]);

  // Avg satisfaction from surveys
  const avgSurvey = await prisma.callSurvey.aggregate({
    _avg: { overallScore: true },
  });

  const summaryStats = {
    totalCalls,
    agentCount,
    queueCount,
    transcriptionCount,
    avgSatisfaction: avgSurvey._avg.overallScore || 0,
  };

  return <AnalyticsHubClient stats={JSON.parse(JSON.stringify(summaryStats))} />;
}
