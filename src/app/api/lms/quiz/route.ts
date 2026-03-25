export const dynamic = 'force-dynamic';

/**
 * Student quiz submission API
 * POST /api/lms/quiz — Submit quiz answers
 *
 * SEC-HARDENING: Wrapped with withUserGuard for centralized auth + CSRF + rate limiting.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withUserGuard } from '@/lib/user-api-guard';
import { submitQuizAttempt } from '@/lib/lms/lms-service';

const submitQuizSchema = z.object({
  quizId: z.string().min(1),
  attemptId: z.string().min(1).optional(), // V2 P0 FIX: Reference in-progress attempt for timer enforcement
  answers: z.array(z.object({
    questionId: z.string().min(1),
    answer: z.union([z.string(), z.array(z.string())]),
  })).min(1),
});

export const POST = withUserGuard(async (request: NextRequest, { session }) => {
  const tenantId = session.user.tenantId;
  if (!tenantId) {
    return NextResponse.json({ error: 'No tenant context' }, { status: 403 });
  }

  const body = await request.json();
  const parsed = submitQuizSchema.safeParse(body);
  if (!parsed.success) {
    // C3-SEC-S-011 FIX: Don't expose Zod validation details to client
    return NextResponse.json({ error: 'Invalid quiz submission data' }, { status: 400 });
  }

  try {
    const attempt = await submitQuizAttempt(
      tenantId,
      parsed.data.quizId,
      session.user.id!,
      parsed.data.answers,
      parsed.data.attemptId
    );
    return NextResponse.json({
      attempt: {
        id: attempt.id,
        score: attempt.score,
        passed: attempt.passed,
        totalPoints: attempt.totalPoints,
        earnedPoints: attempt.earnedPoints,
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      const msg = error.message;
      // C3-SEC-S-004 FIX: Only return known safe business messages
      const safeMessages = ["Maximum attempts reached", "Quiz not found", "Enrollment not found", "Invalid question IDs submitted", "Already enrolled", "Required quizzes not passed", "Time limit exceeded", "Not enrolled in this course"];
      return NextResponse.json({ error: safeMessages.some(s => msg.includes(s)) ? msg : "Quiz submission failed" }, { status: 400 });
    }
    return NextResponse.json({ error: 'Quiz submission failed' }, { status: 500 });
  }
});
