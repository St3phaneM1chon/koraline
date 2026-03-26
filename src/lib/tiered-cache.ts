/**
 * #56 Redis Tiered Caching - L1 in-memory + L2 Redis + L3 DB
 */

import { getRedisClient, isRedisAvailable } from '@/lib/redis';
import { logger } from '@/lib/logger';

const L1 = new Map<string, { data: unknown; exp: number }>();
const L1_TTL = 60000;
const L1_MAX = 500;

function l1Get<T>(k: string): T | null {
  const e = L1.get(k);
  if (e && e.exp > Date.now()) return e.data as T;
  L1.delete(k);
  return null;
}

function l1Set<T>(k: string, d: T, ttl: number = L1_TTL): void {
  if (L1.size >= L1_MAX) {
    const oldest = [...L1.entries()].sort((a, b) => a[1].exp - b[1].exp)[0];
    if (oldest) L1.delete(oldest[0]);
  }
  L1.set(k, { data: d, exp: Date.now() + ttl });
}

async function l2Get<T>(k: string): Promise<T | null> {
  if (!isRedisAvailable()) return null;
  try {
    const redis = await getRedisClient();
    const raw = await redis?.get(`tiered:${k}`);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

async function l2Set<T>(k: string, d: T, ttl: number = 300): Promise<void> {
  if (!isRedisAvailable()) return;
  try {
    const redis = await getRedisClient();
    await redis?.set(`tiered:${k}`, JSON.stringify(d), 'EX', ttl);
  } catch { /* non-critical */ }
}

export interface TieredCacheOptions {
  l1TtlMs?: number;
  l2TtlS?: number;
}

export async function tieredCacheGetOrSet<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: TieredCacheOptions = {}
): Promise<T> {
  const { l1TtlMs = L1_TTL, l2TtlS = 300 } = options;

  const cached1 = l1Get<T>(key);
  if (cached1 !== null) return cached1;

  const cached2 = await l2Get<T>(key);
  if (cached2 !== null) {
    l1Set(key, cached2, l1TtlMs);
    return cached2;
  }

  const data = await fetcher();
  l1Set(key, data, l1TtlMs);
  await l2Set(key, data, l2TtlS).catch(() => {});
  return data;
}

export async function tieredCacheInvalidate(key: string): Promise<void> {
  L1.delete(key);
  try {
    const redis = await getRedisClient();
    if (redis) await redis.del(`tiered:${key}`);
  } catch { /* non-critical */ }
  logger.debug(`[tiered-cache] Invalidated: ${key}`);
}

export function getTieredCacheStats(): { l1Size: number; l1Valid: number } {
  const now = Date.now();
  return { l1Size: L1.size, l1Valid: [...L1.values()].filter(e => e.exp > now).length };
}