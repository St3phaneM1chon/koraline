export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAdminGuard } from '@/lib/admin-api-guard';
import { apiSuccess, apiError } from '@/lib/api-response';
import { ErrorCode } from '@/lib/error-codes';
import { prisma } from '@/lib/db';
import type { CertificateStatus } from '@prisma/client';

export const GET = withAdminGuard(async (request: NextRequest, { session }) => {
  const tenantId = session.user.tenantId;
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') as CertificateStatus | null;
  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10), 100);

  const where = {
    tenantId,
    ...(status && { status }),
  };

  const [certificates, total] = await Promise.all([
    prisma.certificate.findMany({
      where,
      include: {
        template: { select: { name: true } },
      },
      orderBy: { issuedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.certificate.count({ where }),
  ]);

  return apiSuccess(
    { certificates, total, page, limit, totalPages: Math.ceil(total / limit) },
    { request }
  );
});

// P11-06 FIX: Admin certificate revocation endpoint
const revokeSchema = z.object({
  certificateId: z.string().min(1),
  action: z.enum(['revoke']),
  reason: z.string().min(1).max(500),
});

export const PATCH = withAdminGuard(async (request: NextRequest, { session }) => {
  const tenantId = session.user.tenantId;
  const body = await request.json();
  const parsed = revokeSchema.safeParse(body);

  if (!parsed.success) {
    return apiError('Invalid input', ErrorCode.VALIDATION_ERROR, { request, status: 400 });
  }

  const cert = await prisma.certificate.findFirst({
    where: { id: parsed.data.certificateId, tenantId },
  });
  if (!cert) {
    return apiError('Certificate not found', ErrorCode.NOT_FOUND, { request, status: 404 });
  }
  if (cert.status === 'REVOKED') {
    return apiError('Certificate already revoked', ErrorCode.VALIDATION_ERROR, { request, status: 400 });
  }

  const updated = await prisma.certificate.update({
    where: { id: parsed.data.certificateId },
    data: {
      status: 'REVOKED',
      revokedAt: new Date(),
      revokedReason: parsed.data.reason,
    },
  });

  return apiSuccess(updated, { request });
});
