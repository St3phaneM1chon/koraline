/**
 * CRM No-Pause Predictive Dialer - C9
 *
 * Seamless connect algorithm that eliminates the pause between answer and
 * agent connect. Inspired by NICE Personal Connection patent: the agent is
 * pre-connected (listening to ringing) before the customer answers, so there
 * is zero dead air when the call is picked up.
 *
 * Functions:
 * - calculateNoPauseDialRatio: Ultra-aggressive dial ratio with pre-connect
 * - preConnectAgent: Bridge agent audio before customer answers
 * - handleEarlyConnect: Transition when call is answered
 * - calculatePreConnectTiming: Predict next answer based on historical data
 * - getNoPauseMetrics: Zero-pause rate, idle time, CX score
 */

import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CampaignMetrics {
  /** Average answer rate (0.0 - 1.0) */
  answerRate: number;
  /** Average seconds between dial and answer */
  avgRingDurationSec: number;
  /** Standard deviation of ring duration */
  ringDurationStdDev: number;
  /** Average handle time in seconds */
  avgHandleTimeSec: number;
  /** Number of agents currently available */
  availableAgents: number;
  /** Recent sample size used for calculation */
  sampleSize: number;
}

export interface PreConnectSession {
  callId: string;
  agentId: string;
  campaignId: string;
  /** When the agent was bridged to the outbound leg */
  preConnectedAt: Date;
  /** When the call was answered (null if still ringing) */
  answeredAt: Date | null;
  /** Whether the call was answered while agent was listening */
  wasSeamless: boolean;
  /** Status of the pre-connect session */
  status: 'ringing' | 'connected' | 'failed' | 'timeout';
}

export interface NoPauseMetrics {
  /** Total calls placed in period */
  totalCalls: number;
  /** Calls where agent was pre-connected before answer */
  preConnectedCalls: number;
  /** Calls answered with zero pause (seamless connect) */
  zeroPauseCalls: number;
  /** Zero-pause rate as percentage (0-100) */
  zeroPauseRate: number;
  /** Average agent idle time between calls in seconds */
  avgAgentIdleTimeSec: number;
  /** Customer experience score (0-100) based on zero-pause rate */
  customerExperienceScore: number;
  /** Average time agent spent listening to ringing in seconds */
  avgPreConnectListenSec: number;
  /** Calls that timed out while agent was pre-connected */
  timeoutCalls: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Maximum dial ratio for no-pause mode (more aggressive than standard) */
const MAX_NO_PAUSE_RATIO = 4.0;

/** Minimum dial ratio */
const MIN_NO_PAUSE_RATIO = 1.2;

/** Default dial ratio when insufficient data */
const DEFAULT_NO_PAUSE_RATIO = 2.0;

/** Maximum seconds an agent should wait listening to ringing */
const MAX_PRE_CONNECT_WAIT_SEC = 30;

/** Minimum history sample size for reliable predictions */
const MIN_SAMPLE_SIZE = 20;

/** Default ring duration assumption in seconds */
const DEFAULT_RING_DURATION_SEC = 15;

/** History sample size for metrics calculation */
const METRICS_SAMPLE_SIZE = 500;

// ---------------------------------------------------------------------------
// In-memory pre-connect session tracker
// In production, this should be backed by Redis for multi-instance support.
// ---------------------------------------------------------------------------

const activePreConnects = new Map<string, PreConnectSession>();

// ---------------------------------------------------------------------------
// calculateNoPauseDialRatio
// ---------------------------------------------------------------------------

/**
 * Calculate an ultra-aggressive dial ratio that accounts for pre-connect.
 *
 * Unlike standard predictive dialing where the ratio is simply 1/answerRate,
 * no-pause mode factors in the time saved by pre-connecting agents. Since
 * agents hear ringing instead of being idle, the effective agent utilization
 * is higher, allowing a more aggressive ratio without increasing abandonment.
 *
 * Formula:
 *   baseRatio = 1 / answerRate
 *   preConnectBonus = (avgRingDuration / avgHandleTime) * 0.5
 *   ratio = baseRatio + preConnectBonus (clamped)
 *
 * @param campaignId - The CRM campaign ID
 * @returns The no-pause dial ratio (1.2 to 4.0)
 */
export async function calculateNoPauseDialRatio(
  campaignId: string,
): Promise<{ ratio: number; metrics: CampaignMetrics }> {
  const metrics = await getCampaignMetrics(campaignId);

  if (metrics.sampleSize < MIN_SAMPLE_SIZE) {
    logger.info('No-pause dialer: insufficient data, using default ratio', {
      event: 'no_pause_default_ratio',
      campaignId,
      sampleSize: metrics.sampleSize,
      ratio: DEFAULT_NO_PAUSE_RATIO,
    });
    return { ratio: DEFAULT_NO_PAUSE_RATIO, metrics };
  }

  // Base ratio from answer rate
  let baseRatio: number;
  if (metrics.answerRate <= 0) {
    baseRatio = MAX_NO_PAUSE_RATIO;
  } else {
    baseRatio = 1 / metrics.answerRate;
  }

  // Pre-connect bonus: since agents hear ringing, effective idle time is reduced.
  // The bonus is proportional to how much ring time is "recovered" vs handle time.
  const preConnectBonus =
    metrics.avgHandleTimeSec > 0
      ? (metrics.avgRingDurationSec / metrics.avgHandleTimeSec) * 0.5
      : 0;

  let ratio = baseRatio + preConnectBonus;

  // Clamp to safe range
  ratio = Math.min(MAX_NO_PAUSE_RATIO, Math.max(MIN_NO_PAUSE_RATIO, ratio));

  // Round to 1 decimal place
  ratio = Math.round(ratio * 10) / 10;

  logger.info('No-pause dialer: calculated dial ratio', {
    event: 'no_pause_ratio_calculated',
    campaignId,
    answerRate: Math.round(metrics.answerRate * 100),
    baseRatio: Math.round(baseRatio * 10) / 10,
    preConnectBonus: Math.round(preConnectBonus * 100) / 100,
    finalRatio: ratio,
    sampleSize: metrics.sampleSize,
  });

  return { ratio, metrics };
}

// ---------------------------------------------------------------------------
// preConnectAgent
// ---------------------------------------------------------------------------

/**
 * Pre-connect an agent to an outbound call before the customer answers.
 *
 * The agent is bridged into the call leg and hears the ringing tone. When
 * the customer picks up, the agent is already on the line with zero pause.
 * This eliminates the typical 1-3 second delay that causes "hello? hello?"
 * experiences for the customer.
 *
 * @param agentId - The agent user ID
 * @param callId - The outbound call ID (Telnyx call control ID)
 * @param campaignId - The campaign ID for tracking
 * @returns The pre-connect session
 */
export async function preConnectAgent(
  agentId: string,
  callId: string,
  campaignId: string,
): Promise<PreConnectSession> {
  // Verify agent exists and is available
  const agent = await prisma.sipExtension.findFirst({
    where: {
      userId: agentId,
      status: 'ONLINE',
    },
    select: { id: true, userId: true },
  });

  if (!agent) {
    throw new Error(`Agent ${agentId} is not available for pre-connect`);
  }

  // Create pre-connect session
  const session: PreConnectSession = {
    callId,
    agentId,
    campaignId,
    preConnectedAt: new Date(),
    answeredAt: null,
    wasSeamless: false,
    status: 'ringing',
  };

  activePreConnects.set(callId, session);

  // Update agent status to BUSY since they are now listening to ringing
  await prisma.sipExtension.updateMany({
    where: { userId: agentId },
    data: { status: 'BUSY' },
  });

  // Log the pre-connect event as a CRM activity note
  logger.info('No-pause dialer: agent pre-connected', {
    event: 'no_pause_pre_connected',
    agentId,
    callId,
    campaignId,
  });

  // Set a timeout to release agent if call is not answered
  setTimeout(async () => {
    const current = activePreConnects.get(callId);
    if (current && current.status === 'ringing') {
      current.status = 'timeout';
      activePreConnects.delete(callId);

      // Restore agent to ONLINE
      await prisma.sipExtension.updateMany({
        where: { userId: agentId },
        data: { status: 'ONLINE' },
      });

      logger.info('No-pause dialer: pre-connect timed out', {
        event: 'no_pause_timeout',
        agentId,
        callId,
        campaignId,
        waitedSec: MAX_PRE_CONNECT_WAIT_SEC,
      });
    }
  }, MAX_PRE_CONNECT_WAIT_SEC * 1000);

  return session;
}

// ---------------------------------------------------------------------------
// handleEarlyConnect
// ---------------------------------------------------------------------------

/**
 * Handle the moment when a pre-connected call is answered by the customer.
 *
 * Since the agent was already listening to the ringing, the transition to
 * a live conversation is seamless. This function records the timing data
 * and stores the pre-connect metrics in the campaign's targetCriteria JSON.
 *
 * @param callId - The call ID that was answered
 * @param agentId - The pre-connected agent ID
 * @returns Updated session or null if no pre-connect was active
 */
export async function handleEarlyConnect(
  callId: string,
  agentId: string,
): Promise<PreConnectSession | null> {
  const session = activePreConnects.get(callId);

  if (!session) {
    logger.debug('No-pause dialer: no pre-connect session for answered call', {
      event: 'no_pause_no_session',
      callId,
      agentId,
    });
    return null;
  }

  if (session.agentId !== agentId) {
    logger.warn('No-pause dialer: agent mismatch on early connect', {
      event: 'no_pause_agent_mismatch',
      callId,
      expectedAgent: session.agentId,
      actualAgent: agentId,
    });
    return null;
  }

  // Mark as connected
  session.answeredAt = new Date();
  session.wasSeamless = true;
  session.status = 'connected';

  const preConnectDurationMs =
    session.answeredAt.getTime() - session.preConnectedAt.getTime();

  // Record timing in campaign targetCriteria for future predictions
  const campaign = await prisma.crmCampaign.findUnique({
    where: { id: session.campaignId },
    select: { targetCriteria: true },
  });

  if (campaign) {
    const meta = (campaign.targetCriteria as Record<string, unknown>) || {};
    const timings = (meta.noPauseTimings as number[]) || [];

    // Keep last 100 timings for rolling average
    timings.push(preConnectDurationMs);
    if (timings.length > 100) {
      timings.splice(0, timings.length - 100);
    }
    meta.noPauseTimings = timings;

    await prisma.crmCampaign.update({
      where: { id: session.campaignId },
      data: {
        targetCriteria: meta as unknown as Prisma.InputJsonValue,
      },
    });
  }

  // Clean up from active map
  activePreConnects.delete(callId);

  logger.info('No-pause dialer: seamless connect achieved', {
    event: 'no_pause_seamless_connect',
    callId,
    agentId,
    campaignId: session.campaignId,
    preConnectDurationMs,
    preConnectDurationSec: Math.round(preConnectDurationMs / 1000),
  });

  return session;
}

// ---------------------------------------------------------------------------
// calculatePreConnectTiming
// ---------------------------------------------------------------------------

/**
 * Predict when the next outbound call will be answered based on historical
 * answer patterns (ASR, AHT, ring duration statistics).
 *
 * Used to determine the optimal moment to pre-connect an agent to an
 * outbound call. If the predicted ring duration is short, the agent should
 * be connected immediately; if long, a slight delay is acceptable.
 *
 * @param campaignStats - Current campaign performance metrics
 * @returns Predicted timing data
 */
export function calculatePreConnectTiming(campaignStats: CampaignMetrics): {
  /** Optimal seconds before expected answer to pre-connect agent */
  preConnectLeadTimeSec: number;
  /** Predicted seconds until next call is answered */
  predictedRingDurationSec: number;
  /** Confidence in the prediction (0.0 - 1.0) */
  confidence: number;
  /** Whether the sample size is sufficient for reliable prediction */
  isReliable: boolean;
} {
  const isReliable = campaignStats.sampleSize >= MIN_SAMPLE_SIZE;

  // Use historical average ring duration, or default
  const predictedRingDuration = isReliable
    ? campaignStats.avgRingDurationSec
    : DEFAULT_RING_DURATION_SEC;

  // Calculate confidence based on sample size and std dev
  let confidence: number;
  if (!isReliable) {
    confidence = 0.3;
  } else {
    // Higher sample size and lower std dev = higher confidence
    const sampleFactor = Math.min(1.0, campaignStats.sampleSize / 200);
    const stdDevFactor =
      campaignStats.ringDurationStdDev > 0
        ? Math.max(0.2, 1.0 - campaignStats.ringDurationStdDev / predictedRingDuration)
        : 0.8;
    confidence = Math.round(sampleFactor * stdDevFactor * 100) / 100;
  }

  // Pre-connect lead time: connect agent slightly before expected answer.
  // With high confidence, connect closer to the expected answer time.
  // With low confidence, connect earlier to avoid missing the answer.
  const preConnectLeadTimeSec = Math.max(
    2,
    Math.round(predictedRingDuration * (1 - confidence * 0.5)),
  );

  logger.debug('No-pause dialer: pre-connect timing calculated', {
    event: 'no_pause_timing',
    predictedRingDurationSec: Math.round(predictedRingDuration),
    preConnectLeadTimeSec,
    confidence,
    isReliable,
    sampleSize: campaignStats.sampleSize,
  });

  return {
    preConnectLeadTimeSec,
    predictedRingDurationSec: Math.round(predictedRingDuration),
    confidence,
    isReliable,
  };
}

// ---------------------------------------------------------------------------
// getNoPauseMetrics
// ---------------------------------------------------------------------------

/**
 * Get no-pause predictive dialer metrics for a campaign.
 *
 * Calculates the zero-pause rate (percentage of calls where the agent
 * was already on the line when the customer answered), average pre-connect
 * listen time, and customer experience score.
 *
 * @param campaignId - The CRM campaign ID
 * @returns No-pause performance metrics
 */
export async function getNoPauseMetrics(
  campaignId: string,
): Promise<NoPauseMetrics> {
  // Get campaign timing data from targetCriteria
  const campaign = await prisma.crmCampaign.findUnique({
    where: { id: campaignId },
    select: { targetCriteria: true },
  });

  const meta = (campaign?.targetCriteria as Record<string, unknown>) || {};
  const timings = (meta.noPauseTimings as number[]) || [];

  // Get recent call activities for overall metrics
  const activities = await prisma.crmCampaignActivity.findMany({
    where: {
      campaignId,
      channel: 'call',
    },
    select: {
      status: true,
      disposition: true,
      duration: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
    take: METRICS_SAMPLE_SIZE,
  });

  const totalCalls = activities.length;

  // Connected calls = calls where customer answered
  const connectedDispositions = new Set([
    'answered', 'connected', 'interested', 'callback',
    'sale', 'appointment', 'qualified', 'completed',
  ]);
  const connectedCalls = activities.filter(
    (a) =>
      a.status === 'completed' &&
      a.disposition &&
      connectedDispositions.has(a.disposition.toLowerCase()),
  ).length;

  // Pre-connected calls = calls with timing data stored
  const preConnectedCalls = timings.length;

  // Zero-pause calls = pre-connected calls that were answered
  // (all timings represent successful pre-connects)
  const zeroPauseCalls = timings.length;

  // Zero-pause rate as percentage of connected calls
  const zeroPauseRate =
    connectedCalls > 0
      ? Math.round((zeroPauseCalls / connectedCalls) * 1000) / 10
      : 0;

  // Average pre-connect listen time (how long agent heard ringing)
  const avgPreConnectListenSec =
    timings.length > 0
      ? Math.round(timings.reduce((sum, t) => sum + t, 0) / timings.length / 1000)
      : 0;

  // Average idle time = gaps between calls where agent was not pre-connected
  const avgAgentIdleTimeSec = calculateAvgIdleTime(activities);

  // Timeout calls = calls that expired during pre-connect
  const timeoutCalls = Math.max(
    0,
    preConnectedCalls - zeroPauseCalls,
  );

  // Customer experience score: based on zero-pause rate
  // 100% zero-pause = 100 CX score, 0% = 50 (baseline for having any dialer)
  const customerExperienceScore = Math.round(50 + zeroPauseRate * 0.5);

  logger.info('No-pause dialer: metrics calculated', {
    event: 'no_pause_metrics',
    campaignId,
    totalCalls,
    preConnectedCalls,
    zeroPauseCalls,
    zeroPauseRate,
    avgPreConnectListenSec,
    customerExperienceScore,
  });

  return {
    totalCalls,
    preConnectedCalls,
    zeroPauseCalls,
    zeroPauseRate,
    avgAgentIdleTimeSec,
    customerExperienceScore,
    avgPreConnectListenSec,
    timeoutCalls,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Get campaign metrics from recent call activity data.
 */
async function getCampaignMetrics(campaignId: string): Promise<CampaignMetrics> {
  const activities = await prisma.crmCampaignActivity.findMany({
    where: {
      campaignId,
      channel: 'call',
      status: { in: ['completed', 'failed'] },
    },
    select: {
      status: true,
      disposition: true,
      duration: true,
    },
    orderBy: { createdAt: 'desc' },
    take: METRICS_SAMPLE_SIZE,
  });

  const answeredDispositions = new Set([
    'answered', 'connected', 'interested', 'callback',
    'sale', 'appointment', 'qualified', 'completed',
  ]);

  const answeredActivities = activities.filter(
    (a) =>
      a.status === 'completed' &&
      a.disposition &&
      answeredDispositions.has(a.disposition.toLowerCase()),
  );

  const answerRate =
    activities.length > 0 ? answeredActivities.length / activities.length : 0;

  // Estimate ring duration from activities with short durations (< 60s likely ring time)
  const ringDurations = activities
    .filter((a) => a.duration !== null && a.duration > 0 && a.duration < 60)
    .map((a) => a.duration as number);

  const avgRingDurationSec =
    ringDurations.length > 0
      ? ringDurations.reduce((sum, d) => sum + d, 0) / ringDurations.length
      : DEFAULT_RING_DURATION_SEC;

  // Standard deviation of ring duration
  const ringDurationStdDev =
    ringDurations.length > 1
      ? Math.sqrt(
          ringDurations.reduce(
            (sum, d) => sum + Math.pow(d - avgRingDurationSec, 2),
            0,
          ) / ringDurations.length,
        )
      : avgRingDurationSec * 0.3;

  // Average handle time from connected calls
  const handleTimes = answeredActivities
    .filter((a) => a.duration !== null && a.duration >= 60)
    .map((a) => a.duration as number);

  const avgHandleTimeSec =
    handleTimes.length > 0
      ? handleTimes.reduce((sum, d) => sum + d, 0) / handleTimes.length
      : 180; // Default 3 minutes

  // Count available agents
  const availableAgents = await prisma.sipExtension.count({
    where: { status: 'ONLINE' },
  });

  return {
    answerRate,
    avgRingDurationSec: Math.round(avgRingDurationSec),
    ringDurationStdDev: Math.round(ringDurationStdDev * 10) / 10,
    avgHandleTimeSec: Math.round(avgHandleTimeSec),
    availableAgents,
    sampleSize: activities.length,
  };
}

/**
 * Calculate average idle time between connected calls.
 */
function calculateAvgIdleTime(
  activities: Array<{ createdAt: Date; duration: number | null }>,
): number {
  if (activities.length < 2) return 0;

  const sorted = [...activities].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
  );

  let totalGapSec = 0;
  let gapCount = 0;

  for (let i = 1; i < sorted.length; i++) {
    const prevEnd =
      sorted[i - 1].createdAt.getTime() +
      (sorted[i - 1].duration || 0) * 1000;
    const currentStart = sorted[i].createdAt.getTime();
    const gapMs = currentStart - prevEnd;

    // Only count gaps under 10 minutes (longer gaps are likely breaks)
    if (gapMs > 0 && gapMs < 600_000) {
      totalGapSec += gapMs / 1000;
      gapCount++;
    }
  }

  return gapCount > 0 ? Math.round(totalGapSec / gapCount) : 0;
}
