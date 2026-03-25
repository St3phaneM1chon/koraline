export const dynamic = 'force-dynamic';

/**
 * POST /api/lms/course-completion — Manually trigger course completion check
 * Use case: when a student finishes the last lesson and the client wants to
 * explicitly verify/trigger the completion flow.
 *
 * SEC-HARDENING: Wrapped with withUserGuard for centralized auth + CSRF + rate limiting.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withUserGuard } from '@/lib/user-api-guard';
import { recalculateEnrollmentProgress } from '@/lib/lms/lms-service';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

const completionSchema = z.object({
  courseId: z.string().min(1),
});

export const POST = withUserGuard(async (request: NextRequest, { session }) => {
  const body = await request.json();
  const parsed = completionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'courseId is required' }, { status: 400 });
  }

  const tenantId = session.user.tenantId;
  if (!tenantId) {
    return NextResponse.json({ error: 'No tenant context' }, { status: 403 });
  }

  const userId = session.user.id;
  if (!userId) {
    return NextResponse.json({ error: 'User ID missing' }, { status: 401 });
  }

  try {
    // Find the enrollment for this user+course+tenant
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        tenantId_courseId_userId: {
          tenantId,
          courseId: parsed.data.courseId,
          userId,
        },
      },
      select: {
        id: true,
        status: true,
        progress: true,
        lessonsCompleted: true,
        totalLessons: true,
        completedAt: true,
      },
    });

    if (!enrollment) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });
    }

    // Recalculate progress (this also handles auto-completion, certificate issuance, badges)
    await recalculateEnrollmentProgress(enrollment.id);

    // Fetch the updated enrollment
    const updated = await prisma.enrollment.findUnique({
      where: { id: enrollment.id },
      select: {
        id: true,
        status: true,
        progress: true,
        lessonsCompleted: true,
        totalLessons: true,
        completedAt: true,
        certificateId: true,
      },
    });

    return NextResponse.json({ enrollment: updated });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error('Course completion check failed', {
      courseId: parsed.data.courseId,
      userId,
      error: errorMsg,
    });
    return NextResponse.json({ error: 'Completion check failed' }, { status: 500 });
  }
}, { rateLimit: 30 });
