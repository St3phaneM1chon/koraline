export const dynamic = 'force-dynamic';

import { withAdminGuard } from '@/lib/admin-api-guard';
import { apiSuccess } from '@/lib/api-response';
import { prisma } from '@/lib/db';

export const GET = withAdminGuard(async (request) => {
  const [runningJobs, totalJobs, totalProspects] = await Promise.all([
    prisma.scrapeJob.count({ where: { status: 'running' } }),
    prisma.scrapeJob.count(),
    prisma.prospect.count(),
  ]);

  return apiSuccess({
    status: 'healthy',
    scraper: {
      runningJobs,
      maxConcurrent: 3,
      totalJobs,
      totalProspects,
    },
    timestamp: new Date().toISOString(),
  }, { request });
}, { rateLimit: 60 });
