/**
 * CRM Agentless Dialer - C7
 *
 * IVR-based outbound dialing that plays a pre-recorded message or IVR menu
 * without requiring a live agent. Used for appointment reminders, payment
 * notifications, surveys, and broadcast messages.
 *
 * Functions:
 * - startAgentlessDialer: Begin an agentless dialing session
 * - handleAgentlessCallAnswer: Handle when a recipient answers
 * - agentlessDialerStats: Get campaign dialing statistics
 */

import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import { telnyxFetch, getTelnyxConnectionId } from '@/lib/telnyx';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AgentlessDialerConfig {
  campaignId: string;
  callerIdNumber: string;
  message?: string;          // TTS message to play
  audioUrl?: string;         // Pre-recorded audio URL (overrides message)
  ivrMenuId?: string;        // IVR menu to connect after greeting
  maxConcurrent?: number;    // Max simultaneous outbound calls
  language?: string;         // TTS language (default: 'fr-CA')
}

interface AgentlessCallState {
  campaignId: string;
  entryId: string;
  config: AgentlessDialerConfig;
}

// ---------------------------------------------------------------------------
// In-memory call state
// In production, this should be backed by Redis for multi-instance support.
// ---------------------------------------------------------------------------

const activeAgentlessCalls = new Map<string, AgentlessCallState>();

// ---------------------------------------------------------------------------
// startAgentlessDialer
// ---------------------------------------------------------------------------

/**
 * Start an agentless dialing session for a campaign.
 *
 * Picks the next batch of uncalled entries from the DialerListEntry table
 * and places outbound calls. When a call is answered, the system plays
 * a message or connects to an IVR menu (no live agent needed).
 *
 * @param config - Agentless dialer configuration
 * @returns Number of calls initiated
 */
export async function startAgentlessDialer(
  config: AgentlessDialerConfig
): Promise<{ initiated: number; remaining: number }> {
  if (!config.message && !config.audioUrl && !config.ivrMenuId) {
    throw new Error('Agentless dialer requires at least one of: message, audioUrl, or ivrMenuId');
  }

  // Verify campaign exists and is active
  const campaign = await prisma.dialerCampaign.findUnique({
    where: { id: config.campaignId },
    select: { id: true, status: true, name: true, maxConcurrent: true },
  });

  if (!campaign || campaign.status !== 'ACTIVE') {
    throw new Error(`Campaign ${config.campaignId} is not active`);
  }

  const maxConcurrent = config.maxConcurrent ?? campaign.maxConcurrent ?? 5;

  // Get next batch of entries to call
  const entries = await prisma.dialerListEntry.findMany({
    where: {
      campaignId: config.campaignId,
      isCalled: false,
      isDncl: false,
    },
    select: {
      id: true,
      phoneNumber: true,
      firstName: true,
    },
    orderBy: { createdAt: 'asc' },
    take: maxConcurrent,
  });

  if (entries.length === 0) {
    logger.info('Agentless dialer: no entries to call', {
      event: 'agentless_no_entries',
      campaignId: config.campaignId,
    });
    return { initiated: 0, remaining: 0 };
  }

  // Count remaining entries
  const remaining = await prisma.dialerListEntry.count({
    where: {
      campaignId: config.campaignId,
      isCalled: false,
      isDncl: false,
    },
  });

  const connectionId = getTelnyxConnectionId();
  let initiated = 0;

  for (const entry of entries) {
    try {
      // Place the outbound call via Telnyx
      const result = await telnyxFetch<{
        call_control_id: string;
        call_leg_id: string;
      }>('/calls', {
        method: 'POST',
        body: {
          to: entry.phoneNumber,
          from: config.callerIdNumber,
          connection_id: connectionId,
          timeout_secs: 30,
          answering_machine_detection: 'detect',
        },
      });

      const callControlId = result.data.call_control_id;

      // Track the call state for when it's answered
      activeAgentlessCalls.set(callControlId, {
        campaignId: config.campaignId,
        entryId: entry.id,
        config,
      });

      // Mark entry as called
      await prisma.dialerListEntry.update({
        where: { id: entry.id },
        data: {
          isCalled: true,
          callAttempts: { increment: 1 },
          lastCalledAt: new Date(),
        },
      });

      initiated++;

      logger.debug('Agentless dialer: call placed', {
        event: 'agentless_call_placed',
        campaignId: config.campaignId,
        entryId: entry.id,
        phone: entry.phoneNumber,
        callControlId,
      });
    } catch (err) {
      logger.error('Agentless dialer: failed to place call', {
        event: 'agentless_call_failed',
        campaignId: config.campaignId,
        entryId: entry.id,
        phone: entry.phoneNumber,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  logger.info('Agentless dialer: batch initiated', {
    event: 'agentless_batch_started',
    campaignId: config.campaignId,
    campaignName: campaign.name,
    initiated,
    remaining: remaining - initiated,
  });

  return { initiated, remaining: remaining - initiated };
}

// ---------------------------------------------------------------------------
// handleAgentlessCallAnswer
// ---------------------------------------------------------------------------

/**
 * Handle when a recipient answers an agentless outbound call.
 *
 * Plays the configured message (TTS or audio) and optionally connects
 * to an IVR menu for interactive options.
 *
 * @param callControlId - The Telnyx call control ID
 */
export async function handleAgentlessCallAnswer(callControlId: string): Promise<void> {
  const state = activeAgentlessCalls.get(callControlId);

  if (!state) {
    logger.warn('Agentless dialer: unknown call answered', {
      event: 'agentless_unknown_call',
      callControlId,
    });
    return;
  }

  try {
    if (state.config.audioUrl) {
      // Play pre-recorded audio
      await telnyxFetch(`/calls/${callControlId}/actions/playback_start`, {
        method: 'POST',
        body: {
          audio_url: state.config.audioUrl,
          overlay: false,
        },
      });
    } else if (state.config.message) {
      // Play TTS message
      await telnyxFetch(`/calls/${callControlId}/actions/speak`, {
        method: 'POST',
        body: {
          payload: state.config.message,
          language: state.config.language || 'fr-CA',
          voice: 'female',
        },
      });
    }

    // If IVR menu is configured, gather DTMF after the message
    if (state.config.ivrMenuId) {
      const ivrMenu = await prisma.ivrMenu.findUnique({
        where: { id: state.config.ivrMenuId },
        select: { greetingText: true, language: true, inputTimeout: true },
      });

      if (ivrMenu && ivrMenu.greetingText) {
        await telnyxFetch(`/calls/${callControlId}/actions/gather_using_speak`, {
          method: 'POST',
          body: {
            payload: ivrMenu.greetingText,
            language: ivrMenu.language || 'fr-CA',
            voice: 'female',
            minimum_digits: 1,
            maximum_digits: 1,
            timeout_millis: (ivrMenu.inputTimeout || 5) * 1000,
          },
        });
      }
    }

    logger.info('Agentless dialer: call answered and message played', {
      event: 'agentless_call_answered',
      campaignId: state.campaignId,
      entryId: state.entryId,
      callControlId,
      hasIvr: !!state.config.ivrMenuId,
    });
  } catch (err) {
    logger.error('Agentless dialer: failed to play message', {
      event: 'agentless_playback_failed',
      callControlId,
      error: err instanceof Error ? err.message : String(err),
    });
  } finally {
    activeAgentlessCalls.delete(callControlId);
  }
}

// ---------------------------------------------------------------------------
// agentlessDialerStats
// ---------------------------------------------------------------------------

/**
 * Get dialing statistics for an agentless campaign.
 *
 * @param campaignId - The DialerCampaign ID
 * @returns Statistics including total, called, remaining, and DNC counts
 */
export async function agentlessDialerStats(campaignId: string): Promise<{
  total: number;
  called: number;
  remaining: number;
  dncl: number;
}> {
  const [total, called, dncl] = await Promise.all([
    prisma.dialerListEntry.count({ where: { campaignId } }),
    prisma.dialerListEntry.count({ where: { campaignId, isCalled: true } }),
    prisma.dialerListEntry.count({ where: { campaignId, isDncl: true } }),
  ]);

  const remaining = total - called - dncl;

  logger.debug('Agentless dialer: stats retrieved', {
    event: 'agentless_stats',
    campaignId,
    total,
    called,
    remaining,
    dncl,
  });

  return { total, called, remaining, dncl };
}
