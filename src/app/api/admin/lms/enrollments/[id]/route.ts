export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAdminGuard } from '@/lib/admin-api-guard';
import { apiSuccess, apiError } from '@/lib/api-response';
import { ErrorCode } from '@/lib/error-codes';
import { prisma } from '@/lib/db';

const updateSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED', 'CANCELLED']),
});

const VALID_TRANSITIONS: Record<string, string[]> = {
  ACTIVE: ['SUSPENDED', 'CANCELLED'],
  SUSPENDED: ['ACTIVE', 'CANCELLED'],
  CANCELLED: [],
  COMPLETED: [],
  EXPIRED: [],
};

// P11-07 FIX: Enrollment status management with valid state transitions
export const PATCH = withAdminGuard(async (request: NextRequest, { session, params }) => {
  const tenantId = session.user.tenantId;
  const { id } = await params;
  const body = await request.json();
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return apiError('Invalid input', ErrorCode.VALIDATION_ERROR, { request, status: 400 });
  }

  const enrollment = await prisma.enrollment.findFirst({
    where: { id, tenantId },
    select: { id: true, status: true },
  });

  if (!enrollment) {
    return apiError('Enrollment not found', ErrorCode.NOT_FOUND, { request, status: 404 });
  }

  const allowed = VALID_TRANSITIONS[enrollment.status] ?? [];
  if (!allowed.includes(parsed.data.status)) {
    return apiError(
      `Cannot transition from ${enrollment.status} to ${parsed.data.status}`,
      ErrorCode.VALIDATION_ERROR,
      { request, status: 400 }
    );
  }

  const updated = await prisma.enrollment.update({
    where: { id },
    data: { status: parsed.data.status as any },
  });

  return apiSuccess(updated, { request });
});
