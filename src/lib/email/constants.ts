/**
 * Centralized email address constants — Multi-Tenant Koraline
 *
 * All company email addresses used in backend code should reference these
 * constants instead of hardcoding strings. In multi-tenant mode, the tenant
 * name and email addresses come from the tenant config in DB.
 * These constants serve as fallbacks for the platform (Attitudes VIP).
 *
 * Frontend/i18n files may still reference addresses in locale JSON;
 * those are content-level and managed via translations.
 */

export const EMAIL_ADDRESSES = {
  /** Default sender for transactional emails */
  noreply: process.env.SMTP_FROM || 'noreply@attitudes.vip',
  /** Customer support */
  support: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@attitudes.vip',
  /** Privacy / RGPD inquiries */
  privacy: process.env.PRIVACY_EMAIL || 'privacy@attitudes.vip',
  /** Legal department */
  legal: process.env.LEGAL_EMAIL || 'legal@attitudes.vip',
  /** General info */
  info: process.env.INFO_EMAIL || 'info@attitudes.vip',
  /** Admin alerts */
  admin: process.env.ADMIN_EMAIL || 'admin@attitudes.vip',
  /** Billing */
  billing: process.env.BILLING_EMAIL || 'billing@attitudes.vip',
  /** List-Unsubscribe mailto */
  unsubscribe: process.env.UNSUBSCRIBE_EMAIL || 'unsubscribe@attitudes.vip',
} as const;

/** Company name used in email sender fields — reads from env or defaults to platform name */
export const EMAIL_SENDER_NAME = process.env.NEXT_PUBLIC_SITE_NAME || 'Attitudes VIP';
