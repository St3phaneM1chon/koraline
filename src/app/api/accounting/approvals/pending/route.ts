export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { withAdminGuard } from '@/lib/admin-api-guard';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import { apiSuccess, apiError } from '@/lib/api-response';
import { Prisma } from '@prisma/client';

// ---------------------------------------------------------------------------
// GET /api/accounting/approvals/pending - Pending approvals for current user
// ---------------------------------------------------------------------------

export const GET = withAdminGuard(async (request: NextRequest, { session }) => {
  try {
    const userId = session.user?.id;
    const userRole = session.user?.role as string | undefined;

    // Auto-expire overdue PENDING requests
    const now = new Date();
    await prisma.approvalRequest.updateMany({
      where: {
        status: 'PENDING',
        expiresAt: { lt: now },
      },
      data: { status: 'EXPIRED' },
    });

    // Find pending approvals assigned to this user or their role
    const where: Prisma.ApprovalRequestWhereInput = {
      status: 'PENDING',
      OR: [
        { assignedTo: userId },
        ...(userRole ? [{ assignedRole: userRole }] : []),
      ],
    };

    const approvals = await prisma.approvalRequest.findMany({
      where,
      include: { workflowRule: { select: { id: true, name: true } } },
      orderBy: { requestedAt: 'desc' },
    });

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
    }));

    return apiSuccess({ count: mapped.length, approvals: mapped }, { request });
  } catch (error) {
    logger.error('Error fetching pending approvals', {
      error: error instanceof Error ? error.message : String(error),
    });
    return apiError('Error fetching pending approvals', 'INTERNAL_ERROR', { status: 500, request });
  }
});
