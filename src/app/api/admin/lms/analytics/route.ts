export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { withAdminGuard } from '@/lib/admin-api-guard';
import { apiSuccess } from '@/lib/api-response';
import { getLmsDashboardStats } from '@/lib/lms/lms-service';

export const GET = withAdminGuard(async (request: NextRequest, { session }) => {
  const stats = await getLmsDashboardStats(session.user.tenantId);
  return apiSuccess(stats, { request });
});
