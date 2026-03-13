/**
 * URL Validator — SSRF Protection for web crawling
 *
 * Blocks:
 *   - Private/internal IP ranges (RFC 1918, loopback, link-local, etc.)
 *   - Non-HTTP(S) protocols (file://, ftp://, etc.)
 *   - .local, .internal, .localhost hostnames
 *   - Cloud metadata endpoints (169.254.169.254)
 */

import { logger } from '@/lib/logger';

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  '0.0.0.0',
  '127.0.0.1',
  '::1',
  '[::1]',
  'metadata.google.internal',
  'metadata.google.com',
]);

const BLOCKED_TLD_SUFFIXES = ['.local', '.internal', '.localhost', '.example', '.test', '.invalid'];

/** Check if an IP is in a private/internal range */
function isPrivateIP(hostname: string): boolean {
  // IPv4 patterns
  const ipv4Match = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4Match) {
    const [, a, b] = ipv4Match.map(Number);
    // 10.0.0.0/8
    if (a === 10) return true;
    // 172.16.0.0/12
    if (a === 172 && b >= 16 && b <= 31) return true;
    // 192.168.0.0/16
    if (a === 192 && b === 168) return true;
    // 127.0.0.0/8 (loopback)
    if (a === 127) return true;
    // 169.254.0.0/16 (link-local, AWS/GCP metadata)
    if (a === 169 && b === 254) return true;
    // 0.0.0.0/8
    if (a === 0) return true;
    // 100.64.0.0/10 (carrier-grade NAT)
    if (a === 100 && b >= 64 && b <= 127) return true;
    // 198.18.0.0/15 (benchmark testing)
    if (a === 198 && (b === 18 || b === 19)) return true;
  }

  // IPv6 loopback/link-local (simplified check)
  const stripped = hostname.replace(/[\[\]]/g, '');
  if (stripped === '::1' || stripped.startsWith('fe80:') || stripped.startsWith('fc00:') || stripped.startsWith('fd')) {
    return true;
  }

  return false;
}

/**
 * Validate a URL for safe external fetching (anti-SSRF).
 *
 * @returns `null` if the URL is safe, or an error message string if blocked.
 */
export function validateUrl(rawUrl: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return 'Invalid URL format';
  }

  // Only allow HTTP(S)
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return `Blocked protocol: ${parsed.protocol}`;
  }

  const hostname = parsed.hostname.toLowerCase();

  // Blocked hostnames
  if (BLOCKED_HOSTNAMES.has(hostname)) {
    return `Blocked hostname: ${hostname}`;
  }

  // Blocked TLD suffixes
  for (const suffix of BLOCKED_TLD_SUFFIXES) {
    if (hostname.endsWith(suffix)) {
      return `Blocked TLD: ${hostname}`;
    }
  }

  // Private/internal IPs
  if (isPrivateIP(hostname)) {
    return `Blocked private IP: ${hostname}`;
  }

  return null; // Safe
}

/**
 * Validate a URL and log if blocked. Returns true if safe, false if blocked.
 */
export function isSafeUrl(rawUrl: string): boolean {
  const error = validateUrl(rawUrl);
  if (error) {
    logger.warn('SSRF protection: URL blocked', { url: rawUrl, reason: error });
    return false;
  }
  return true;
}
