export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { withAdminGuard } from '@/lib/admin-api-guard';
import { apiSuccess, apiError } from '@/lib/api-response';
import { ErrorCode } from '@/lib/error-codes';
import { getAuditLogs } from '@/lib/lms/audit-trail';

export const GET = withAdminGuard(async (request: NextRequest, { session }) => {
  const tenantId = session.user.tenantId;
  const { searchParams } = new URL(request.url);

  const entity = searchParams.get('entity') ?? undefined;
  const userId = searchParams.get('userId') ?? undefined;
  const action = searchParams.get('action') ?? undefined;
  const from = searchParams.get('from') ? new Date(searchParams.get('from')!) : undefined;
  const to = searchParams.get('to') ? new Date(searchParams.get('to')!) : undefined;
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50', 10), 200);
  const offset = parseInt(searchParams.get('offset') ?? '0', 10);

  if (!tenantId) return apiError('No tenant', ErrorCode.FORBIDDEN, { request, status: 403 });

  const result = await getAuditLogs(tenantId, { entity, userId, action, from, to, limit, offset });
  return apiSuccess(result, { request });
});
