export const dynamic = 'force-dynamic';

/**
 * CRM Deal Detail API
 * GET    /api/admin/crm/deals/[id] -- Get single deal with all relations
 * PUT    /api/admin/crm/deals/[id] -- Update deal fields
 * DELETE /api/admin/crm/deals/[id] -- Delete a deal
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAdminGuard } from '@/lib/admin-api-guard';
import { prisma } from '@/lib/db';
import { apiSuccess, apiError, apiNoContent } from '@/lib/api-response';
import { ErrorCode } from '@/lib/error-codes';
import { logger } from '@/lib/logger';
import { Prisma } from '@prisma/client';

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const updateDealSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  value: z.union([z.string(), z.number()]).optional(),
  stageId: z.string().optional(),
  assignedToId: z.string().optional(),
  expectedCloseDate: z.string().datetime().optional().nullable(),
  actualCloseDate: z.string().datetime().optional().nullable(),
  lostReason: z.string().max(2000).optional().nullable(),
  wonReason: z.string().max(2000).optional().nullable(),
  tags: z.array(z.string()).optional(),
  customFields: z.record(z.unknown()).optional().nullable(),
});

// ---------------------------------------------------------------------------
// GET: Get single deal with all includes
// ---------------------------------------------------------------------------

export const GET = withAdminGuard(async (
  request: NextRequest,
  { params }: { session: unknown; params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;

    const deal = await prisma.crmDeal.findUnique({
      where: { id },
      include: {
        stage: true,
        pipeline: {
          include: {
            stages: { orderBy: { position: 'asc' } },
          },
        },
        assignedTo: { select: { id: true, name: true, email: true, image: true } },
        lead: true,
        contact: { select: { id: true, name: true, email: true, image: true } },
        tasks: {
          orderBy: { createdAt: 'desc' },
        },
        activities: {
          include: {
            performedBy: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        stageHistory: {
          include: {
            fromStage: { select: { id: true, name: true, color: true } },
            toStage: { select: { id: true, name: true, color: true } },
            changedBy: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!deal) {
      return apiError('Deal not found', ErrorCode.NOT_FOUND, { request });
    }

    return apiSuccess(deal, { request });
  } catch (error) {
    logger.error('[crm/deals/[id]] GET error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return apiError('Failed to fetch deal', ErrorCode.INTERNAL_ERROR, { request });
  }
});

// ---------------------------------------------------------------------------
// PUT: Update deal fields
// ---------------------------------------------------------------------------

export const PUT = withAdminGuard(async (
  request: NextRequest,
  { params }: { session: unknown; params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = updateDealSchema.safeParse(body);

    if (!parsed.success) {
      return apiError('Invalid input', ErrorCode.VALIDATION_ERROR, {
        request,
        details: parsed.error.flatten(),
      });
    }

    // Check deal exists
    const existing = await prisma.crmDeal.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return apiError('Deal not found', ErrorCode.NOT_FOUND, { request });
    }

    const data: Prisma.CrmDealUpdateInput = {};
    const {
      title, value, stageId, assignedToId,
      expectedCloseDate, actualCloseDate,
      lostReason, wonReason, tags, customFields,
    } = parsed.data;

    if (title !== undefined) data.title = title;
    if (value !== undefined) data.value = new Prisma.Decimal(String(value));
    if (stageId !== undefined) data.stage = { connect: { id: stageId } };
    if (assignedToId !== undefined) data.assignedTo = { connect: { id: assignedToId } };
    if (expectedCloseDate !== undefined) {
      data.expectedCloseDate = expectedCloseDate ? new Date(expectedCloseDate) : null;
    }
    if (actualCloseDate !== undefined) {
      data.actualCloseDate = actualCloseDate ? new Date(actualCloseDate) : null;
    }
    if (lostReason !== undefined) data.lostReason = lostReason;
    if (wonReason !== undefined) data.wonReason = wonReason;
    if (tags !== undefined) data.tags = tags;
    if (customFields !== undefined) {
      data.customFields = customFields ? JSON.parse(JSON.stringify(customFields)) : Prisma.JsonNull;
    }

    const deal = await prisma.crmDeal.update({
      where: { id },
      data,
      include: {
        stage: { select: { id: true, name: true, color: true, probability: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        lead: { select: { id: true, contactName: true } },
        contact: { select: { id: true, name: true, email: true } },
      },
    });

    logger.info('[crm/deals/[id]] Deal updated', { dealId: id });

    return apiSuccess(deal, { request });
  } catch (error) {
    logger.error('[crm/deals/[id]] PUT error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return apiError('Failed to update deal', ErrorCode.INTERNAL_ERROR, { request });
  }
});

// ---------------------------------------------------------------------------
// DELETE: Delete a deal
// ---------------------------------------------------------------------------

export const DELETE = withAdminGuard(async (
  request: NextRequest,
  { params }: { session: unknown; params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;

    const existing = await prisma.crmDeal.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return apiError('Deal not found', ErrorCode.NOT_FOUND, { request });
    }

    await prisma.crmDeal.delete({ where: { id } });

    logger.info('[crm/deals/[id]] Deal deleted', { dealId: id });

    return apiNoContent({ request });
  } catch (error) {
    logger.error('[crm/deals/[id]] DELETE error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return apiError('Failed to delete deal', ErrorCode.INTERNAL_ERROR, { request });
  }
});
