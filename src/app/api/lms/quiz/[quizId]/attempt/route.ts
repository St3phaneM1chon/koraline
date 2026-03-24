export const dynamic = 'force-dynamic';

/**
 * Student quiz attempt API
 * GET  /api/lms/quiz/[quizId]/attempt — Get previous attempts for current user
 * POST /api/lms/quiz/[quizId]/attempt — Start a new attempt (returns questions without answers)
 *
 * SEC-HARDENING: Wrapped with withUserGuard for centralized auth + CSRF + rate limiting.
 */
import { NextRequest, NextResponse } from 'next/server';
import { withUserGuard } from '@/lib/user-api-guard';
import { prisma } from '@/lib/db';

export const GET = withUserGuard(async (_request: NextRequest, { session, params }) => {
  const tenantId = session.user.tenantId;
  if (!tenantId) {
    return NextResponse.json({ error: 'No tenant context' }, { status: 403 });
  }

  const quizId = params?.quizId;
  if (!quizId) {
    return NextResponse.json({ error: 'quizId is required' }, { status: 400 });
  }

  const attempts = await prisma.quizAttempt.findMany({
    where: { quizId, userId: session.user.id!, tenantId },
    orderBy: { startedAt: 'desc' },
    select: {
      id: true,
      score: true,
      totalPoints: true,
      earnedPoints: true,
      passed: true,
      startedAt: true,
      completedAt: true,
      timeTaken: true,
    },
  });

  const quiz = await prisma.quiz.findFirst({
    where: { id: quizId, tenantId },
    select: { maxAttempts: true, passingScore: true },
  });

  return NextResponse.json({
    attempts,
    maxAttempts: quiz?.maxAttempts ?? 3,
    passingScore: quiz?.passingScore ?? 70,
    attemptsUsed: attempts.length,
    canAttempt: quiz ? attempts.length < quiz.maxAttempts : false,
  });
}, { skipCsrf: true });

export const POST = withUserGuard(async (_request: NextRequest, { session, params }) => {
  const tenantId = session.user.tenantId;
  if (!tenantId) {
    return NextResponse.json({ error: 'No tenant context' }, { status: 403 });
  }

  const quizId = params?.quizId;
  if (!quizId) {
    return NextResponse.json({ error: 'quizId is required' }, { status: 400 });
  }

  // Fetch quiz with questions
  const quiz = await prisma.quiz.findFirst({
    where: { id: quizId, tenantId },
    include: {
      questions: {
        orderBy: { sortOrder: 'asc' },
      },
    },
  });

  if (!quiz) {
    return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
  }

  // Check max attempts
  const attemptCount = await prisma.quizAttempt.count({
    where: { quizId, userId: session.user.id!, tenantId },
  });

  if (attemptCount >= quiz.maxAttempts) {
    return NextResponse.json({ error: 'Maximum attempts reached' }, { status: 400 });
  }

  // Strip answers from questions - return only what the student needs
  const questions = quiz.questions.map((q) => {
    const options = q.options as Array<{ id: string; text: string; isCorrect?: boolean }>;
    return {
      id: q.id,
      type: q.type,
      question: q.question,
      points: q.points,
      sortOrder: q.sortOrder,
      // Strip isCorrect from options so students cannot see answers
      options: options.map(({ id, text }) => ({ id, text })),
      // Never send correctAnswer or matchingPairs
    };
  });

  // C3-BIZ-B-008 FIX: Use Fisher-Yates shuffle for uniform randomization
  let finalQuestions = questions;
  if (quiz.shuffleQuestions) {
    finalQuestions = [...questions];
    for (let i = finalQuestions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [finalQuestions[i], finalQuestions[j]] = [finalQuestions[j], finalQuestions[i]];
    }
  }

  return NextResponse.json({
    quiz: {
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      timeLimit: quiz.timeLimit,
      passingScore: quiz.passingScore,
      showResults: quiz.showResults,
    },
    questions: finalQuestions,
    attemptNumber: attemptCount + 1,
    attemptsRemaining: quiz.maxAttempts - attemptCount - 1,
  });
});
