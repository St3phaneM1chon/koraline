/**
 * CRM Real-time Adherence Monitoring - F3
 *
 * Tracks agent adherence to scheduled shifts in real time.
 * Compares current presence status against scheduled activities and
 * calculates adherence rates over time.
 *
 * Functions:
 * - getRealtimeAdherence: Compare current status vs scheduled activity
 * - calculateAdherenceRate: % time on schedule for a given date
 * - getTeamAdherence: All agents' adherence scores
 * - getAdherenceExceptions: List deviations from schedule
 */

import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AdherenceState = 'IN_ADHERENCE' | 'OUT_OF_ADHERENCE';

export interface AgentAdherence {
  agentId: string;
  agentName: string;
  agentEmail: string | null;
  agentImage: string | null;
  scheduledActivity: string | null; // e.g. "MORNING 09:00-17:00"
  actualStatus: string;             // e.g. "ONLINE", "OFFLINE"
  state: AdherenceState;
  reason: string | null;            // null when in adherence
  adherenceRate: number;            // 0-100%
}

export interface AdherenceException {
  id: string;
  agentId: string;
  timestamp: Date;
  expectedStatus: string;
  actualStatus: string;
  reason: string;
  durationMinutes: number;
}

// ---------------------------------------------------------------------------
// getRealtimeAdherence
// ---------------------------------------------------------------------------

/**
 * Get the real-time adherence state for a single agent.
 * Compares the agent's current PresenceStatus against their scheduled shift.
 */
export async function getRealtimeAdherence(agentId: string): Promise<AgentAdherence | null> {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const [schedule, presence, user] = await Promise.all([
    prisma.agentSchedule.findFirst({
      where: { agentId, date: todayStart },
    }),
    prisma.presenceStatus.findFirst({
      where: { userId: agentId },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.user.findUnique({
      where: { id: agentId },
      select: { id: true, name: true, email: true, image: true },
    }),
  ]);

  if (!user) return null;

  const actualStatus = presence?.status ?? 'OFFLINE';
  let scheduledActivity: string | null = null;
  let state: AdherenceState = 'IN_ADHERENCE';
  let reason: string | null = null;

  if (schedule && !schedule.isOff) {
    scheduledActivity = `${schedule.shiftType} ${schedule.startTime}-${schedule.endTime}`;
    const isInShift = currentTime >= schedule.startTime && currentTime <= schedule.endTime;

    if (isInShift && (actualStatus === 'OFFLINE' || actualStatus === 'AWAY')) {
      state = 'OUT_OF_ADHERENCE';
      reason = actualStatus === 'OFFLINE' ? 'Late login or unauthorized absence' : 'Unauthorized break';
    } else if (!isInShift && (actualStatus === 'ONLINE' || actualStatus === 'BUSY')) {
      // Working outside schedule - generally OK but track
      state = 'IN_ADHERENCE';
    }
  } else if (schedule?.isOff) {
    scheduledActivity = 'DAY OFF';
  } else {
    scheduledActivity = 'No schedule';
  }

  return {
    agentId: user.id,
    agentName: user.name ?? 'Unknown',
    agentEmail: user.email,
    agentImage: user.image,
    scheduledActivity,
    actualStatus,
    state,
    reason,
    adherenceRate: state === 'IN_ADHERENCE' ? 100 : 0,
  };
}

// ---------------------------------------------------------------------------
// calculateAdherenceRate
// ---------------------------------------------------------------------------

/**
 * Calculate the adherence rate for an agent on a specific date.
 * Uses PresenceStatus records to determine how much time the agent
 * was in the correct status during their scheduled shift.
 */
export async function calculateAdherenceRate(agentId: string, date: Date): Promise<number> {
  const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const schedule = await prisma.agentSchedule.findFirst({
    where: { agentId, date: dayStart },
  });

  if (!schedule || schedule.isOff) return 100; // No schedule or day off = 100% adherent

  const [startH, startM] = schedule.startTime.split(':').map(Number);
  const [endH, endM] = schedule.endTime.split(':').map(Number);
  const shiftMinutes = (endH * 60 + endM) - (startH * 60 + startM);
  if (shiftMinutes <= 0) return 100;

  // Get presence records for the day
  const presence = await prisma.presenceStatus.findFirst({
    where: { userId: agentId },
    select: { status: true, onlineSince: true, lastActivity: true },
  });

  if (!presence || !presence.onlineSince) return 0;

  // Simplified: if agent was online during their shift, calculate approximate adherence
  const onlineSince = presence.onlineSince;
  const shiftStart = new Date(dayStart);
  shiftStart.setHours(startH, startM, 0, 0);
  const shiftEnd = new Date(dayStart);
  shiftEnd.setHours(endH, endM, 0, 0);

  const effectiveStart = onlineSince > shiftStart ? onlineSince : shiftStart;
  const now = new Date();
  const effectiveEnd = now < shiftEnd ? now : shiftEnd;

  const onlineMinutes = Math.max(0, (effectiveEnd.getTime() - effectiveStart.getTime()) / 60000);
  const currentShiftMinutes = Math.max(0, (effectiveEnd.getTime() - shiftStart.getTime()) / 60000);

  if (currentShiftMinutes <= 0) return 100;

  const rate = Math.min(100, Math.round((onlineMinutes / currentShiftMinutes) * 100));

  logger.debug('Adherence rate calculated', {
    event: 'adherence_rate_calc',
    agentId,
    date: dayStart.toISOString(),
    rate,
    onlineMinutes,
    shiftMinutes: currentShiftMinutes,
  });

  return rate;
}

// ---------------------------------------------------------------------------
// getTeamAdherence
// ---------------------------------------------------------------------------

/**
 * Get adherence status for all agents who have a schedule today.
 */
export async function getTeamAdherence(): Promise<AgentAdherence[]> {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const schedules = await prisma.agentSchedule.findMany({
    where: { date: todayStart },
    include: {
      agent: { select: { id: true, name: true, email: true, image: true } },
    },
  });

  const results: AgentAdherence[] = [];

  for (const schedule of schedules) {
    const adherence = await getRealtimeAdherence(schedule.agentId);
    if (adherence) {
      results.push(adherence);
    }
  }

  return results;
}

// ---------------------------------------------------------------------------
// getAdherenceExceptions
// ---------------------------------------------------------------------------

/**
 * Get adherence exceptions (deviations from schedule) for an agent on a date.
 * Returns a list of time periods where the agent was out of adherence.
 */
export async function getAdherenceExceptions(
  agentId: string,
  date: Date
): Promise<AdherenceException[]> {
  const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const schedule = await prisma.agentSchedule.findFirst({
    where: { agentId, date: dayStart },
  });

  if (!schedule || schedule.isOff) return [];

  // Build exceptions based on current state (simplified)
  const adherence = await getRealtimeAdherence(agentId);
  const exceptions: AdherenceException[] = [];

  if (adherence && adherence.state === 'OUT_OF_ADHERENCE') {
    exceptions.push({
      id: `exc-${agentId}-${Date.now()}`,
      agentId,
      timestamp: new Date(),
      expectedStatus: 'ONLINE',
      actualStatus: adherence.actualStatus,
      reason: adherence.reason ?? 'Out of adherence',
      durationMinutes: 0, // Real-time - duration not yet known
    });
  }

  return exceptions;
}
