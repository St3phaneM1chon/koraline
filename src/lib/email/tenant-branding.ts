/**
 * Tenant Email Branding — Koraline SaaS Platform
 *
 * Loads tenant-specific branding (name, logo, colors, support email, site URL)
 * from the database and provides it to email templates.
 *
 * When no tenant is specified (or tenant has no branding), defaults to
 * the Koraline platform branding — NOT "BioCycle Peptides".
 */

import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import { EMAIL_ADDRESSES, EMAIL_SENDER_NAME } from '@/lib/email/constants';

// ─── Public interface ─────────────────────────────────────────────────────────

export interface TenantEmailBranding {
  /** Display name in emails (header, footer, subject). */
  tenantName: string;
  /** URL of the tenant logo. If undefined, the base template uses a text fallback. */
  logoUrl?: string;
  /** Primary brand color (hex). Used for header background accents, buttons, links. */
  primaryColor: string;
  /** Secondary brand color (hex). Used for the header bar background. */
  secondaryColor: string;
  /** Support email shown in email body (e.g. "Contact us at X"). */
  supportEmail: string;
  /** Base site URL (no trailing slash). Used for links and footer. */
  siteUrl: string;
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_BRANDING: TenantEmailBranding = {
  tenantName: EMAIL_SENDER_NAME || 'Koraline',
  logoUrl: undefined,
  primaryColor: '#CC5500',
  secondaryColor: '#1f2937',
  supportEmail: EMAIL_ADDRESSES.support,
  siteUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://attitudes.vip',
};

/**
 * Return the default platform branding.
 * Safe to call in any context (no DB access).
 */
export function getDefaultBranding(): TenantEmailBranding {
  return { ...DEFAULT_BRANDING };
}

// ─── DB loader ────────────────────────────────────────────────────────────────

/**
 * Load tenant branding from the database.
 *
 * Looks up:
 *  1. Tenant record for name, logoUrl, primaryColor, secondaryColor, domainCustom
 *  2. SiteSettings record (by tenantId) for supportEmail, logoUrl override
 *
 * Falls back to platform defaults for any missing field.
 * Never throws — returns defaults on any error.
 *
 * @param tenantId - The tenant ID. If null/undefined, returns defaults.
 */
export async function loadTenantBranding(
  tenantId: string | null | undefined,
): Promise<TenantEmailBranding> {
  if (!tenantId) return getDefaultBranding();

  try {
    // Parallel queries for speed
    const [tenant, siteSettings] = await Promise.all([
      prisma.tenant.findUnique({
        where: { id: tenantId },
        select: {
          name: true,
          logoUrl: true,
          primaryColor: true,
          secondaryColor: true,
          domainCustom: true,
          domainKoraline: true,
        },
      }),
      prisma.siteSettings.findFirst({
        where: { tenantId },
        select: {
          companyName: true,
          logoUrl: true,
          supportEmail: true,
        },
      }),
    ]);

    if (!tenant) {
      logger.warn('[TenantBranding] Tenant not found, using defaults', { tenantId });
      return getDefaultBranding();
    }

    // Build the site URL from the tenant's domains
    const siteUrl = tenant.domainCustom
      ? `https://${tenant.domainCustom}`
      : tenant.domainKoraline
        ? `https://${tenant.domainKoraline}`
        : DEFAULT_BRANDING.siteUrl;

    return {
      tenantName: siteSettings?.companyName || tenant.name || DEFAULT_BRANDING.tenantName,
      logoUrl: siteSettings?.logoUrl || tenant.logoUrl || DEFAULT_BRANDING.logoUrl,
      primaryColor: tenant.primaryColor || DEFAULT_BRANDING.primaryColor,
      secondaryColor: tenant.secondaryColor || DEFAULT_BRANDING.secondaryColor,
      supportEmail: siteSettings?.supportEmail || DEFAULT_BRANDING.supportEmail,
      siteUrl,
    };
  } catch (error) {
    logger.error('[TenantBranding] Failed to load tenant branding, using defaults', {
      tenantId,
      error: error instanceof Error ? error.message : String(error),
    });
    return getDefaultBranding();
  }
}
