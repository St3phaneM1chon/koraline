export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { withAdminGuard } from '@/lib/admin-api-guard';
import { prisma } from '@/lib/db';

/**
 * CRM: Sales Leaderboard
 * Groups won deals by assignedToId (sales rep),
 * returning deal count and total value per rep.
 */
async function handler(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const period = url.searchParams.get('period') || '30'; // days
    const days = Math.min(Math.max(parseInt(period, 10), 1), 365);

    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);

    // Group won deals by assignedToId
    const deals = await prisma.crmDeal.groupBy({
      by: ['assignedToId'],
      where: {
        actualCloseDate: { not: null, gte: sinceDate },
        stage: { isWon: true },
      },
      _count: true,
      _sum: { value: true },
    });

    // Fetch user names for the leaderboard
    const userIds = deals.map((d) => d.assignedToId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true, image: true },
      take: 200,
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    const leaderboard = deals
      .map((d) => {
        const user = userMap.get(d.assignedToId);
        return {
          userId: d.assignedToId,
          name: user?.name || user?.email || 'Unknown',
          image: user?.image || null,
          dealsWon: d._count,
          totalValue: d._sum.value ? Number(d._sum.value) : 0,
        };
      })
      .sort((a, b) => b.totalValue - a.totalValue);

    return NextResponse.json({
      data: {
        leaderboard,
        period: `${days} days`,
        totalDeals: leaderboard.reduce((s, l) => s + l.dealsWon, 0),
        totalRevenue: leaderboard.reduce((s, l) => s + l.totalValue, 0),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const GET = withAdminGuard(handler);
