/**
 * In-memory cache utilities for API routes
 * Used for frequently accessed singleton data (e.g., SiteSettings)
 */

export interface CacheEntry<T> {
  data: T;
  expiry: number;
}

/**
 * Generic cache manager for any cacheable data
 */
export class SimpleCache<T> {
  private cache: CacheEntry<T> | null = null;
  private ttlMs: number;

  constructor(ttlSeconds: number = 30) {
    this.ttlMs = ttlSeconds * 1000;
  }

  /**
   * Get cached data if valid, otherwise return null
   */
  get(): T | null {
    if (this.cache && Date.now() < this.cache.expiry) {
      return this.cache.data;
    }
    this.cache = null;
    return null;
  }

  /**
   * Set cache data with TTL
   */
  set(data: T): void {
    this.cache = {
      data,
      expiry: Date.now() + this.ttlMs,
    };
  }

  /**
   * Invalidate cache
   */
  invalidate(): void {
    this.cache = null;
  }

  /**
   * Check if cache exists and is valid
   */
  isValid(): boolean {
    return this.cache !== null && Date.now() < this.cache.expiry;
  }
}

/**
 * SiteSettings cache with 30-second TTL
 */
export const siteSettingsCache = new SimpleCache(30);

/**
 * Cache TTL constants (in seconds)
 */
export const CacheTTL = {
  CONFIG: 300, // 5 minutes for config data
  CURRENCIES: 300, // 5 minutes for currency data
  CATEGORIES: 600, // 10 minutes for categories
  PRODUCTS: 300, // 5 minutes for products
  SEARCH: 60, // 1 minute for search results
  SUGGESTIONS: 300, // 5 minutes for suggestions
  SITE_SETTINGS: 30, // 30 seconds for site settings
  STATS: 600, // 10 minutes for statistics
  STATIC: 3600, // 1 hour for static/rarely-changing data
};

/**
 * Cache tags for invalidation
 */
export const CacheTags = {
  CONFIG: 'config',
  CURRENCIES: 'currencies',
  CATEGORIES: 'categories',
  PRODUCTS: 'products',
  SEARCH: 'search',
  SUGGESTIONS: 'suggestions',
  SITE_SETTINGS: 'siteSettings',
};

/**
 * Cache keys builders
 */
export const CacheKeys = {
  config: {
    currencies: () => 'config:currencies',
    siteSettings: () => 'config:siteSettings',
  },
  categories: {
    all: () => 'categories:all',
    byId: (id: string) => `categories:${id}`,
  },
  products: {
    byId: (id: string) => `products:${id}`,
    related: (id: string) => `products:${id}:related`,
    search: (query: string) => `products:search:${query}`,
  },
  search: {
    suggestions: (query: string) => `search:suggestions:${query}`,
  },
};

/**
 * In-memory cache store with tag-based invalidation
 */
interface CacheItem {
  value: unknown;
  expiry: number;
  tags: string[];
}

const globalCacheStore = new Map<string, CacheItem>();
const tagIndex = new Map<string, Set<string>>();

/**
 * Get or set cache value with TTL and tags
 */
export async function cacheGetOrSet<T>(
  key: string,
  fn: () => Promise<T>,
  options?: { ttl?: number; tags?: string[] }
): Promise<T> {
  // Check if value exists and is not expired
  const item = globalCacheStore.get(key);
  if (item && Date.now() < item.expiry) {
    return item.value as T;
  }

  // Value not found or expired - fetch fresh value
  const value = await fn();
  const ttl = options?.ttl ?? CacheTTL.CONFIG;
  const tags = options?.tags ?? [];

  // Store in cache
  globalCacheStore.set(key, {
    value,
    expiry: Date.now() + ttl * 1000,
    tags,
  });

  // Index by tags for efficient invalidation
  for (const tag of tags) {
    if (!tagIndex.has(tag)) {
      tagIndex.set(tag, new Set());
    }
    tagIndex.get(tag)!.add(key);
  }

  return value;
}

/**
 * Get cached value without setting if missing
 */
export function cacheGet<T>(key: string): T | null {
  const item = globalCacheStore.get(key);
  if (item && Date.now() < item.expiry) {
    return item.value as T;
  }
  globalCacheStore.delete(key);
  return null;
}

/**
 * Set cache value directly
 */
export function cacheSet<T>(key: string, value: T, options?: { ttl?: number; tags?: string[] }): void {
  const ttl = options?.ttl ?? CacheTTL.CONFIG;
  const tags = options?.tags ?? [];

  globalCacheStore.set(key, {
    value,
    expiry: Date.now() + ttl * 1000,
    tags,
  });

  // Index by tags
  for (const tag of tags) {
    if (!tagIndex.has(tag)) {
      tagIndex.set(tag, new Set());
    }
    tagIndex.get(tag)!.add(key);
  }
}

/**
 * Invalidate cache by tag
 */
export function cacheInvalidateTag(tag: string): void {
  const keys = tagIndex.get(tag);
  if (keys) {
    for (const key of keys) {
      globalCacheStore.delete(key);
    }
    tagIndex.delete(tag);
  }
}

/**
 * Invalidate specific cache key
 */
export function cacheDelete(key: string): void {
  const item = globalCacheStore.get(key);
  if (item) {
    for (const tag of item.tags) {
      tagIndex.get(tag)?.delete(key);
    }
  }
  globalCacheStore.delete(key);
}

/**
 * Get cache statistics
 */
export function cacheStats() {
  return {
    totalKeys: globalCacheStore.size,
    totalTags: tagIndex.size,
    entries: Array.from(globalCacheStore.entries()).map(([key, item]) => ({
      key,
      ttl: Math.max(0, Math.floor((item.expiry - Date.now()) / 1000)),
      tags: item.tags,
    })),
  };
}

/**
 * Check if Redis is connected (placeholder - always false for in-memory cache)
 */
export function isCacheRedisConnected(): boolean {
  return false;
}
