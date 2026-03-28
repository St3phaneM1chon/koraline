export const dynamic = 'force-dynamic';

/**
 * Admin Form Submissions API
 * GET — List submissions for a given form (paginated)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAdminGuard } from '@/lib/admin-api-guard';
import { logger } from '@/lib/logger';

export const GET = withAdminGuard(async (request: NextRequest, ctx) => {
  try {
    const params = ctx?.params ? (typeof ctx.params.then === 'function' ? await ctx.params : ctx.params) : {};
    const formId = params?.id;
    if (!formId) {
      return NextResponse.json({ error: 'Form ID required' }, { status: 400 });
    }

    // Verify form exists
    const form = await prisma.formDefinition.findUnique({
      where: { id: formId },
      select: { id: true, name: true, fields: true },
    });
    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
    const skip = (page - 1) * limit;

    const [submissions, total] = await Promise.all([
      prisma.formSubmission.findMany({
        where: { formId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          data: true,
          ip: true,
          userAgent: true,
          createdAt: true,
        },
      }),
      prisma.formSubmission.count({ where: { formId } }),
    ]);

    return NextResponse.json({
      submissions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      form: { id: form.id, name: form.name, fields: form.fields },
    });
  } catch (error) {
    logger.error('[Admin Form Submissions GET]', { error });
    return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 });
  }
});
