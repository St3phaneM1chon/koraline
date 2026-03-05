export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAdminGuard } from '@/lib/admin-api-guard';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import { apiSuccess, apiError, apiNoContent } from '@/lib/api-response';

// ---------------------------------------------------------------------------
// Zod Schemas
// ---------------------------------------------------------------------------

const conditionSchema = z.object({
  field: z.string().min(1),
  operator: z.enum(['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'in', 'contains']),
  value: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]),
});

const actionSchema = z.object({
  type: z.enum(['REQUIRE_APPROVAL', 'SEND_NOTIFICATION', 'AUTO_APPROVE', 'BLOCK']),
  params: z
    .object({
      role: z.string().optional(),
      userId: z.string().optional(),
      message: z.string().optional(),
      expiresInDays: z.number().int().positive().optional(),
    })
    .optional(),
});

const updateWorkflowSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional().nullable(),
  trigger: z.string().min(1).optional(),
  conditions: z.array(conditionSchema).optional(),
  actions: z.array(actionSchema).min(1).optional(),
  priority: z.number().int().min(0).max(1000).optional(),
  isActive: z.boolean().optional(),
});

// ---------------------------------------------------------------------------
// GET /api/accounting/workflows/[id] - Get single workflow
// ---------------------------------------------------------------------------

export const GET = withAdminGuard(async (request: NextRequest, { params }) => {
  try {
    const { id } = params;

    const workflow = await prisma.workflow.findUnique({
      where: { id },
    });

    if (!workflow) {
      return apiError('Workflow not found', 'NOT_FOUND', { status: 404, request });
    }

    return apiSuccess(
      {
        ...workflow,
        conditions: workflow.conditions ?? [],
        actions: workflow.actions,
      },
      { request },
    );
  } catch (error) {
    logger.error('Error fetching workflow', {
      error: error instanceof Error ? error.message : String(error),
    });
    return apiError('Error fetching workflow', 'INTERNAL_ERROR', { status: 500, request });
  }
});

// ---------------------------------------------------------------------------
// PUT /api/accounting/workflows/[id] - Update workflow
// ---------------------------------------------------------------------------

export const PUT = withAdminGuard(async (request: NextRequest, { params }) => {
  try {
    const { id } = params;

    const existing = await prisma.workflow.findUnique({ where: { id } });
    if (!existing) {
      return apiError('Workflow not found', 'NOT_FOUND', { status: 404, request });
    }

    const body = await request.json();
    const parsed = updateWorkflowSchema.safeParse(body);

    if (!parsed.success) {
      return apiError('Invalid data', 'VALIDATION_ERROR', {
        status: 400,
        details: parsed.error.flatten().fieldErrors,
        request,
      });
    }

    const data = parsed.data;

    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.trigger !== undefined) updateData.trigger = data.trigger;
    if (data.conditions !== undefined) updateData.conditions = data.conditions;
    if (data.actions !== undefined) updateData.actions = data.actions;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const updated = await prisma.workflow.update({
      where: { id },
      data: updateData,
    });

    logger.info('Workflow updated', {
      workflowId: id,
      changes: Object.keys(updateData),
    });

    return apiSuccess(
      {
        ...updated,
        conditions: updated.conditions ?? [],
        actions: updated.actions,
      },
      { request },
    );
  } catch (error) {
    logger.error('Error updating workflow', {
      error: error instanceof Error ? error.message : String(error),
    });
    return apiError('Error updating workflow', 'INTERNAL_ERROR', { status: 500, request });
  }
});

// ---------------------------------------------------------------------------
// DELETE /api/accounting/workflows/[id] - Delete workflow
// ---------------------------------------------------------------------------

export const DELETE = withAdminGuard(async (request: NextRequest, { params, session }) => {
  try {
    const { id } = params;

    const existing = await prisma.workflow.findUnique({ where: { id } });
    if (!existing) {
      return apiError('Workflow not found', 'NOT_FOUND', { status: 404, request });
    }

    await prisma.workflow.delete({
      where: { id },
    });

    logger.info('Workflow deleted', {
      workflowId: id,
      deletedBy: session.user?.email,
    });

    return apiNoContent({ request });
  } catch (error) {
    logger.error('Error deleting workflow', {
      error: error instanceof Error ? error.message : String(error),
    });
    return apiError('Error deleting workflow', 'INTERNAL_ERROR', { status: 500, request });
  }
});
