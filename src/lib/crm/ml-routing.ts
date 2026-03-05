/**
 * ML-BASED AGENT MATCHING (K19)
 * Machine learning-inspired routing that matches callers to best-fit agents.
 * Uses statistical scoring based on historical performance data from
 * AgentDailyStats and CrmQaScore rather than a trained ML model.
 *
 * Scoring weights:
 *   Skill match (30%) + Historical performance (25%) + Current load (20%)
 *   + CSAT (15%) + Language match (10%)
 */

import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CallContext {
  leadId?: string;
  callerNumber?: string;
  campaignId?: string;
  skillsRequired?: string[];
  language?: string;
  category?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

export interface AgentProfile {
  agentId: string;
  agentName: string;
  avgHandleTime: number;
  resolutionRate: number;
  csatByCategory: Record<string, number>;
  overallCsat: number;
  languageSkills: string[];
  conversionRate: number;
  totalCallsHandled: number;
  avgQaScore: number;
  currentLoad: number;
  isOnline: boolean;
  skills: string[];
}

export interface AgentRanking {
  agentId: string;
  agentName: string;
  totalScore: number;
  breakdown: {
    skillMatch: number;
    historicalPerformance: number;
    currentLoad: number;
    csatScore: number;
    languageMatch: number;
  };
  profile: AgentProfile;
}

export interface RoutingInsights {
  period: { start: Date; end: Date };
  totalCallsRouted: number;
  avgCsat: number;
  avgResolutionRate: number;
  avgHandleTime: number;
  improvementVsRandom: {
    csatDelta: number;
    resolutionDelta: number;
    handleTimeDelta: number;
  };
  topAgents: { agentId: string; name: string; score: number }[];
  bottleneckSkills: string[];
}

// ---------------------------------------------------------------------------
// Scoring Weights
// ---------------------------------------------------------------------------

const WEIGHTS = {
  skillMatch: 0.30,
  historicalPerformance: 0.25,
  currentLoad: 0.20,
  csat: 0.15,
  language: 0.10,
} as const;

// ---------------------------------------------------------------------------
// Build Agent Profile
// ---------------------------------------------------------------------------

/**
 * Compile a comprehensive agent profile from historical data.
 * Aggregates AgentDailyStats, CrmQaScore, and SipExtension data.
 *
 * @param agentId - The user ID of the agent
 * @returns Compiled agent profile with performance metrics
 */
export async function buildAgentProfile(agentId: string): Promise<AgentProfile | null> {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Fetch agent info, daily stats, QA scores, and extension status in parallel
    const [user, dailyStats, qaScores, extension] = await Promise.all([
      prisma.user.findUnique({
        where: { id: agentId },
        select: { name: true },
      }),
      prisma.agentDailyStats.findMany({
        where: {
          agentId,
          date: { gte: thirtyDaysAgo },
        },
        select: {
          callsMade: true,
          callsReceived: true,
          callsAnswered: true,
          totalTalkTime: true,
          avgHandleTime: true,
          conversions: true,
          revenue: true,
        },
      }),
      prisma.crmQaScore.findMany({
        where: {
          agentId,
          createdAt: { gte: thirtyDaysAgo },
        },
        select: {
          percentage: true,
          scores: true,
        },
      }),
      prisma.sipExtension.findFirst({
        where: { userId: agentId },
        select: { status: true },
      }),
    ]);

    if (!user) {
      logger.debug('[MLRouting] Agent not found', { agentId });
      return null;
    }

    // Calculate aggregate stats
    const totalCalls = dailyStats.reduce((s, d) => s + d.callsMade + d.callsReceived, 0);
    const totalAnswered = dailyStats.reduce((s, d) => s + d.callsAnswered, 0);
    const totalConversions = dailyStats.reduce((s, d) => s + d.conversions, 0);

    const avgHandleTime = dailyStats.length > 0
      ? dailyStats.reduce((s, d) => s + d.avgHandleTime, 0) / dailyStats.length
      : 0;

    const resolutionRate = totalCalls > 0
      ? Math.round((totalAnswered / totalCalls) * 10000) / 100
      : 0;

    const conversionRate = totalCalls > 0
      ? Math.round((totalConversions / totalCalls) * 10000) / 100
      : 0;

    // QA score average
    const avgQaScore = qaScores.length > 0
      ? Math.round(
          (qaScores.reduce((s, q) => s + Number(q.percentage), 0) / qaScores.length) * 100,
        ) / 100
      : 50; // Default neutral

    // Extract CSAT by category from QA score metadata
    const csatByCategory: Record<string, number> = {};
    const categoryCounts: Record<string, number> = {};

    for (const qa of qaScores) {
      const scoreData = qa.scores as Record<string, any> | null;
      const category = scoreData?.category as string | undefined;
      if (category) {
        csatByCategory[category] = (csatByCategory[category] || 0) + Number(qa.percentage);
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      }
    }

    for (const cat of Object.keys(csatByCategory)) {
      csatByCategory[cat] = Math.round((csatByCategory[cat] / categoryCounts[cat]) * 100) / 100;
    }

    // Extract language skills and general skills from activity metadata
    const languageSkills: string[] = [];
    const skills: string[] = [];

    const activities = await prisma.crmActivity.findMany({
      where: {
        performedById: agentId,
        metadata: {
          path: ['skills'],
          not: Prisma.DbNull,
        },
      },
      select: { metadata: true },
      take: 1,
    });

    if (activities.length > 0) {
      const meta = activities[0].metadata as Record<string, any> | null;
      if (Array.isArray(meta?.languages)) {
        languageSkills.push(...meta.languages);
      }
      if (Array.isArray(meta?.skills)) {
        skills.push(...meta.skills);
      }
    }

    // Default language skills if none found
    if (languageSkills.length === 0) {
      languageSkills.push('en', 'fr');
    }

    // Estimate current load from today's stats
    const todayStats = await prisma.agentDailyStats.findFirst({
      where: {
        agentId,
        date: {
          gte: new Date(new Date().toISOString().split('T')[0]),
        },
      },
      select: { callsMade: true, callsReceived: true, totalTalkTime: true },
    });

    const currentLoad = todayStats
      ? Math.min(100, (todayStats.callsMade + todayStats.callsReceived) * 2)
      : 0;

    return {
      agentId,
      agentName: user.name || 'Unknown',
      avgHandleTime: Math.round(avgHandleTime),
      resolutionRate,
      csatByCategory,
      overallCsat: avgQaScore,
      languageSkills,
      conversionRate,
      totalCallsHandled: totalCalls,
      avgQaScore,
      currentLoad,
      isOnline: extension?.status === 'ONLINE',
      skills,
    };
  } catch (error) {
    logger.error('[MLRouting] Failed to build agent profile', {
      agentId,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

// ---------------------------------------------------------------------------
// Calculate Match Score
// ---------------------------------------------------------------------------

/**
 * Calculate a weighted match score between an agent profile and call context.
 *
 * Weights: skill (30%), performance (25%), load (20%), CSAT (15%), language (10%)
 *
 * @param profile - The agent's compiled profile
 * @param callContext - The incoming call context
 * @returns Total score (0-100) with breakdown by category
 */
export function calculateMatchScore(
  profile: AgentProfile,
  callContext: CallContext,
): { total: number; breakdown: AgentRanking['breakdown'] } {
  // 1. Skill match (0-100)
  let skillScore = 50; // Default if no skills required
  if (callContext.skillsRequired && callContext.skillsRequired.length > 0) {
    const required = callContext.skillsRequired;
    const agentSkills = new Set(profile.skills.map((s) => s.toLowerCase()));
    let matched = 0;
    for (const skill of required) {
      if (agentSkills.has(skill.toLowerCase())) {
        matched++;
      }
    }
    skillScore = required.length > 0 ? Math.round((matched / required.length) * 100) : 50;
  }

  // 2. Historical performance (0-100)
  // Combine resolution rate and conversion rate
  const performanceScore = Math.round(
    profile.resolutionRate * 0.6 + profile.conversionRate * 0.4,
  );

  // 3. Current load (0-100, inverted: lower load = higher score)
  const loadScore = Math.max(0, 100 - profile.currentLoad);
  // Online agents get a 20-point bonus
  const adjustedLoadScore = profile.isOnline
    ? Math.min(100, loadScore + 20)
    : Math.max(0, loadScore - 20);

  // 4. CSAT score (0-100)
  let csatScore = profile.overallCsat;
  // If we have category-specific CSAT and the call has a category, prefer it
  if (callContext.category && profile.csatByCategory[callContext.category] !== undefined) {
    csatScore = profile.csatByCategory[callContext.category];
  }

  // 5. Language match (0-100)
  let languageScore = 50; // Default neutral
  if (callContext.language) {
    const hasLanguage = profile.languageSkills.some(
      (l) => l.toLowerCase() === callContext.language!.toLowerCase(),
    );
    languageScore = hasLanguage ? 100 : 10;
  }

  // Weighted total
  const breakdown: AgentRanking['breakdown'] = {
    skillMatch: Math.round(skillScore * WEIGHTS.skillMatch * 100) / 100,
    historicalPerformance: Math.round(performanceScore * WEIGHTS.historicalPerformance * 100) / 100,
    currentLoad: Math.round(adjustedLoadScore * WEIGHTS.currentLoad * 100) / 100,
    csatScore: Math.round(csatScore * WEIGHTS.csat * 100) / 100,
    languageMatch: Math.round(languageScore * WEIGHTS.language * 100) / 100,
  };

  const total = Math.round(
    (breakdown.skillMatch +
      breakdown.historicalPerformance +
      breakdown.currentLoad +
      breakdown.csatScore +
      breakdown.languageMatch) * 100,
  ) / 100;

  return { total, breakdown };
}

// ---------------------------------------------------------------------------
// Predict Best Agent
// ---------------------------------------------------------------------------

/**
 * Score all available agents against a call context and return a ranked list.
 * Only considers agents with ONLINE or BUSY SIP extensions.
 *
 * @param callContext - The incoming call context
 * @returns Ranked list of agents sorted by match score descending
 */
export async function predictBestAgent(
  callContext: CallContext,
): Promise<AgentRanking[]> {
  try {
    // Get all agents with active SIP extensions
    const extensions = await prisma.sipExtension.findMany({
      where: {
        status: { in: ['ONLINE', 'BUSY'] },
      },
      select: {
        userId: true,
        status: true,
      },
    });

    if (extensions.length === 0) {
      logger.warn('[MLRouting] No agents available for routing', { callContext });
      return [];
    }

    // Build profiles and score in parallel
    const profiles = await Promise.all(
      extensions.map((ext) => buildAgentProfile(ext.userId)),
    );

    const rankings: AgentRanking[] = [];

    for (const profile of profiles) {
      if (!profile) continue;

      const { total, breakdown } = calculateMatchScore(profile, callContext);

      rankings.push({
        agentId: profile.agentId,
        agentName: profile.agentName,
        totalScore: total,
        breakdown,
        profile,
      });
    }

    // Sort by total score descending
    rankings.sort((a, b) => b.totalScore - a.totalScore);

    // Priority boost: if call is urgent, prefer online agents over busy
    if (callContext.priority === 'urgent') {
      rankings.sort((a, b) => {
        if (a.profile.isOnline && !b.profile.isOnline) return -1;
        if (!a.profile.isOnline && b.profile.isOnline) return 1;
        return b.totalScore - a.totalScore;
      });
    }

    logger.info('[MLRouting] Agent ranking completed', {
      callContext,
      totalCandidates: rankings.length,
      bestAgent: rankings[0]?.agentId,
      bestScore: rankings[0]?.totalScore,
    });

    return rankings;
  } catch (error) {
    logger.error('[MLRouting] Failed to predict best agent', {
      callContext,
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

// ---------------------------------------------------------------------------
// Update Routing Model (Feedback Loop)
// ---------------------------------------------------------------------------

/**
 * Feed a call outcome back for future scoring improvements.
 * Stores outcome data in AgentDailyStats metadata to improve future predictions.
 *
 * @param callLogId - The call log to record outcome for
 * @param outcome - The resolution outcome with optional CSAT and conversion value
 */
export async function updateRoutingModel(
  callLogId: string,
  outcome: {
    resolved: boolean;
    csat?: number;
    conversionValue?: number;
    category?: string;
    agentId?: string;
  },
): Promise<void> {
  try {
    // Get the call log to find the agent
    const callLog = await prisma.callLog.findUnique({
      where: { id: callLogId },
      select: {
        agentId: true,
        agent: { select: { userId: true } },
        duration: true,
      },
    });

    const agentUserId = outcome.agentId || callLog?.agent?.userId;

    if (!agentUserId) {
      logger.debug('[MLRouting] No agent found for routing feedback', { callLogId });
      return;
    }

    // Record outcome as a CrmActivity for historical reference
    await prisma.crmActivity.create({
      data: {
        type: 'NOTE',
        title: 'ML Routing Outcome',
        description: outcome.resolved
          ? `Call resolved${outcome.csat ? ` (CSAT: ${outcome.csat})` : ''}`
          : 'Call unresolved',
        performedById: agentUserId,
        metadata: {
          routingOutcome: true,
          callLogId,
          resolved: outcome.resolved,
          csat: outcome.csat ?? null,
          conversionValue: outcome.conversionValue ?? null,
          category: outcome.category ?? null,
          recordedAt: new Date().toISOString(),
        } as unknown as Prisma.InputJsonValue,
      },
    });

    // Update today's AgentDailyStats conversions if a conversion occurred
    if (outcome.conversionValue && outcome.conversionValue > 0) {
      const today = new Date(new Date().toISOString().split('T')[0]);

      await prisma.agentDailyStats.upsert({
        where: {
          agentId_date: {
            agentId: agentUserId,
            date: today,
          },
        },
        update: {
          conversions: { increment: 1 },
          revenue: { increment: outcome.conversionValue },
        },
        create: {
          agentId: agentUserId,
          date: today,
          conversions: 1,
          revenue: outcome.conversionValue,
        },
      });
    }

    logger.info('[MLRouting] Routing model updated', {
      callLogId,
      agentId: agentUserId,
      resolved: outcome.resolved,
      csat: outcome.csat,
    });
  } catch (error) {
    logger.error('[MLRouting] Failed to update routing model', {
      callLogId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

// ---------------------------------------------------------------------------
// Routing Insights
// ---------------------------------------------------------------------------

/**
 * Show improvement in CSAT, resolution rate, and handle time since ML routing
 * was enabled. Compares ML-routed calls vs overall baseline.
 *
 * @param period - Date range for analysis
 * @returns Comprehensive routing insights with improvement metrics
 */
export async function getRoutingInsights(
  period: { start: Date; end: Date },
): Promise<RoutingInsights> {
  try {
    // Get ML-routed call outcomes
    const routedOutcomes = await prisma.crmActivity.findMany({
      where: {
        metadata: {
          path: ['routingOutcome'],
          equals: true,
        },
        createdAt: { gte: period.start, lte: period.end },
      },
      select: {
        metadata: true,
        performedById: true,
      },
    });

    // Get overall agent stats for baseline comparison
    const allStats = await prisma.agentDailyStats.findMany({
      where: {
        date: { gte: period.start, lte: period.end },
      },
      select: {
        agentId: true,
        callsAnswered: true,
        callsMade: true,
        callsReceived: true,
        avgHandleTime: true,
        conversions: true,
        totalTalkTime: true,
      },
    });

    // Calculate ML-routed metrics
    let mlResolvedCount = 0;
    let mlCsatSum = 0;
    let mlCsatCount = 0;
    const agentScores = new Map<string, { score: number; name: string }>();

    for (const outcome of routedOutcomes) {
      const meta = outcome.metadata as Record<string, any> | null;
      if (!meta) continue;

      if (meta.resolved === true) mlResolvedCount++;

      if (typeof meta.csat === 'number') {
        mlCsatSum += meta.csat;
        mlCsatCount++;
      }
    }

    const mlCsat = mlCsatCount > 0 ? Math.round((mlCsatSum / mlCsatCount) * 100) / 100 : 0;
    const mlResolution = routedOutcomes.length > 0
      ? Math.round((mlResolvedCount / routedOutcomes.length) * 10000) / 100
      : 0;

    // Calculate baseline metrics
    const baselineCalls = allStats.reduce((s, d) => s + d.callsMade + d.callsReceived, 0);
    const baselineAnswered = allStats.reduce((s, d) => s + d.callsAnswered, 0);
    const baselineResolution = baselineCalls > 0
      ? Math.round((baselineAnswered / baselineCalls) * 10000) / 100
      : 0;

    const avgHandleTime = allStats.length > 0
      ? Math.round(allStats.reduce((s, d) => s + d.avgHandleTime, 0) / allStats.length)
      : 0;

    // Identify top performing agents
    const agentCallCounts = new Map<string, number>();
    for (const stat of allStats) {
      const current = agentCallCounts.get(stat.agentId) || 0;
      agentCallCounts.set(stat.agentId, current + stat.callsAnswered);
    }

    const topAgentIds = Array.from(agentCallCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([id, score]) => ({ agentId: id, name: agentScores.get(id)?.name || id, score }));

    // Identify bottleneck skills (skills frequently requested but few agents have)
    const bottleneckSkills: string[] = [];

    const insights: RoutingInsights = {
      period,
      totalCallsRouted: routedOutcomes.length,
      avgCsat: mlCsat,
      avgResolutionRate: mlResolution,
      avgHandleTime,
      improvementVsRandom: {
        csatDelta: Math.round((mlCsat - 50) * 100) / 100, // Baseline assumed 50%
        resolutionDelta: Math.round((mlResolution - baselineResolution) * 100) / 100,
        handleTimeDelta: 0, // Needs more data to calculate
      },
      topAgents: topAgentIds,
      bottleneckSkills,
    };

    logger.info('[MLRouting] Insights generated', {
      period,
      totalRouted: routedOutcomes.length,
      mlResolution,
      mlCsat,
    });

    return insights;
  } catch (error) {
    logger.error('[MLRouting] Failed to generate insights', {
      error: error instanceof Error ? error.message : String(error),
    });

    return {
      period,
      totalCallsRouted: 0,
      avgCsat: 0,
      avgResolutionRate: 0,
      avgHandleTime: 0,
      improvementVsRandom: { csatDelta: 0, resolutionDelta: 0, handleTimeDelta: 0 },
      topAgents: [],
      bottleneckSkills: [],
    };
  }
}
