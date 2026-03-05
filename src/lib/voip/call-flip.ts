/**
 * Call Flip - Transfer active call between devices mid-call
 * Enables switching from web softphone to mobile or desk phone seamlessly.
 * Uses Telnyx Call Control API transfer with special handling for device switching.
 */

import { logger } from '@/lib/logger';
import { VoipStateMap } from './voip-state';

// ─── Types ──────────────────────────────────────────────────────────────────

export type FlipTarget = 'mobile' | 'desk_phone' | 'web' | 'sip';

export interface FlipDevice {
  type: FlipTarget;
  label: string;
  /** E.164 phone number or SIP URI */
  destination: string;
  /** Whether this device is currently active */
  isActive: boolean;
}

export interface CallFlipState {
  callControlId: string;
  originalDevice: FlipDevice;
  currentDevice: FlipDevice;
  flipHistory: Array<{
    from: FlipTarget;
    to: FlipTarget;
    timestamp: Date;
  }>;
  callSessionId?: string;
}

export interface FlipResult {
  success: boolean;
  newCallControlId?: string;
  device: FlipDevice;
  error?: string;
}

// ─── State Management ───────────────────────────────────────────────────────

const flipStates = new VoipStateMap<CallFlipState>('voip:call-flip:');

// ─── Functions ──────────────────────────────────────────────────────────────

/**
 * Get registered devices for a user/extension.
 */
export async function getUserDevices(userId: string): Promise<FlipDevice[]> {
  const { default: prisma } = await import('@/lib/db');

  // Get user's SIP extension
  const extension = await prisma.sipExtension.findFirst({
    where: { userId },
    select: { extension: true, sipUsername: true, sipDomain: true },
  });

  // Get user for mobile number
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { phone: true, name: true },
  });

  const devices: FlipDevice[] = [];

  // Web softphone (always available)
  devices.push({
    type: 'web',
    label: 'Web Softphone',
    destination: extension
      ? `sip:${extension.sipUsername}@${extension.sipDomain ?? 'sip.telnyx.com'}`
      : '',
    isActive: false,
  });

  // SIP desk phone
  if (extension) {
    devices.push({
      type: 'desk_phone',
      label: `Ext. ${extension.extension}`,
      destination: `sip:${extension.sipUsername}@${extension.sipDomain ?? 'sip.telnyx.com'}`,
      isActive: false,
    });
  }

  // Mobile
  if (user?.phone) {
    devices.push({
      type: 'mobile',
      label: 'Mobile',
      destination: user.phone,
      isActive: false,
    });
  }

  return devices;
}

/**
 * Flip an active call to another device.
 * The call is transferred to the new device seamlessly.
 */
export async function flipCall(
  callControlId: string,
  targetDevice: FlipDevice,
  _userId: string
): Promise<FlipResult> {
  const telnyx = await import('@/lib/telnyx');

  try {
    logger.info('Call flip initiated', {
      callControlId,
      target: targetDevice.type,
      destination: targetDevice.destination,
    });

    // Store current state before flip
    const existingState = flipStates.get(callControlId);
    const originalDevice = existingState?.originalDevice ?? {
      type: 'web' as FlipTarget,
      label: 'Web Softphone',
      destination: '',
      isActive: true,
    };

    // Use Telnyx transfer to move the call
    // For SIP targets, use SIP URI directly
    // For phone numbers, use E.164
    const isSip = targetDevice.destination.startsWith('sip:');

    if (isSip) {
      await telnyx.transferCall(callControlId, targetDevice.destination);
    } else {
      await telnyx.transferCall(callControlId, targetDevice.destination);
    }

    // Update state
    const flipState: CallFlipState = {
      callControlId,
      originalDevice,
      currentDevice: { ...targetDevice, isActive: true },
      flipHistory: [
        ...(existingState?.flipHistory ?? []),
        {
          from: existingState?.currentDevice.type ?? 'web',
          to: targetDevice.type,
          timestamp: new Date(),
        },
      ],
    };
    flipStates.set(callControlId, flipState);

    logger.info('Call flip successful', {
      callControlId,
      device: targetDevice.type,
    });

    return {
      success: true,
      device: targetDevice,
    };
  } catch (error) {
    logger.error('Call flip failed', { callControlId, error });
    return {
      success: false,
      device: targetDevice,
      error: error instanceof Error ? error.message : 'Call flip failed',
    };
  }
}

/**
 * Get the flip state for a call.
 */
export function getFlipState(callControlId: string): CallFlipState | undefined {
  return flipStates.get(callControlId);
}

/**
 * Cleanup flip state on call hangup.
 */
export function cleanupFlipState(callControlId: string): void {
  flipStates.delete(callControlId);
}
