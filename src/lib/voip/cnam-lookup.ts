/**
 * CNAM Lookup - Caller Name + Spam Detection via Telnyx Number Lookup
 * Enriches incoming caller ID with name, carrier, line type, and spam score.
 */

import { logger } from '@/lib/logger';
import { VoipStateMap } from './voip-state';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface CnamResult {
  phoneNumber: string;
  callerName?: string;
  carrier?: string;
  lineType?: 'landline' | 'mobile' | 'voip' | 'toll_free' | 'unknown';
  city?: string;
  state?: string;
  country?: string;
  /** Spam score 0-100 (0 = legit, 100 = definitely spam) */
  spamScore: number;
  spamLabel?: 'clean' | 'low_risk' | 'medium_risk' | 'high_risk' | 'spam';
  /** Whether number is on internal blocklist */
  isBlocked: boolean;
  /** Cache timestamp */
  cachedAt: Date;
}

// ─── Cache ──────────────────────────────────────────────────────────────────

// Cache CNAM results for 24 hours to reduce API calls
const cnamCache = new VoipStateMap<CnamResult>('voip:cnam:');

// Internal spam/block list
const spamNumbers = new Set<string>();

// ─── Functions ──────────────────────────────────────────────────────────────

/**
 * Look up CNAM information for a phone number.
 * Uses Telnyx Number Lookup API with caching.
 */
export async function lookupCnam(phoneNumber: string): Promise<CnamResult> {
  // Normalize to E.164
  const normalized = normalizeNumber(phoneNumber);

  // Check cache first
  const cached = cnamCache.get(normalized);
  if (cached) {
    return cached;
  }

  // Check internal blocklist
  const isBlocked = spamNumbers.has(normalized);

  try {
    const telnyx = await import('@/lib/telnyx');

    // Telnyx Number Lookup API
    const result = await telnyx.telnyxFetch<{
      caller_name?: { caller_name?: string };
      carrier?: { name?: string; type?: string };
      portability?: { city?: string; state?: string; ported_status?: string };
      country_code?: string;
    }>(`/number_lookup/${encodeURIComponent(normalized)}`, {
      method: 'GET',
    });

    const data = result.data;

    const cnamResult: CnamResult = {
      phoneNumber: normalized,
      callerName: data?.caller_name?.caller_name,
      carrier: data?.carrier?.name,
      lineType: mapLineType(data?.carrier?.type),
      city: data?.portability?.city,
      state: data?.portability?.state,
      country: data?.country_code,
      spamScore: calculateSpamScore(data),
      spamLabel: getSpamLabel(calculateSpamScore(data)),
      isBlocked,
      cachedAt: new Date(),
    };

    // Cache the result
    cnamCache.set(normalized, cnamResult);

    logger.info('[CNAM] Lookup successful', {
      phoneNumber: normalized,
      callerName: cnamResult.callerName,
      spamScore: cnamResult.spamScore,
    });

    return cnamResult;
  } catch (error) {
    logger.warn('[CNAM] Lookup failed, returning basic result', {
      phoneNumber: normalized,
      error: error instanceof Error ? error.message : String(error),
    });

    // Return basic result on API failure
    const basicResult: CnamResult = {
      phoneNumber: normalized,
      spamScore: 0,
      isBlocked,
      cachedAt: new Date(),
    };

    return basicResult;
  }
}

/**
 * Check if a number is likely spam (quick check without full lookup).
 */
export function isLikelySpam(phoneNumber: string): boolean {
  const normalized = normalizeNumber(phoneNumber);
  if (spamNumbers.has(normalized)) return true;

  const cached = cnamCache.get(normalized);
  if (cached) {
    return cached.spamScore >= 70;
  }

  return false;
}

/**
 * Add a number to the internal blocklist.
 */
export function blockNumber(phoneNumber: string): void {
  const normalized = normalizeNumber(phoneNumber);
  spamNumbers.add(normalized);

  // Update cache if exists
  const cached = cnamCache.get(normalized);
  if (cached) {
    cached.isBlocked = true;
    cached.spamScore = 100;
    cached.spamLabel = 'spam';
    cnamCache.set(normalized, cached);
  }

  logger.info('[CNAM] Number blocked', { phoneNumber: normalized });
}

/**
 * Remove a number from the internal blocklist.
 */
export function unblockNumber(phoneNumber: string): void {
  const normalized = normalizeNumber(phoneNumber);
  spamNumbers.delete(normalized);

  const cached = cnamCache.get(normalized);
  if (cached) {
    cached.isBlocked = false;
    cnamCache.set(normalized, cached);
  }
}

/**
 * Get all blocked numbers.
 */
export function getBlockedNumbers(): string[] {
  return Array.from(spamNumbers);
}

/**
 * Get cached CNAM result without triggering a lookup.
 */
export function getCachedCnam(phoneNumber: string): CnamResult | undefined {
  return cnamCache.get(normalizeNumber(phoneNumber));
}

// ─── Internal Helpers ───────────────────────────────────────────────────────

function normalizeNumber(phone: string): string {
  // Remove non-digits except leading +
  const cleaned = phone.replace(/[^+\d]/g, '');
  // Add +1 for North American numbers without country code
  if (cleaned.length === 10) return `+1${cleaned}`;
  if (cleaned.length === 11 && cleaned.startsWith('1')) return `+${cleaned}`;
  if (!cleaned.startsWith('+')) return `+${cleaned}`;
  return cleaned;
}

function mapLineType(type?: string): CnamResult['lineType'] {
  switch (type?.toLowerCase()) {
    case 'landline': return 'landline';
    case 'mobile': case 'wireless': return 'mobile';
    case 'voip': return 'voip';
    case 'tollfree': case 'toll_free': return 'toll_free';
    default: return 'unknown';
  }
}

function calculateSpamScore(data: Record<string, unknown> | null | undefined): number {
  if (!data) return 0;

  let score = 0;

  // VoIP numbers are slightly more suspicious
  const carrier = data.carrier as { type?: string } | undefined;
  if (carrier?.type === 'voip') score += 15;

  // No CNAM name registered = slightly suspicious
  const callerName = data.caller_name as { caller_name?: string } | undefined;
  if (!callerName?.caller_name) score += 10;

  // Recently ported numbers
  const portability = data.portability as { ported_status?: string } | undefined;
  if (portability?.ported_status === 'Y') score += 5;

  return Math.min(100, score);
}

function getSpamLabel(score: number): CnamResult['spamLabel'] {
  if (score >= 70) return 'spam';
  if (score >= 50) return 'high_risk';
  if (score >= 30) return 'medium_risk';
  if (score >= 10) return 'low_risk';
  return 'clean';
}
