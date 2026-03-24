export const dynamic = 'force-dynamic';

/**
 * GET /api/lms/preferences — Load student study preferences
 * PUT /api/lms/preferences — Save student preferences (including workProvince)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withUserGuard } from '@/lib/user-api-guard';

export const GET = withUserGuard(async (_request, { session }) => {
  const profile = await prisma.studentProfile.findUnique({
    where: { userId: session.user!.id },
    select: {
      province: true,
      workProvince: true,
      language: true,
      bestTimeOfDay: true,
      sessionPreference: true,
      prefersVoice: true,
    },
  });

  if (!profile) {
    return NextResponse.json({});
  }

  const timeMap: Record<string, string> = {
    EARLY_MORNING: 'morning',
    MORNING: 'morning',
    AFTERNOON: 'afternoon',
    EVENING: 'evening',
    NIGHT: 'evening',
  };

  const durationMap: Record<string, number> = {
    SHORT_15MIN: 15,
    MEDIUM_30MIN: 25,
    LONG_60MIN: 60,
  };

  return NextResponse.json({
    workProvince: profile.workProvince || profile.province || '',
    displayLanguage: profile.language || 'fr',
    aureliaVoice: profile.prefersVoice,
    studyTime: profile.bestTimeOfDay ? (timeMap[profile.bestTimeOfDay] || 'morning') : 'morning',
    sessionDuration: profile.sessionPreference ? (durationMap[profile.sessionPreference] || 25) : 25,
  });
}, { skipCsrf: true });

export const PUT = withUserGuard(async (request: NextRequest, { session }) => {
  const body = await request.json();
  const userId = session.user!.id;

  const updateData: Record<string, unknown> = {};

  if (body.workProvince !== undefined) {
    updateData.workProvince = body.workProvince || null;
  }

  if (body.displayLanguage !== undefined) {
    updateData.language = body.displayLanguage;
  }

  if (body.aureliaVoice !== undefined) {
    updateData.prefersVoice = body.aureliaVoice;
  }

  if (body.studyTime !== undefined) {
    const timeMap: Record<string, string> = {
      morning: 'MORNING',
      afternoon: 'AFTERNOON',
      evening: 'EVENING',
    };
    updateData.bestTimeOfDay = timeMap[body.studyTime] || 'MORNING';
  }

  if (body.sessionDuration !== undefined) {
    const durationMap: Record<number, string> = {
      15: 'SHORT_15MIN',
      25: 'MEDIUM_30MIN',
      45: 'LONG_60MIN',
      60: 'LONG_60MIN',
    };
    updateData.sessionPreference = durationMap[body.sessionDuration] || 'MEDIUM_30MIN';
  }

  // Upsert: create profile if it doesn't exist
  await prisma.studentProfile.upsert({
    where: { userId },
    update: {
      ...updateData,
      lastProfileUpdateAt: new Date(),
    },
    create: {
      userId,
      tenantId: (session.user as unknown as Record<string, string>).tenantId || 'default',
      ...updateData,
    },
  });

  return NextResponse.json({ success: true });
});
