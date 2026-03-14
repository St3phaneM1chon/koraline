export const dynamic = 'force-dynamic';

/**
 * Call Center Analytics API — C29
 * GET /api/admin/crm/call-analytics - Call center KPIs
 *
 * Computes key call center metrics from CallLog data:
 * - AHT (Average Handle Time)
 * - ASA (Average Speed of Answer)
 * - FCR (First Call Resolution)
 * - Abandon Rate
 * - Service Level %
 * - Occupancy Rate
 *
 * Query params:
 * - from: ISO date string (start of range)
 * - to: ISO date string (end of range)
 * - queue: optional queue name filter
 */

import { NextRequest } from 'next/server';
import { withAdminGuard } from '@/lib/admin-api-guard';
import { prisma } from '@/lib/db';
import { apiSuccess } from '@/lib/api-response';

// ---------------------------------------------------------------------------
// GET: Call center KPIs
// ---------------------------------------------------------------------------

export const GET = withAdminGuard(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);

  // Default date range: last 7 days
  const now = new Date();
  const defaultFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const from = searchParams.get('from') ? new Date(searchParams.get('from')!) : defaultFrom;
  const to = searchParams.get('to') ? new Date(searchParams.get('to')!) : now;
  const queue = searchParams.get('queue') || undefined;

  // Build where clause
  const where: Record<string, unknown> = {
    startedAt: { gte: from, lte: to },
  };
  if (queue) {
    where.queue = queue;
  }

  // Fetch all calls in the range
  const [allCalls, , abandonedCalls, agentPresence] = await Promise.all([
    prisma.callLog.findMany({
      where,
      select: {
        id: true,
        status: true,
        direction: true,
        duration: true,
        queue: true,
        startedAt: true,
        answeredAt: true,
        endedAt: true,
        agentId: true,
        callerNumber: true,
      },
    }),

    // Completed calls (for AHT calculation)
    prisma.callLog.count({
      where: { ...where, status: 'COMPLETED', duration: { not: null } },
    }),

    // Abandoned/missed calls (MISSED in schema represents abandoned inbound calls)
    prisma.callLog.count({
      where: { ...where, status: 'MISSED' },
    }),

    // Agent presence count for occupancy
    prisma.presenceStatus.count({
      where: { status: { in: ['ONLINE', 'BUSY'] } },
    }),
  ]);

  // ── Single-pass computation of all KPIs, hourly + daily ──
  const totalCalls = allCalls.length;
  const SL_THRESHOLD = 20; // seconds
  let answeredCount = 0;
  let inboundCount = 0;
  let totalTalkTime = 0;
  let totalWaitTime = 0;
  let waitCount = 0;
  let answeredWithinThreshold = 0;

  const callerMap = new Map<string, number>();
  const hourlyDistribution = Array.from({ length: 24 }, (_, h) => ({
    hour: h, total: 0, answered: 0, abandoned: 0,
  }));
  const dailyMap = new Map<string, { date: string; total: number; answered: number; abandoned: number; aht: number; talkTime: number }>();

  for (const call of allCalls) {
    const isCompleted = call.status === 'COMPLETED';
    const isMissed = call.status === 'MISSED';
    const isInbound = call.direction === 'INBOUND';
    const hour = new Date(call.startedAt).getHours();
    const dateKey = new Date(call.startedAt).toISOString().split('T')[0];

    // AHT + ASA + Service Level
    if (isCompleted) {
      answeredCount++;
      totalTalkTime += call.duration || 0;
      if (call.startedAt && call.answeredAt) {
        const wait = (new Date(call.answeredAt).getTime() - new Date(call.startedAt).getTime()) / 1000;
        if (wait >= 0 && wait < 600) {
          totalWaitTime += wait;
          waitCount++;
        }
        if (isInbound && wait <= SL_THRESHOLD) {
          answeredWithinThreshold++;
        }
      }
    }

    if (isInbound) inboundCount++;

    // FCR
    if (call.callerNumber) {
      callerMap.set(call.callerNumber, (callerMap.get(call.callerNumber) || 0) + 1);
    }

    // Hourly distribution
    hourlyDistribution[hour].total++;
    if (isCompleted) hourlyDistribution[hour].answered++;
    if (isMissed) hourlyDistribution[hour].abandoned++;

    // Daily trend
    if (!dailyMap.has(dateKey)) {
      dailyMap.set(dateKey, { date: dateKey, total: 0, answered: 0, abandoned: 0, aht: 0, talkTime: 0 });
    }
    const day = dailyMap.get(dateKey)!;
    day.total++;
    if (isCompleted) { day.answered++; day.talkTime += call.duration || 0; }
    if (isMissed) day.abandoned++;
  }

  const aht = answeredCount > 0 ? Math.round(totalTalkTime / answeredCount) : 0;
  const asa = waitCount > 0 ? Math.round(totalWaitTime / waitCount) : 0;

  const uniqueCallers = callerMap.size;
  const singleCallCallers = Array.from(callerMap.values()).filter(c => c === 1).length;
  const fcr = uniqueCallers > 0 ? Math.round((singleCallCallers / uniqueCallers) * 100) : 0;

  const abandonRate = totalCalls > 0 ? Math.round((abandonedCalls / totalCalls) * 1000) / 10 : 0;
  const serviceLevel = inboundCount > 0 ? Math.round((answeredWithinThreshold / inboundCount) * 100) : 0;

  const rangeHours = Math.max(1, (to.getTime() - from.getTime()) / (1000 * 60 * 60));
  const agentHoursAvailable = agentPresence * rangeHours;
  const agentHoursTalking = totalTalkTime / 3600;
  const occupancyRate = agentHoursAvailable > 0
    ? Math.min(100, Math.round((agentHoursTalking / agentHoursAvailable) * 100))
    : 0;

  const dailyTrend = Array.from(dailyMap.values())
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(d => ({ ...d, aht: d.answered > 0 ? Math.round(d.talkTime / d.answered) : 0 }));

  return apiSuccess({
    dateRange: { from: from.toISOString(), to: to.toISOString() },
    kpis: {
      aht,               // seconds
      asa,               // seconds
      fcr,               // percentage
      abandonRate,        // percentage
      serviceLevel,       // percentage
      occupancyRate,      // percentage
      totalCalls,
      answeredCalls: answeredCount,
      abandonedCalls,
      avgTalkTime: aht,
    },
    hourlyDistribution,
    dailyTrend,
  }, { request });
}, { requiredPermission: 'crm.reports.view' });
