export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { withAdminGuard } from '@/lib/admin-api-guard';
import { apiSuccess } from '@/lib/api-response';
import { getInstructors } from '@/lib/lms/lms-service';

export const GET = withAdminGuard(async (request: NextRequest, { session }) => {
  const instructors = await getInstructors(session.user.tenantId);
  return apiSuccess(instructors, { request });
});
