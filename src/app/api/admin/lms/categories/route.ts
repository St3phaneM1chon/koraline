export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAdminGuard } from '@/lib/admin-api-guard';
import { apiSuccess, apiError } from '@/lib/api-response';
import { ErrorCode } from '@/lib/error-codes';
import { prisma } from '@/lib/db';
import { getCourseCategories } from '@/lib/lms/lms-service';

const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  description: z.string().max(1000).optional(),
  parentId: z.string().optional(),
  sortOrder: z.number().int().min(0).optional(),
  imageUrl: z.string().url().optional(),
});

export const GET = withAdminGuard(async (request: NextRequest, { session }) => {
  const categories = await getCourseCategories(session.user.tenantId);
  return apiSuccess(categories, { request });
});

export const POST = withAdminGuard(async (request: NextRequest, { session }) => {
  const tenantId = session.user.tenantId;
  const body = await request.json();
  const parsed = createCategorySchema.safeParse(body);
  if (!parsed.success) {
    return apiError('Validation failed', ErrorCode.VALIDATION_ERROR, { request });
  }

  try {
    const category = await prisma.courseCategory.create({
      data: { tenantId, ...parsed.data },
    });
    return apiSuccess(category, { request, status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return apiError('Category slug already exists', ErrorCode.CONFLICT, { request, status: 409 });
    }
    throw error;
  }
});
