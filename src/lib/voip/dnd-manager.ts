/**
 * Do Not Disturb (DND) Manager
 * Supports: DND all, DND with exceptions (whitelist), scheduled DND,
 * auto-DND during meetings, custom DND message.
 */

import { logger } from '@/lib/logger';
import { VoipStateMap } from './voip-state';

// ─── Types ──────────────────────────────────────────────────────────────────

export type DndMode = 'off' | 'all' | 'custom';

export interface DndSchedule {
  enabled: boolean;
  /** Days of week: 0=Sun, 1=Mon, ..., 6=Sat */
  days: number[];
  /** Start time HH:MM (24h format) */
  startTime: string;
  /** End time HH:MM (24h format) */
  endTime: string;
  /** Timezone (IANA) */
  timezone: string;
}

export interface DndConfig {
  mode: DndMode;
  /** Custom message to callers */
  message?: string;
  /** Whitelist: these numbers/extensions always ring through */
  exceptions: string[];
  /** Scheduled DND periods */
  schedules: DndSchedule[];
  /** Auto-DND during calendar events */
  autoCalendarDnd: boolean;
  /** Forward calls when DND is active */
  forwardTo?: string;
  /** Play voicemail greeting when DND */
  goToVoicemail: boolean;
}

export interface DndState {
  userId: string;
  extensionId: string;
  config: DndConfig;
  /** Whether DND is currently active (considering mode + schedule) */
  isActive: boolean;
  /** Reason DND is active */
  activeReason?: 'manual' | 'schedule' | 'calendar';
  activatedAt?: Date;
}

// ─── Default Config ─────────────────────────────────────────────────────────

const DEFAULT_CONFIG: DndConfig = {
  mode: 'off',
  exceptions: [],
  schedules: [],
  autoCalendarDnd: false,
  goToVoicemail: true,
};

// ─── State Management ───────────────────────────────────────────────────────

const dndStates = new VoipStateMap<DndState>('voip:dnd:');
const scheduleTimers = new Map<string, ReturnType<typeof setInterval>>();

// ─── Functions ──────────────────────────────────────────────────────────────

/**
 * Set DND configuration for a user.
 */
export async function setDndConfig(
  userId: string,
  config: Partial<DndConfig>
): Promise<DndState> {
  const { default: prisma } = await import('@/lib/db');

  const extension = await prisma.sipExtension.findFirst({
    where: { userId },
    select: { id: true, extension: true },
  });

  if (!extension) {
    throw new Error('No SIP extension found for user');
  }

  const existing = dndStates.get(userId);
  const newConfig: DndConfig = {
    ...(existing?.config ?? DEFAULT_CONFIG),
    ...config,
  };

  const isActive = computeDndActive(newConfig);
  const state: DndState = {
    userId,
    extensionId: extension.id,
    config: newConfig,
    isActive,
    activeReason: isActive
      ? newConfig.mode === 'all' || newConfig.mode === 'custom' ? 'manual' : 'schedule'
      : undefined,
    activatedAt: isActive ? new Date() : undefined,
  };

  dndStates.set(userId, state);

  // Update SIP extension status
  if (isActive) {
    await prisma.sipExtension.update({
      where: { id: extension.id },
      data: { status: 'DND' },
    });
  } else {
    await prisma.sipExtension.update({
      where: { id: extension.id },
      data: { status: 'ONLINE' },
    });
  }

  // Setup/clear schedule timers
  setupScheduleCheck(userId, newConfig);

  logger.info('DND config updated', {
    userId,
    mode: newConfig.mode,
    isActive,
  });

  return state;
}

/**
 * Toggle DND on/off quickly.
 */
export async function toggleDnd(userId: string): Promise<DndState> {
  const existing = dndStates.get(userId);
  const currentMode = existing?.config.mode ?? 'off';
  const newMode = currentMode === 'off' ? 'all' : 'off';

  return setDndConfig(userId, { mode: newMode });
}

/**
 * Check if a call to a user should be blocked by DND.
 * Returns routing info if DND is active.
 */
export function checkDnd(
  targetUserId: string,
  callerNumber?: string
): {
  blocked: boolean;
  reason?: string;
  forwardTo?: string;
  goToVoicemail: boolean;
  message?: string;
} {
  const state = dndStates.get(targetUserId);

  if (!state || !state.isActive) {
    return { blocked: false, goToVoicemail: false };
  }

  // Check whitelist exceptions
  if (callerNumber && state.config.exceptions.includes(callerNumber)) {
    return { blocked: false, goToVoicemail: false };
  }

  return {
    blocked: true,
    reason: state.activeReason ?? 'dnd',
    forwardTo: state.config.forwardTo,
    goToVoicemail: state.config.goToVoicemail,
    message: state.config.message,
  };
}

/**
 * Get DND state for a user.
 */
export function getDndState(userId: string): DndState | undefined {
  const state = dndStates.get(userId);
  if (state) {
    // Recompute active state (schedule may have changed)
    state.isActive = computeDndActive(state.config);
  }
  return state;
}

/**
 * Add a number to DND exceptions (whitelist).
 */
export async function addException(userId: string, number: string): Promise<void> {
  const state = dndStates.get(userId);
  if (!state) return;

  if (!state.config.exceptions.includes(number)) {
    state.config.exceptions.push(number);
    dndStates.set(userId, state);
  }
}

/**
 * Remove a number from DND exceptions.
 */
export async function removeException(userId: string, number: string): Promise<void> {
  const state = dndStates.get(userId);
  if (!state) return;

  state.config.exceptions = state.config.exceptions.filter(e => e !== number);
  dndStates.set(userId, state);
}

/**
 * Add a DND schedule.
 */
export async function addSchedule(
  userId: string,
  schedule: DndSchedule
): Promise<DndState> {
  const state = dndStates.get(userId);
  const config = state?.config ?? { ...DEFAULT_CONFIG };

  config.schedules.push(schedule);
  return setDndConfig(userId, config);
}

// ─── Internal Helpers ───────────────────────────────────────────────────────

/**
 * Compute if DND should currently be active based on mode + schedules.
 */
function computeDndActive(config: DndConfig): boolean {
  if (config.mode === 'off') {
    // Check if any schedule is currently active
    return config.schedules.some(s => s.enabled && isWithinSchedule(s));
  }
  return config.mode === 'all' || config.mode === 'custom';
}

/**
 * Check if current time is within a DND schedule.
 */
function isWithinSchedule(schedule: DndSchedule): boolean {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: schedule.timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    weekday: 'short',
  });

  const parts = formatter.formatToParts(now);
  const hour = parseInt(parts.find(p => p.type === 'hour')?.value ?? '0');
  const minute = parseInt(parts.find(p => p.type === 'minute')?.value ?? '0');
  const day = now.getDay(); // 0=Sun

  // Check day of week
  if (!schedule.days.includes(day)) return false;

  // Parse start/end times
  const [startH, startM] = schedule.startTime.split(':').map(Number);
  const [endH, endM] = schedule.endTime.split(':').map(Number);

  const currentMinutes = hour * 60 + minute;
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  // Handle overnight schedules
  if (startMinutes <= endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  } else {
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }
}

/**
 * Setup periodic schedule check for a user's DND.
 */
function setupScheduleCheck(userId: string, config: DndConfig): void {
  // Clear existing timer
  const existing = scheduleTimers.get(userId);
  if (existing) clearInterval(existing);

  // Only set timer if there are enabled schedules
  if (config.schedules.some(s => s.enabled)) {
    const timer = setInterval(() => {
      const state = dndStates.get(userId);
      if (!state) return;

      const shouldBeActive = computeDndActive(state.config);
      if (shouldBeActive !== state.isActive) {
        state.isActive = shouldBeActive;
        state.activeReason = shouldBeActive ? 'schedule' : undefined;
        state.activatedAt = shouldBeActive ? new Date() : undefined;
        dndStates.set(userId, state);

        logger.info('DND schedule triggered', {
          userId,
          isActive: shouldBeActive,
        });
      }
    }, 60000); // Check every minute
    scheduleTimers.set(userId, timer);
  }
}

/**
 * Cleanup DND state for a user.
 */
export function cleanupDnd(userId: string): void {
  dndStates.delete(userId);
  const timer = scheduleTimers.get(userId);
  if (timer) {
    clearInterval(timer);
    scheduleTimers.delete(userId);
  }
}
