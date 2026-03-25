export const dynamic = 'force-dynamic';

/**
 * GET /api/lms/certificates/verify/[code] — Public certificate verification
 *
 * No authentication required. Returns only public-safe fields:
 * student first name + last initial, course title, completion date, certificate number, validity.
 * Does NOT expose: email, userId, enrollmentId, full name.
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { checkRateLimit } from '@/lib/security';

/**
 * Mask full name to "FirstName L." for privacy.
 * "Jean-Pierre Dupont" → "Jean-Pierre D."
 * "Alice" → "Alice"
 */
function maskName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length <= 1) return parts[0] || 'Student';
  const firstName = parts.slice(0, -1).join(' ');
  const lastInitial = parts[parts.length - 1][0];
  return `${firstName} ${lastInitial}.`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  // Rate limiting — prevent brute-force certificate code enumeration
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
  const rateResult = checkRateLimit(`cert-verify:${ip}`, 30, 60000); // 30 req/min
  if (!rateResult.allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const { code } = await params;
  if (!code || code.length < 5) {
    return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
  }

  const certificate = await prisma.certificate.findUnique({
    where: { verificationCode: code },
    select: {
      id: true,
      courseTitle: true,
      studentName: true,
      status: true,
      issuedAt: true,
      expiresAt: true,
      verificationCode: true,
    },
  });

  if (!certificate) {
    return NextResponse.json({ valid: false, error: 'Certificate not found' }, { status: 404 });
  }

  const isValid =
    certificate.status === 'ISSUED' &&
    (!certificate.expiresAt || new Date(certificate.expiresAt) > new Date());

  return NextResponse.json({
    valid: isValid,
    certificate: {
      studentName: maskName(certificate.studentName),
      courseTitle: certificate.courseTitle,
      completionDate: certificate.issuedAt,
      certificateNumber: certificate.verificationCode,
      isValid,
    },
  });
}
