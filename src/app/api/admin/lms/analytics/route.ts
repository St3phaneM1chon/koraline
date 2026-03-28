export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { withAdminGuard } from '@/lib/admin-api-guard';
import { apiSuccess } from '@/lib/api-response';
import { getLmsDashboardStats } from '@/lib/lms/lms-service';

export const GET = withAdminGuard(async (request: NextRequest, { session }) => {
  try {
    const stats = await getLmsDashboardStats(session.user.tenantId);
    return apiSuccess(stats, { request });
  } catch {
    // Graceful degradation: return zeroed stats instead of 500 when tenant has no LMS data
    return apiSuccess({
      totalCourses: 0,
      publishedCourses: 0,
      totalEnrollments: 0,
      activeEnrollments: 0,
      completedEnrollments: 0,
      completionRate: 0,
      totalCertificates: 0,
      overdueCompliance: 0,
      avgCompletionDays: null,
    }, { request });
  }
});
