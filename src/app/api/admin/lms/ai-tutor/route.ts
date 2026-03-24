export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAdminGuard } from '@/lib/admin-api-guard';
import { apiSuccess, apiError } from '@/lib/api-response';
import { ErrorCode } from '@/lib/error-codes';
import { prisma } from '@/lib/db';

export const GET = withAdminGuard(async (request: NextRequest, { session }) => {
  const tenantId = session.user.tenantId;
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10), 100);

  const [subscriptions, total, totalSessions, totalMessages] = await Promise.all([
    prisma.aiTutorSubscription.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.aiTutorSubscription.count({ where: { tenantId } }),
    prisma.aiTutorSession.count({ where: { tenantId } }),
    prisma.aiTutorMessage.count({
      where: { session: { tenantId } },
    }),
  ]);

  return apiSuccess({
    subscriptions,
    total,
    page,
    limit,
    stats: { totalSessions, totalMessages },
  }, { request });
});

const knowledgeSchema = z.object({
  domain: z.string().min(1).max(50),
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  source: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const POST = withAdminGuard(async (request: NextRequest, { session }) => {
  const tenantId = session.user.tenantId;
  const body = await request.json();

  // Admin can add knowledge to the AI Tutor's RAG database
  const parsed = knowledgeSchema.safeParse(body);
  if (!parsed.success) {
    return apiError('Validation failed', ErrorCode.VALIDATION_ERROR, { request });
  }

  const knowledge = await prisma.aiTutorKnowledge.create({
    data: {
      tenantId,
      domain: parsed.data.domain,
      title: parsed.data.title,
      content: parsed.data.content,
      source: parsed.data.source,
      metadata: (parsed.data.metadata ?? {}) as Record<string, string>,
    },
  });

  return apiSuccess(knowledge, { request, status: 201 });
});
