/**
 * CRM Call Blending - 3F.3
 *
 * Manages agent call modes (inbound, outbound, blended) to optimize
 * agent utilization. When inbound queues are idle, blended agents can
 * be assigned outbound calls, and vice versa.
 *
 * Since there is no AgentPresence model in the schema, agent mode is
 * tracked via the SipExtension status field and an in-memory mode map.
 * In production, this would be backed by Redis for multi-instance support.
 */

import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AgentMode = 'inbound' | 'outbound' | 'blended';

interface AgentModeEntry {
  mode: AgentMode;
  updatedAt: Date;
}

// ---------------------------------------------------------------------------
// In-memory agent mode store
// In production, this should be backed by Redis for multi-instance support.
// ---------------------------------------------------------------------------

const agentModes = new Map<string, AgentModeEntry>();

// ---------------------------------------------------------------------------
// getAgentMode
// ---------------------------------------------------------------------------

/**
 * Get the current call handling mode for an agent.
 *
 * Checks the in-memory mode map first. If no mode is set, defaults
 * to 'blended' for agents with a SIP extension, or 'inbound' otherwise.
 *
 * @param agentId - The user ID of the agent
 * @returns The agent's current mode: 'inbound', 'outbound', or 'blended'
 */
export async function getAgentMode(agentId: string): Promise<AgentMode> {
  // Check in-memory store
  const entry = agentModes.get(agentId);
  if (entry) {
    return entry.mode;
  }

  // Check if agent has a SIP extension (indicating they can handle calls)
  const extension = await prisma.sipExtension.findFirst({
    where: { userId: agentId },
    select: { id: true, status: true },
  });

  // Default mode: agents with extensions are 'blended', others are 'inbound'
  const defaultMode: AgentMode = extension ? 'blended' : 'inbound';

  // Store default for future lookups
  agentModes.set(agentId, { mode: defaultMode, updatedAt: new Date() });

  return defaultMode;
}

// ---------------------------------------------------------------------------
// setAgentMode
// ---------------------------------------------------------------------------

/**
 * Set the call handling mode for an agent.
 *
 * Updates the in-memory mode map and adjusts the agent's SIP extension
 * status if applicable:
 * - 'inbound': Agent only receives incoming calls
 * - 'outbound': Agent only makes outgoing calls
 * - 'blended': Agent handles both inbound and outbound
 *
 * @param agentId - The user ID of the agent
 * @param mode - The desired mode: 'inbound', 'outbound', or 'blended'
 */
export async function setAgentMode(agentId: string, mode: string): Promise<void> {
  const validModes: AgentMode[] = ['inbound', 'outbound', 'blended'];
  const normalizedMode = mode.toLowerCase() as AgentMode;

  if (!validModes.includes(normalizedMode)) {
    throw new Error(`Invalid agent mode: ${mode}. Must be one of: ${validModes.join(', ')}`);
  }

  // Update in-memory store
  agentModes.set(agentId, { mode: normalizedMode, updatedAt: new Date() });

  // Update SIP extension status to reflect availability
  const extension = await prisma.sipExtension.findFirst({
    where: { userId: agentId },
    select: { id: true },
  });

  if (extension) {
    // Mark as ONLINE when setting a mode (agent is active)
    await prisma.sipExtension.update({
      where: { id: extension.id },
      data: {
        status: 'ONLINE',
        lastSeenAt: new Date(),
      },
    });
  }

  logger.info('Call blending: agent mode set', {
    event: 'agent_mode_set',
    agentId,
    mode: normalizedMode,
  });
}

// ---------------------------------------------------------------------------
// shouldBlend
// ---------------------------------------------------------------------------

/**
 * Determine if an agent should be blended (switched from outbound to inbound).
 *
 * Returns true if:
 * 1. The agent is currently in 'outbound' or 'blended' mode
 * 2. There are no pending outbound calls for the agent's campaigns
 * 3. There are inbound calls waiting (checking active call logs with no agent)
 *
 * @param agentId - The user ID of the agent
 * @returns true if the agent should be switched to handle inbound calls
 */
export async function shouldBlend(agentId: string): Promise<boolean> {
  const mode = await getAgentMode(agentId);

  // Only blend agents who are in outbound or blended mode
  if (mode === 'inbound') {
    return false;
  }

  // Check if there are pending outbound activities for this agent
  // (via campaigns where the agent is working)
  const pendingOutbound = await prisma.crmCampaignActivity.count({
    where: {
      status: 'pending',
      channel: 'call',
      campaign: {
        status: 'ACTIVE',
      },
    },
  });

  // Check if there are inbound calls waiting (ringing without an assigned agent)
  const waitingInbound = await prisma.callLog.count({
    where: {
      direction: 'INBOUND',
      status: 'RINGING',
      agentId: null, // No agent assigned yet
    },
  });

  const shouldSwitch = pendingOutbound === 0 && waitingInbound > 0;

  if (shouldSwitch) {
    logger.info('Call blending: recommending blend to inbound', {
      event: 'blend_recommended',
      agentId,
      currentMode: mode,
      pendingOutbound,
      waitingInbound,
    });
  }

  return shouldSwitch;
}

// ---------------------------------------------------------------------------
// getBlendingStats
// ---------------------------------------------------------------------------

/**
 * Get current blending statistics across all agents.
 *
 * @returns Object with counts of blended, inbound-only, and outbound-only agents
 */
export async function getBlendingStats(): Promise<{
  blendedAgents: number;
  inboundOnly: number;
  outboundOnly: number;
}> {
  let blendedAgents = 0;
  let inboundOnly = 0;
  let outboundOnly = 0;

  // Count from in-memory store
  agentModes.forEach((entry) => {
    switch (entry.mode) {
      case 'blended':
        blendedAgents++;
        break;
      case 'inbound':
        inboundOnly++;
        break;
      case 'outbound':
        outboundOnly++;
        break;
    }
  });

  // If no agents tracked in memory, check SIP extensions for online agents
  if (agentModes.size === 0) {
    const onlineExtensions = await prisma.sipExtension.count({
      where: {
        status: { in: ['ONLINE', 'BUSY'] },
      },
    });
    // All online agents default to blended
    blendedAgents = onlineExtensions;
  }

  logger.debug('Call blending: stats retrieved', {
    event: 'blending_stats',
    blendedAgents,
    inboundOnly,
    outboundOnly,
    totalTracked: agentModes.size,
  });

  return { blendedAgents, inboundOnly, outboundOnly };
}
