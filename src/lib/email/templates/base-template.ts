/**
 * Template de base pour tous les emails — Multi-Tenant Koraline
 * Le nom de l'entreprise vient du tenant config (companyName parameter).
 * Colors, logo, and URLs are driven by TenantEmailBranding when provided.
 */

import { EMAIL_SENDER_NAME } from '@/lib/email/constants';
import type { TenantEmailBranding } from '@/lib/email/tenant-branding';

/** Shared HTML escape utility — use for all user-supplied strings in email templates */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

export interface BaseTemplateData {
  preheader?: string;
  content: string;
  footerText?: string;
  unsubscribeUrl?: string;
  locale?: 'fr' | 'en';
  darkMode?: boolean;
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    linkedin?: string;
    twitter?: string;
  };
  /** Override the company name in the footer. Defaults to tenant name or platform name. */
  companyName?: string;
  /** Override the company address in the footer. Defaults to 'Montreal, QC, Canada' */
  companyAddress?: string;
  /** Tenant branding (colors, logo, name, URLs). When provided, overrides companyName and colors. */
  branding?: TenantEmailBranding;
}

// Default constants — used when no TenantEmailBranding is provided
const DEFAULT_BRAND_COLOR = '#CC5500'; // Orange
const DEFAULT_DARK_COLOR = '#1f2937';

export function baseTemplate(data: BaseTemplateData): string {
  const {
    preheader = '', content, footerText, unsubscribeUrl, locale = 'fr',
    darkMode = false, socialLinks, branding,
    companyAddress = 'Montréal, QC, Canada',
  } = data;

  // Resolve branding: explicit branding > companyName prop > defaults
  const brandColor = branding?.primaryColor || DEFAULT_BRAND_COLOR;
  const headerBgColor = branding?.secondaryColor || DEFAULT_DARK_COLOR;
  const companyName = branding?.tenantName || data.companyName || EMAIL_SENDER_NAME;
  const logoUrl = branding?.logoUrl;
  const siteUrl = branding?.siteUrl || process.env.NEXT_PUBLIC_APP_URL || 'https://attitudes.vip';
  // Initials for the text-logo fallback (first 2 chars of company name)
  const logoInitials = companyName.substring(0, 2).toUpperCase();

  const isFr = locale === 'fr';

  const defaultFooter = isFr
    ? `Cet email a été envoyé par ${escapeHtml(companyName)}.`
    : `This email was sent by ${escapeHtml(companyName)}.`;

  const contactText = isFr ? 'Contactez-nous' : 'Contact us';
  const viewOnlineText = isFr ? 'Voir en ligne' : 'View online';

  // Build the logo cell: use an <img> if logoUrl is present, otherwise a colored initials box
  const logoHtml = logoUrl
    ? `<img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(companyName)}" height="40" style="height: 40px; max-width: 180px; object-fit: contain;">`
    : `<div style="width: 40px; height: 40px; background-color: ${brandColor}; border-radius: 10px; display: inline-block; text-align: center; line-height: 40px;">
        <span style="color: white; font-weight: bold; font-size: 16px;">${logoInitials}</span>
      </div>`;

  return `
<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${escapeHtml(companyName)}</title>
  <!--[if mso]>
  <style type="text/css">
    table { border-collapse: collapse; }
    .button { padding: 12px 24px !important; }
  </style>
  <![endif]-->
  <style>
    body { margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; }
    .header { background-color: ${headerBgColor}; padding: 24px; text-align: center; }
    .logo { height: 40px; }
    .content { background-color: #ffffff; padding: 32px; }
    .footer { background-color: #f9fafb; padding: 24px; text-align: center; font-size: 12px; color: #6b7280; }
    .button { display: inline-block; background-color: ${brandColor}; color: #ffffff !important; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; }
    .button:hover { opacity: 0.9; }
    .divider { border-top: 1px solid #e5e7eb; margin: 24px 0; }
    h1, h2, h3 { color: ${headerBgColor}; margin-top: 0; }
    p { color: #4b5563; line-height: 1.6; }
    a { color: ${brandColor}; }
    .preheader { display: none; max-height: 0; overflow: hidden; }
    @media only screen and (max-width: 600px) {
      .content { padding: 20px !important; }
      .button { display: block !important; text-align: center; }
    }
    ${darkMode ? `
    @media (prefers-color-scheme: dark) {
      body { background-color: #1a1a2e !important; }
      .content { background-color: #16213e !important; color: #e0e0e0 !important; }
      .footer { background-color: #0f3460 !important; }
      h1, h2, h3 { color: #e0e0e0 !important; }
      p { color: #c4c4c4 !important; }
    }
    ` : ''}
  </style>
</head>
<body>
  <!-- Preheader -->
  <div style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    ${preheader}
    ${'&zwnj;&nbsp;'.repeat(40)}
  </div>

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f3f4f6;">
    <tr>
      <td align="center" style="padding: 20px 10px;">
        <table role="presentation" class="container" width="600" cellspacing="0" cellpadding="0">
          <!-- Header -->
          <tr>
            <td class="header" style="background-color: ${headerBgColor}; padding: 24px; text-align: center; border-radius: 12px 12px 0 0;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <div style="display: inline-flex; align-items: center; gap: 12px;">
                      ${logoHtml}
                      <span style="color: white; font-size: 20px; font-weight: bold;">${escapeHtml(companyName)}</span>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td class="content" style="background-color: #ffffff; padding: 32px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="footer" style="background-color: #f9fafb; padding: 24px; text-align: center; border-radius: 0 0 12px 12px;">
              <p style="margin: 0 0 12px 0; font-size: 12px; color: #6b7280;">
                ${footerText || defaultFooter}
              </p>
              ${socialLinks ? `
              <p style="margin: 0 0 12px 0; font-size: 14px;">
                ${socialLinks.facebook ? `<a href="${socialLinks.facebook}" style="color: #6b7280; text-decoration: none; margin: 0 6px;">Facebook</a>` : ''}
                ${socialLinks.instagram ? `<a href="${socialLinks.instagram}" style="color: #6b7280; text-decoration: none; margin: 0 6px;">Instagram</a>` : ''}
                ${socialLinks.linkedin ? `<a href="${socialLinks.linkedin}" style="color: #6b7280; text-decoration: none; margin: 0 6px;">LinkedIn</a>` : ''}
                ${socialLinks.twitter ? `<a href="${socialLinks.twitter}" style="color: #6b7280; text-decoration: none; margin: 0 6px;">X</a>` : ''}
              </p>
              ` : ''}
              <p style="margin: 0 0 12px 0; font-size: 12px; color: #9ca3af;">
                <a href="${siteUrl}/contact" style="color: #6b7280; text-decoration: underline;">${contactText}</a>
                &nbsp;|&nbsp;
                <a href="${siteUrl}" style="color: #6b7280; text-decoration: underline;">${viewOnlineText}</a>
                ${unsubscribeUrl ? `&nbsp;|&nbsp;<a href="${unsubscribeUrl}" style="color: #6b7280; text-decoration: underline;">${isFr ? 'Se désabonner' : 'Unsubscribe'}</a>` : ''}
              </p>
              <p style="margin: 0; font-size: 11px; color: #9ca3af;">
                © ${new Date().getFullYear()} ${escapeHtml(companyName)} ${companyAddress}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

// Composants réutilisables
export const emailComponents = {
  button: (text: string, url: string, color?: string) => `
    <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 24px 0;">
      <tr>
        <td align="center">
          <a href="${url}" class="button" style="display: inline-block; background-color: ${color || DEFAULT_BRAND_COLOR}; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">${text}</a>
        </td>
      </tr>
    </table>
  `,
  
  divider: () => `<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">`,
  
  infoBox: (content: string, color: string = '#f0fdf4', borderColor: string = '#86efac') => `
    <div style="background-color: ${color}; border: 1px solid ${borderColor}; border-radius: 8px; padding: 16px; margin: 16px 0;">
      ${content}
    </div>
  `,
  
  warningBox: (content: string) => `
    <div style="background-color: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 16px; margin: 16px 0;">
      ${content}
    </div>
  `,
  
  orderItem: (name: string, quantity: number, price: string, imageUrl?: string, isFr: boolean = true) => {
    // AUDIT-FIX: Whitelist allowed image domains to prevent tracking pixel injection
    const ALLOWED_IMAGE_DOMAINS = ['attitudes.vip', 'cdn.attitudes.vip', 'blob.core.windows.net', 'localhost'];
    let safeImage: string | undefined;
    if (imageUrl && /^https?:\/\//.test(imageUrl)) {
      try {
        const url = new URL(imageUrl);
        safeImage = ALLOWED_IMAGE_DOMAINS.some(d => url.hostname === d || url.hostname.endsWith(`.${d}`))
          ? imageUrl : undefined;
      } catch { safeImage = undefined; }
    }
    return `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
          <tr>
            ${safeImage ? `<td width="60" style="padding-right: 12px;"><img src="${safeImage}" alt="${escapeHtml(name)}" width="60" height="60" style="border-radius: 8px; object-fit: cover;"></td>` : ''}
            <td>
              <p style="margin: 0; font-weight: 600; color: #1f2937;">${name}</p>
              <p style="margin: 4px 0 0 0; font-size: 14px; color: #6b7280;">${isFr ? 'Qté' : 'Qty'}: ${quantity}</p>
            </td>
            <td align="right" style="font-weight: 600; color: #1f2937;">${price}</td>
          </tr>
        </table>
      </td>
    </tr>
  `;
  },
  
  trackingInfo: (carrier: string, trackingNumber: string, trackingUrl: string, isFr: boolean = true) => `
    <div style="background-color: #eff6ff; border: 1px solid #93c5fd; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
      <p style="margin: 0 0 8px 0; font-size: 14px; color: #1e40af;">
        <strong>${isFr ? 'Transporteur' : 'Carrier'}:</strong> ${carrier}
      </p>
      <p style="margin: 0 0 16px 0; font-size: 18px; font-weight: bold; color: #1e40af; letter-spacing: 2px;">
        ${trackingNumber}
      </p>
      <a href="${trackingUrl}" style="display: inline-block; background-color: #3b82f6; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600;">
        📦 ${isFr ? 'Suivre ma commande' : 'Track my order'}
      </a>
    </div>
  `,
};
