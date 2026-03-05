/**
 * Call Pickup - Directed and Group pickup
 * Directed: *8 + extension = pick up a specific ringing call
 * Group: *9 = pick up any ringing call in your pickup group
 */

import { logger } from '@/lib/logger';
import { VoipStateMap } from './voip-state';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface RingingCall {
  callControlId: string;
  callerNumber: string;
  callerName?: string;
  targetExtension: string;
  targetUserId: string;
  companyId: string;
  ringStartedAt: Date;
  pickupGroupId?: string;
}

export interface PickupGroup {
  id: string;
  name: string;
  companyId: string;
  memberExtensions: string[];
}

export interface PickupResult {
  success: boolean;
  callControlId?: string;
  callerNumber?: string;
  callerName?: string;
  error?: string;
}

// ─── State Management ───────────────────────────────────────────────────────

/** Active ringing calls available for pickup, keyed by target extension */
const ringingCalls = new VoipStateMap<RingingCall>('voip:ringing:');

// ─── Functions ──────────────────────────────────────────────────────────────

/**
 * Register a ringing call (called when inbound call starts ringing).
 * This makes the call available for directed or group pickup.
 */
export function registerRingingCall(call: RingingCall): void {
  ringingCalls.set(call.targetExtension, call);

  // Auto-expire after 60 seconds (call should have been answered or gone to VM)
  setTimeout(() => {
    const existing = ringingCalls.get(call.targetExtension);
    if (existing?.callControlId === call.callControlId) {
      ringingCalls.delete(call.targetExtension);
    }
  }, 60000);

  logger.info('Ringing call registered for pickup', {
    extension: call.targetExtension,
    caller: call.callerNumber,
  });
}

/**
 * Unregister a ringing call (answered, voicemail, or hangup).
 */
export function unregisterRingingCall(targetExtension: string): void {
  ringingCalls.delete(targetExtension);
}

/**
 * Directed pickup: pick up a call ringing on a specific extension.
 * The agent's call is bridged with the ringing call.
 */
export async function directedPickup(
  targetExtension: string,
  pickerCallControlId: string
): Promise<PickupResult> {
  const ringing = ringingCalls.get(targetExtension);
  if (!ringing) {
    return {
      success: false,
      error: `No ringing call on extension ${targetExtension}`,
    };
  }

  return executePickup(ringing, pickerCallControlId);
}

/**
 * Group pickup: pick up any ringing call in the agent's pickup group.
 * Picks the longest-ringing call first.
 */
export async function groupPickup(
  pickerExtension: string,
  pickerCallControlId: string,
  companyId: string
): Promise<PickupResult> {
  // Get picker's pickup group
  const group = await getPickupGroupForExtension(pickerExtension, companyId);

  if (!group) {
    return { success: false, error: 'No pickup group configured for your extension' };
  }

  // Find oldest ringing call in the group
  let oldestCall: RingingCall | null = null;
  for (const ext of group.memberExtensions) {
    if (ext === pickerExtension) continue; // Don't pick up your own
    const call = ringingCalls.get(ext);
    if (call && call.companyId === companyId) {
      if (!oldestCall || call.ringStartedAt < oldestCall.ringStartedAt) {
        oldestCall = call;
      }
    }
  }

  if (!oldestCall) {
    return { success: false, error: 'No ringing calls in your pickup group' };
  }

  return executePickup(oldestCall, pickerCallControlId);
}

/**
 * Execute the actual pickup: answer the ringing call and bridge it.
 */
async function executePickup(
  ringingCall: RingingCall,
  pickerCallControlId: string
): Promise<PickupResult> {
  const telnyx = await import('@/lib/telnyx');

  try {
    // Answer the ringing call
    await telnyx.answerCall(ringingCall.callControlId);

    // Bridge with the picker's call
    await telnyx.bridgeCall(ringingCall.callControlId, pickerCallControlId);

    // Clean up
    ringingCalls.delete(ringingCall.targetExtension);

    logger.info('Call pickup successful', {
      extension: ringingCall.targetExtension,
      picker: pickerCallControlId,
      caller: ringingCall.callerNumber,
    });

    return {
      success: true,
      callControlId: ringingCall.callControlId,
      callerNumber: ringingCall.callerNumber,
      callerName: ringingCall.callerName,
    };
  } catch (error) {
    logger.error('Call pickup failed', {
      extension: ringingCall.targetExtension,
      error,
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Pickup failed',
    };
  }
}

/**
 * Get all ringing calls visible to a given extension (for UI display).
 */
export function getVisibleRingingCalls(
  pickerExtension: string,
  companyId: string,
  pickupGroup?: PickupGroup
): RingingCall[] {
  const calls: RingingCall[] = [];
  const extensions = pickupGroup?.memberExtensions ?? [];

  ringingCalls.forEach((call, ext) => {
    if (call.companyId !== companyId) return;
    if (ext === pickerExtension) return;
    // Show if in same pickup group, or if no group configured show all company calls
    if (extensions.length === 0 || extensions.includes(ext)) {
      calls.push(call);
    }
  });

  // Sort by ring duration (oldest first)
  return calls.sort((a, b) =>
    new Date(a.ringStartedAt).getTime() - new Date(b.ringStartedAt).getTime()
  );
}

/**
 * Get the pickup group for an extension.
 * Uses CallQueue with RING_ALL strategy as pickup group proxy.
 */
async function getPickupGroupForExtension(
  extension: string,
  companyId: string
): Promise<PickupGroup | null> {
  const { default: prisma } = await import('@/lib/db');

  // Find queues where this extension's user is a member
  const ext = await prisma.sipExtension.findUnique({
    where: { extension },
    select: { userId: true },
  });
  if (!ext?.userId) return null;

  const memberships = await prisma.callQueueMember.findMany({
    where: { userId: ext.userId },
    select: { queueId: true },
  });

  if (memberships.length === 0) return null;

  // Fetch the queues for these memberships
  const queues = await prisma.callQueue.findMany({
    where: { id: { in: memberships.map((m: { queueId: string }) => m.queueId) } },
    include: {
      members: {
        include: {
          user: {
            include: {
              sipExtensions: { select: { extension: true } },
            },
          },
        },
      },
    },
  });

  // Use first RING_ALL queue as pickup group
  for (const queue of queues) {
    if (queue.strategy === 'RING_ALL' && queue.companyId === companyId) {
      const memberExtensions = queue.members
        .map((m: { user?: { sipExtensions?: { extension: string }[] } | null }) => m.user?.sipExtensions?.[0]?.extension)
        .filter((e: string | undefined): e is string => !!e);

      return {
        id: queue.id,
        name: queue.name,
        companyId,
        memberExtensions,
      };
    }
  }

  return null;
}
