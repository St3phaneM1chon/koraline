export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { withUserGuard } from '@/lib/user-api-guard';
import { prisma } from '@/lib/db';

export const GET = withUserGuard(async (request: NextRequest, { session }) => {
  const tenantId = session.user.tenantId;
  if (!tenantId) return NextResponse.json({ error: 'No tenant' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const unreadOnly = searchParams.get('unread') === 'true';
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10), 100);

  const [notifications, unreadCount] = await Promise.all([
    prisma.lmsNotification.findMany({
      where: { tenantId, userId: session.user.id, ...(unreadOnly ? { isRead: false } : {}) },
      orderBy: { createdAt: 'desc' },
      take: limit,
    }),
    prisma.lmsNotification.count({
      where: { tenantId, userId: session.user.id, isRead: false },
    }),
  ]);

  return NextResponse.json({ data: { notifications, unreadCount } });
}, { skipCsrf: true });

// Mark notifications as read
export const POST = withUserGuard(async (request: NextRequest, { session }) => {
  const tenantId = session.user.tenantId;
  if (!tenantId) return NextResponse.json({ error: 'No tenant' }, { status: 403 });

  const body = await request.json();
  const { notificationIds, markAll } = body;

  if (markAll) {
    await prisma.lmsNotification.updateMany({
      where: { tenantId, userId: session.user.id, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  } else if (Array.isArray(notificationIds) && notificationIds.length > 0) {
    await prisma.lmsNotification.updateMany({
      where: { id: { in: notificationIds }, tenantId, userId: session.user.id },
      data: { isRead: true, readAt: new Date() },
    });
  }

  const unreadCount = await prisma.lmsNotification.count({
    where: { tenantId, userId: session.user.id, isRead: false },
  });

  return NextResponse.json({ data: { unreadCount } });
});
