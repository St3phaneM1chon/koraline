/**
 * Simultaneous Ring - Ring multiple endpoints at once
 * Rings WebRTC softphone + SIP desk phone + mobile simultaneously.
 * First device to answer gets the call; others stop ringing.
 */

import { logger } from '@/lib/logger';
import { getTelnyxConnectionId } from '@/lib/telnyx';
import { VoipStateMap } from './voip-state';

// ─── Types ──────────────────────────────────────────────────────────────────

export type DeviceType = 'webrtc' | 'sip' | 'mobile' | 'external';

export interface RingEndpoint {
  type: DeviceType;
  /** SIP URI or E.164 number */
  destination: string;
  /** Display label */
  label: string;
  /** Ring delay in seconds (0 = immediate) */
  delay: number;
  /** Whether this endpoint is enabled */
  enabled: boolean;
}

export interface SimultaneousRingConfig {
  userId: string;
  enabled: boolean;
  endpoints: RingEndpoint[];
  /** Include voicemail as final fallback */
  voicemailFallback: boolean;
  /** Total ring timeout before voicemail (seconds) */
  totalTimeout: number;
}

export interface SimultaneousRingCall {
  userId: string;
  incomingCallControlId: string;
  /** Call control IDs for each forked leg */
  forkedLegs: Map<string, { endpoint: RingEndpoint; callControlId: string }>;
  startedAt: Date;
  answered: boolean;
  answeredBy?: string;
}

// ─── State ──────────────────────────────────────────────────────────────────

const simRingConfigs = new VoipStateMap<SimultaneousRingConfig>('voip:simring:config:');
const activeSimRingCalls = new VoipStateMap<SimultaneousRingCall>('voip:simring:call:');

// ─── Functions ──────────────────────────────────────────────────────────────

/**
 * Configure simultaneous ring for a user.
 */
export async function configureSimultaneousRing(
  userId: string,
  config: Partial<SimultaneousRingConfig>
): Promise<SimultaneousRingConfig> {
  const existing = simRingConfigs.get(userId);
  const updated: SimultaneousRingConfig = {
    userId,
    enabled: true,
    endpoints: [],
    voicemailFallback: true,
    totalTimeout: 25,
    ...existing,
    ...config,
  };

  simRingConfigs.set(userId, updated);

  logger.info('[SimRing] Config updated', {
    userId,
    endpointCount: updated.endpoints.filter(e => e.enabled).length,
  });

  return updated;
}

/**
 * Get simultaneous ring config for a user.
 */
export function getSimRingConfig(userId: string): SimultaneousRingConfig | undefined {
  return simRingConfigs.get(userId);
}

/**
 * Auto-configure endpoints from user's devices.
 */
export async function autoConfigureEndpoints(
  userId: string
): Promise<RingEndpoint[]> {
  const { default: prisma } = await import('@/lib/db');

  const endpoints: RingEndpoint[] = [];

  // WebRTC softphone (always available)
  endpoints.push({
    type: 'webrtc',
    destination: 'webrtc',
    label: 'Web Softphone',
    delay: 0,
    enabled: true,
  });

  // SIP desk phone
  const extension = await prisma.sipExtension.findFirst({
    where: { userId },
    select: { extension: true, sipUsername: true, sipDomain: true },
  });

  if (extension) {
    endpoints.push({
      type: 'sip',
      destination: `sip:${extension.sipUsername}@${extension.sipDomain ?? 'sip.telnyx.com'}`,
      label: `Desk Phone (Ext. ${extension.extension})`,
      delay: 0,
      enabled: true,
    });
  }

  // Mobile number
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { phone: true },
  });

  if (user?.phone) {
    endpoints.push({
      type: 'mobile',
      destination: user.phone,
      label: 'Mobile',
      delay: 5, // Ring mobile after 5s delay
      enabled: false, // Off by default
    });
  }

  return endpoints;
}

/**
 * Execute simultaneous ring for an incoming call.
 * Forks the call to all enabled endpoints.
 */
export async function executeSimultaneousRing(
  userId: string,
  incomingCallControlId: string,
  callerNumber: string
): Promise<{ forkedCount: number }> {
  const config = simRingConfigs.get(userId);
  if (!config?.enabled) {
    return { forkedCount: 0 };
  }

  const enabledEndpoints = config.endpoints.filter(e => e.enabled);
  if (enabledEndpoints.length === 0) {
    return { forkedCount: 0 };
  }

  const telnyx = await import('@/lib/telnyx');
  const forkedLegs = new Map<string, { endpoint: RingEndpoint; callControlId: string }>();

  // Fork call to each endpoint
  for (const endpoint of enabledEndpoints) {
    if (endpoint.type === 'webrtc') {
      // WebRTC is handled by the Telnyx SDK directly (original ring)
      continue;
    }

    try {
      // Dial the endpoint with a delay if configured
      const connectionId = getTelnyxConnectionId();
      if (endpoint.delay > 0) {
        setTimeout(async () => {
          try {
            const result = await telnyx.dialCall({
              to: endpoint.destination,
              from: callerNumber,
              connectionId,
              timeout: config.totalTimeout - endpoint.delay,
              clientState: JSON.stringify({
                simRing: true,
                userId,
                originalCallId: incomingCallControlId,
              }),
            });
            if (result.data?.call_control_id) {
              forkedLegs.set(endpoint.destination, {
                endpoint,
                callControlId: result.data.call_control_id,
              });
            }
          } catch {
            logger.warn('[SimRing] Delayed fork failed', { endpoint: endpoint.destination });
          }
        }, endpoint.delay * 1000);
      } else {
        const result = await telnyx.dialCall({
          to: endpoint.destination,
          from: callerNumber,
          connectionId,
          timeout: config.totalTimeout,
          clientState: JSON.stringify({
            simRing: true,
            userId,
            originalCallId: incomingCallControlId,
          }),
        });
        if (result.data?.call_control_id) {
          forkedLegs.set(endpoint.destination, {
            endpoint,
            callControlId: result.data.call_control_id,
          });
        }
      }
    } catch (error) {
      logger.warn('[SimRing] Fork failed for endpoint', {
        destination: endpoint.destination,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // Track the simultaneous ring call
  const simCall: SimultaneousRingCall = {
    userId,
    incomingCallControlId,
    forkedLegs,
    startedAt: new Date(),
    answered: false,
  };
  activeSimRingCalls.set(incomingCallControlId, simCall);

  logger.info('[SimRing] Executed', {
    userId,
    forkedCount: forkedLegs.size,
    endpoints: enabledEndpoints.map(e => e.type),
  });

  return { forkedCount: forkedLegs.size };
}

/**
 * Handle when any device answers the simultaneous ring.
 * Cancel all other ringing legs.
 */
export async function handleSimRingAnswered(
  answeredCallControlId: string,
  answeredEndpoint: string
): Promise<void> {
  // Find the sim ring call
  let simCall: SimultaneousRingCall | undefined;
  let originalCallId = '';

  activeSimRingCalls.forEach((call, id) => {
    if (call.incomingCallControlId === answeredCallControlId) {
      simCall = call;
      originalCallId = id;
    }
    call.forkedLegs.forEach((leg) => {
      if (leg.callControlId === answeredCallControlId) {
        simCall = call;
        originalCallId = id;
      }
    });
  });

  if (!simCall) return;

  simCall.answered = true;
  simCall.answeredBy = answeredEndpoint;

  const telnyx = await import('@/lib/telnyx');

  // Cancel all other forked legs
  for (const [_dest, leg] of simCall.forkedLegs) {
    if (leg.callControlId !== answeredCallControlId) {
      try {
        await telnyx.hangupCall(leg.callControlId);
      } catch {
        // Already hung up
      }
    }
  }

  activeSimRingCalls.delete(originalCallId);

  logger.info('[SimRing] Answered', {
    answeredBy: answeredEndpoint,
    cancelledLegs: simCall.forkedLegs.size - 1,
  });
}

/**
 * Cancel all simultaneous ring legs (e.g., caller hung up).
 */
export async function cancelSimRing(incomingCallControlId: string): Promise<void> {
  const simCall = activeSimRingCalls.get(incomingCallControlId);
  if (!simCall) return;

  const telnyx = await import('@/lib/telnyx');

  for (const [, leg] of simCall.forkedLegs) {
    try {
      await telnyx.hangupCall(leg.callControlId);
    } catch {
      // Already hung up
    }
  }

  activeSimRingCalls.delete(incomingCallControlId);
}

/**
 * Cleanup sim ring state.
 */
export function cleanupSimRing(callControlId: string): void {
  activeSimRingCalls.delete(callControlId);
}
