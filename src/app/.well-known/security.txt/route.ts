/**
 * /.well-known/security.txt
 *
 * RFC 9116 compliant security.txt for vulnerability disclosure.
 * See: https://securitytxt.org/
 *
 * SEC-HARDENING: Enterprise security standard for responsible disclosure.
 */

import { NextResponse } from 'next/server';

// Expiry: 1 year from now, regenerated on each request so it stays current.
function getExpiryDate(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString();
}

const SECURITY_TXT = `# Security Policy for Attitudes VIP / Koraline SaaS Platform
# https://securitytxt.org/

Contact: mailto:security@attitudes.vip
Contact: mailto:stephane.michon@attitudes.vip
Preferred-Languages: fr, en
Canonical: https://attitudes.vip/.well-known/security.txt
Policy: https://attitudes.vip/security-policy
Hiring: https://attitudes.vip/careers
`;

export async function GET() {
  const body = SECURITY_TXT + `Expires: ${getExpiryDate()}\n`;

  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400', // 24h cache
    },
  });
}
