export const dynamic = 'force-dynamic';

/**
 * GET /api/lms/quiz/results?quizId=xxx&attemptId=yyy
 * C3-LMS-L-002 FIX: Quiz results/feedback route for students.
 * Respects the quiz.showResults flag.
 */

import { NextRequest, NextResponse } from 'next/server';
import { withUserGuard } from '@/lib/user-api-guard';
import { prisma } from '@/lib/db';

export const GET = withUserGuard(async (request: NextRequest, { session }) => {
  const tenantId = session.user.tenantId;
  if (!tenantId) {
    return NextResponse.json({ error: 'No tenant context' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const quizId = searchParams.get('quizId');
  const attemptId = searchParams.get('attemptId');

  if (!quizId || !attemptId) {
    return NextResponse.json({ error: 'quizId and attemptId are required' }, { status: 400 });
  }

  // Verify the quiz exists and check showResults flag
  const quiz = await prisma.quiz.findFirst({
    where: { id: quizId, tenantId },
    select: { id: true, showResults: true, title: true, passingScore: true },
  });

  if (!quiz) {
    return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
  }

  // Verify the attempt belongs to this user
  const attempt = await prisma.quizAttempt.findFirst({
    where: { id: attemptId, quizId, userId: session.user.id!, tenantId },
    select: {
      id: true,
      score: true,
      totalPoints: true,
      earnedPoints: true,
      passed: true,
      answers: true,
      startedAt: true,
      completedAt: true,
      timeTaken: true,
    },
  });

  if (!attempt) {
    return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
  }

  // Basic result always available
  const result: Record<string, unknown> = {
    quizTitle: quiz.title,
    score: attempt.score,
    passed: attempt.passed,
    totalPoints: attempt.totalPoints,
    earnedPoints: attempt.earnedPoints,
    passingScore: quiz.passingScore,
    completedAt: attempt.completedAt,
    timeTaken: attempt.timeTaken,
  };

  // If showResults is enabled, include per-question feedback
  if (quiz.showResults) {
    const questions = await prisma.quizQuestion.findMany({
      where: { quizId },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        question: true,
        type: true,
        points: true,
        options: true,
        correctAnswer: true,
      },
    });

    const answers = attempt.answers as Array<{
      questionId: string;
      answer: unknown;
      isCorrect: boolean;
      points: number;
    }> | null;

    const answerMap = new Map(
      (answers || []).map(a => [a.questionId, a])
    );

    result.questions = questions.map(q => {
      const studentAnswer = answerMap.get(q.id);
      const options = q.options as Array<{ id: string; text: string; isCorrect?: boolean }> | null;

      return {
        id: q.id,
        question: q.question,
        type: q.type,
        points: q.points,
        studentAnswer: studentAnswer?.answer ?? null,
        isCorrect: studentAnswer?.isCorrect ?? false,
        earnedPoints: studentAnswer?.points ?? 0,
        // Show correct answer for non-sensitive question types
        correctAnswer: q.type === 'FILL_IN' ? q.correctAnswer : undefined,
        correctOptionIds: options?.filter(o => o.isCorrect).map(o => o.id) ?? [],
      };
    });
  }

  return NextResponse.json({ result });
}, { skipCsrf: true });
