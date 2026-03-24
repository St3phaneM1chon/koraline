export const dynamic = 'force-dynamic';

/**
 * Student progress API
 * GET /api/lms/progress?courseId=xxx — Get my progress for a course
 * POST /api/lms/progress — Update lesson progress
 *
 * SEC-HARDENING: Wrapped with withUserGuard for centralized auth + CSRF + rate limiting.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withUserGuard } from '@/lib/user-api-guard';
import { getEnrollment, getUserEnrollments, updateLessonProgress } from '@/lib/lms/lms-service';

const updateProgressSchema = z.object({
  enrollmentId: z.string().min(1),
  lessonId: z.string().min(1),
  isCompleted: z.boolean().optional(),
  videoProgress: z.number().int().min(0).optional(),
  videoCompleted: z.boolean().optional(),
  timeSpent: z.number().int().min(0).optional(),
});

export const GET = withUserGuard(async (request: NextRequest, { session }) => {
  const tenantId = session.user.tenantId;
  if (!tenantId) {
    return NextResponse.json({ error: 'No tenant context' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const courseId = searchParams.get('courseId');

  if (courseId) {
    const enrollment = await getEnrollment(tenantId, courseId, session.user.id!);
    return NextResponse.json({ enrollment });
  }

  // Return all enrollments for the user
  const enrollments = await getUserEnrollments(tenantId, session.user.id!);
  return NextResponse.json({ enrollments });
}, { skipCsrf: true });

export const POST = withUserGuard(async (request: NextRequest, { session }) => {
  const tenantId = session.user.tenantId;
  if (!tenantId) {
    return NextResponse.json({ error: 'No tenant context' }, { status: 403 });
  }

  const body = await request.json();
  const parsed = updateProgressSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const progress = await updateLessonProgress(
      tenantId,
      parsed.data.enrollmentId,
      parsed.data.lessonId,
      session.user.id!,
      {
        isCompleted: parsed.data.isCompleted,
        videoProgress: parsed.data.videoProgress,
        videoCompleted: parsed.data.videoCompleted,
        timeSpent: parsed.data.timeSpent,
      }
    );
    return NextResponse.json({ progress });
  } catch (error) {
    if (error instanceof Error) {
      const msg = error.message;
      // C3-SEC-S-005 FIX: Only return known safe business messages
      const safeMessages = ["Enrollment not found", "Course already completed", "Cannot mark video as completed", "Time spent per update cannot exceed"];
      return NextResponse.json({ error: safeMessages.some(s => msg.includes(s)) ? msg : "Failed to update progress" }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 });
  }
});
