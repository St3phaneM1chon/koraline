/**
 * Rich Presence Manager (D1-D5)
 *
 * Features:
 * - 6 presence states: available, busy, dnd, away, break, offline
 * - Auto-detect from call state (in-call → busy)
 * - Custom status message
 * - Team presence view (who's available)
 * - Schedule-based presence (office hours → available, after hours → away)
 * - Presence broadcast via Redis pub/sub for multi-agent visibility
 */

import { VoipStateMap } from './voip-state';
import { logger } from '@/lib/logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PresenceStatus = 'available' | 'busy' | 'dnd' | 'away' | 'break' | 'offline';

export interface PresenceInfo {
  status: PresenceStatus;
  customMessage: string | null;
  lastChanged: string; // ISO date
  autoDetected: boolean;
  userId: string;
  userName: string;
  /** Extension number if any */
  extension: string | null;
  /** Currently on a call */
  inCall: boolean;
  /** Current call control ID */
  callControlId: string | null;
}

export interface PresenceScheduleRule {
  dayOfWeek: number[]; // 0=Sunday, 6=Saturday
  startHour: number;   // 0-23
  startMinute: number; // 0-59
  endHour: number;
  endMinute: number;
  status: PresenceStatus;
}

export interface PresenceConfig {
  userId: string;
  userName: string;
  extension: string | null;
  /** DND exceptions — these callers ring through even in DND */
  dndExceptions: string[];
  /** Auto-away timeout in minutes (0 = disabled) */
  autoAwayMinutes: number;
  /** Schedule rules */
  schedule: PresenceScheduleRule[];
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

const presenceStore = new VoipStateMap<PresenceInfo>('voip:presence:');
const configStore = new VoipStateMap<PresenceConfig>('voip:presence-config:');

// ---------------------------------------------------------------------------
// Core API
// ---------------------------------------------------------------------------

/**
 * Set the presence status for a user.
 */
export function setPresence(
  userId: string,
  status: PresenceStatus,
  options?: { customMessage?: string; autoDetected?: boolean }
): PresenceInfo {
  const existing = presenceStore.get(userId);

  const updated: PresenceInfo = {
    status,
    customMessage: options?.customMessage ?? existing?.customMessage ?? null,
    lastChanged: new Date().toISOString(),
    autoDetected: options?.autoDetected ?? false,
    userId,
    userName: existing?.userName ?? userId,
    extension: existing?.extension ?? null,
    inCall: existing?.inCall ?? false,
    callControlId: existing?.callControlId ?? null,
  };

  presenceStore.set(userId, updated);

  logger.info('[Presence] Status changed', {
    userId,
    status,
    autoDetected: updated.autoDetected,
    customMessage: updated.customMessage,
  });

  return updated;
}

/**
 * Initialize presence for a user (on login / softphone connect).
 */
export function initPresence(
  userId: string,
  userName: string,
  extension: string | null
): PresenceInfo {
  const existing = presenceStore.get(userId);
  if (existing) {
    // Update name/extension but keep status
    existing.userName = userName;
    existing.extension = extension;
    presenceStore.set(userId, existing);
    return existing;
  }

  const info: PresenceInfo = {
    status: 'available',
    customMessage: null,
    lastChanged: new Date().toISOString(),
    autoDetected: false,
    userId,
    userName,
    extension,
    inCall: false,
    callControlId: null,
  };

  presenceStore.set(userId, info);
  return info;
}

/**
 * Remove presence on disconnect / logout.
 */
export function removePresence(userId: string): void {
  presenceStore.delete(userId);
}

/**
 * Get presence for a single user.
 */
export function getPresence(userId: string): PresenceInfo | undefined {
  return presenceStore.get(userId);
}

/**
 * Get all online presences (team view).
 */
export function getTeamPresence(): PresenceInfo[] {
  const result: PresenceInfo[] = [];
  for (const [, info] of presenceStore) {
    result.push(info);
  }
  return result.sort((a, b) => {
    // Sort: available first, then busy, then others
    const order: Record<PresenceStatus, number> = {
      available: 0, busy: 1, break: 2, away: 3, dnd: 4, offline: 5,
    };
    return (order[a.status] ?? 5) - (order[b.status] ?? 5);
  });
}

/**
 * Get count of agents by status.
 */
export function getPresenceSummary(): Record<PresenceStatus, number> {
  const summary: Record<PresenceStatus, number> = {
    available: 0, busy: 0, dnd: 0, away: 0, break: 0, offline: 0,
  };
  for (const [, info] of presenceStore) {
    summary[info.status] = (summary[info.status] || 0) + 1;
  }
  return summary;
}

// ---------------------------------------------------------------------------
// Auto-detection
// ---------------------------------------------------------------------------

/**
 * Called when a call starts — auto-set busy.
 */
export function onCallStarted(userId: string, callControlId: string): void {
  const info = presenceStore.get(userId);
  if (!info) return;

  info.inCall = true;
  info.callControlId = callControlId;

  // Only auto-set to busy if currently available or break
  if (info.status === 'available' || info.status === 'break') {
    info.status = 'busy';
    info.autoDetected = true;
    info.lastChanged = new Date().toISOString();
  }

  presenceStore.set(userId, info);
}

/**
 * Called when a call ends — auto-restore previous status.
 */
export function onCallEnded(userId: string): void {
  const info = presenceStore.get(userId);
  if (!info) return;

  info.inCall = false;
  info.callControlId = null;

  // Auto-restore to available if status was auto-detected as busy
  if (info.status === 'busy' && info.autoDetected) {
    info.status = 'available';
    info.autoDetected = false;
    info.lastChanged = new Date().toISOString();
  }

  presenceStore.set(userId, info);
}

// ---------------------------------------------------------------------------
// DND
// ---------------------------------------------------------------------------

/**
 * Toggle Do Not Disturb mode.
 */
export function toggleDnd(userId: string): PresenceStatus {
  const info = presenceStore.get(userId);
  if (!info) return 'offline';

  if (info.status === 'dnd') {
    info.status = 'available';
  } else {
    info.status = 'dnd';
  }

  info.autoDetected = false;
  info.lastChanged = new Date().toISOString();
  presenceStore.set(userId, info);

  return info.status;
}

/**
 * Check if a caller should ring through DND exceptions.
 */
export function isDndException(userId: string, callerNumber: string): boolean {
  const config = configStore.get(userId);
  if (!config) return false;
  return config.dndExceptions.some(
    (exc) => callerNumber.includes(exc) || exc.includes(callerNumber)
  );
}

// ---------------------------------------------------------------------------
// Custom status message
// ---------------------------------------------------------------------------

/**
 * Set a custom status message (e.g., "In a meeting until 3pm").
 */
export function setCustomMessage(userId: string, message: string | null): void {
  const info = presenceStore.get(userId);
  if (!info) return;

  info.customMessage = message;
  presenceStore.set(userId, info);
}

// ---------------------------------------------------------------------------
// Schedule
// ---------------------------------------------------------------------------

/**
 * Save presence schedule configuration.
 */
export function setPresenceConfig(config: PresenceConfig): void {
  configStore.set(config.userId, config);
}

/**
 * Get presence config for a user.
 */
export function getPresenceConfig(userId: string): PresenceConfig | undefined {
  return configStore.get(userId);
}

/**
 * Evaluate schedule rules and return the appropriate status.
 * Called periodically or on login.
 */
export function evaluateSchedule(userId: string): PresenceStatus | null {
  const config = configStore.get(userId);
  if (!config || config.schedule.length === 0) return null;

  const now = new Date();
  const dayOfWeek = now.getDay();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  for (const rule of config.schedule) {
    if (!rule.dayOfWeek.includes(dayOfWeek)) continue;

    const startMinutes = rule.startHour * 60 + rule.startMinute;
    const endMinutes = rule.endHour * 60 + rule.endMinute;

    if (currentMinutes >= startMinutes && currentMinutes < endMinutes) {
      return rule.status;
    }
  }

  return null;
}

/**
 * Apply schedule-based presence if applicable.
 */
export function applySchedulePresence(userId: string): void {
  const info = presenceStore.get(userId);
  if (!info) return;

  // Don't override manual DND or in-call busy
  if (info.status === 'dnd' && !info.autoDetected) return;
  if (info.inCall) return;

  const scheduledStatus = evaluateSchedule(userId);
  if (scheduledStatus && scheduledStatus !== info.status) {
    info.status = scheduledStatus;
    info.autoDetected = true;
    info.lastChanged = new Date().toISOString();
    presenceStore.set(userId, info);

    logger.info('[Presence] Schedule-based status applied', {
      userId,
      status: scheduledStatus,
    });
  }
}
