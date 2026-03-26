export const dynamic = 'force-dynamic';

/**
 * Student Cohort API
 * GET /api/lms/cohort — Current user's cohort membership + peer info
 */
import { NextRequest, NextResponse } from 'next/server';
import { withUserGuard } from '@/lib/user-api-guard';
import { prisma } from '@/lib/db';

export const GET = withUserGuard(async (_request: NextRequest, { session }) => {
  const tenantId = session.user.tenantId;
  if (!tenantId) return NextResponse.json({ error: 'No tenant' }, { status: 403 });
  const userId = session.user.id!;

  // Find user's active cohort memberships
  const memberships = await prisma.lmsCohortMember.findMany({
    where: { tenantId, userId },
    include: {
      cohort: {
        select: {
          id: true,
          name: true,
          description: true,
          courseId: true,
          startsAt: true,
          endsAt: true,
          isActive: true,
          _count: { select: { members: true } },
        },
      },
    },
  });

  if (memberships.length === 0) {
    return NextResponse.json({ data: { cohorts: [], activeCohort: null } });
  }

  // Get peer names for the most recent active cohort
  const activeMembership = memberships.find(m => m.cohort.isActive) ?? memberships[0];
  let peers: Array<{ name: string; role: string; joinedAt: Date }> = [];

  if (activeMembership) {
    const cohortMembers = await prisma.lmsCohortMember.findMany({
      where: { cohortId: activeMembership.cohortId },
      select: { userId: true, role: true, joinedAt: true },
      take: 50,
    });

    const peerUserIds = cohortMembers.map(m => m.userId).filter(id => id !== userId);
    const users = peerUserIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: peerUserIds }, tenantId },
          select: { id: true, name: true },
        })
      : [];
    const nameMap = new Map(users.map(u => [u.id, u.name ?? 'Etudiant']));

    peers = cohortMembers
      .filter(m => m.userId !== userId)
      .map(m => ({
        name: nameMap.get(m.userId) ?? 'Etudiant',
        role: m.role,
        joinedAt: m.joinedAt,
      }));
  }

  return NextResponse.json({
    data: {
      cohorts: memberships.map(m => ({
        id: m.cohort.id,
        name: m.cohort.name,
        description: m.cohort.description,
        courseId: m.cohort.courseId,
        startsAt: m.cohort.startsAt,
        endsAt: m.cohort.endsAt,
        isActive: m.cohort.isActive,
        memberCount: m.cohort._count.members,
        myRole: m.role,
      })),
      activeCohort: activeMembership ? {
        id: activeMembership.cohort.id,
        name: activeMembership.cohort.name,
        peers,
        memberCount: activeMembership.cohort._count.members,
      } : null,
    },
  });
}, { skipCsrf: true });
