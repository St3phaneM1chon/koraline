export const dynamic = 'force-dynamic';

/**
 * Single Campaign API
 * GET    — Campaign detail with contact list + stats
 * PUT    — Update campaign settings
 * DELETE — Delete campaign (only if DRAFT)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth-config';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const campaign = await prisma.dialerCampaign.findUnique({
    where: { id },
    include: {
      dialerList: {
        orderBy: { createdAt: 'asc' },
        take: 200,
      },
      dispositions: {
        orderBy: { createdAt: 'desc' },
        take: 50,
      },
      _count: {
        select: {
          dialerList: true,
          dispositions: true,
        },
      },
    },
  });

  if (!campaign) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
  }

  // Compute stats
  const stats = await prisma.dialerListEntry.groupBy({
    by: ['isDncl', 'isCalled'],
    where: { campaignId: id },
    _count: true,
  });

  return NextResponse.json({ data: campaign, stats });
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
    name,
    description,
    status,
    callerIdNumber,
    maxConcurrent,
    useAmd,
    scriptTitle,
    scriptBody,
    startTime,
    endTime,
    timezone,
    activeDays,
  } = body;

  const campaign = await prisma.dialerCampaign.update({
    where: { id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(status !== undefined ? { status: status as never } : {}),
      ...(callerIdNumber !== undefined ? { callerIdNumber } : {}),
      ...(maxConcurrent !== undefined ? { maxConcurrent } : {}),
      ...(useAmd !== undefined ? { useAmd } : {}),
      ...(scriptTitle !== undefined ? { scriptTitle } : {}),
      ...(scriptBody !== undefined ? { scriptBody } : {}),
      ...(startTime !== undefined ? { startTime } : {}),
      ...(endTime !== undefined ? { endTime } : {}),
      ...(timezone !== undefined ? { timezone } : {}),
      ...(activeDays !== undefined ? { activeDays } : {}),
    },
    include: {
      _count: { select: { dialerList: true } },
    },
  });

  return NextResponse.json({ data: campaign });
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

  const campaign = await prisma.dialerCampaign.findUnique({
    where: { id },
    select: { status: true },
  });

  if (!campaign) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
  }

  if (campaign.status !== 'DRAFT') {
    return NextResponse.json(
      { error: 'Can only delete DRAFT campaigns' },
      { status: 400 }
    );
  }

  // Delete associated entries first, then campaign
  await prisma.dialerDisposition.deleteMany({ where: { campaignId: id } });
  await prisma.dialerListEntry.deleteMany({ where: { campaignId: id } });
  await prisma.dialerCampaign.delete({ where: { id } });

  return NextResponse.json({ status: 'deleted' });
}
