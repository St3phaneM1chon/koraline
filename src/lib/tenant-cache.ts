/**
 * TENANT CACHE — Redis avec isolation par tenant
 *
 * Toutes les clés Redis sont préfixées automatiquement avec le tenantId.
 * Empêche la pollution de cache cross-tenant.
 *
 * Utiliser tenantCache au lieu de redis directement pour les données tenant.
 * Les données globales (ex: taux de change) utilisent globalCache.
 */

import { getCurrentTenantIdFromContext } from '@/lib/db';

/**
 * Génère une clé Redis préfixée par le tenantId courant.
 * Format: t:{tenantId}:{key}
 */
export function tenantCacheKey(key: string): string {
  const tenantId = getCurrentTenantIdFromContext();
  if (!tenantId) return `global:${key}`;
  return `t:${tenantId}:${key}`;
}

/**
 * Génère une clé Redis globale (pas de prefix tenant).
 * À utiliser UNIQUEMENT pour les données partagées entre tenants
 * (ex: taux de change, config plateforme).
 */
export function globalCacheKey(key: string): string {
  return `global:${key}`;
}

/**
 * Purge toutes les clés Redis d'un tenant spécifique.
 * Utilisé lors du déprovisioning d'un tenant.
 */
export async function purgeTenantCache(tenantId: string): Promise<number> {
  try {
    const { getRedisClient } = await import('@/lib/redis');
    const redis = await getRedisClient();
    if (!redis) return 0;

    const pattern = `t:${tenantId}:*`;
    const keys = await redis.keys(pattern);
    if (keys.length === 0) return 0;

    await redis.del(...keys);
    return keys.length;
  } catch {
    return 0;
  }
}
