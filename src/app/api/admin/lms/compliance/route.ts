export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { withAdminGuard } from '@/lib/admin-api-guard';
import { apiSuccess } from '@/lib/api-response';
import { prisma } from '@/lib/db';

export const GET = withAdminGuard(async (request: NextRequest, { session }) => {
  const tenantId = session.user.tenantId;
  const { searchParams } = new URL(request.url);
  const validStatuses = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE', 'EXPIRED'] as const;
  type ValidStatus = typeof validStatuses[number];
  const rawStatus = searchParams.get('status');
  const status: ValidStatus | null = rawStatus && (validStatuses as readonly string[]).includes(rawStatus) ? rawStatus as ValidStatus : null;
  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10), 100);

  const now = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  // Get compliance enrollments (courses marked as compliance)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {
    tenantId,
    complianceStatus: status ? status : { not: null },
  };

  const [enrollments, total, overdueCount, upcomingDeadlines, completedCount, totalCompliance] = await Promise.all([
    prisma.enrollment.findMany({
      where,
      include: {
        course: { select: { id: true, title: true, slug: true, complianceDeadlineDays: true } },
      },
      orderBy: { complianceDeadline: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.enrollment.count({ where }),
    prisma.enrollment.count({ where: { tenantId, complianceStatus: 'OVERDUE' } }),
    prisma.enrollment.count({
      where: {
        tenantId,
        complianceDeadline: { gte: now, lte: thirtyDaysFromNow },
        complianceStatus: { not: 'COMPLETED' },
      },
    }),
    prisma.enrollment.count({ where: { tenantId, complianceStatus: 'COMPLETED' } }),
    prisma.enrollment.count({ where: { tenantId, complianceStatus: { not: null } } }),
  ]);

  const complianceRate = totalCompliance > 0
    ? Math.round((completedCount / totalCompliance) * 100)
    : 0;

  // Count total UFC earned (from CeCredit table if available)
  let totalUfcEarned = 0;
  try {
    const ufcAgg = await prisma.ceCredit.aggregate({
      _sum: { ufcCredits: true },
      where: { tenantId },
    });
    totalUfcEarned = Number(ufcAgg._sum.ufcCredits ?? 0);
  } catch {
    // CeCredit table may not exist yet
  }

  return apiSuccess({
    enrollments,
    total,
    page,
    limit,
    stats: {
      totalOverdue: overdueCount,
      upcomingDeadlines,
      completedCount,
      totalCompliance,
      complianceRate,
      totalUfcEarned,
    },
  }, { request });
});
