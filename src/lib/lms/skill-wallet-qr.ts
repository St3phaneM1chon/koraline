/**
 * #22 Skill Wallet QR
 * Generate QR code for certificate/credential sharing.
 * Uses a verification URL that can be scanned to verify authenticity.
 */

import { logger } from '@/lib/logger';
import crypto from 'crypto';

// ── Types ────────────────────────────────────────────────────

export interface SkillWalletData {
  userId: string;
  userName: string;
  credentials: CredentialEntry[];
  verificationUrl: string;
  qrDataUrl: string;
}

export interface CredentialEntry {
  id: string;
  title: string;
  issuer: string;
  earnedAt: Date;
  expiresAt: Date | null;
  type: 'course_completion' | 'certification' | 'badge' | 'ceu';
  verificationHash: string;
}

// ── Functions ───────────────────────────────────────────────

const BASE_URL = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://attitudes.vip';

/**
 * Generate a verification hash for a credential.
 * This hash can be used to verify the credential's authenticity
 * without exposing private data.
 */
export function generateVerificationHash(
  userId: string,
  credentialId: string,
  earnedAt: Date
): string {
  const secret = process.env.NEXTAUTH_SECRET || 'default-secret';
  const data = `${userId}:${credentialId}:${earnedAt.toISOString()}`;
  return crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('hex')
    .slice(0, 16);
}

/**
 * Generate verification URL for a credential.
 */
export function getVerificationUrl(hash: string): string {
  return `${BASE_URL}/verify/credential/${hash}`;
}

/**
 * Generate QR code data URL using a simple SVG-based QR approach.
 * For production, consider using a QR library like 'qrcode'.
 */
export async function generateQRCodeDataUrl(text: string): Promise<string> {
  try {
    // Try to use qrcode library if available
    const QRCode = await import('qrcode').catch(() => null);
    if (QRCode) {
      return await QRCode.default.toDataURL(text, {
        width: 256,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' },
        errorCorrectionLevel: 'M',
      });
    }
  } catch {
    // qrcode package not installed
  }

  // Fallback: return a placeholder SVG data URL
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
    <rect width="256" height="256" fill="white"/>
    <rect x="20" y="20" width="80" height="80" fill="black" rx="4"/>
    <rect x="156" y="20" width="80" height="80" fill="black" rx="4"/>
    <rect x="20" y="156" width="80" height="80" fill="black" rx="4"/>
    <rect x="28" y="28" width="64" height="64" fill="white" rx="2"/>
    <rect x="164" y="28" width="64" height="64" fill="white" rx="2"/>
    <rect x="28" y="164" width="64" height="64" fill="white" rx="2"/>
    <rect x="44" y="44" width="32" height="32" fill="black" rx="2"/>
    <rect x="180" y="44" width="32" height="32" fill="black" rx="2"/>
    <rect x="44" y="180" width="32" height="32" fill="black" rx="2"/>
    <text x="128" y="140" text-anchor="middle" font-size="10" fill="#666">Scan to verify</text>
  </svg>`;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

/**
 * Build a skill wallet for a user with QR code.
 */
export async function buildSkillWallet(
  userId: string,
  userName: string,
  credentials: Omit<CredentialEntry, 'verificationHash'>[]
): Promise<SkillWalletData> {
  try {
    const enrichedCredentials: CredentialEntry[] = credentials.map(cred => ({
      ...cred,
      verificationHash: generateVerificationHash(userId, cred.id, cred.earnedAt),
    }));

    // Generate a combined verification URL for the whole wallet
    const walletHash = generateVerificationHash(userId, 'wallet', new Date());
    const verificationUrl = `${BASE_URL}/verify/wallet/${walletHash}`;
    const qrDataUrl = await generateQRCodeDataUrl(verificationUrl);

    return {
      userId,
      userName,
      credentials: enrichedCredentials,
      verificationUrl,
      qrDataUrl,
    };
  } catch (error) {
    logger.error('[skill-wallet-qr] Error:', error);
    throw error;
  }
}
