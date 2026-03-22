/**
 * Proactive Alerts — Monitors VoIP system and surfaces actionable alerts.
 *
 * Alert types:
 * 1. voicemail_unread  — Voicemails unread for >2 hours
 * 2. missed_calls      — 3+ missed calls in the last hour
 * 3. agent_offline     — Agents offline during business hours (9-17 ET, weekdays)
 * 4. high_volume       — Today's call volume exceeds 150% of 7-day daily average
 * 5. negative_sentiment — Client with 2+ negative-sentiment calls in last 30 days
 * 6. low_service_level — Service level below 80% threshold today
 * 7. recording_gap     — Completed calls without recordings (compliance risk)
 *
 * Designed to be called:
 * - By the dashboard API (GET /api/admin/voip/alerts) for real-time display
 * - By a periodic cron for email/push notifications
 */

import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AlertType =
  | 'voicemail_unread'
  | 'missed_calls'
  | 'agent_offline'
  | 'high_volume'
  | 'negative_sentiment'
  | 'low_service_level'
  | 'recording_gap';

export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  timestamp: Date;
  data?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Get current hour and day in Eastern Time (America/Toronto). */
function getEasternTimeInfo(now: Date): { hour: number; dayShort: string } {
  const hour = parseInt(
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Toronto',
      hour: 'numeric',
      hour12: false,
    }).format(now),
    10
  );
  const dayShort = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Toronto',
    weekday: 'short',
  }).format(now);
  return { hour, dayShort };
}

/** Determine if the given time is within business hours (Mon-Fri 9-17 ET). */
function isBusinessHours(now: Date): boolean {
  const { hour, dayShort } = getEasternTimeInfo(now);
  return !['Sat', 'Sun'].includes(dayShort) && hour >= 9 && hour < 17;
}

// ---------------------------------------------------------------------------
// Alert checks
// ---------------------------------------------------------------------------

/**
 * Check all alert conditions and return active alerts.
 * Called by the dashboard or a periodic cron.
 */
export async function checkAlerts(): Promise<Alert[]> {
  const alerts: Alert[] = [];
  const now = new Date();

  // Run all checks in parallel for performance
  const results = await Promise.allSettled([
    checkUnreadVoicemails(now, alerts),
    checkMissedCalls(now, alerts),
    checkAgentsOffline(now, alerts),
    checkHighVolume(now, alerts),
    checkNegativeSentiment(now, alerts),
    checkServiceLevel(now, alerts),
    checkRecordingGap(now, alerts),
  ]);

  // Log any check failures (but don't block the response)
  for (const result of results) {
    if (result.status === 'rejected') {
      logger.warn('[ProactiveAlerts] Alert check failed', {
        error: result.reason instanceof Error ? result.reason.message : String(result.reason),
      });
    }
  }

  // Sort by severity: critical first, then warning, then info
  const severityOrder: Record<AlertSeverity, number> = { critical: 0, warning: 1, info: 2 };
  alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return alerts;
}

// ---------------------------------------------------------------------------
// Individual alert checks
// ---------------------------------------------------------------------------

/**
 * 1. Unread voicemails older than 2 hours.
 */
async function checkUnreadVoicemails(now: Date, alerts: Alert[]): Promise<void> {
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

  const count = await prisma.voicemail.count({
    where: {
      isRead: false,
      createdAt: { lt: twoHoursAgo },
    },
  });

  if (count > 0) {
    alerts.push({
      id: `vm-unread-${now.getTime()}`,
      type: 'voicemail_unread',
      severity: count > 5 ? 'critical' : 'warning',
      title: `${count} message(s) vocal(aux) non lu(s)`,
      message: `${count} message(s) vocal(aux) non lu(s) depuis plus de 2 heures. Les clients attendent un retour d'appel.`,
      timestamp: now,
      data: { count },
    });
  }
}

/**
 * 2. Three or more missed calls in the last hour.
 */
async function checkMissedCalls(now: Date, alerts: Alert[]): Promise<void> {
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  const count = await prisma.callLog.count({
    where: {
      direction: 'INBOUND',
      status: 'MISSED',
      startedAt: { gte: oneHourAgo },
    },
  });

  if (count >= 3) {
    alerts.push({
      id: `missed-calls-${now.getTime()}`,
      type: 'missed_calls',
      severity: count >= 5 ? 'critical' : 'warning',
      title: `${count} appels manques dans la derniere heure`,
      message: `${count} appels entrants manques dans la derniere heure. Verifiez la disponibilite des agents.`,
      timestamp: now,
      data: { count },
    });
  }
}

/**
 * 3. Agents offline during business hours.
 */
async function checkAgentsOffline(now: Date, alerts: Alert[]): Promise<void> {
  if (!isBusinessHours(now)) return;

  const offlineAgents = await prisma.sipExtension.findMany({
    where: { status: 'OFFLINE' },
    select: {
      extension: true,
      user: { select: { name: true } },
    },
    take: 50,
  });

  if (offlineAgents.length > 0) {
    const names = offlineAgents
      .map(a => a.user?.name || `Ext. ${a.extension}`)
      .join(', ');

    alerts.push({
      id: `agents-offline-${now.getTime()}`,
      type: 'agent_offline',
      severity: 'warning',
      title: `${offlineAgents.length} agent(s) hors ligne`,
      message: `Pendant les heures d'affaires: ${names}`,
      timestamp: now,
      data: {
        count: offlineAgents.length,
        agents: offlineAgents.map(a => ({
          extension: a.extension,
          name: a.user?.name || null,
        })),
      },
    });
  }
}

/**
 * 4. High call volume — today exceeds 150% of 7-day daily average.
 */
async function checkHighVolume(now: Date, alerts: Alert[]): Promise<void> {
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [todayCount, weekTotal] = await Promise.all([
    prisma.callLog.count({
      where: { startedAt: { gte: startOfToday } },
    }),
    prisma.callLog.count({
      where: { startedAt: { gte: weekAgo, lt: startOfToday } },
    }),
  ]);

  // Calculate 7-day average (excluding today)
  const dailyAvg = weekTotal / 7;

  if (dailyAvg > 0 && todayCount > dailyAvg * 1.5) {
    alerts.push({
      id: `high-volume-${now.getTime()}`,
      type: 'high_volume',
      severity: 'info',
      title: "Volume d'appels eleve",
      message: `${todayCount} appels aujourd'hui vs moyenne de ${Math.round(dailyAvg)}/jour (+${Math.round(((todayCount / dailyAvg) - 1) * 100)}%).`,
      timestamp: now,
      data: {
        todayCount,
        dailyAverage: Math.round(dailyAvg),
        percentAbove: Math.round(((todayCount / dailyAvg) - 1) * 100),
      },
    });
  }
}

/**
 * 5. Clients with consecutive negative sentiment calls (2+ in 30 days).
 */
async function checkNegativeSentiment(now: Date, alerts: Alert[]): Promise<void> {
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Find clients with 2+ calls that have negative sentiment transcriptions
  const negativeCalls = await prisma.callTranscription.findMany({
    where: {
      sentiment: 'negative',
      createdAt: { gte: thirtyDaysAgo },
      callLog: {
        clientId: { not: null },
      },
    },
    select: {
      callLog: {
        select: {
          clientId: true,
          client: { select: { name: true, email: true } },
        },
      },
    },
    take: 200,
  });

  // Group by clientId and count
  const clientCounts = new Map<string, { count: number; name: string | null }>();
  for (const tc of negativeCalls) {
    const clientId = tc.callLog.clientId;
    if (!clientId) continue;

    const existing = clientCounts.get(clientId);
    if (existing) {
      existing.count++;
    } else {
      clientCounts.set(clientId, {
        count: 1,
        name: tc.callLog.client?.name || tc.callLog.client?.email || null,
      });
    }
  }

  // Filter to clients with 2+ negative calls
  const atRiskClients = Array.from(clientCounts.entries())
    .filter(([, v]) => v.count >= 2)
    .map(([id, v]) => ({ clientId: id, name: v.name, negativeCallCount: v.count }));

  if (atRiskClients.length > 0) {
    const clientNames = atRiskClients
      .slice(0, 5)
      .map(c => c.name || c.clientId)
      .join(', ');

    alerts.push({
      id: `negative-sentiment-${now.getTime()}`,
      type: 'negative_sentiment',
      severity: atRiskClients.length >= 3 ? 'critical' : 'warning',
      title: `${atRiskClients.length} client(s) a risque (sentiment negatif)`,
      message: `Client(s) avec 2+ appels negatifs en 30 jours: ${clientNames}${atRiskClients.length > 5 ? '...' : ''}`,
      timestamp: now,
      data: {
        count: atRiskClients.length,
        clients: atRiskClients.slice(0, 10),
      },
    });
  }
}

/**
 * 6. Low service level — below 80% answered-in-20s threshold today.
 * Only checks during business hours and if there's sufficient volume (5+ inbound calls).
 */
async function checkServiceLevel(now: Date, alerts: Alert[]): Promise<void> {
  if (!isBusinessHours(now)) return;

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const todayFilter = { startedAt: { gte: startOfToday } };

  const [totalInbound, answeredIn20s] = await Promise.all([
    prisma.callLog.count({
      where: { ...todayFilter, direction: 'INBOUND' },
    }),
    prisma.callLog.count({
      where: {
        ...todayFilter,
        direction: 'INBOUND',
        status: 'COMPLETED',
        waitTime: { lte: 20 },
      },
    }),
  ]);

  // Only alert if we have meaningful volume
  if (totalInbound >= 5) {
    const serviceLevel = Math.round((answeredIn20s / totalInbound) * 100);
    if (serviceLevel < 80) {
      alerts.push({
        id: `low-service-level-${now.getTime()}`,
        type: 'low_service_level',
        severity: serviceLevel < 60 ? 'critical' : 'warning',
        title: `Niveau de service: ${serviceLevel}%`,
        message: `Seulement ${serviceLevel}% des appels entrants repondus en moins de 20 secondes (cible: 80%). ${answeredIn20s}/${totalInbound} appels.`,
        timestamp: now,
        data: {
          serviceLevel,
          answeredIn20s,
          totalInbound,
          target: 80,
        },
      });
    }
  }
}

/**
 * 7. Recording compliance gap — completed calls without recordings.
 * Checks last 24 hours only.
 */
async function checkRecordingGap(now: Date, alerts: Alert[]): Promise<void> {
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const [completedCalls, recordedCalls] = await Promise.all([
    prisma.callLog.count({
      where: {
        startedAt: { gte: oneDayAgo },
        status: 'COMPLETED',
      },
    }),
    prisma.callRecording.count({
      where: {
        createdAt: { gte: oneDayAgo },
        blobUrl: { not: null },
      },
    }),
  ]);

  if (completedCalls >= 5) {
    const compliance = Math.round((recordedCalls / completedCalls) * 100);
    if (compliance < 90) {
      const missing = completedCalls - recordedCalls;
      alerts.push({
        id: `recording-gap-${now.getTime()}`,
        type: 'recording_gap',
        severity: compliance < 70 ? 'critical' : 'warning',
        title: `${missing} appel(s) sans enregistrement`,
        message: `Conformite enregistrement: ${compliance}% (${recordedCalls}/${completedCalls} appels). ${missing} appel(s) non enregistre(s) dans les 24 dernieres heures.`,
        timestamp: now,
        data: {
          compliance,
          recordedCalls,
          completedCalls,
          missingRecordings: missing,
        },
      });
    }
  }
}

// ---------------------------------------------------------------------------
// Alert summary (for email digest)
// ---------------------------------------------------------------------------

/**
 * Generate a summary of all current alerts, suitable for email notifications.
 * Groups by severity and options as plain text.
 */
export async function getAlertSummary(): Promise<{
  alerts: Alert[];
  criticalCount: number;
  warningCount: number;
  infoCount: number;
  hasAlerts: boolean;
}> {
  const alerts = await checkAlerts();

  return {
    alerts,
    criticalCount: alerts.filter(a => a.severity === 'critical').length,
    warningCount: alerts.filter(a => a.severity === 'warning').length,
    infoCount: alerts.filter(a => a.severity === 'info').length,
    hasAlerts: alerts.length > 0,
  };
}
