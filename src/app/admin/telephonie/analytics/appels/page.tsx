export const dynamic = 'force-dynamic';

/**
 * Call Analytics Page - Volume, duration, and disposition analysis.
 */

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth-config';
import { prisma } from '@/lib/db';
import { UserRole } from '@/types';
import AppelsClient from './AppelsClient';

export default async function AppelsAnalyticsPage() {
  const session = await auth();
  if (!session?.user || (session.user.role !== UserRole.EMPLOYEE && session.user.role !== UserRole.OWNER)) {
    redirect('/auth/signin');
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const monthAgo = new Date();
  monthAgo.setDate(monthAgo.getDate() - 30);

  // Counts by direction
  const [inbound, outbound, internal] = await Promise.all([
    prisma.callLog.count({ where: { direction: 'INBOUND', startedAt: { gte: monthAgo } } }),
    prisma.callLog.count({ where: { direction: 'OUTBOUND', startedAt: { gte: monthAgo } } }),
    prisma.callLog.count({ where: { direction: 'INTERNAL', startedAt: { gte: monthAgo } } }),
  ]);

  // Counts by status (disposition)
  const dispositions = await prisma.callLog.groupBy({
    by: ['status'],
    where: { startedAt: { gte: monthAgo } },
    _count: { id: true },
  });

  // Duration stats
  const durationStats = await prisma.callLog.aggregate({
    where: { startedAt: { gte: monthAgo }, duration: { not: null } },
    _avg: { duration: true },
    _min: { duration: true },
    _max: { duration: true },
    _sum: { duration: true },
    _count: { id: true },
  });

  // Today / week / month counts
  const [todayCount, weekCount, monthCount] = await Promise.all([
    prisma.callLog.count({ where: { startedAt: { gte: today } } }),
    prisma.callLog.count({ where: { startedAt: { gte: weekAgo } } }),
    prisma.callLog.count({ where: { startedAt: { gte: monthAgo } } }),
  ]);

  const stats = {
    inbound,
    outbound,
    internal,
    dispositions: dispositions.map((d) => ({
      status: d.status,
      count: d._count.id,
    })),
    duration: {
      avg: Math.round(durationStats._avg.duration || 0),
      min: durationStats._min.duration || 0,
      max: durationStats._max.duration || 0,
      total: durationStats._sum.duration || 0,
      count: durationStats._count.id,
    },
    todayCount,
    weekCount,
    monthCount,
  };

  return <AppelsClient stats={JSON.parse(JSON.stringify(stats))} />;
}
