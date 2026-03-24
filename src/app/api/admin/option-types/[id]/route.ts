export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/db';
import { withAdminGuard } from '@/lib/admin-api-guard';
import { apiSuccess, apiError } from '@/lib/api-response';
import { z } from 'zod';

const updateSchema = z.object({
  label: z.string().min(1).max(100).optional(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

// PUT /api/admin/option-types/[id] — Update a format type
export const PUT = withAdminGuard(async (request, { params }) => {
  const { id } = await params;

  const existing = await prisma.formatTypeOption.findUnique({ where: { id } });
  if (!existing) {
    return apiError('Option type not found', 'NOT_FOUND', { status: 404 });
  }

  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return apiError('Validation error', 'VALIDATION_ERROR', { details: parsed.error.flatten().fieldErrors });
  }

  const updated = await prisma.formatTypeOption.update({
    where: { id },
    data: parsed.data,
  });

  return apiSuccess(updated, { request });
}, { requiredPermission: 'products.manage_options' });

// DELETE /api/admin/option-types/[id] — Delete a format type (only if unused)
export const DELETE = withAdminGuard(async (request, { params }) => {
  const { id } = await params;

  const existing = await prisma.formatTypeOption.findUnique({ where: { id } });
  if (!existing) {
    return apiError('Option type not found', 'NOT_FOUND', { status: 404 });
  }

  // Check if any ProductOption uses this type
  const usageCount = await prisma.productOption.count({
    where: { optionType: existing.value },
  });

  if (usageCount > 0) {
    return apiError(`Ce type est utilisé par ${usageCount} format(s). Désactivez-le plutôt.`, 'VALIDATION_ERROR', { status: 409, request });
  }

  await prisma.formatTypeOption.delete({ where: { id } });

  return apiSuccess({ deleted: true }, { request });
}, { requiredPermission: 'products.manage_options' });
