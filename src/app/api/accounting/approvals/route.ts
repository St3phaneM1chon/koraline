export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { withAdminGuard } from '@/lib/admin-api-guard';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import { apiError, apiPaginated } from '@/lib/api-response';

// ---------------------------------------------------------------------------
// GET /api/accounting/approvals - List approval requests with filtering
// ---------------------------------------------------------------------------

export const GET = withAdminGuard(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const entityType = searchParams.get('entityType');
    const assignedRole = searchParams.get('assignedRole');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(Math.max(1, parseInt(searchParams.get('limit') || '20') || 20), 100);

    // Build where clause
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (entityType) where.entityType = entityType;
    if (assignedRole) where.assignedRole = assignedRole;

    // Auto-expire overdue PENDING requests
    const now = new Date();
    await prisma.approvalRequest.updateMany({
      where: {
        status: 'PENDING',
        expiresAt: { lt: now },
      },
      data: { status: 'EXPIRED' },
    });

    const [approvals, total] = await Promise.all([
      prisma.approvalRequest.findMany({
        where,
        include: { workflowRule: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.approvalRequest.count({ where }),
    ]);

    const mapped = approvals.map((a) => ({
      id: a.id,
      workflowRuleId: a.workflowRuleId,
      workflowRuleName: a.workflowRule?.name ?? null,
      entityType: a.entityType,
      entityId: a.entityId,
      entitySummary: a.entitySummary,
      amount: a.amount ? Number(a.amount) : null,
      status: a.status,
      requestedBy: a.requestedBy,
      requestedAt: a.requestedAt,
      assignedRole: a.assignedRole,
      assignedTo: a.assignedTo,
      expiresAt: a.expiresAt,
      respondedBy: a.respondedBy,
      respondedAt: a.respondedAt,
      responseNote: a.responseNote,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
    }));

    return apiPaginated(mapped, page, limit, total, { request });
  } catch (error) {
    logger.error('Error fetching approval requests', {
      error: error instanceof Error ? error.message : String(error),
    });
    return apiError('Error fetching approval requests', 'INTERNAL_ERROR', { status: 500, request });
  }
});
