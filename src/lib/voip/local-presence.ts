/**
 * VoIP Local Presence — Area code matching for outbound caller ID
 *
 * Wraps the CRM local-presence module for use in VoIP contexts.
 * Provides local number selection for outbound calls based on the
 * destination's area code, increasing answer rates.
 *
 * Re-exports core functions from `@/lib/crm/local-presence` and adds
 * VoIP-specific utilities like bulk matching and pool statistics.
 *
 * Usage:
 *   import { matchLocalCallerId, getPoolStats } from '@/lib/voip/local-presence';
 *   const callerId = await matchLocalCallerId('+15145551234');
 */

import { logger } from '@/lib/logger';
import {
  getLocalCallerId,
  getCallerIdPool,
  addCallerIdToPool,
} from '@/lib/crm/local-presence';

// Re-export core CRM functions for VoIP consumers
export { getLocalCallerId, getCallerIdPool, addCallerIdToPool };

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LocalPresenceMatch {
  destinationNumber: string;
  matchedCallerId: string | null;
  matchType: 'exact' | 'region' | 'none';
  areaCode: string | null;
}

export interface PoolStats {
  totalNumbers: number;
  areaCodes: string[];
  regions: string[];
}

// ---------------------------------------------------------------------------
// VoIP-specific helpers
// ---------------------------------------------------------------------------

/**
 * Match a local caller ID for an outbound call destination.
 * Returns structured match info including match type.
 */
export async function matchLocalCallerId(
  destinationNumber: string
): Promise<LocalPresenceMatch> {
  const areaCode = extractAreaCode(destinationNumber);
  const matched = await getLocalCallerId(destinationNumber);

  let matchType: LocalPresenceMatch['matchType'] = 'none';
  if (matched && areaCode) {
    // Check if the matched number has the exact same area code
    const matchedAreaCode = extractAreaCode(matched);
    matchType = matchedAreaCode === areaCode ? 'exact' : 'region';
  }

  logger.debug('[VoIP LocalPresence] Match result', {
    destinationNumber,
    matchedCallerId: matched,
    matchType,
    areaCode,
  });

  return {
    destinationNumber,
    matchedCallerId: matched,
    matchType,
    areaCode,
  };
}

/**
 * Match local caller IDs for multiple destinations in batch.
 */
export async function matchLocalCallerIdBatch(
  destinationNumbers: string[]
): Promise<LocalPresenceMatch[]> {
  const results: LocalPresenceMatch[] = [];
  for (const number of destinationNumbers) {
    results.push(await matchLocalCallerId(number));
  }
  return results;
}

/**
 * Get pool statistics (total numbers, unique area codes, regions).
 */
export async function getPoolStats(): Promise<PoolStats> {
  const pool = await getCallerIdPool();
  const areaCodes = [...new Set(pool.map((e) => e.areaCode))];
  const regions = [...new Set(pool.map((e) => e.region))];

  return {
    totalNumbers: pool.length,
    areaCodes,
    regions,
  };
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function extractAreaCode(phone: string): string | null {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return digits.substring(0, 3);
  if (digits.length === 11 && digits.startsWith('1')) return digits.substring(1, 4);
  return null;
}
