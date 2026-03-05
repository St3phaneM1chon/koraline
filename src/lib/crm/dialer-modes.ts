/**
 * CRM Progressive Dialer Mode - C4
 *
 * Progressive dialer distinct from predictive: calls one lead at a time
 * and waits for agent readiness before dialing the next number. This
 * eliminates abandoned calls at the cost of lower throughput.
 *
 * Functions:
 * - startProgressiveDialer: Begin a progressive dialing session
 * - getNextProgressiveLead: Pick the next lead to call
 * - progressiveDialerTick: Advance the dialer by one step if agent is ready
 */

import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ProgressiveSession {
  campaignId: string;
  agentId: string;
  startedAt: Date;
  totalDialed: number;
  isAgentReady: boolean;
}

interface ProgressiveTickResult {
  action: 'dial' | 'wait' | 'done';
  leadId?: string;
  phone?: string;
  reason?: string;
}

// ---------------------------------------------------------------------------
// In-memory session store
// In production, this should be backed by Redis for multi-instance support.
// ---------------------------------------------------------------------------

const progressiveSessions = new Map<string, ProgressiveSession>();

// ---------------------------------------------------------------------------
// startProgressiveDialer
// ---------------------------------------------------------------------------

/**
 * Start a progressive dialing session for a campaign and agent.
 *
 * Creates an in-memory session that tracks the agent's readiness state.
 * The dialer only places one call at a time and waits for the agent to
 * signal readiness before dialing the next lead.
 *
 * @param campaignId - The DialerCampaign ID
 * @param agentId - The agent's user ID (must have a SipExtension)
 * @returns The session key for subsequent tick calls
 */
export async function startProgressiveDialer(
  campaignId: string,
  agentId: string
): Promise<string> {
  // Verify campaign exists and is active
  const campaign = await prisma.dialerCampaign.findUnique({
    where: { id: campaignId },
    select: { id: true, status: true, name: true },
  });

  if (!campaign || campaign.status !== 'ACTIVE') {
    throw new Error(`Campaign ${campaignId} is not active (status: ${campaign?.status})`);
  }

  // Verify agent has a SIP extension and is online
  const extension = await prisma.sipExtension.findFirst({
    where: { userId: agentId },
    select: { id: true, status: true },
  });

  if (!extension) {
    throw new Error(`Agent ${agentId} has no SIP extension`);
  }

  if (extension.status !== 'ONLINE') {
    throw new Error(`Agent ${agentId} is not online (status: ${extension.status})`);
  }

  const sessionKey = `${campaignId}:${agentId}`;

  progressiveSessions.set(sessionKey, {
    campaignId,
    agentId,
    startedAt: new Date(),
    totalDialed: 0,
    isAgentReady: true,
  });

  logger.info('Progressive dialer: session started', {
    event: 'progressive_session_started',
    campaignId,
    agentId,
    campaignName: campaign.name,
    sessionKey,
  });

  return sessionKey;
}

// ---------------------------------------------------------------------------
// getNextProgressiveLead
// ---------------------------------------------------------------------------

/**
 * Get the next lead to call in a progressive dialing campaign.
 *
 * Selects one uncalled, non-DNC lead from the DialerListEntry table,
 * ordered by scheduled callbacks first, then by creation date.
 *
 * @param campaignId - The DialerCampaign ID
 * @returns The next lead to call, or null if no leads remain
 */
export async function getNextProgressiveLead(
  campaignId: string
): Promise<{ entryId: string; phone: string; firstName?: string; lastName?: string } | null> {
  // First check for scheduled callbacks that are due
  const callback = await prisma.dialerListEntry.findFirst({
    where: {
      campaignId,
      isCalled: false,
      isDncl: false,
      scheduledAt: { lte: new Date() },
    },
    select: {
      id: true,
      phoneNumber: true,
      firstName: true,
      lastName: true,
    },
    orderBy: { scheduledAt: 'asc' },
  });

  if (callback) {
    return {
      entryId: callback.id,
      phone: callback.phoneNumber,
      firstName: callback.firstName ?? undefined,
      lastName: callback.lastName ?? undefined,
    };
  }

  // Then get the next uncalled lead in FIFO order
  const lead = await prisma.dialerListEntry.findFirst({
    where: {
      campaignId,
      isCalled: false,
      isDncl: false,
      scheduledAt: null,
    },
    select: {
      id: true,
      phoneNumber: true,
      firstName: true,
      lastName: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  if (!lead) {
    return null;
  }

  return {
    entryId: lead.id,
    phone: lead.phoneNumber,
    firstName: lead.firstName ?? undefined,
    lastName: lead.lastName ?? undefined,
  };
}

// ---------------------------------------------------------------------------
// progressiveDialerTick
// ---------------------------------------------------------------------------

/**
 * Advance the progressive dialer by one step.
 *
 * Checks if the agent is ready (not on a call), then picks the next lead
 * and returns a dial instruction. If the agent is busy, returns a wait
 * instruction. If no leads remain, returns done.
 *
 * @param sessionKey - The session key from startProgressiveDialer
 * @returns The action to take: dial (with lead info), wait, or done
 */
export async function progressiveDialerTick(
  sessionKey: string
): Promise<ProgressiveTickResult> {
  const session = progressiveSessions.get(sessionKey);

  if (!session) {
    return { action: 'done', reason: 'Session not found or expired' };
  }

  // Check agent availability via SIP extension status
  const extension = await prisma.sipExtension.findFirst({
    where: { userId: session.agentId },
    select: { status: true },
  });

  if (!extension || extension.status === 'OFFLINE') {
    progressiveSessions.delete(sessionKey);
    return { action: 'done', reason: 'Agent went offline' };
  }

  if (extension.status === 'BUSY') {
    return { action: 'wait', reason: 'Agent is on a call' };
  }

  if (extension.status === 'DND' || extension.status === 'AWAY') {
    return { action: 'wait', reason: `Agent is ${extension.status}` };
  }

  // Agent is ONLINE - get next lead
  const nextLead = await getNextProgressiveLead(session.campaignId);

  if (!nextLead) {
    progressiveSessions.delete(sessionKey);

    logger.info('Progressive dialer: campaign exhausted', {
      event: 'progressive_campaign_done',
      campaignId: session.campaignId,
      agentId: session.agentId,
      totalDialed: session.totalDialed,
    });

    return { action: 'done', reason: 'No more leads to call' };
  }

  // Mark entry as called and increment attempts
  await prisma.dialerListEntry.update({
    where: { id: nextLead.entryId },
    data: {
      isCalled: true,
      callAttempts: { increment: 1 },
      lastCalledAt: new Date(),
    },
  });

  session.totalDialed++;

  logger.info('Progressive dialer: dialing next lead', {
    event: 'progressive_dial',
    campaignId: session.campaignId,
    agentId: session.agentId,
    entryId: nextLead.entryId,
    phone: nextLead.phone,
    totalDialed: session.totalDialed,
  });

  return {
    action: 'dial',
    leadId: nextLead.entryId,
    phone: nextLead.phone,
  };
}
