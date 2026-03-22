/**
 * TENANT FEATURE FLAGS — Rollback control
 *
 * Chaque mécanisme multi-tenant peut être activé/désactivé individuellement
 * via des variables d'environnement. Permet un rollback couche par couche
 * en cas de problème.
 */

export const TenantFlags = {
  /** Master switch : active le filtrage tenant dans Prisma middleware */
  filterEnabled: () => process.env.MULTI_TENANT_FILTER !== 'false',

  /** Active le prefix tenant sur les clés Redis */
  cachePrefixEnabled: () => process.env.MULTI_TENANT_CACHE_PREFIX !== 'false',

  /** Active l'isolation des fichiers par tenant */
  storageIsolateEnabled: () => process.env.MULTI_TENANT_STORAGE_ISOLATE !== 'false',

  /** Active l'itération par tenant dans les cron jobs */
  cronIterateEnabled: () => process.env.MULTI_TENANT_CRON_ITERATE !== 'false',

  /** Active le CORS dynamique par tenant */
  corsDynamicEnabled: () => process.env.MULTI_TENANT_CORS_DYNAMIC !== 'false',

  /** Active le Row-Level Security PostgreSQL */
  rlsEnabled: () => process.env.MULTI_TENANT_RLS === 'true',
} as const;
