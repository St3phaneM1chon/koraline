/**
 * TENANT BRANDING — Server-Side Loader
 *
 * Loads tenant branding from the database based on the x-tenant-slug header.
 * Cached with React cache() for dedup within a single request.
 *
 * Usage (Server Components):
 *   const branding = await getTenantBranding();
 *
 * The branding object is then passed to TenantBrandingProvider (client)
 * so that all client components can access it via useTenantBranding().
 */

import { cache } from 'react';
import { headers } from 'next/headers';
import { prisma } from '@/lib/db';

export interface TenantBranding {
  id: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  font: string;
  locale: string;
  currency: string;
}

/** Default branding used as fallback when tenant is not found in DB. */
const DEFAULT_BRANDING: TenantBranding = {
  id: '',
  slug: 'attitudes',
  name: 'Attitudes VIP',
  logoUrl: null,
  primaryColor: '#0066CC',
  secondaryColor: '#003366',
  font: 'Inter',
  locale: 'fr',
  currency: 'CAD',
};

/**
 * Loads tenant branding from DB. Cached per-request via React cache().
 * Safe to call multiple times in the same request tree — only 1 DB query.
 */
export const getTenantBranding = cache(async (): Promise<TenantBranding> => {
  try {
    const headersList = await headers();
    const tenantSlug = headersList.get('x-tenant-slug') || 'attitudes';

    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      select: {
        id: true,
        slug: true,
        name: true,
        logoUrl: true,
        primaryColor: true,
        secondaryColor: true,
        font: true,
        locale: true,
        currency: true,
      },
    });

    if (!tenant) {
      return { ...DEFAULT_BRANDING, slug: tenantSlug };
    }

    return {
      id: tenant.id,
      slug: tenant.slug,
      name: tenant.name,
      logoUrl: tenant.logoUrl,
      primaryColor: tenant.primaryColor,
      secondaryColor: tenant.secondaryColor,
      font: tenant.font,
      locale: tenant.locale,
      currency: tenant.currency,
    };
  } catch (error) {
    // During build or when DB is unavailable, return defaults
    console.warn('[getTenantBranding] Failed to load tenant, using defaults:', error);
    return DEFAULT_BRANDING;
  }
});
