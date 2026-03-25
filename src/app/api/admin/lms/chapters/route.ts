export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAdminGuard } from '@/lib/admin-api-guard';
import { apiSuccess, apiError } from '@/lib/api-response';
import { ErrorCode } from '@/lib/error-codes';
import { prisma } from '@/lib/db';

const createChapterSchema = z.object({
  courseId: z.string().min(1),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  sortOrder: z.number().int().min(0).optional(),
  isPublished: z.boolean().optional(),
});

export const GET = withAdminGuard(async (request: NextRequest, { session }) => {
  const tenantId = session.user.tenantId;
  const courseId = new URL(request.url).searchParams.get('courseId');
  if (!courseId) return apiError('courseId required', ErrorCode.VALIDATION_ERROR, { request });

  const chapters = await prisma.courseChapter.findMany({
    where: { tenantId, courseId },
    include: {
      lessons: {
        orderBy: { sortOrder: 'asc' },
        select: { id: true, title: true, type: true, sortOrder: true, isPublished: true, estimatedMinutes: true },
      },
    },
    orderBy: { sortOrder: 'asc' },
    take: 100,
  });

  return apiSuccess(chapters, { request });
});

export const POST = withAdminGuard(async (request: NextRequest, { session }) => {
  const tenantId = session.user.tenantId;
  const body = await request.json();
  const parsed = createChapterSchema.safeParse(body);
  if (!parsed.success) {
    return apiError('Validation failed', ErrorCode.VALIDATION_ERROR, { request });
  }

  const course = await prisma.course.findFirst({ where: { id: parsed.data.courseId, tenantId } });
  if (!course) return apiError('Course not found', ErrorCode.NOT_FOUND, { request, status: 404 });

  let sortOrder = parsed.data.sortOrder;
  if (sortOrder === undefined) {
    const last = await prisma.courseChapter.findFirst({
      where: { courseId: parsed.data.courseId, tenantId },
      orderBy: { sortOrder: 'desc' },
    });
    sortOrder = (last?.sortOrder ?? -1) + 1;
  }

  const chapter = await prisma.courseChapter.create({
    data: {
      tenantId,
      courseId: parsed.data.courseId,
      title: parsed.data.title,
      description: parsed.data.description,
      sortOrder,
      isPublished: parsed.data.isPublished ?? false,
    },
  });

  return apiSuccess(chapter, { request, status: 201 });
});
