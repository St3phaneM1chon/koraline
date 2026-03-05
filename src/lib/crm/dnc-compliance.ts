/**
 * DNC / DNCL / TCPA / CASL COMPLIANCE ENGINE
 *
 * Complete compliance module for Canadian and US telemarketing:
 * - Internal DNC list management
 * - CRTC DNCL national list import & scrubbing
 * - TCPA Manual Touch Mode
 * - CASL consent tracking
 * - Timezone-aware calling hours (CRTC: 9h-21h30)
 * - Attempt rules (max retries, intervals)
 * - Recording consent announcements
 */

import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ComplianceCheckResult {
  canCall: boolean;
  reasons: string[];
  consentStatus?: 'express' | 'implied' | 'expired' | 'none';
  attemptInfo?: {
    attemptsToday: number;
    attemptsTotal: number;
    maxToday: number;
    maxTotal: number;
    lastAttemptAt?: Date;
    nextAllowedAt?: Date;
  };
}

export interface CallingHoursConfig {
  timezone: string;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  weekendAllowed: boolean;
  holidayDates?: string[]; // ISO date strings
}

// Default CRTC calling hours
const DEFAULT_CALLING_HOURS: CallingHoursConfig = {
  timezone: 'America/Toronto',
  startHour: 9,
  startMinute: 0,
  endHour: 21,
  endMinute: 30,
  weekendAllowed: false,
};

// ---------------------------------------------------------------------------
// DNC status check
// ---------------------------------------------------------------------------

/**
 * Check whether a phone number is blocked by the internal SmsOptOut list
 * or by any CrmLead record with a non-CALLABLE dncStatus.
 */
export async function checkDncStatus(
  phone: string,
): Promise<{ isBlocked: boolean; reason?: string }> {
  // 1. Check internal SmsOptOut table
  const optOut = await prisma.smsOptOut.findUnique({
    where: { phone },
  });

  if (optOut) {
    return {
      isBlocked: true,
      reason: optOut.reason ?? 'Phone is on the internal Do-Not-Call list',
    };
  }

  // 2. Check if any CrmLead with this phone has a non-CALLABLE dncStatus
  const blockedLead = await prisma.crmLead.findFirst({
    where: {
      phone,
      dncStatus: { not: 'CALLABLE' },
    },
    select: { id: true, dncStatus: true },
  });

  if (blockedLead) {
    return {
      isBlocked: true,
      reason: `Lead ${blockedLead.id} has dncStatus=${blockedLead.dncStatus}`,
    };
  }

  // 3. Check DNCL national list
  const dncl = await prisma.dnclEntry.findUnique({ where: { phoneNumber: normalizePhone(phone) } });
  if (dncl) {
    return {
      isBlocked: true,
      reason: 'Phone is on the National DNCL (CRTC)',
    };
  }

  return { isBlocked: false };
}

// ---------------------------------------------------------------------------
// Add to internal DNC
// ---------------------------------------------------------------------------

/**
 * Add a phone number to the internal SmsOptOut table.
 * Also updates any CrmLead with matching phone to dncStatus = INTERNAL_DNC.
 */
export async function addToInternalDnc(
  phone: string,
  reason?: string,
): Promise<void> {
  await prisma.smsOptOut.upsert({
    where: { phone },
    create: { phone, reason },
    update: { reason },
  });

  const result = await prisma.crmLead.updateMany({
    where: { phone },
    data: { dncStatus: 'INTERNAL_DNC' },
  });

  logger.info('Phone added to internal DNC', { phone, reason, leadsUpdated: result.count });
}

// ---------------------------------------------------------------------------
// DNCL National List Import
// ---------------------------------------------------------------------------

/**
 * Import phone numbers from a DNCL CSV file.
 * Expects an array of phone numbers (already parsed from CSV).
 */
export async function importDnclList(
  phoneNumbers: string[],
  source: string = 'CRTC DNCL import',
): Promise<{ imported: number; skipped: number; errors: number }> {
  let imported = 0;
  let skipped = 0;
  let errors = 0;

  // Process in batches of 500
  for (let i = 0; i < phoneNumbers.length; i += 500) {
    const batch = phoneNumbers.slice(i, i + 500);
    const normalized = batch.map(normalizePhone).filter(Boolean);

    try {
      const result = await prisma.dnclEntry.createMany({
        data: normalized.map(phone => ({
          phoneNumber: phone,
          source,
          addedAt: new Date(),
        })),
        skipDuplicates: true,
      });

      imported += result.count;
      skipped += normalized.length - result.count;
    } catch (err) {
      errors += batch.length;
      logger.error('DNCL import batch failed', { batchStart: i, error: String(err) });
    }
  }

  // Also update matching CrmLeads
  const allNormalized = phoneNumbers.map(normalizePhone).filter(Boolean);
  if (allNormalized.length > 0) {
    await prisma.crmLead.updateMany({
      where: { phone: { in: allNormalized }, dncStatus: 'CALLABLE' },
      data: { dncStatus: 'NATIONAL_DNC' },
    });
  }

  logger.info('DNCL import complete', { imported, skipped, errors, total: phoneNumbers.length });
  return { imported, skipped, errors };
}

// ---------------------------------------------------------------------------
// CRTC calling hours (enhanced)
// ---------------------------------------------------------------------------

/**
 * Check if the current time in the given timezone falls within calling hours.
 * Enhanced to support configurable hours, weekend/holiday blocking.
 */
export function isWithinCallingHours(
  timezone?: string,
  config?: Partial<CallingHoursConfig>,
): boolean {
  const cfg = { ...DEFAULT_CALLING_HOURS, ...config };
  const tz = timezone ?? cfg.timezone;

  try {
    const now = new Date();

    // Check day of week
    const dayFormatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      weekday: 'short',
    });
    const day = dayFormatter.format(now);
    const isWeekend = day === 'Sat' || day === 'Sun';
    if (isWeekend && !cfg.weekendAllowed) {
      return false;
    }

    // Check holidays
    if (cfg.holidayDates) {
      const dateFormatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: tz,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
      const todayStr = dateFormatter.format(now);
      if (cfg.holidayDates.includes(todayStr)) {
        return false;
      }
    }

    // Check time
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    });

    const parts = formatter.formatToParts(now);
    const hour = parseInt(parts.find((p) => p.type === 'hour')?.value ?? '0', 10);
    const minute = parseInt(parts.find((p) => p.type === 'minute')?.value ?? '0', 10);

    const timeInMinutes = hour * 60 + minute;
    const startMinutes = cfg.startHour * 60 + (cfg.startMinute || 0);
    const endMinutes = cfg.endHour * 60 + (cfg.endMinute || 0);

    return timeInMinutes >= startMinutes && timeInMinutes <= endMinutes;
  } catch (err) {
    logger.warn('isWithinCallingHours: invalid timezone, defaulting to false', {
      timezone: tz,
      error: err instanceof Error ? err.message : String(err),
    });
    return false;
  }
}

// ---------------------------------------------------------------------------
// Attempt Rules
// ---------------------------------------------------------------------------

/**
 * Check if we can attempt another call to this lead based on attempt rules.
 */
export async function checkAttemptRules(
  leadId: string,
  maxAttemptsPerDay: number = 3,
  maxAttemptsTotal: number = 10,
  minRetryIntervalMinutes: number = 60,
): Promise<{
  canAttempt: boolean;
  reason?: string;
  attemptsToday: number;
  attemptsTotal: number;
  lastAttemptAt?: Date;
  nextAllowedAt?: Date;
}> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Count attempts today
  const attemptsToday = await prisma.crmActivity.count({
    where: {
      leadId,
      type: 'CALL',
      createdAt: { gte: today, lt: tomorrow },
    },
  });

  // Count total attempts
  const attemptsTotal = await prisma.crmActivity.count({
    where: { leadId, type: 'CALL' },
  });

  // Get last attempt
  const lastAttempt = await prisma.crmActivity.findFirst({
    where: { leadId, type: 'CALL' },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true },
  });

  const lastAttemptAt = lastAttempt?.createdAt;
  let nextAllowedAt: Date | undefined;

  if (lastAttemptAt) {
    nextAllowedAt = new Date(lastAttemptAt.getTime() + minRetryIntervalMinutes * 60000);
  }

  // Check daily limit
  if (attemptsToday >= maxAttemptsPerDay) {
    return {
      canAttempt: false,
      reason: `Daily attempt limit reached (${attemptsToday}/${maxAttemptsPerDay})`,
      attemptsToday,
      attemptsTotal,
      lastAttemptAt,
      nextAllowedAt: tomorrow,
    };
  }

  // Check total limit
  if (attemptsTotal >= maxAttemptsTotal) {
    return {
      canAttempt: false,
      reason: `Total attempt limit reached (${attemptsTotal}/${maxAttemptsTotal})`,
      attemptsToday,
      attemptsTotal,
      lastAttemptAt,
    };
  }

  // Check retry interval
  if (nextAllowedAt && new Date() < nextAllowedAt) {
    return {
      canAttempt: false,
      reason: `Too soon since last attempt. Next allowed: ${nextAllowedAt.toISOString()}`,
      attemptsToday,
      attemptsTotal,
      lastAttemptAt,
      nextAllowedAt,
    };
  }

  return { canAttempt: true, attemptsToday, attemptsTotal, lastAttemptAt, nextAllowedAt };
}

// ---------------------------------------------------------------------------
// Consent tracking
// ---------------------------------------------------------------------------

/**
 * Check consent status for a phone number or email.
 */
export async function checkConsent(
  identifier: { phone?: string; email?: string },
  channel: 'PHONE' | 'EMAIL' | 'SMS' | 'ALL' = 'ALL',
): Promise<{ hasConsent: boolean; type?: string; grantedAt?: Date; expiresAt?: Date }> {
  const where: Record<string, unknown> = {
    revokedAt: null,
    OR: [{ channel }, { channel: 'ALL' }],
  };

  if (identifier.phone) where.phone = identifier.phone;
  else if (identifier.email) where.email = identifier.email;
  else return { hasConsent: false };

  const consent = await prisma.crmConsentRecord.findFirst({
    where: where as Prisma.CrmConsentRecordWhereInput,
    orderBy: { grantedAt: 'desc' },
  });

  if (!consent) return { hasConsent: false };

  // Check expiry
  if (consent.expiresAt && consent.expiresAt < new Date()) {
    return { hasConsent: false, type: consent.type, grantedAt: consent.grantedAt, expiresAt: consent.expiresAt };
  }

  return { hasConsent: true, type: consent.type, grantedAt: consent.grantedAt, expiresAt: consent.expiresAt || undefined };
}

/**
 * Record consent for a contact.
 */
export async function recordConsent(data: {
  phone?: string;
  email?: string;
  channel?: 'PHONE' | 'EMAIL' | 'SMS' | 'ALL';
  type: string;
  source: string;
  leadId?: string;
  userId?: string;
  expiresAt?: Date;
  notes?: string;
}): Promise<string> {
  const record = await prisma.crmConsentRecord.create({
    data: {
      phone: data.phone,
      email: data.email,
      channel: (data.channel as 'PHONE' | 'EMAIL' | 'SMS' | 'ALL') || 'ALL',
      type: data.type,
      source: data.source,
      leadId: data.leadId,
      userId: data.userId,
      expiresAt: data.expiresAt,
      notes: data.notes,
    },
  });

  logger.info('Consent recorded', { id: record.id, phone: data.phone, email: data.email, type: data.type });
  return record.id;
}

/**
 * Revoke consent for a contact.
 */
export async function revokeConsent(
  identifier: { phone?: string; email?: string },
  channel?: 'PHONE' | 'EMAIL' | 'SMS' | 'ALL',
): Promise<number> {
  const where: Record<string, unknown> = { revokedAt: null };
  if (identifier.phone) where.phone = identifier.phone;
  if (identifier.email) where.email = identifier.email;
  if (channel) where.channel = channel;

  const result = await prisma.crmConsentRecord.updateMany({
    where: where as Parameters<typeof prisma.crmConsentRecord.updateMany>[0]['where'],
    data: { revokedAt: new Date() },
  });

  logger.info('Consent revoked', { ...identifier, channel, count: result.count });
  return result.count;
}

// ---------------------------------------------------------------------------
// Full pre-call compliance check (enhanced)
// ---------------------------------------------------------------------------

/**
 * Comprehensive pre-call compliance check combining:
 * - DNC/DNCL check
 * - Calling hours check
 * - Attempt rules
 * - Consent verification
 */
export async function preCallComplianceCheck(
  phone: string,
  options?: {
    timezone?: string;
    leadId?: string;
    maxAttemptsPerDay?: number;
    maxAttemptsTotal?: number;
    minRetryIntervalMinutes?: number;
    callingHours?: Partial<CallingHoursConfig>;
    requireConsent?: boolean;
  },
): Promise<ComplianceCheckResult> {
  const reasons: string[] = [];
  let consentStatus: ComplianceCheckResult['consentStatus'] = 'none';
  let attemptInfo: ComplianceCheckResult['attemptInfo'];

  // 1. DNC check
  const dncResult = await checkDncStatus(phone);
  if (dncResult.isBlocked) {
    reasons.push(dncResult.reason ?? 'Phone is on a Do-Not-Call list');
  }

  // 2. Calling hours check
  if (!isWithinCallingHours(options?.timezone, options?.callingHours)) {
    const tz = options?.timezone ?? options?.callingHours?.timezone ?? 'America/Toronto';
    reasons.push(`Outside CRTC calling hours (09:00-21:30) in timezone ${tz}`);
  }

  // 3. Attempt rules (if leadId provided)
  if (options?.leadId) {
    const attempts = await checkAttemptRules(
      options.leadId,
      options.maxAttemptsPerDay,
      options.maxAttemptsTotal,
      options.minRetryIntervalMinutes,
    );
    attemptInfo = {
      attemptsToday: attempts.attemptsToday,
      attemptsTotal: attempts.attemptsTotal,
      maxToday: options.maxAttemptsPerDay || 3,
      maxTotal: options.maxAttemptsTotal || 10,
      lastAttemptAt: attempts.lastAttemptAt,
      nextAllowedAt: attempts.nextAllowedAt,
    };

    if (!attempts.canAttempt) {
      reasons.push(attempts.reason!);
    }
  }

  // 4. Consent check
  if (options?.requireConsent) {
    const consent = await checkConsent({ phone }, 'PHONE');
    if (consent.hasConsent) {
      consentStatus = consent.type as 'express' | 'implied';
    } else if (consent.expiresAt) {
      consentStatus = 'expired';
      reasons.push('Consent has expired');
    } else {
      consentStatus = 'none';
      reasons.push('No consent on record');
    }
  }

  const canCall = reasons.length === 0;

  if (!canCall) {
    logger.info('Pre-call compliance check failed', { phone, reasons });
  }

  return { canCall, reasons, consentStatus, attemptInfo };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  if (digits.startsWith('+')) return phone.replace(/\s/g, '');
  return `+${digits}`;
}

/**
 * Get calling rules from the database or return defaults.
 */
export async function getCallingRules(): Promise<CallingHoursConfig> {
  const rule = await prisma.callingRule.findFirst({
    where: { isActive: true },
    orderBy: { updatedAt: 'desc' },
  });

  if (!rule) return DEFAULT_CALLING_HOURS;

  return {
    timezone: rule.timezone,
    startHour: rule.startHour,
    startMinute: 0,
    endHour: rule.endHour,
    endMinute: rule.endMinute,
    weekendAllowed: rule.weekendAllowed,
  };
}

/**
 * Get compliance summary stats for dashboard.
 */
export async function getComplianceStats(): Promise<{
  internalDncCount: number;
  nationalDnclCount: number;
  consentRecords: number;
  activeConsents: number;
  revokedConsents: number;
  callingRules: number;
}> {
  const [internalDnc, nationalDncl, totalConsent, activeConsent, revokedConsent, rules] = await Promise.all([
    prisma.smsOptOut.count(),
    prisma.dnclEntry.count(),
    prisma.crmConsentRecord.count(),
    prisma.crmConsentRecord.count({ where: { revokedAt: null } }),
    prisma.crmConsentRecord.count({ where: { revokedAt: { not: null } } }),
    prisma.callingRule.count({ where: { isActive: true } }),
  ]);

  return {
    internalDncCount: internalDnc,
    nationalDnclCount: nationalDncl,
    consentRecords: totalConsent,
    activeConsents: activeConsent,
    revokedConsents: revokedConsent,
    callingRules: rules,
  };
}
