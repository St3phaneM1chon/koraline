/**
 * Call Forwarding Rules Engine
 * Supports: unconditional, busy, no-answer, unavailable, scheduled forwarding.
 * Applied before queue routing in the inbound call flow.
 */

import { logger } from '@/lib/logger';
import { VoipStateMap } from './voip-state';

// ─── Types ──────────────────────────────────────────────────────────────────

export type ForwardingType = 'unconditional' | 'busy' | 'no_answer' | 'unavailable' | 'scheduled';

export interface ForwardingRule {
  id: string;
  type: ForwardingType;
  /** Destination: E.164 number, extension, or voicemail */
  destination: string;
  /** Is this a voicemail destination */
  isVoicemail: boolean;
  /** Enabled state */
  enabled: boolean;
  /** Ring timeout before forwarding (no_answer type) */
  ringTimeout?: number;
  /** Schedule for scheduled forwarding */
  schedule?: ForwardingSchedule;
  /** Priority (lower = checked first) */
  priority: number;
}

export interface ForwardingSchedule {
  /** Days of week: 0=Sun, 1=Mon, ..., 6=Sat */
  days: number[];
  /** Start time HH:MM */
  startTime: string;
  /** End time HH:MM */
  endTime: string;
  /** Timezone (IANA) */
  timezone: string;
}

export interface ForwardingConfig {
  userId: string;
  extensionId: string;
  rules: ForwardingRule[];
  /** Global enable/disable for all forwarding */
  globalEnabled: boolean;
}

export interface ForwardingDecision {
  shouldForward: boolean;
  destination?: string;
  isVoicemail?: boolean;
  rule?: ForwardingRule;
  reason?: string;
}

// ─── State Management ───────────────────────────────────────────────────────

const forwardingConfigs = new VoipStateMap<ForwardingConfig>('voip:forwarding:');

// ─── Functions ──────────────────────────────────────────────────────────────

/**
 * Configure forwarding rules for a user's extension.
 */
export async function setForwardingRules(
  userId: string,
  rules: ForwardingRule[]
): Promise<ForwardingConfig> {
  const { default: prisma } = await import('@/lib/db');

  const extension = await prisma.sipExtension.findFirst({
    where: { userId },
    select: { id: true },
  });

  if (!extension) {
    throw new Error('No SIP extension found for user');
  }

  // Sort by priority
  rules.sort((a, b) => a.priority - b.priority);

  const config: ForwardingConfig = {
    userId,
    extensionId: extension.id,
    rules,
    globalEnabled: true,
  };

  forwardingConfigs.set(userId, config);

  logger.info('Forwarding rules updated', {
    userId,
    ruleCount: rules.length,
    types: rules.filter(r => r.enabled).map(r => r.type),
  });

  return config;
}

/**
 * Quick-set unconditional forwarding.
 */
export async function setUnconditionalForward(
  userId: string,
  destination: string
): Promise<void> {
  const existing = forwardingConfigs.get(userId);
  const rules = existing?.rules.filter(r => r.type !== 'unconditional') ?? [];

  rules.unshift({
    id: `fwd-uncond-${userId}`,
    type: 'unconditional',
    destination,
    isVoicemail: false,
    enabled: true,
    priority: 0,
  });

  await setForwardingRules(userId, rules);
}

/**
 * Quick-set forward to voicemail when no answer.
 */
export async function setNoAnswerForward(
  userId: string,
  ringTimeout = 20
): Promise<void> {
  const existing = forwardingConfigs.get(userId);
  const rules = existing?.rules.filter(r => r.type !== 'no_answer') ?? [];

  rules.push({
    id: `fwd-noanswer-${userId}`,
    type: 'no_answer',
    destination: 'voicemail',
    isVoicemail: true,
    enabled: true,
    ringTimeout,
    priority: 50,
  });

  await setForwardingRules(userId, rules);
}

/**
 * Evaluate forwarding rules for an incoming call.
 * Called by the inbound call routing logic.
 */
export async function evaluateForwarding(
  targetUserId: string,
  context: {
    callerNumber?: string;
    isUserBusy?: boolean;
    isUserUnavailable?: boolean;
    ringTimeoutReached?: boolean;
  }
): Promise<ForwardingDecision> {
  const config = forwardingConfigs.get(targetUserId);

  if (!config || !config.globalEnabled) {
    return { shouldForward: false };
  }

  const enabledRules = config.rules.filter(r => r.enabled);

  for (const rule of enabledRules) {
    const matches = checkRuleCondition(rule, context);
    if (matches) {
      logger.info('Forwarding rule matched', {
        userId: targetUserId,
        ruleType: rule.type,
        destination: rule.destination,
      });

      return {
        shouldForward: true,
        destination: rule.destination,
        isVoicemail: rule.isVoicemail,
        rule,
        reason: `Forwarding: ${rule.type}`,
      };
    }
  }

  return { shouldForward: false };
}

/**
 * Get forwarding configuration for a user.
 */
export function getForwardingConfig(userId: string): ForwardingConfig | undefined {
  return forwardingConfigs.get(userId);
}

/**
 * Toggle a specific forwarding rule on/off.
 */
export function toggleRule(userId: string, ruleId: string, enabled: boolean): void {
  const config = forwardingConfigs.get(userId);
  if (!config) return;

  const rule = config.rules.find(r => r.id === ruleId);
  if (rule) {
    rule.enabled = enabled;
    forwardingConfigs.set(userId, config);
  }
}

/**
 * Toggle global forwarding on/off.
 */
export function toggleGlobalForwarding(userId: string, enabled: boolean): void {
  const config = forwardingConfigs.get(userId);
  if (!config) return;

  config.globalEnabled = enabled;
  forwardingConfigs.set(userId, config);
}

/**
 * Remove a forwarding rule.
 */
export function removeRule(userId: string, ruleId: string): void {
  const config = forwardingConfigs.get(userId);
  if (!config) return;

  config.rules = config.rules.filter(r => r.id !== ruleId);
  forwardingConfigs.set(userId, config);
}

/**
 * Clear all forwarding rules for a user.
 */
export function clearForwarding(userId: string): void {
  forwardingConfigs.delete(userId);
}

// ─── Internal Helpers ───────────────────────────────────────────────────────

/**
 * Check if a forwarding rule's condition is met.
 */
function checkRuleCondition(
  rule: ForwardingRule,
  context: {
    isUserBusy?: boolean;
    isUserUnavailable?: boolean;
    ringTimeoutReached?: boolean;
  }
): boolean {
  switch (rule.type) {
    case 'unconditional':
      return true; // Always forward

    case 'busy':
      return context.isUserBusy === true;

    case 'no_answer':
      return context.ringTimeoutReached === true;

    case 'unavailable':
      return context.isUserUnavailable === true;

    case 'scheduled':
      return rule.schedule ? isWithinSchedule(rule.schedule) : false;

    default:
      return false;
  }
}

/**
 * Check if current time is within a forwarding schedule.
 */
function isWithinSchedule(schedule: ForwardingSchedule): boolean {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: schedule.timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(now);
  const hour = parseInt(parts.find(p => p.type === 'hour')?.value ?? '0');
  const minute = parseInt(parts.find(p => p.type === 'minute')?.value ?? '0');
  const day = now.getDay();

  if (!schedule.days.includes(day)) return false;

  const [startH, startM] = schedule.startTime.split(':').map(Number);
  const [endH, endM] = schedule.endTime.split(':').map(Number);

  const currentMin = hour * 60 + minute;
  const startMin = startH * 60 + startM;
  const endMin = endH * 60 + endM;

  if (startMin <= endMin) {
    return currentMin >= startMin && currentMin < endMin;
  } else {
    return currentMin >= startMin || currentMin < endMin;
  }
}
