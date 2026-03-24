export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAdminGuard } from '@/lib/admin-api-guard';
import { apiSuccess, apiError } from '@/lib/api-response';
import { ErrorCode } from '@/lib/error-codes';
import { prisma } from '@/lib/db';

const createQuizSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  timeLimit: z.number().int().min(1).optional(),
  maxAttempts: z.number().int().min(1).max(100).optional(),
  passingScore: z.number().int().min(0).max(100).optional(),
  shuffleQuestions: z.boolean().optional(),
  showResults: z.boolean().optional(),
  questions: z.array(z.object({
    type: z.enum(['MULTIPLE_CHOICE', 'TRUE_FALSE', 'FILL_IN', 'MATCHING', 'ORDERING']).optional(),
    question: z.string().min(1),
    explanation: z.string().optional(),
    points: z.number().int().min(1).optional(),
    sortOrder: z.number().int().min(0).optional(),
    options: z.array(z.object({
      id: z.string(),
      text: z.string(),
      isCorrect: z.boolean(),
    })).optional(),
    correctAnswer: z.string().optional(),
    caseSensitive: z.boolean().optional(),
    matchingPairs: z.array(z.object({
      left: z.string(),
      right: z.string(),
    })).optional(),
  })).optional(),
});

export const GET = withAdminGuard(async (request: NextRequest, { session }) => {
  const tenantId = session.user.tenantId;
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10), 100);

  const [quizzes, total] = await Promise.all([
    prisma.quiz.findMany({
      where: { tenantId },
      include: {
        _count: { select: { questions: true, attempts: true } },
        lesson: { select: { id: true, title: true, chapter: { select: { course: { select: { title: true } } } } } },
      },
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.quiz.count({ where: { tenantId } }),
  ]);

  return apiSuccess({ quizzes, total, page, limit }, { request });
});

export const POST = withAdminGuard(async (request: NextRequest, { session }) => {
  const tenantId = session.user.tenantId;
  const body = await request.json();
  const parsed = createQuizSchema.safeParse(body);
  if (!parsed.success) {
    return apiError('Validation failed', ErrorCode.VALIDATION_ERROR, { request });
  }

  const quiz = await prisma.quiz.create({
    data: {
      tenantId,
      title: parsed.data.title,
      description: parsed.data.description,
      timeLimit: parsed.data.timeLimit,
      maxAttempts: parsed.data.maxAttempts ?? 3,
      passingScore: parsed.data.passingScore ?? 70,
      shuffleQuestions: parsed.data.shuffleQuestions ?? false,
      showResults: parsed.data.showResults ?? true,
      questions: parsed.data.questions ? {
        create: parsed.data.questions.map((q, i) => ({
          type: q.type ?? 'MULTIPLE_CHOICE',
          question: q.question,
          explanation: q.explanation,
          points: q.points ?? 1,
          sortOrder: q.sortOrder ?? i,
          options: q.options ?? [],
          correctAnswer: q.correctAnswer,
          caseSensitive: q.caseSensitive ?? false,
          matchingPairs: q.matchingPairs,
        })),
      } : undefined,
    },
    include: { questions: true },
  });

  return apiSuccess(quiz, { request, status: 201 });
});
