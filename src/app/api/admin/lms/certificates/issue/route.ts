export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/lms/certificates/issue
 * C3-LMS-L-001 + C3-BIZ-B-002 FIX: Admin route to manually issue a certificate
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAdminGuard } from '@/lib/admin-api-guard';
import { apiSuccess, apiError } from '@/lib/api-response';
import { issueCertificate } from '@/lib/lms/lms-service';
import { logger } from '@/lib/logger';

const issueSchema = z.object({
  enrollmentId: z.string().min(1),
  userId: z.string().min(1),
  studentName: z.string().min(1).max(200),
});

export const POST = withAdminGuard(async (request: NextRequest, { session }) => {
  const tenantId = session.user.tenantId;
  if (!tenantId) {
    return apiError('No tenant context', 'AUTH_ERROR', { status: 403, request });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError('Invalid JSON body', 'VALIDATION_ERROR', { status: 400, request });
  }

  const parsed = issueSchema.safeParse(body);
  if (!parsed.success) {
    return apiError('Invalid input', 'VALIDATION_ERROR', { status: 400, request });
  }

  try {
    const certificate = await issueCertificate(
      tenantId,
      parsed.data.enrollmentId,
      parsed.data.userId,
      parsed.data.studentName,
    );

    logger.info('[LMS] Certificate issued by admin', {
      certificateId: certificate.id,
      enrollmentId: parsed.data.enrollmentId,
      issuedBy: session.user.id,
    });

    return apiSuccess({ certificate }, { request, status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    const safeMessages = [
      'Enrollment not found or not completed',
      'No certificate template configured for this course',
      'Required quizzes not passed',
    ];
    if (safeMessages.some(s => msg.includes(s))) {
      return apiError(msg, 'VALIDATION_ERROR', { status: 400, request });
    }
    logger.error('[LMS] Certificate issuance failed', { error: msg });
    return apiError('Certificate issuance failed', 'INTERNAL_ERROR', { status: 500, request });
  }
});
