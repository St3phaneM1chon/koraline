/**
 * Ring Groups - Dedicated ring groups (separate from queue system)
 * Supports simultaneous, sequential, and round-robin ringing.
 */

import { logger } from '@/lib/logger';
import { VoipStateMap } from './voip-state';

// ─── Types ──────────────────────────────────────────────────────────────────

export type RingStrategy = 'simultaneous' | 'sequential' | 'round_robin';

export interface RingGroup {
  id: string;
  name: string;
  companyId: string;
  strategy: RingStrategy;
  /** Member extension numbers */
  members: string[];
  /** Ring timeout per member in seconds (sequential) */
  ringTimeout: number;
  /** Total ring timeout before overflow */
  totalTimeout: number;
  /** What to do when no one answers */
  overflowAction: 'voicemail' | 'extension' | 'external' | 'ivr';
  overflowTarget: string;
  /** Skip members who are on DND or busy */
  skipBusy: boolean;
  /** Round-robin tracking */
  lastMemberIndex?: number;
}

export interface RingGroupCall {
  ringGroupId: string;
  callControlId: string;
  attemptedMembers: string[];
  currentMember?: string;
  startedAt: Date;
}

// ─── State ──────────────────────────────────────────────────────────────────

const ringGroupConfigs = new VoipStateMap<RingGroup>('voip:ringgroup:config:');
const activeRingGroupCalls = new VoipStateMap<RingGroupCall>('voip:ringgroup:call:');

// ─── Functions ──────────────────────────────────────────────────────────────

/**
 * Create or update a ring group.
 */
export function upsertRingGroup(group: RingGroup): void {
  ringGroupConfigs.set(group.id, group);
  logger.info('[RingGroup] Upserted', { id: group.id, name: group.name, strategy: group.strategy });
}

/**
 * Get a ring group by ID.
 */
export function getRingGroup(id: string): RingGroup | undefined {
  return ringGroupConfigs.get(id);
}

/**
 * Get all ring groups for a company.
 */
export function getRingGroupsForCompany(companyId: string): RingGroup[] {
  const groups: RingGroup[] = [];
  ringGroupConfigs.forEach((group) => {
    if (group.companyId === companyId) {
      groups.push(group);
    }
  });
  return groups;
}

/**
 * Route a call to a ring group. Returns the SIP URIs to ring.
 */
export async function routeToRingGroup(
  ringGroupId: string,
  callControlId: string
): Promise<{
  sipUris: string[];
  strategy: RingStrategy;
  ringTimeout: number;
}> {
  const group = ringGroupConfigs.get(ringGroupId);
  if (!group) {
    throw new Error(`Ring group ${ringGroupId} not found`);
  }

  const { default: prisma } = await import('@/lib/db');

  // Get available members (skip busy/DND if configured)
  let availableMembers = [...group.members];

  if (group.skipBusy) {
    const extensions = await prisma.sipExtension.findMany({
      where: {
        extension: { in: availableMembers },
        status: { in: ['ONLINE', 'AWAY'] }, // Skip BUSY, DND, OFFLINE
      },
      select: { extension: true, sipUsername: true, sipDomain: true },
    });
    availableMembers = extensions.map(e => e.extension);
  }

  if (availableMembers.length === 0) {
    // All members busy, go to overflow
    return { sipUris: [], strategy: group.strategy, ringTimeout: group.ringTimeout };
  }

  // Get SIP URIs for available members
  const extensions = await prisma.sipExtension.findMany({
    where: { extension: { in: availableMembers } },
    select: { extension: true, sipUsername: true, sipDomain: true },
  });

  const sipUris = extensions.map(
    e => `sip:${e.sipUsername}@${e.sipDomain ?? 'sip.telnyx.com'}`
  );

  let orderedUris = sipUris;

  switch (group.strategy) {
    case 'simultaneous':
      // Ring all at once
      orderedUris = sipUris;
      break;

    case 'sequential':
      // Ring in order
      orderedUris = sipUris;
      break;

    case 'round_robin': {
      // Start from next member after last answerer
      const startIdx = ((group.lastMemberIndex ?? -1) + 1) % sipUris.length;
      orderedUris = [
        ...sipUris.slice(startIdx),
        ...sipUris.slice(0, startIdx),
      ];
      break;
    }
  }

  // Track the call
  activeRingGroupCalls.set(callControlId, {
    ringGroupId,
    callControlId,
    attemptedMembers: [],
    startedAt: new Date(),
  });

  logger.info('[RingGroup] Routing call', {
    ringGroupId,
    callControlId,
    strategy: group.strategy,
    memberCount: orderedUris.length,
  });

  return {
    sipUris: orderedUris,
    strategy: group.strategy,
    ringTimeout: group.ringTimeout,
  };
}

/**
 * Handle when a ring group call is answered.
 * Updates round-robin index.
 */
export function handleRingGroupAnswered(
  callControlId: string,
  answeredExtension: string
): void {
  const call = activeRingGroupCalls.get(callControlId);
  if (!call) return;

  const group = ringGroupConfigs.get(call.ringGroupId);
  if (group && group.strategy === 'round_robin') {
    const idx = group.members.indexOf(answeredExtension);
    if (idx >= 0) {
      group.lastMemberIndex = idx;
      ringGroupConfigs.set(group.id, group);
    }
  }

  activeRingGroupCalls.delete(callControlId);
}

/**
 * Handle ring group overflow (no answer from any member).
 */
export async function handleRingGroupOverflow(
  callControlId: string
): Promise<{ action: string; target: string } | null> {
  const call = activeRingGroupCalls.get(callControlId);
  if (!call) return null;

  const group = ringGroupConfigs.get(call.ringGroupId);
  if (!group) return null;

  activeRingGroupCalls.delete(callControlId);

  logger.info('[RingGroup] Overflow triggered', {
    ringGroupId: group.id,
    action: group.overflowAction,
    target: group.overflowTarget,
  });

  return {
    action: group.overflowAction,
    target: group.overflowTarget,
  };
}

/**
 * Delete a ring group.
 */
export function deleteRingGroup(id: string): void {
  ringGroupConfigs.delete(id);
}

/**
 * Cleanup ring group call state on hangup.
 */
export function cleanupRingGroupCall(callControlId: string): void {
  activeRingGroupCalls.delete(callControlId);
}
