export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAdminGuard } from '@/lib/admin-api-guard';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import { apiSuccess, apiError, apiPaginated } from '@/lib/api-response';

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

const createWorkflowSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().max(1000).optional(),
  trigger: z.string().min(1, 'Trigger is required'),
  conditions: z.array(conditionSchema).optional(),
  actions: z.array(actionSchema).min(1, 'At least one action is required'),
  priority: z.number().int().min(0).max(1000).default(0),
  isActive: z.boolean().default(true),
});

// ---------------------------------------------------------------------------
// GET /api/accounting/workflows - List workflows
// ---------------------------------------------------------------------------

export const GET = withAdminGuard(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const trigger = searchParams.get('trigger');
    const isActive = searchParams.get('isActive');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(Math.max(1, parseInt(searchParams.get('limit') || '50') || 50), 200);

    // Build where clause
    const where: Record<string, unknown> = {};
    if (trigger) where.trigger = trigger;
    if (isActive !== null && isActive !== undefined && isActive !== '') {
      where.isActive = isActive === 'true';
    }

    const [workflows, total] = await Promise.all([
      prisma.workflow.findMany({
        where,
        orderBy: { priority: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.workflow.count({ where }),
    ]);

    // Serialize for response
    const mapped = workflows.map((rule: typeof workflows[number]) => ({
      ...rule,
      conditions: rule.conditions ?? [],
      actions: rule.actions,
    }));

    return apiPaginated(mapped, page, limit, total, { request });
  } catch (error) {
    logger.error('Error fetching workflows', {
      error: error instanceof Error ? error.message : String(error),
    });
    return apiError('Error fetching workflows', 'INTERNAL_ERROR', { status: 500, request });
  }
});

// ---------------------------------------------------------------------------
// POST /api/accounting/workflows - Create workflow
// ---------------------------------------------------------------------------

export const POST = withAdminGuard(async (request: NextRequest, { session }) => {
  try {
    const body = await request.json();
    const parsed = createWorkflowSchema.safeParse(body);

    if (!parsed.success) {
      return apiError('Invalid data', 'VALIDATION_ERROR', {
        status: 400,
        details: parsed.error.flatten().fieldErrors,
        request,
      });
    }

    const data = parsed.data;

    const workflow = await prisma.workflow.create({
      data: {
        name: data.name,
        description: data.description || null,
        trigger: data.trigger,
        conditions: data.conditions ?? [],
        actions: data.actions,
        priority: data.priority,
        isActive: data.isActive,
        createdBy: session.user?.email || null,
      },
    });

    logger.info('Workflow created', {
      workflowId: workflow.id,
      name: workflow.name,
      trigger: workflow.trigger,
      createdBy: session.user?.email,
    });

    return apiSuccess(
      {
        ...workflow,
        conditions: workflow.conditions ?? [],
        actions: workflow.actions,
      },
      { status: 201, request },
    );
  } catch (error) {
    logger.error('Error creating workflow', {
      error: error instanceof Error ? error.message : String(error),
    });
    return apiError('Error creating workflow', 'INTERNAL_ERROR', { status: 500, request });
  }
});
