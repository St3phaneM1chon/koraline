export const dynamic = 'force-dynamic';

/**
 * Student Badges/Achievements API
 * GET /api/lms/badges — List all badges + user's earned status
 */
import { NextRequest, NextResponse } from 'next/server';
import { withUserGuard } from '@/lib/user-api-guard';
import { prisma } from '@/lib/db';

export const GET = withUserGuard(async (_request: NextRequest, { session }) => {
  const tenantId = session.user.tenantId;
  if (!tenantId) return NextResponse.json({ error: 'No tenant' }, { status: 403 });
  const userId = session.user.id!;

  const [allBadges, myAwards, streak] = await Promise.all([
    prisma.lmsBadge.findMany({
      where: { tenantId, isActive: true },
      select: { id: true, name: true, description: true, iconUrl: true, criteria: true },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.lmsBadgeAward.findMany({
      where: { tenantId, userId },
      select: { badgeId: true, awardedAt: true },
    }),
    prisma.lmsStreak.findUnique({
      where: { tenantId_userId: { tenantId, userId } },
      select: { currentStreak: true, longestStreak: true },
    }),
  ]);

  const earnedBadgeIds = new Set(myAwards.map(a => a.badgeId));
  const awardDateMap = new Map(myAwards.map(a => [a.badgeId, a.awardedAt]));

  const badges = allBadges.map(b => ({
    id: b.id,
    name: b.name,
    description: b.description,
    iconUrl: b.iconUrl,
    criteria: b.criteria,
    earned: earnedBadgeIds.has(b.id),
    earnedAt: awardDateMap.get(b.id) ?? null,
  }));

  return NextResponse.json({
    data: {
      badges,
      earned: myAwards.length,
      total: allBadges.length,
      currentStreak: streak?.currentStreak ?? 0,
      longestStreak: streak?.longestStreak ?? 0,
    },
  });
}, { skipCsrf: true });
