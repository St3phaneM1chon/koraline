/**
 * VoIP State — Redis-backed state management with in-memory fallback
 *
 * Drop-in replacement for Map<string, T> that syncs to Redis.
 * - Sync reads from in-memory (no await needed at call sites)
 * - Writes sync to Redis in background (fire-and-forget)
 * - On init, loads existing state from Redis (crash recovery)
 * - TTL 24h for automatic cleanup of stale entries
 */

import { getRedisClient } from '@/lib/redis';
import { logger } from '@/lib/logger';

const DEFAULT_TTL = 86400; // 24 hours

/** Custom JSON serializer that handles Map, Set, and non-serializable types */
function serialize(value: unknown): string {
  return JSON.stringify(value, (key, val) => {
    // Skip timer references (not serializable)
    if (key === 'wrapUpTimer') return undefined;
    if (typeof val === 'function') return undefined;
    if (val instanceof Map) return { __type: 'Map', entries: [...val.entries()] };
    if (val instanceof Set) return { __type: 'Set', values: [...val] };
    return val;
  });
}

/** Custom JSON deserializer that restores Map, Set, and Date objects */
function deserialize<T>(json: string): T {
  return JSON.parse(json, (_key, val) => {
    if (val && typeof val === 'object' && val.__type === 'Map') {
      return new Map(val.entries);
    }
    if (val && typeof val === 'object' && val.__type === 'Set') {
      return new Set(val.values);
    }
    // Revive ISO date strings back to Date objects
    if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(val)) {
      const d = new Date(val);
      if (!isNaN(d.getTime())) return d;
    }
    return val;
  });
}

/**
 * Redis-backed Map with sync in-memory access and async Redis persistence.
 *
 * Usage: replace `new Map<string, T>()` with `new VoipStateMap<T>('voip:prefix:')`.
 * All existing .get()/.set()/.delete()/.has() calls work unchanged.
 */
export class VoipStateMap<T> {
  private memory = new Map<string, T>();
  private prefix: string;
  private ttl: number;

  constructor(prefix: string, ttl = DEFAULT_TTL) {
    this.prefix = prefix;
    this.ttl = ttl;
    this.loadFromRedis();
  }

  private redisKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  /** Load existing state from Redis on startup (best-effort) */
  private loadFromRedis(): void {
    getRedisClient()
      .then(async (redis) => {
        if (!redis) return;
        try {
          const keys = await redis.keys(`${this.prefix}*`);
          for (const rKey of keys) {
            const val = await redis.get(rKey);
            if (val) {
              const localKey = rKey.slice(this.prefix.length);
              if (!this.memory.has(localKey)) {
                try {
                  this.memory.set(localKey, deserialize<T>(val));
                } catch {
                  // Skip corrupt entries
                }
              }
            }
          }
          if (keys.length > 0) {
            logger.debug(`[VoipState] Restored ${keys.length} entries from Redis (${this.prefix})`);
          }
        } catch {
          // Redis unavailable — continue with in-memory only
        }
      })
      .catch(() => {});
  }

  /** Sync write to Redis (fire-and-forget) */
  private syncToRedis(key: string, value: T): void {
    getRedisClient()
      .then((redis) => {
        if (!redis) return;
        try {
          const json = serialize(value);
          redis.set(this.redisKey(key), json, 'EX', this.ttl).catch(() => {});
        } catch {
          // Serialization failed — skip Redis sync
        }
      })
      .catch(() => {});
  }

  /** Remove key from Redis (fire-and-forget) */
  private deleteFromRedis(key: string): void {
    getRedisClient()
      .then((redis) => {
        if (!redis) return;
        redis.del(this.redisKey(key)).catch(() => {});
      })
      .catch(() => {});
  }

  // ── Map-compatible API (sync) ──────────────────

  get(key: string): T | undefined {
    return this.memory.get(key);
  }

  has(key: string): boolean {
    return this.memory.has(key);
  }

  set(key: string, value: T): this {
    this.memory.set(key, value);
    this.syncToRedis(key, value);
    return this;
  }

  delete(key: string): boolean {
    const result = this.memory.delete(key);
    if (result) this.deleteFromRedis(key);
    return result;
  }

  get size(): number {
    return this.memory.size;
  }

  values() {
    return this.memory.values();
  }

  entries() {
    return this.memory.entries();
  }

  keys() {
    return this.memory.keys();
  }

  forEach(callbackfn: (value: T, key: string, map: Map<string, T>) => void): void {
    this.memory.forEach(callbackfn);
  }

  [Symbol.iterator]() {
    return this.memory[Symbol.iterator]();
  }
}
