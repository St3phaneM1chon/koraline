export const dynamic = 'force-dynamic';

/**
 * G25 — Certificate Generation API
 * POST /api/lms/certificates/generate
 *
 * Generates a certificate for a completed enrollment.
 * Returns the certificate ID, verification code, and rendered HTML.
 *
 * Body: { enrollmentId: string }
 *
 * Requires authentication (user must own the enrollment).
 */

import { NextRequest, NextResponse } from 'next/server';
import { withUserGuard } from '@/lib/user-api-guard';
import { generateCertificate } from '@/lib/lms/certificate-generator';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const generateSchema = z.object({
  enrollmentId: z.string().min(1),
});

export const POST = withUserGuard(async (request: NextRequest, { session }) => {
  const tenantId = session.user.tenantId;
  if (!tenantId) {
    return NextResponse.json({ error: 'No tenant' }, { status: 403 });
  }

  const userId = session.user.id;
  if (!userId) {
    return NextResponse.json({ error: 'User ID missing' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = generateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'enrollmentId is required' },
        { status: 400 }
      );
    }

    const result = await generateCertificate({
      enrollmentId: parsed.data.enrollmentId,
      tenantId,
      userId,
    });

    return NextResponse.json({
      certificate: {
        id: result.certificateId,
        verificationCode: result.verificationCode,
        studentName: result.studentName,
        courseTitle: result.courseTitle,
        issuedAt: result.issuedAt,
        verifyUrl: `/verify/certificate/${result.verificationCode}`,
        downloadUrl: `/api/lms/certificates/${result.certificateId}/download`,
      },
      html: result.html,
    }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    // Known business errors — return 400/409 not 500
    if (message.includes('not found')) {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    if (message.includes('not yet completed')) {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    if (message.includes('already exists')) {
      return NextResponse.json({ error: message }, { status: 409 });
    }

    logger.error('[Certificate Generate API] Error', {
      userId,
      tenantId,
      error: message,
    });
    return NextResponse.json({ error: 'Failed to generate certificate' }, { status: 500 });
  }
}, { rateLimit: 10 });
