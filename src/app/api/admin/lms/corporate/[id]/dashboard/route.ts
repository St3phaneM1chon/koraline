export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { withAdminGuard } from '@/lib/admin-api-guard';
import { apiSuccess, apiError } from '@/lib/api-response';
import { ErrorCode } from '@/lib/error-codes';
import { getCorporateDashboardStats } from '@/lib/lms/lms-service';

export const GET = withAdminGuard(async (request: NextRequest, { session, params }) => {
  const tenantId = session.user.tenantId;
  const { id } = await params;

  try {
    const stats = await getCorporateDashboardStats(tenantId, id);
    return apiSuccess(stats, { request });
  } catch {
    return apiError('Corporate account not found', ErrorCode.NOT_FOUND, { request, status: 404 });
  }
});
