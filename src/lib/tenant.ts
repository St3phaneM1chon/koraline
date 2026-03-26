/**
 * TENANT UTILITIES — Multi-Tenant Koraline SaaS
 *
 * Détecte le tenant à partir du domaine de la requête.
 * Le tenantId est propagé via:
 *   1. Next.js middleware → header x-tenant-id
 *   2. Prisma middleware → injection automatique dans toutes les requêtes
 *   3. RLS PostgreSQL → filet de sécurité au niveau DB
 */

import { headers } from 'next/headers';
import { prisma } from '@/lib/db';

// Cache en mémoire des tenants par domaine (évite un appel DB à chaque requête)
const tenantCache = new Map<string, { tenantId: string; slug: string; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Résout le tenant à partir d'un hostname.
 * Ordre de résolution:
 *   1. Domaine custom exact (tenant's custom domain)
 *   2. Sous-domaine koraline.app (tenant.koraline.app)
 *   3. Slug par défaut (localhost, attitudes.vip)
 */
export async function resolveTenantByHost(hostname: string): Promise<{ tenantId: string; slug: string } | null> {
  // Nettoyer le hostname (retirer le port)
  const cleanHost = hostname.split(':')[0].toLowerCase();

  // Vérifier le cache
  const cached = tenantCache.get(cleanHost);
  if (cached && cached.expiresAt > Date.now()) {
    return { tenantId: cached.tenantId, slug: cached.slug };
  }

  // Cas spéciaux: localhost et dev → tenant par défaut (premier tenant actif)
  if (cleanHost === 'localhost' || cleanHost === '127.0.0.1') {
    const defaultTenant = await getDefaultTenant();
    if (defaultTenant) {
      tenantCache.set(cleanHost, { ...defaultTenant, expiresAt: Date.now() + CACHE_TTL_MS });
    }
    return defaultTenant;
  }

  // 1. Chercher par domaine custom (only if DNS ownership verified)
  const byCustomDomain = await prisma.tenant.findUnique({
    where: { domainCustom: cleanHost },
    select: { id: true, slug: true, status: true, domainVerified: true },
  });
  if (byCustomDomain && byCustomDomain.status === 'ACTIVE' && byCustomDomain.domainVerified) {
    const result = { tenantId: byCustomDomain.id, slug: byCustomDomain.slug };
    tenantCache.set(cleanHost, { ...result, expiresAt: Date.now() + CACHE_TTL_MS });
    return result;
  }

  // 2. Chercher par sous-domaine koraline.app
  const byKoralineDomain = await prisma.tenant.findUnique({
    where: { domainKoraline: cleanHost },
    select: { id: true, slug: true, status: true },
  });
  if (byKoralineDomain && byKoralineDomain.status === 'ACTIVE') {
    const result = { tenantId: byKoralineDomain.id, slug: byKoralineDomain.slug };
    tenantCache.set(cleanHost, { ...result, expiresAt: Date.now() + CACHE_TTL_MS });
    return result;
  }

  // 3. Extraire le slug du sous-domaine (slug.koraline.app)
  const koralineMatch = cleanHost.match(/^([a-z0-9-]+)\.koraline\.app$/);
  if (koralineMatch) {
    const slug = koralineMatch[1];
    const bySlug = await prisma.tenant.findUnique({
      where: { slug },
      select: { id: true, slug: true, status: true },
    });
    if (bySlug && bySlug.status === 'ACTIVE') {
      const result = { tenantId: bySlug.id, slug: bySlug.slug };
      tenantCache.set(cleanHost, { ...result, expiresAt: Date.now() + CACHE_TTL_MS });
      return result;
    }
  }

  // 4. Domaine attitudes.vip → tenant super-admin
  if (cleanHost === 'attitudes.vip' || cleanHost.endsWith('.attitudes.vip')) {
    const attitudes = await prisma.tenant.findUnique({
      where: { slug: 'attitudes' },
      select: { id: true, slug: true, status: true },
    });
    if (attitudes) {
      const result = { tenantId: attitudes.id, slug: attitudes.slug };
      tenantCache.set(cleanHost, { ...result, expiresAt: Date.now() + CACHE_TTL_MS });
      return result;
    }
  }

  // Fallback → tenant par défaut
  return getDefaultTenant();
}

/**
 * Retourne le tenant par défaut (le premier actif, normalement BioCycle).
 * Utilisé pour localhost et comme fallback.
 */
async function getDefaultTenant(): Promise<{ tenantId: string; slug: string } | null> {
  const tenant = await prisma.tenant.findFirst({
    where: { status: 'ACTIVE' },
    orderBy: { createdAt: 'asc' },
    select: { id: true, slug: true },
  });
  return tenant ? { tenantId: tenant.id, slug: tenant.slug } : null;
}

/**
 * Récupère le tenantId depuis les headers de la requête (injecté par le middleware Next.js).
 * À utiliser dans les Server Components et API routes.
 */
export async function getCurrentTenantId(): Promise<string | null> {
  try {
    const headersList = await headers();
    return headersList.get('x-tenant-id');
  } catch {
    // Hors contexte de requête (ex: script, build)
    return null;
  }
}

/**
 * Récupère le slug du tenant courant depuis les headers.
 */
export async function getCurrentTenantSlug(): Promise<string | null> {
  try {
    const headersList = await headers();
    return headersList.get('x-tenant-slug');
  } catch {
    return null;
  }
}

/**
 * Vérifie si le tenant courant est le super-admin (Attitudes).
 */
export async function isSuperAdmin(): Promise<boolean> {
  const slug = await getCurrentTenantSlug();
  return slug === 'attitudes';
}

/**
 * Vide le cache tenant (utile après une modification de config tenant).
 */
export function clearTenantCache(hostname?: string): void {
  if (hostname) {
    tenantCache.delete(hostname.toLowerCase());
  } else {
    tenantCache.clear();
  }
}
