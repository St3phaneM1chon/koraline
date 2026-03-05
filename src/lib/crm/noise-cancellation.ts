/**
 * CRM AI Noise Cancellation - C36
 *
 * Framework for AI-powered background noise removal during calls. In
 * production, real noise cancellation uses Telnyx Media Streams API,
 * Krisp SDK, or Dolby.io. This module implements the configuration,
 * toggle, and metrics layer that integrates with the call system.
 *
 * Features:
 * - Enable/disable noise cancellation per call
 * - Configure aggressiveness (low/medium/high)
 * - Apply to agent side, caller side, or both
 * - Track usage metrics and quality improvements
 *
 * Functions:
 * - enableNoiseCancellation: Enable NC for an active call
 * - disableNoiseCancellation: Disable NC mid-call
 * - getNoiseCancellationStatus: Current state and quality metrics
 * - configureNoiseCancellation: Global settings
 * - getNoiseCancellationMetrics: Usage and performance stats
 */

import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type NoiseCancellationAggressiveness = 'low' | 'medium' | 'high';

export interface NoiseCancellationConfig {
  /** Whether NC is enabled by default for new calls */
  defaultEnabled: boolean;
  /** Default aggressiveness level */
  aggressiveness: NoiseCancellationAggressiveness;
  /** Apply NC to the agent's audio stream */
  applyToAgent: boolean;
  /** Apply NC to the caller's audio stream */
  applyToCaller: boolean;
}

export interface CallNoiseCancellationState {
  /** Call ID */
  callId: string;
  /** Whether NC is currently active */
  isActive: boolean;
  /** Current aggressiveness level */
  aggressiveness: NoiseCancellationAggressiveness;
  /** Applied to agent side */
  agentEnabled: boolean;
  /** Applied to caller side */
  callerEnabled: boolean;
  /** When NC was enabled */
  enabledAt: Date | null;
  /** Estimated noise reduction percentage (0-100) */
  estimatedReductionPct: number;
}

export interface NoiseCancellationMetrics {
  /** Total calls in the period */
  totalCalls: number;
  /** Calls with NC enabled */
  ncEnabledCalls: number;
  /** NC adoption rate (0-100) */
  adoptionRate: number;
  /** Average estimated noise reduction (0-100) */
  avgNoiseReductionPct: number;
  /** Calls by aggressiveness level */
  byAggressiveness: Record<NoiseCancellationAggressiveness, number>;
  /** Agent satisfaction improvement estimate (percentage points) */
  agentSatisfactionImprovementPct: number;
  /** Calls where NC was disabled mid-call */
  disabledMidCall: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Default NC configuration */
const DEFAULT_CONFIG: NoiseCancellationConfig = {
  defaultEnabled: true,
  aggressiveness: 'medium',
  applyToAgent: true,
  applyToCaller: false,
};

/** Estimated noise reduction by aggressiveness level */
const NOISE_REDUCTION_ESTIMATES: Record<NoiseCancellationAggressiveness, number> = {
  low: 40,
  medium: 70,
  high: 90,
};

// ---------------------------------------------------------------------------
// In-memory NC state per call
// In production, this should be backed by Redis for multi-instance support.
// ---------------------------------------------------------------------------

const activeNCStates = new Map<string, CallNoiseCancellationState>();

// ---------------------------------------------------------------------------
// enableNoiseCancellation
// ---------------------------------------------------------------------------

/**
 * Enable AI noise cancellation for an active call.
 *
 * In production, this would send a media stream command to the telephony
 * provider (Telnyx Media Streams, Krisp API, or Dolby.io) to start
 * processing the audio stream through a noise cancellation model.
 *
 * @param callId - The call ID to enable NC for
 * @param config - Optional override for aggressiveness
 * @returns The NC state for the call
 */
export async function enableNoiseCancellation(
  callId: string,
  config?: { aggressiveness?: NoiseCancellationAggressiveness },
): Promise<CallNoiseCancellationState> {
  // Verify call exists and is active
  const callLog = await prisma.callLog.findFirst({
    where: {
      OR: [
        { pbxUuid: callId },
        { id: callId },
      ],
      status: 'IN_PROGRESS',
    },
    select: { id: true, pbxUuid: true },
  });

  if (!callLog) {
    throw new Error(`Active call not found: ${callId}`);
  }

  const globalConfig = await getNoiseCancellationConfig();
  const aggressiveness = config?.aggressiveness || globalConfig.aggressiveness;

  const state: CallNoiseCancellationState = {
    callId,
    isActive: true,
    aggressiveness,
    agentEnabled: globalConfig.applyToAgent,
    callerEnabled: globalConfig.applyToCaller,
    enabledAt: new Date(),
    estimatedReductionPct: NOISE_REDUCTION_ESTIMATES[aggressiveness],
  };

  activeNCStates.set(callId, state);

  // In production: send media stream command to Telnyx
  // await telnyxFetch(`/calls/${callControlId}/actions/streaming_start`, {
  //   method: 'POST',
  //   body: { stream_type: 'noise_cancellation', ... },
  // });

  logger.info('Noise cancellation: enabled', {
    event: 'nc_enabled',
    callId,
    callLogId: callLog.id,
    aggressiveness,
    applyToAgent: globalConfig.applyToAgent,
    applyToCaller: globalConfig.applyToCaller,
    estimatedReduction: NOISE_REDUCTION_ESTIMATES[aggressiveness],
  });

  // Record in campaign activity if call is linked to a campaign
  await recordNCEvent(callLog.id, 'enabled', aggressiveness);

  return state;
}

// ---------------------------------------------------------------------------
// disableNoiseCancellation
// ---------------------------------------------------------------------------

/**
 * Disable noise cancellation for an active call.
 *
 * @param callId - The call ID to disable NC for
 * @returns Updated NC state or null if not active
 */
export async function disableNoiseCancellation(
  callId: string,
): Promise<CallNoiseCancellationState | null> {
  const state = activeNCStates.get(callId);

  if (!state) {
    logger.debug('Noise cancellation: disable called for unknown call', {
      event: 'nc_disable_unknown',
      callId,
    });
    return null;
  }

  state.isActive = false;
  state.estimatedReductionPct = 0;

  // In production: send stop command to Telnyx media stream
  // await telnyxFetch(`/calls/${callControlId}/actions/streaming_stop`, { ... });

  // Find call log for recording
  const callLog = await prisma.callLog.findFirst({
    where: {
      OR: [
        { pbxUuid: callId },
        { id: callId },
      ],
    },
    select: { id: true },
  });

  if (callLog) {
    await recordNCEvent(callLog.id, 'disabled', state.aggressiveness);
  }

  const durationSec = state.enabledAt
    ? Math.round((Date.now() - state.enabledAt.getTime()) / 1000)
    : 0;

  logger.info('Noise cancellation: disabled', {
    event: 'nc_disabled',
    callId,
    aggressiveness: state.aggressiveness,
    durationSec,
  });

  activeNCStates.delete(callId);

  return state;
}

// ---------------------------------------------------------------------------
// getNoiseCancellationStatus
// ---------------------------------------------------------------------------

/**
 * Get the current noise cancellation state for a call.
 *
 * @param callId - The call ID to check
 * @returns Current NC state or inactive state
 */
export function getNoiseCancellationStatus(
  callId: string,
): CallNoiseCancellationState {
  const state = activeNCStates.get(callId);

  if (state) return state;

  // Return inactive state
  return {
    callId,
    isActive: false,
    aggressiveness: 'medium',
    agentEnabled: false,
    callerEnabled: false,
    enabledAt: null,
    estimatedReductionPct: 0,
  };
}

// ---------------------------------------------------------------------------
// configureNoiseCancellation
// ---------------------------------------------------------------------------

/**
 * Update global noise cancellation settings.
 *
 * Settings are stored in SiteSettings and apply to all new calls.
 * Existing active calls are not affected by config changes.
 *
 * @param settings - The NC configuration to save
 * @returns The saved configuration
 */
export async function configureNoiseCancellation(
  settings: Partial<NoiseCancellationConfig>,
): Promise<NoiseCancellationConfig> {
  const current = await getNoiseCancellationConfig();

  const merged: NoiseCancellationConfig = {
    defaultEnabled: settings.defaultEnabled ?? current.defaultEnabled,
    aggressiveness: settings.aggressiveness ?? current.aggressiveness,
    applyToAgent: settings.applyToAgent ?? current.applyToAgent,
    applyToCaller: settings.applyToCaller ?? current.applyToCaller,
  };

  // Store in AuditTrail config store
  await prisma.auditTrail.create({
    data: {
      entityType: 'NOISE_CANCELLATION_CONFIG',
      entityId: 'singleton',
      action: 'CONFIG',
      metadata: merged as unknown as Prisma.InputJsonValue,
      userId: 'system',
    },
  });

  logger.info('Noise cancellation: config updated', {
    event: 'nc_config_updated',
    defaultEnabled: merged.defaultEnabled,
    aggressiveness: merged.aggressiveness,
    applyToAgent: merged.applyToAgent,
    applyToCaller: merged.applyToCaller,
  });

  return merged;
}

// ---------------------------------------------------------------------------
// getNoiseCancellationMetrics
// ---------------------------------------------------------------------------

/**
 * Get noise cancellation usage and performance metrics for a time period.
 *
 * @param period - Time period for metrics
 * @returns NC performance metrics
 */
export async function getNoiseCancellationMetrics(period: {
  start: Date;
  end: Date;
}): Promise<NoiseCancellationMetrics> {
  // Total calls in period
  const totalCalls = await prisma.callLog.count({
    where: {
      createdAt: {
        gte: period.start,
        lte: period.end,
      },
    },
  });

  // NC events from CrmActivity
  const ncActivities = await prisma.crmActivity.findMany({
    where: {
      type: 'NOTE',
      createdAt: {
        gte: period.start,
        lte: period.end,
      },
      description: { startsWith: 'noise_cancellation:' },
    },
    select: {
      description: true,
      metadata: true,
    },
  });

  let ncEnabledCalls = 0;
  let disabledMidCall = 0;
  let totalReduction = 0;
  const byAggressiveness: Record<NoiseCancellationAggressiveness, number> = {
    low: 0,
    medium: 0,
    high: 0,
  };

  const enabledCallIds = new Set<string>();
  const disabledCallIds = new Set<string>();

  for (const activity of ncActivities) {
    const meta = (activity.metadata as Record<string, unknown>) || {};
    const action = meta.action as string;
    const aggressiveness = meta.aggressiveness as NoiseCancellationAggressiveness;
    const callLogId = meta.callLogId as string | undefined;

    if (action === 'enabled') {
      ncEnabledCalls++;
      if (callLogId) enabledCallIds.add(callLogId);

      if (aggressiveness && byAggressiveness[aggressiveness] !== undefined) {
        byAggressiveness[aggressiveness]++;
      }

      totalReduction +=
        NOISE_REDUCTION_ESTIMATES[aggressiveness] ||
        NOISE_REDUCTION_ESTIMATES.medium;
    } else if (action === 'disabled') {
      if (callLogId) disabledCallIds.add(callLogId);
    }
  }

  // Calls where NC was disabled mid-call (enabled and then disabled)
  disabledMidCall = [...disabledCallIds].filter((id) =>
    enabledCallIds.has(id),
  ).length;

  const adoptionRate =
    totalCalls > 0
      ? Math.round((ncEnabledCalls / totalCalls) * 1000) / 10
      : 0;

  const avgNoiseReductionPct =
    ncEnabledCalls > 0 ? Math.round(totalReduction / ncEnabledCalls) : 0;

  // Agent satisfaction improvement estimate:
  // Based on industry data, NC improves agent satisfaction by ~15-25%
  // Scale by adoption rate
  const agentSatisfactionImprovementPct =
    adoptionRate > 0
      ? Math.round((adoptionRate / 100) * 20 * 10) / 10
      : 0;

  logger.info('Noise cancellation: metrics calculated', {
    event: 'nc_metrics',
    totalCalls,
    ncEnabledCalls,
    adoptionRate,
    avgNoiseReductionPct,
    disabledMidCall,
    periodStart: period.start.toISOString(),
    periodEnd: period.end.toISOString(),
  });

  return {
    totalCalls,
    ncEnabledCalls,
    adoptionRate,
    avgNoiseReductionPct,
    byAggressiveness,
    agentSatisfactionImprovementPct,
    disabledMidCall,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Get the global NC configuration from SiteSettings.
 */
async function getNoiseCancellationConfig(): Promise<NoiseCancellationConfig> {
  const trail = await prisma.auditTrail.findFirst({
    where: { entityType: 'NOISE_CANCELLATION_CONFIG', action: 'CONFIG' },
    orderBy: { createdAt: 'desc' },
  });

  if (trail?.metadata) {
    try {
      const parsed = trail.metadata as Partial<NoiseCancellationConfig>;
      return {
        defaultEnabled: parsed.defaultEnabled ?? DEFAULT_CONFIG.defaultEnabled,
        aggressiveness: parsed.aggressiveness ?? DEFAULT_CONFIG.aggressiveness,
        applyToAgent: parsed.applyToAgent ?? DEFAULT_CONFIG.applyToAgent,
        applyToCaller: parsed.applyToCaller ?? DEFAULT_CONFIG.applyToCaller,
      };
    } catch {
      // Fall through to defaults
    }
  }

  return { ...DEFAULT_CONFIG };
}

/**
 * Record a noise cancellation event for metrics tracking.
 */
async function recordNCEvent(
  callLogId: string,
  action: 'enabled' | 'disabled',
  aggressiveness: NoiseCancellationAggressiveness,
): Promise<void> {
  try {
    // Find client associated with this call
    const callLog = await prisma.callLog.findUnique({
      where: { id: callLogId },
      select: { clientId: true },
    });

    await prisma.crmActivity.create({
      data: {
        type: 'NOTE',
        title: 'Noise Cancellation Event',
        contactId: callLog?.clientId || undefined,
        description: `noise_cancellation: ${action} (${aggressiveness})`,
        metadata: {
          source: 'noise_cancellation',
          action,
          aggressiveness,
          callLogId,
          estimatedReduction: action === 'enabled'
            ? NOISE_REDUCTION_ESTIMATES[aggressiveness]
            : 0,
        },
      },
    });
  } catch (error) {
    // Non-critical: don't fail NC toggling for metrics recording
    logger.debug('Noise cancellation: failed to record event', {
      event: 'nc_record_error',
      callLogId,
      action,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
