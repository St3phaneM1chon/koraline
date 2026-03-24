export const dynamic = 'force-dynamic';

/**
 * Diagnostic Quiz API
 * GET  /api/lms/diagnostic?courseId=xxx → returns diagnostic quiz questions
 * POST /api/lms/diagnostic → evaluates answers and returns results + lessonsToSkip
 *
 * SEC-HARDENING: Wrapped with withUserGuard for centralized auth + CSRF + rate limiting.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withUserGuard } from '@/lib/user-api-guard';
import { generateDiagnosticQuiz, evaluateDiagnostic } from '@/lib/lms/diagnostic-service';

const evaluateDiagnosticSchema = z.object({
  courseId: z.string().min(1),
  answers: z.array(z.object({
    questionId: z.string().min(1),
    answer: z.union([z.string(), z.array(z.string())]),
    responseTimeSec: z.number().min(0).max(600), // Max 10 minutes per question
  })).min(1).max(20),
});

export const GET = withUserGuard(async (request: NextRequest, { session }) => {
  const tenantId = session.user.tenantId;
  if (!tenantId) {
    return NextResponse.json({ error: 'No tenant context' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const courseId = searchParams.get('courseId');

  if (!courseId) {
    return NextResponse.json({ error: 'courseId is required' }, { status: 400 });
  }

  try {
    const questions = await generateDiagnosticQuiz(tenantId, courseId);
    return NextResponse.json({ questions, count: questions.length });
  } catch (error) {
    if (error instanceof Error) {
      const safeMessages = ['Course not found'];
      return NextResponse.json(
        { error: safeMessages.some(s => error.message.includes(s)) ? error.message : 'Failed to generate diagnostic quiz' },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: 'Failed to generate diagnostic quiz' }, { status: 500 });
  }
}, { skipCsrf: true });

export const POST = withUserGuard(async (request: NextRequest, { session }) => {
  const tenantId = session.user.tenantId;
  if (!tenantId) {
    return NextResponse.json({ error: 'No tenant context' }, { status: 403 });
  }

  const body = await request.json();
  const parsed = evaluateDiagnosticSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid diagnostic submission data' }, { status: 400 });
  }

  try {
    const results = await evaluateDiagnostic(
      tenantId,
      session.user.id!,
      parsed.data.courseId,
      parsed.data.answers
    );

    return NextResponse.json({
      results: results.results,
      knownConcepts: results.knownConcepts,
      unknownConcepts: results.unknownConcepts,
      lessonsToSkip: results.lessonsToSkip,
    });
  } catch (error) {
    if (error instanceof Error) {
      const safeMessages = ['Course not found', 'Diagnostic not found', 'Already completed'];
      return NextResponse.json(
        { error: safeMessages.some(s => error.message.includes(s)) ? error.message : 'Diagnostic evaluation failed' },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: 'Diagnostic evaluation failed' }, { status: 500 });
  }
});
