/**
 * TENANT CRON — Exécution de tâches planifiées par tenant
 *
 * Les cron jobs doivent itérer sur chaque tenant actif.
 * Ce module fournit les utilitaires pour exécuter des tâches
 * dans le contexte de chaque tenant.
 */

import { prisma } from '@/lib/db';
import { runWithTenant } from '@/lib/db';
import { logger } from '@/lib/logger';

interface TenantInfo {
  id: string;
  slug: string;
  plan: string;
}

/**
 * Exécute une fonction pour chaque tenant actif.
 * Le contexte tenant est automatiquement propagé via AsyncLocalStorage.
 *
 * Usage dans un cron job :
 * ```
 * await forEachActiveTenant(async (tenant) => {
 *   // Prisma filtre automatiquement par tenantId ici
 *   const expiring = await prisma.loyaltyTransaction.findMany({...});
 * });
 * ```
 */
export async function forEachActiveTenant(
  fn: (tenant: TenantInfo) => Promise<void>,
  options?: {
    plan?: string;       // Filtrer par plan (ex: 'pro', 'enterprise')
    sequential?: boolean; // true = un par un, false = en parallèle (défaut: true)
    maxConcurrency?: number; // Si parallèle, max tenants simultanés (défaut: 5)
  }
): Promise<{ succeeded: number; failed: number; errors: { tenantSlug: string; error: string }[] }> {
  const { plan, sequential = true, maxConcurrency = 5 } = options || {};

  const tenants = await prisma.tenant.findMany({
    where: {
      status: 'ACTIVE',
      ...(plan ? { plan } : {}),
    },
    select: { id: true, slug: true, plan: true },
    orderBy: { createdAt: 'asc' },
  });

  let succeeded = 0;
  let failed = 0;
  const errors: { tenantSlug: string; error: string }[] = [];

  const processTenant = async (tenant: TenantInfo) => {
    try {
      await runWithTenant(tenant.id, false, () => fn(tenant));
      succeeded++;
    } catch (error) {
      failed++;
      const errorMsg = error instanceof Error ? error.message : String(error);
      errors.push({ tenantSlug: tenant.slug, error: errorMsg });
      logger.error(`[Cron] Failed for tenant ${tenant.slug}`, {
        tenantId: tenant.id,
        error: errorMsg,
      });
    }
  };

  if (sequential) {
    for (const tenant of tenants) {
      await processTenant(tenant);
    }
  } else {
    // Parallèle avec contrôle de concurrence
    const chunks: TenantInfo[][] = [];
    for (let i = 0; i < tenants.length; i += maxConcurrency) {
      chunks.push(tenants.slice(i, i + maxConcurrency));
    }
    for (const chunk of chunks) {
      await Promise.all(chunk.map(processTenant));
    }
  }

  return { succeeded, failed, errors };
}
