export const dynamic = 'force-dynamic';

/**
 * VoIP Dashboard API — Enriched with 12 standard telephony KPIs
 * GET - Returns aggregated VoIP metrics, trends, agent status, voicemails, queues
 *
 * Query params:
 *   - dateFrom / dateTo: ISO date strings for period filter (default: current month)
 *   - period: shortcut — "today" | "week" | "month" (overrides dateFrom/dateTo)
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAdminGuard } from '@/lib/admin-api-guard';
import { VoipStateMap } from '@/lib/voip/voip-state';
import { getQueueStats } from '@/lib/voip/queue-engine';

// Access the active call state map to show live call counts on the dashboard
// This uses the same Redis-backed state used by call-control.ts
const activeCallStates = new VoipStateMap<{ callLogId?: string }>('voip:call:');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Resolve period boundaries from query params */
function resolvePeriod(searchParams: URLSearchParams): { from: Date; to: Date } {
  const now = new Date();
  const period = searchParams.get('period');

  if (period === 'today') {
    const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    return { from: startOfDay, to: now };
  }
  if (period === 'week') {
    const startOfWeek = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - now.getUTCDay()));
    return { from: startOfWeek, to: now };
  }
  // "month" or default
  const dateFrom = searchParams.get('dateFrom');
  const dateTo = searchParams.get('dateTo');
  const from = dateFrom ? new Date(dateFrom) : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const to = dateTo ? new Date(dateTo) : now;
  return { from, to };
}

/** Safe division — returns 0 when denominator is 0 */
function safePercent(numerator: number, denominator: number): number {
  return denominator > 0 ? Math.round((numerator / denominator) * 1000) / 10 : 0;
}

/** Round to N decimal places */
function round(value: number | null | undefined, decimals = 1): number {
  if (value == null) return 0;
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export const GET = withAdminGuard(async (request) => {
  const { searchParams } = new URL(request.url);
  const { from: periodStart, to: periodEnd } = resolvePeriod(searchParams);

  const now = new Date();
  const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  const dateFilter = { startedAt: { gte: periodStart, lte: periodEnd } };
  const todayFilter = { startedAt: { gte: startOfDay, lte: now } };

  // -----------------------------------------------------------------------
  // Phase 1: Batch transaction — basic counts and aggregates
  // -----------------------------------------------------------------------
  const [
    // Today
    callsToday,
    completedToday,
    missedToday,
    avgDurationToday,
    // Period — volume
    totalCalls,
    completedPeriod,
    missedPeriod,
    avgDurationPeriod,
    inboundCalls,
    outboundCalls,
    // Service level — inbound answered within 20s
    answeredIn20s,
    totalInbound,
    inboundMissed,
    // Performance — AHT (completed calls with duration)
    ahtAggregate,
    // Performance — FCR
    resolvedCount,
    totalWithDisposition,
    // Performance — transfer rate
    transferredCount,
    // Quality — voicemail calls
    voicemailCalls,
    // Quality — recording compliance (calls with a recording)
    callsWithRecording,
    totalCompletedPeriod,
    // Satisfaction surveys
    avgSatisfaction,
    // ASA — average speed of answer (avg waitTime for answered inbound)
    asaAggregate,
    // Active agents count
    activeAgentsCount,
    // Unread voicemails count
    unreadVoicemailCount,
    // Recent calls
    recentCalls,
  ] = await prisma.$transaction([
    // ---- Today ----
    prisma.callLog.count({ where: todayFilter }),
    prisma.callLog.count({ where: { ...todayFilter, status: 'COMPLETED' } }),
    prisma.callLog.count({ where: { ...todayFilter, status: 'MISSED' } }),
    prisma.callLog.aggregate({ where: { ...todayFilter, duration: { not: null } }, _avg: { duration: true } }),

    // ---- Period: Volume ----
    prisma.callLog.count({ where: dateFilter }),
    prisma.callLog.count({ where: { ...dateFilter, status: 'COMPLETED' } }),
    prisma.callLog.count({ where: { ...dateFilter, status: 'MISSED' } }),
    prisma.callLog.aggregate({ where: { ...dateFilter, duration: { not: null } }, _avg: { duration: true } }),
    prisma.callLog.count({ where: { ...dateFilter, direction: 'INBOUND' } }),
    prisma.callLog.count({ where: { ...dateFilter, direction: 'OUTBOUND' } }),

    // ---- Service Level: answered within 20s ----
    prisma.callLog.count({
      where: {
        ...dateFilter,
        direction: 'INBOUND',
        status: 'COMPLETED',
        waitTime: { lte: 20 },
      },
    }),
    // Total inbound for service level denominator
    prisma.callLog.count({
      where: { ...dateFilter, direction: 'INBOUND' },
    }),
    // Inbound missed
    prisma.callLog.count({
      where: { ...dateFilter, direction: 'INBOUND', status: 'MISSED' },
    }),

    // ---- AHT (Average Handle Time) ----
    prisma.callLog.aggregate({
      where: { ...dateFilter, status: 'COMPLETED', duration: { gt: 0 } },
      _avg: { duration: true },
    }),

    // ---- FCR (First Call Resolution) ----
    prisma.callLog.count({
      where: { ...dateFilter, disposition: 'resolved' },
    }),
    prisma.callLog.count({
      where: { ...dateFilter, disposition: { not: null } },
    }),

    // ---- Transfer Rate ----
    prisma.callLog.count({
      where: { ...dateFilter, status: 'TRANSFERRED' },
    }),

    // ---- Voicemail Rate ----
    prisma.callLog.count({
      where: { ...dateFilter, status: 'VOICEMAIL' },
    }),

    // ---- Recording Compliance ----
    prisma.callRecording.count({
      where: {
        callLog: { ...dateFilter, status: 'COMPLETED' },
      },
    }),
    prisma.callLog.count({
      where: { ...dateFilter, status: 'COMPLETED' },
    }),

    // ---- Satisfaction ----
    prisma.callSurvey.aggregate({
      where: { callLog: dateFilter },
      _avg: { overallScore: true },
    }),

    // ---- ASA (Average Speed of Answer) ----
    prisma.callLog.aggregate({
      where: {
        ...dateFilter,
        direction: 'INBOUND',
        status: 'COMPLETED',
        waitTime: { not: null },
      },
      _avg: { waitTime: true },
    }),

    // ---- Agents online ----
    prisma.sipExtension.count({ where: { status: { in: ['ONLINE', 'BUSY'] } } }),

    // ---- Unread voicemails ----
    prisma.voicemail.count({ where: { isRead: false } }),

    // ---- Recent calls ----
    prisma.callLog.findMany({
      where: {},
      include: {
        agent: { select: { extension: true, user: { select: { name: true } } } },
        client: { select: { name: true } },
      },
      orderBy: { startedAt: 'desc' },
      take: 10,
    }),
  ]);

  // -----------------------------------------------------------------------
  // Phase 2: Parallel queries (not in transaction — these are independent)
  // -----------------------------------------------------------------------
  const [
    sentimentResult,
    trendRows,
    agentsData,
    voicemailsData,
    queuesData,
    callbackStats,
  ] = await Promise.all([
    // ---- Average Sentiment (from CallTranscription) ----
    prisma.callTranscription.aggregate({
      where: {
        callLog: { ...dateFilter },
        sentimentScore: { not: null },
      },
      _avg: { sentimentScore: true },
      _count: { sentimentScore: true },
    }),

    // ---- Trends (last 7 days from period end) ----
    prisma.$queryRaw<Array<{
      date: string;
      calls: number;
      avgDuration: number;
      missedRate: number;
    }>>`
      SELECT
        TO_CHAR(DATE("startedAt"), 'YYYY-MM-DD') as date,
        COUNT(*)::int as calls,
        COALESCE(AVG("duration"), 0)::int as "avgDuration",
        CASE
          WHEN COUNT(*) > 0
          THEN (COUNT(*) FILTER (WHERE status = 'MISSED') * 100.0 / COUNT(*))::numeric(5,1)
          ELSE 0
        END as "missedRate"
      FROM "CallLog"
      WHERE "startedAt" >= ${new Date(periodEnd.getTime() - 7 * 86400000)}
        AND "startedAt" <= ${periodEnd}
      GROUP BY DATE("startedAt")
      ORDER BY DATE("startedAt") ASC
    `,

    // ---- Agent status with today's stats ----
    prisma.sipExtension.findMany({
      select: {
        id: true,
        extension: true,
        status: true,
        user: { select: { id: true, name: true } },
      },
      orderBy: { extension: 'asc' },
    }).then(async (extensions) => {
      // Fetch per-agent call stats for today in one batch query
      const agentIds = extensions.map(e => e.id);
      if (agentIds.length === 0) return [];

      const agentStats = await prisma.callLog.groupBy({
        by: ['agentId'],
        where: {
          ...todayFilter,
          agentId: { in: agentIds },
        },
        _count: { id: true },
        _avg: { duration: true },
      });

      const statsMap = new Map<string, { count: number; avgDuration: number | null }>();
      for (const s of agentStats) {
        if (s.agentId) {
          statsMap.set(s.agentId, { count: s._count.id, avgDuration: s._avg.duration });
        }
      }

      return extensions.map(ext => ({
        id: ext.id,
        name: ext.user?.name || `Extension ${ext.extension}`,
        extension: ext.extension,
        status: ext.status,
        callsToday: statsMap.get(ext.id)?.count ?? 0,
        avgHandleTime: round(statsMap.get(ext.id)?.avgDuration ?? null, 0),
      }));
    }),

    // ---- Unread voicemails (details, latest 20) ----
    prisma.voicemail.findMany({
      where: { isRead: false },
      select: {
        id: true,
        callerNumber: true,
        callerName: true,
        createdAt: true,
        durationSec: true,
        transcription: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),

    // ---- Queue status ----
    prisma.callQueue.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        members: {
          select: {
            user: {
              select: {
                presenceStatuses: { select: { status: true } },
                sipExtensions: { select: { isRegistered: true } },
              },
            },
          },
        },
      },
    }),

    // ---- Callback completion ----
    // Callbacks are tracked two ways:
    //   1. CallLog.disposition = "callback_needed" (inbound calls needing follow-up)
    //   2. DialerDisposition.type = CALLBACK with callbackAt (dialer campaigns)
    // A callback is "completed" when a subsequent outbound call exists for the same
    // callerNumber, or when the DialerDisposition type changes to INTERESTED/OTHER
    // after a CALLBACK. We approximate with the dialer disposition data.
    (async () => {
      // Count from CallLog dispositions
      const callbackNeededFromCalls = await prisma.callLog.count({
        where: { ...dateFilter, disposition: 'callback_needed' },
      });

      // Count from DialerDisposition (scheduled callbacks in period)
      const callbacksScheduled = await prisma.dialerDisposition.count({
        where: {
          callbackAt: { not: null },
          createdAt: { gte: periodStart, lte: periodEnd },
          type: 'CALLBACK',
        },
      });

      const totalNeeded = callbackNeededFromCalls + callbacksScheduled;

      // "Completed" callbacks: outbound calls to numbers that had callback_needed
      // For dialer: dispositions that were CALLBACK but the listEntry was subsequently called
      const callbacksHonoured = await prisma.dialerDisposition.count({
        where: {
          callbackAt: { not: null, lte: now },
          createdAt: { gte: periodStart, lte: periodEnd },
          listEntry: { isCalled: true },
        },
      });

      // Also count callback_needed calls where a subsequent outbound call was made
      // We approximate: count outbound calls in the period (a subset went to callbacks)
      const callbacksCompletedFromCalls = await prisma.callLog.count({
        where: {
          ...dateFilter,
          direction: 'OUTBOUND',
          disposition: 'resolved',
        },
      });

      const completed = callbacksHonoured + Math.min(callbacksCompletedFromCalls, callbackNeededFromCalls);

      return { needed: totalNeeded, completed: Math.min(completed, totalNeeded) };
    })(),
  ]);

  // -----------------------------------------------------------------------
  // Phase 3: Compute KPIs
  // -----------------------------------------------------------------------

  // Service Level: % of inbound calls answered within 20 seconds
  const serviceLevel = safePercent(answeredIn20s, totalInbound);

  // ASA: Average Speed of Answer (seconds)
  const avgSpeedOfAnswer = round(asaAggregate._avg.waitTime, 0);

  // Abandon Rate: % of inbound calls missed
  const abandonRate = safePercent(inboundMissed, totalInbound);

  // AHT: Average Handle Time (seconds)
  const avgHandleTime = round(ahtAggregate._avg.duration, 0);

  // FCR: First Call Resolution %
  const firstCallResolution = safePercent(resolvedCount, totalWithDisposition);

  // Transfer Rate %
  const transferRate = safePercent(transferredCount, totalCalls);

  // Voicemail Rate %
  const voicemailRate = safePercent(voicemailCalls, totalInbound);

  // Average Sentiment: transcription-based, scale 0-1 → convert to -1 to 1
  // sentimentScore is stored 0.0-1.0 in schema, we map to -1..1 for the dashboard
  const rawSentiment = sentimentResult._avg.sentimentScore;
  const avgSentiment = rawSentiment != null ? round(rawSentiment * 2 - 1, 2) : null;

  // Recording Compliance: % of completed calls with a recording
  const recordingCompliance = safePercent(callsWithRecording, totalCompletedPeriod);

  // Callback Completion: % of callbacks honoured
  const callbackCompletion = safePercent(callbackStats.completed, callbackStats.needed);

  // Answer rates (backward compatible)
  const answerRateToday = callsToday > 0
    ? Math.round((completedToday / callsToday) * 100)
    : 0;
  const answerRatePeriod = totalCalls > 0
    ? Math.round((completedPeriod / totalCalls) * 100)
    : 0;

  // -----------------------------------------------------------------------
  // Phase 4: Format queue data with live stats
  // -----------------------------------------------------------------------
  const liveQueueStats = getQueueStats();
  const queues = queuesData.map(q => {
    const onlineCount = q.members.filter(m =>
      m.user.presenceStatuses.some(p => p.status === 'ONLINE') ||
      m.user.sipExtensions.some(e => e.isRegistered)
    ).length;

    return {
      id: q.id,
      name: q.name,
      waitingCount: liveQueueStats.byQueue[q.id] || 0,
      avgWaitTime: 0, // Would need real-time tracking; placeholder
      agentsOnline: onlineCount,
    };
  });

  // -----------------------------------------------------------------------
  // Phase 5: Format voicemails
  // -----------------------------------------------------------------------
  const unreadVoicemails = voicemailsData.map(vm => ({
    id: vm.id,
    callerNumber: vm.callerNumber,
    callerName: vm.callerName,
    date: vm.createdAt.toISOString(),
    duration: vm.durationSec ?? 0,
    transcription: vm.transcription,
  }));

  // -----------------------------------------------------------------------
  // Phase 6: Format trends
  // -----------------------------------------------------------------------
  const trends = trendRows.map(row => ({
    date: row.date,
    calls: Number(row.calls),
    avgDuration: Number(row.avgDuration),
    missedRate: Number(row.missedRate),
  }));

  // -----------------------------------------------------------------------
  // Response — backward compatible + enriched KPIs
  // -----------------------------------------------------------------------
  return NextResponse.json({
    // 12 Standard Telephony KPIs
    kpis: {
      // Volume
      totalCalls,
      inboundCalls,
      outboundCalls,
      // Service Level
      serviceLevel,         // % answered in 20s (target: 80%)
      avgSpeedOfAnswer,     // ASA in seconds (target: <30s)
      abandonRate,          // % missed inbound (target: <5%)
      // Performance
      avgHandleTime,        // AHT in seconds (target: <240s)
      firstCallResolution,  // FCR % (target: >70%)
      transferRate,         // % transferred (target: <15%)
      // Quality
      voicemailRate,        // % voicemail (target: <10%)
      avgSentiment,         // -1 to 1 score (null if no data)
      recordingCompliance,  // % with recording (target: 100%)
      // Callbacks
      callbackCompletion,   // % callbacks honoured
      missedCalls: missedPeriod,
    },

    // 7-day trends
    trends,

    // Agent status
    agents: agentsData,

    // Unread voicemails (detail)
    unreadVoicemails,

    // Active queues
    queues,

    // ---- Backward-compatible fields ----
    today: {
      calls: callsToday,
      completed: completedToday,
      missed: missedToday,
      avgDuration: Math.round(avgDurationToday._avg.duration || 0),
      answerRate: answerRateToday,
    },
    period: {
      from: periodStart.toISOString(),
      to: periodEnd.toISOString(),
      calls: totalCalls,
      completed: completedPeriod,
      missed: missedPeriod,
      avgDuration: Math.round(avgDurationPeriod._avg.duration || 0),
      answerRate: answerRatePeriod,
      inbound: inboundCalls,
      outbound: outboundCalls,
    },
    satisfaction: {
      avgScore: avgSatisfaction._avg.overallScore
        ? Math.round(avgSatisfaction._avg.overallScore * 10) / 10
        : null,
    },
    activeAgents: activeAgentsCount,
    unreadVoicemailCount: unreadVoicemailCount,
    recentCalls,
    // Real-time state from VoipStateMap (Redis-backed, not DB queries)
    liveState: {
      activeCalls: activeCallStates.size,
      queueStats: liveQueueStats,
    },
  });
}, { skipCsrf: true });
