export const dynamic = 'force-dynamic';

/**
 * Public certificate verification API
 * GET /api/lms/certificates/verify?code=xxx — Verify a certificate by its QR code
 * No authentication required — this is a public verification endpoint
 */
import { NextRequest, NextResponse } from 'next/server';
import { verifyCertificate } from '@/lib/lms/lms-service';
import { checkRateLimit } from '@/lib/security';

/**
 * P11-02 FIX: Mask full name to "FirstName L." for privacy on public endpoint.
 * "Jean-Pierre Dupont" -> "Jean-Pierre D."
 * "Alice" -> "Alice"
 */
function maskName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length <= 1) return parts[0] || 'Student';
  const firstName = parts.slice(0, -1).join(' ');
  const lastInitial = parts[parts.length - 1][0];
  return `${firstName} ${lastInitial}.`;
}

export async function GET(request: NextRequest) {
  // Rate limiting — prevent brute-force certificate code enumeration
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
  const rateResult = checkRateLimit(`cert-verify:${ip}`, 30, 60000); // 30 req/min
  if (!rateResult.allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const code = new URL(request.url).searchParams.get('code');
  if (!code) {
    return NextResponse.json({ error: 'Verification code required' }, { status: 400 });
  }

  const certificate = await verifyCertificate(code);
  if (!certificate) {
    return NextResponse.json({ valid: false, error: 'Certificate not found' }, { status: 404 });
  }

  const isValid = certificate.status === 'ISSUED' &&
    (!certificate.expiresAt || new Date(certificate.expiresAt) > new Date());

  // P11-02 FIX: Mask student name on public verification endpoint to prevent PII leakage
  return NextResponse.json({
    valid: isValid,
    certificate: {
      courseTitle: certificate.courseTitle,
      studentName: maskName(certificate.studentName),
      issuedAt: certificate.issuedAt,
      expiresAt: certificate.expiresAt,
      status: certificate.status,
    },
  });
}
