export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAdminGuard } from '@/lib/admin-api-guard';
import { apiSuccess, apiError } from '@/lib/api-response';
import { ErrorCode } from '@/lib/error-codes';
import { prisma } from '@/lib/db';

const createLessonSchema = z.object({
  chapterId: z.string().min(1),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  type: z.enum(['VIDEO', 'TEXT', 'QUIZ', 'EXERCISE', 'DOCUMENT', 'SCORM', 'LIVE_SESSION']).optional(),
  sortOrder: z.number().int().min(0).optional(),
  isPublished: z.boolean().optional(),
  isFree: z.boolean().optional(),
  textContent: z.string().optional(),
  videoUrl: z.string().url().optional(),
  videoDuration: z.number().int().min(0).optional(),
  documentUrl: z.string().url().optional(),
  quizId: z.string().optional(),
  exerciseInstructions: z.string().optional(),
  exerciseSubmissionType: z.enum(['text', 'file', 'url']).optional(),
  estimatedMinutes: z.number().int().min(1).optional(),
});

export const GET = withAdminGuard(async (request: NextRequest, { session }) => {
  const tenantId = session.user.tenantId;
  const chapterId = new URL(request.url).searchParams.get('chapterId');
  if (!chapterId) return apiError('chapterId required', ErrorCode.VALIDATION_ERROR, { request });

  const lessons = await prisma.lesson.findMany({
    where: { tenantId, chapterId },
    orderBy: { sortOrder: 'asc' },
    take: 200,
  });

  return apiSuccess(lessons, { request });
});

export const POST = withAdminGuard(async (request: NextRequest, { session }) => {
  const tenantId = session.user.tenantId;
  const body = await request.json();
  const parsed = createLessonSchema.safeParse(body);
  if (!parsed.success) {
    return apiError('Validation failed', ErrorCode.VALIDATION_ERROR, { request });
  }

  const chapter = await prisma.courseChapter.findFirst({ where: { id: parsed.data.chapterId, tenantId } });
  if (!chapter) return apiError('Chapter not found', ErrorCode.NOT_FOUND, { request, status: 404 });

  let sortOrder = parsed.data.sortOrder;
  if (sortOrder === undefined) {
    const last = await prisma.lesson.findFirst({
      where: { chapterId: parsed.data.chapterId },
      orderBy: { sortOrder: 'desc' },
    });
    sortOrder = (last?.sortOrder ?? -1) + 1;
  }

  const lesson = await prisma.lesson.create({
    data: {
      tenantId,
      chapterId: parsed.data.chapterId,
      title: parsed.data.title,
      description: parsed.data.description,
      type: parsed.data.type ?? 'TEXT',
      sortOrder,
      isPublished: parsed.data.isPublished ?? false,
      isFree: parsed.data.isFree ?? false,
      textContent: parsed.data.textContent,
      videoUrl: parsed.data.videoUrl,
      videoDuration: parsed.data.videoDuration,
      documentUrl: parsed.data.documentUrl,
      quizId: parsed.data.quizId,
      exerciseInstructions: parsed.data.exerciseInstructions,
      exerciseSubmissionType: parsed.data.exerciseSubmissionType,
      estimatedMinutes: parsed.data.estimatedMinutes ?? 10,
    },
  });

  return apiSuccess(lesson, { request, status: 201 });
});
