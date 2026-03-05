/**
 * Multi-Line Support - Manage 2-6 simultaneous calls per agent
 * Enables call waiting, line switching, and concurrent call handling.
 */

import { logger } from '@/lib/logger';
import { VoipStateMap } from './voip-state';

// ─── Types ──────────────────────────────────────────────────────────────────

export type LineStatus = 'idle' | 'ringing' | 'active' | 'held' | 'wrap-up';

export interface CallLine {
  /** Line number (1-6) */
  lineNumber: number;
  /** Status of this line */
  status: LineStatus;
  /** Telnyx call control ID */
  callControlId?: string;
  /** Remote party info */
  remoteNumber?: string;
  remoteName?: string;
  /** Call direction */
  direction?: 'inbound' | 'outbound';
  /** Call start time */
  startedAt?: Date;
  /** Duration in seconds (live-updating) */
  duration: number;
  /** Is this line muted */
  isMuted: boolean;
  /** Is this the currently focused line */
  isFocused: boolean;
}

export interface MultiLineState {
  userId: string;
  maxLines: number;
  lines: CallLine[];
  /** Currently focused/active line number */
  focusedLine: number;
  /** Total active calls across all lines */
  activeCallCount: number;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const MAX_LINES = 6;
const DEFAULT_MAX_LINES = 4;

// ─── State Management ───────────────────────────────────────────────────────

const lineStates = new VoipStateMap<MultiLineState>('voip:multiline:');

// ─── Functions ──────────────────────────────────────────────────────────────

/**
 * Initialize multi-line state for a user.
 */
export function initializeLines(
  userId: string,
  maxLines: number = DEFAULT_MAX_LINES
): MultiLineState {
  const effectiveMax = Math.min(maxLines, MAX_LINES);

  const lines: CallLine[] = [];
  for (let i = 1; i <= effectiveMax; i++) {
    lines.push(createEmptyLine(i));
  }

  const state: MultiLineState = {
    userId,
    maxLines: effectiveMax,
    lines,
    focusedLine: 1,
    activeCallCount: 0,
  };

  lineStates.set(userId, state);
  return state;
}

/**
 * Assign an incoming/outgoing call to the next available line.
 * Returns the line number assigned, or null if all lines busy.
 */
export function assignCallToLine(
  userId: string,
  callControlId: string,
  info: {
    remoteNumber?: string;
    remoteName?: string;
    direction: 'inbound' | 'outbound';
    status?: LineStatus;
  }
): number | null {
  const state = getOrInitState(userId);

  // Find first idle line
  const idleLine = state.lines.find(l => l.status === 'idle');
  if (!idleLine) {
    logger.warn('No available lines for call', {
      userId,
      activeCallCount: state.activeCallCount,
    });
    return null;
  }

  // Auto-hold current active line if there is one
  const activeLine = state.lines.find(l => l.status === 'active' && l.isFocused);
  if (activeLine && info.status === 'active') {
    activeLine.status = 'held';
    activeLine.isFocused = false;
  }

  // Assign call to line
  idleLine.status = info.status ?? 'ringing';
  idleLine.callControlId = callControlId;
  idleLine.remoteNumber = info.remoteNumber;
  idleLine.remoteName = info.remoteName;
  idleLine.direction = info.direction;
  idleLine.startedAt = new Date();
  idleLine.duration = 0;
  idleLine.isMuted = false;

  // Focus new line if it's active
  if (idleLine.status === 'active' || idleLine.status === 'ringing') {
    idleLine.isFocused = true;
    state.focusedLine = idleLine.lineNumber;
  }

  updateActiveCount(state);
  lineStates.set(userId, state);

  logger.info('Call assigned to line', {
    userId,
    line: idleLine.lineNumber,
    callControlId,
    direction: info.direction,
  });

  return idleLine.lineNumber;
}

/**
 * Update a line's status (e.g., ringing → active, active → held).
 */
export function updateLineStatus(
  userId: string,
  callControlId: string,
  status: LineStatus
): void {
  const state = getOrInitState(userId);
  const line = state.lines.find(l => l.callControlId === callControlId);
  if (!line) return;

  line.status = status;

  if (status === 'idle') {
    // Clear line on hangup
    Object.assign(line, createEmptyLine(line.lineNumber));
  }

  updateActiveCount(state);
  lineStates.set(userId, state);
}

/**
 * Switch focus to a different line.
 * Holds the current active line and resumes the target line.
 */
export async function switchLine(
  userId: string,
  targetLineNumber: number
): Promise<{ success: boolean; error?: string }> {
  const state = getOrInitState(userId);

  const targetLine = state.lines.find(l => l.lineNumber === targetLineNumber);
  if (!targetLine || targetLine.status === 'idle') {
    return { success: false, error: `Line ${targetLineNumber} has no active call` };
  }

  const currentFocused = state.lines.find(l => l.isFocused && l.status === 'active');

  try {
    const telnyx = await import('@/lib/telnyx');

    // Hold current active call
    if (currentFocused && currentFocused.callControlId && currentFocused.lineNumber !== targetLineNumber) {
      await telnyx.telnyxFetch(`/calls/${currentFocused.callControlId}/actions/hold`, { method: 'POST', body: {} });
      currentFocused.status = 'held';
      currentFocused.isFocused = false;
    }

    // Resume target call (if held)
    if (targetLine.status === 'held' && targetLine.callControlId) {
      await telnyx.telnyxFetch(`/calls/${targetLine.callControlId}/actions/unhold`, { method: 'POST', body: {} });
      targetLine.status = 'active';
    }

    // Update focus
    state.lines.forEach(l => { l.isFocused = false; });
    targetLine.isFocused = true;
    state.focusedLine = targetLineNumber;

    lineStates.set(userId, state);

    logger.info('Line switched', {
      userId,
      from: currentFocused?.lineNumber,
      to: targetLineNumber,
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Switch failed',
    };
  }
}

/**
 * Merge two lines into a conference call.
 */
export async function mergeLines(
  userId: string,
  line1: number,
  line2: number
): Promise<{ success: boolean; conferenceId?: string; error?: string }> {
  const state = getOrInitState(userId);
  const l1 = state.lines.find(l => l.lineNumber === line1);
  const l2 = state.lines.find(l => l.lineNumber === line2);

  if (!l1?.callControlId || !l2?.callControlId) {
    return { success: false, error: 'Both lines must have active calls' };
  }

  try {
    // Use conference-call module to merge
    const { createConference, addParticipant } = await import('@/lib/crm/conference-call');
    const conf = await createConference(l1.callControlId, `merge-${Date.now()}`);

    if (conf.conferenceId) {
      await addParticipant(conf.conferenceId, l2.callControlId);

      // Free up line 2
      Object.assign(l2, createEmptyLine(l2.lineNumber));
      l1.remoteName = `Conference (${l1.remoteName ?? 'Unknown'}, ${l2.remoteName ?? 'Unknown'})`;

      updateActiveCount(state);
      lineStates.set(userId, state);

      return { success: true, conferenceId: conf.conferenceId };
    }

    return { success: false, error: 'Failed to create conference' };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Merge failed',
    };
  }
}

/**
 * Get the multi-line state for a user.
 */
export function getLineState(userId: string): MultiLineState {
  return getOrInitState(userId);
}

/**
 * Get the currently focused/active line.
 */
export function getFocusedLine(userId: string): CallLine | null {
  const state = lineStates.get(userId);
  if (!state) return null;
  return state.lines.find(l => l.isFocused) ?? null;
}

/**
 * Find which line a call is on.
 */
export function findLineByCallId(userId: string, callControlId: string): CallLine | null {
  const state = lineStates.get(userId);
  if (!state) return null;
  return state.lines.find(l => l.callControlId === callControlId) ?? null;
}

/**
 * Check if user can accept another call.
 */
export function hasAvailableLine(userId: string): boolean {
  const state = lineStates.get(userId);
  if (!state) return true; // Not initialized = can accept
  return state.lines.some(l => l.status === 'idle');
}

/**
 * Cleanup all lines for a user.
 */
export function cleanupLines(userId: string): void {
  lineStates.delete(userId);
}

// ─── Internal Helpers ───────────────────────────────────────────────────────

function createEmptyLine(lineNumber: number): CallLine {
  return {
    lineNumber,
    status: 'idle',
    duration: 0,
    isMuted: false,
    isFocused: lineNumber === 1,
  };
}

function getOrInitState(userId: string): MultiLineState {
  const existing = lineStates.get(userId);
  if (existing) return existing;
  return initializeLines(userId);
}

function updateActiveCount(state: MultiLineState): void {
  state.activeCallCount = state.lines.filter(
    l => l.status !== 'idle' && l.status !== 'wrap-up'
  ).length;
}
