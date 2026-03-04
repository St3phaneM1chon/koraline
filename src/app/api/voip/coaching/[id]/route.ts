export const dynamic = 'force-dynamic';

/**
 * Single Coaching Session API
 * GET    — Session detail with scores
 * PUT    — Update session (reschedule, feedback, etc.)
 * DELETE — Cancel session
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth-config';
import { getSessionScores } from '@/lib/voip/scoring-engine';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const coachingSession = await prisma.coachingSession.findUnique({
    where: { id },
    include: {
      coach: { select: { id: true, name: true, email: true } },
      student: { select: { id: true, name: true, email: true } },
      supervisor: { select: { id: true, name: true } },
      callLog: {
        include: {
          recording: { select: { id: true, url: true, duration: true } },
          transcription: { select: { id: true, fullText: true } },
        },
      },
      scores: { orderBy: { criterion: 'asc' } },
    },
  });

  if (!coachingSession) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  // Add computed overall score
  const { overallScore } = await getSessionScores(id);

  return NextResponse.json({
    data: {
      ...coachingSession,
      overallScore,
    },
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  const {
    scheduledAt,
    topic,
    objectives,
    feedback,
    status,
    supervisorId,
  } = body;

  const updated = await prisma.coachingSession.update({
    where: { id },
    data: {
      ...(scheduledAt !== undefined ? { scheduledAt: new Date(scheduledAt) } : {}),
      ...(topic !== undefined ? { topic } : {}),
      ...(objectives !== undefined ? { objectives } : {}),
      ...(feedback !== undefined ? { feedback } : {}),
      ...(status !== undefined ? { status: status as never } : {}),
      ...(supervisorId !== undefined ? { supervisorId } : {}),
    },
    include: {
      coach: { select: { id: true, name: true } },
      student: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ data: updated });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const coachingSession = await prisma.coachingSession.findUnique({
    where: { id },
    select: { status: true },
  });

  if (!coachingSession) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  if (coachingSession.status === 'IN_PROGRESS') {
    return NextResponse.json(
      { error: 'Cannot cancel an in-progress session. End the call first.' },
      { status: 400 }
    );
  }

  await prisma.coachingSession.update({
    where: { id },
    data: { status: 'CANCELLED' },
  });

  return NextResponse.json({ status: 'cancelled' });
}
