export const dynamic = 'force-dynamic';

/**
 * Admin Leaderboard API
 * GET /api/admin/lms/leaderboard?view=individual|team&period=week|month|all
 */
import { NextRequest } from 'next/server';
import { withAdminGuard } from '@/lib/admin-api-guard';
import { apiSuccess } from '@/lib/api-response';
import { prisma } from '@/lib/db';

export const GET = withAdminGuard(async (request: NextRequest, { session }) => {
  const tenantId = session.user.tenantId;
  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') ?? 'month';

  // Determine time window
  let periodFilter: Date | undefined;
  if (period === 'week') {
    periodFilter = new Date(Date.now() - 7 * 86400000);
  } else if (period === 'month') {
    periodFilter = new Date(Date.now() - 30 * 86400000);
  }

  // Get materialized leaderboard if available
  const leaderboard = await prisma.lmsLeaderboard.findMany({
    where: {
      tenantId,
      ...(periodFilter ? { period: { gte: periodFilter.toISOString().slice(0, 7) } } : {}),
    },
    orderBy: { totalPoints: 'desc' },
    take: 100,
  });

  if (leaderboard.length > 0) {
    // Resolve user names
    const userIds = leaderboard.map(l => l.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds }, tenantId },
      select: { id: true, name: true },
    });
    const nameMap = new Map(users.map(u => [u.id, u.name ?? 'Etudiant']));

    const data = leaderboard.map((l, i) => ({
      rank: l.rank || i + 1,
      id: l.id,
      name: nameMap.get(l.userId) ?? 'Etudiant',
      points: l.totalPoints,
      coursesCompleted: l.coursesCompleted,
      badgesEarned: l.badgeCount,
      streakDays: l.currentStreak,
    }));

    return apiSuccess(data, { request });
  }

  // Fallback: compute from enrollments
  const enrollments = await prisma.enrollment.groupBy({
    by: ['userId'],
    where: { tenantId, status: 'COMPLETED' },
    _count: true,
    orderBy: { _count: { userId: 'desc' } },
    take: 50,
  });

  const userIds = enrollments.map(e => e.userId);
  const users = userIds.length > 0
    ? await prisma.user.findMany({ where: { id: { in: userIds }, tenantId }, select: { id: true, name: true } })
    : [];
  const nameMap = new Map(users.map(u => [u.id, u.name ?? 'Etudiant']));

  const data = enrollments.map((e, i) => ({
    rank: i + 1,
    id: e.userId,
    name: nameMap.get(e.userId) ?? 'Etudiant',
    points: e._count * 100,
    coursesCompleted: e._count,
    badgesEarned: 0,
    streakDays: 0,
  }));

  return apiSuccess(data, { request });
});
