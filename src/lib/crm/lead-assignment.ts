/**
 * LEAD ASSIGNMENT STRATEGIES
 * Round-robin and auto-assignment of leads to agents.
 */

import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

/**
 * Assign a lead to the agent (from `agentIds`) who currently has the fewest
 * assigned leads with status NEW or CONTACTED (round-robin by workload).
 *
 * Updates `CrmLead.assignedToId` and returns the chosen agent ID.
 */
export async function assignLeadRoundRobin(
  leadId: string,
  agentIds: string[],
): Promise<string> {
  if (agentIds.length === 0) {
    throw new Error('assignLeadRoundRobin: agentIds array is empty');
  }

  // Count active leads per agent
  const counts = await prisma.crmLead.groupBy({
    by: ['assignedToId'],
    where: {
      assignedToId: { in: agentIds },
      status: { in: ['NEW', 'CONTACTED'] },
    },
    _count: { id: true },
  });

  // Build a map agentId -> count
  const countMap = new Map<string, number>();
  for (const agentId of agentIds) {
    countMap.set(agentId, 0);
  }
  for (const row of counts) {
    if (row.assignedToId) {
      countMap.set(row.assignedToId, row._count.id);
    }
  }

  // Pick the agent with the fewest leads
  let chosenId = agentIds[0];
  let minCount = Infinity;
  for (const [agentId, count] of countMap.entries()) {
    if (count < minCount) {
      minCount = count;
      chosenId = agentId;
    }
  }

  // Update lead
  await prisma.crmLead.update({
    where: { id: leadId },
    data: { assignedToId: chosenId },
  });

  logger.info('Lead assigned via round-robin', { leadId, agentId: chosenId, agentLoad: minCount });
  return chosenId;
}

/**
 * Automatically assign a lead by picking from all users with role EMPLOYEE
 * using round-robin.  Returns the assigned agent ID, or `null` if no agents
 * are available.
 */
export async function autoAssignLead(leadId: string): Promise<string | null> {
  const agents = await prisma.user.findMany({
    where: { role: 'EMPLOYEE' },
    select: { id: true },
  });

  if (agents.length === 0) {
    logger.warn('autoAssignLead: no agents with role EMPLOYEE found', { leadId });
    return null;
  }

  const agentIds = agents.map((a) => a.id);
  return assignLeadRoundRobin(leadId, agentIds);
}
