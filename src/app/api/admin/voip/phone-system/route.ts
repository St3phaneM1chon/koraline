/**
 * Phone System Status & Configuration API
 *
 * GET  /api/admin/voip/phone-system — System status overview
 * POST /api/admin/voip/phone-system — Configure/update phone number routing
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAdminGuard } from '@/lib/admin-api-guard';
import { PHONE_NUMBERS, BUSINESS_HOURS, STAFF } from '@/lib/voip/phone-system-config';

export const dynamic = 'force-dynamic';

/**
 * GET — Phone system status overview
 * Returns all numbers, IVR menus, extensions, and their current state.
 */
export const GET = withAdminGuard(async () => {
  // Fetch all phone numbers with routing info
  const phoneNumbers = await prisma.phoneNumber.findMany({
    where: { isActive: true },
    orderBy: { number: 'asc' },
    select: {
      id: true,
      number: true,
      displayName: true,
      country: true,
      type: true,
      region: true,
      language: true,
      routeToIvr: true,
      routeToQueue: true,
      routeToExt: true,
      forwardTo: true,
      isActive: true,
    },
  });

  // Fetch IVR menus
  const ivrMenus = await prisma.ivrMenu.findMany({
    where: { isActive: true },
    include: {
      options: { orderBy: { sortOrder: 'asc' } },
    },
  });

  // Fetch extensions
  const extensions = await prisma.sipExtension.findMany({
    include: {
      user: { select: { name: true, email: true } },
    },
  });

  // Call stats (last 24h)
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentCalls = await prisma.callLog.aggregate({
    where: { startedAt: { gte: oneDayAgo } },
    _count: true,
  });

  const missedCalls = await prisma.callLog.count({
    where: {
      startedAt: { gte: oneDayAgo },
      status: 'MISSED',
    },
  });

  const unreadVoicemails = await prisma.voicemail.count({
    where: { isRead: false, isArchived: false },
  });

  return NextResponse.json({
    status: 'active',
    config: {
      businessHours: BUSINESS_HOURS,
      staff: STAFF,
    },
    phoneNumbers: phoneNumbers.map(pn => ({
      ...pn,
      routing: pn.forwardTo
        ? `FORWARD → ${pn.forwardTo}`
        : pn.routeToIvr
          ? `IVR`
          : pn.routeToQueue
            ? `QUEUE: ${pn.routeToQueue}`
            : pn.routeToExt
              ? `EXT: ${pn.routeToExt}`
              : 'DEFAULT',
    })),
    ivrMenus: ivrMenus.map(m => ({
      id: m.id,
      name: m.name,
      language: m.language,
      optionCount: m.options.length,
      businessHours: m.businessHoursStart && m.businessHoursEnd
        ? `${m.businessHoursStart}-${m.businessHoursEnd}`
        : 'Always',
      afterHoursMenuId: m.afterHoursMenuId,
    })),
    extensions: extensions.map(e => ({
      extension: e.extension,
      user: e.user?.name || e.user?.email || 'Unassigned',
      status: e.status,
      isRegistered: e.isRegistered,
    })),
    stats: {
      callsLast24h: recentCalls._count,
      missedLast24h: missedCalls,
      unreadVoicemails,
    },
    expectedNumbers: PHONE_NUMBERS.map(pn => ({
      number: pn.number,
      displayName: pn.displayName,
      region: pn.region,
      language: pn.language,
      routing: pn.forwardTo ? `FORWARD → ${pn.forwardTo}` : pn.routeToIvr || 'DEFAULT',
    })),
  });
});

/**
 * POST — Update phone number routing
 * Body: { number: string, routeToIvr?: string, routeToQueue?: string, forwardTo?: string, language?: string }
 */
export const POST = withAdminGuard(async (req: NextRequest) => {
  const body = await req.json();
  const { number, routeToIvr, routeToQueue, routeToExt, forwardTo, language } = body;

  if (!number) {
    return NextResponse.json({ error: 'number is required' }, { status: 400 });
  }

  const phoneNumber = await prisma.phoneNumber.findUnique({
    where: { number },
  });

  if (!phoneNumber) {
    return NextResponse.json({ error: `Phone number ${number} not found` }, { status: 404 });
  }

  const updated = await prisma.phoneNumber.update({
    where: { id: phoneNumber.id },
    data: {
      ...(routeToIvr !== undefined ? { routeToIvr } : {}),
      ...(routeToQueue !== undefined ? { routeToQueue } : {}),
      ...(routeToExt !== undefined ? { routeToExt } : {}),
      ...(forwardTo !== undefined ? { forwardTo } : {}),
      ...(language !== undefined ? { language } : {}),
    },
  });

  return NextResponse.json({
    success: true,
    phoneNumber: {
      number: updated.number,
      displayName: updated.displayName,
      routeToIvr: updated.routeToIvr,
      routeToQueue: updated.routeToQueue,
      routeToExt: updated.routeToExt,
      forwardTo: updated.forwardTo,
      language: updated.language,
    },
  });
});
