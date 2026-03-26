export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { withAdminGuard } from '@/lib/admin-api-guard';
import { prisma } from '@/lib/db';

/**
 * CRM: Deal Stage Automation (Feature 12)
 * GET - Returns deals that need automatic stage transitions
 * POST - Executes automatic stage transitions based on rules
 *
 * Rules:
 * - Deals in won stages (isWon=true) with no actualCloseDate -> set actualCloseDate
 * - Deals in lost stages (isLost=true) with no actualCloseDate -> set actualCloseDate
 * - Deals past expectedCloseDate that are still open -> flag as overdue
 */
async function getHandler(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const pipelineId = url.searchParams.get('pipelineId');

    const now = new Date();

    // Deals in won/lost stages without actualCloseDate
    const unclosedWonLost = await prisma.crmDeal.findMany({
      where: {
        actualCloseDate: null,
        stage: { OR: [{ isWon: true }, { isLost: true }] },
        ...(pipelineId ? { pipelineId } : {}),
      },
      select: {
        id: true,
        title: true,
        value: true,
        assignedToId: true,
        stageId: true,
        stage: { select: { name: true, isWon: true, isLost: true } },
        createdAt: true,
      },
      take: 100,
    });

    // Deals past expectedCloseDate still in active stages
    const overdue = await prisma.crmDeal.findMany({
      where: {
        expectedCloseDate: { lt: now },
        actualCloseDate: null,
        stage: { isWon: false, isLost: false },
        ...(pipelineId ? { pipelineId } : {}),
      },
      select: {
        id: true,
        title: true,
        value: true,
        assignedToId: true,
        expectedCloseDate: true,
        stageId: true,
        stage: { select: { name: true } },
      },
      take: 100,
    });

    return NextResponse.json({
      data: {
        needsCloseDateUpdate: unclosedWonLost.map((d) => ({
          dealId: d.id,
          title: d.title,
          value: Number(d.value),
          stageName: d.stage.name,
          isWon: d.stage.isWon,
          isLost: d.stage.isLost,
          action: 'SET_ACTUAL_CLOSE_DATE',
        })),
        overdue: overdue.map((d) => ({
          dealId: d.id,
          title: d.title,
          value: Number(d.value),
          stageName: d.stage.name,
          expectedCloseDate: d.expectedCloseDate,
          daysOverdue: Math.floor(
            (now.getTime() - (d.expectedCloseDate?.getTime() || 0)) /
              (1000 * 60 * 60 * 24)
          ),
          action: 'FLAG_OVERDUE',
        })),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function postHandler(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, dealIds } = body as {
      action: 'SET_ACTUAL_CLOSE_DATE';
      dealIds: string[];
    };

    if (!action || !dealIds || !Array.isArray(dealIds) || dealIds.length === 0) {
      return NextResponse.json(
        { error: 'action and dealIds[] are required' },
        { status: 400 }
      );
    }

    if (action === 'SET_ACTUAL_CLOSE_DATE') {
      const now = new Date();
      const result = await prisma.crmDeal.updateMany({
        where: {
          id: { in: dealIds },
          actualCloseDate: null,
          stage: { OR: [{ isWon: true }, { isLost: true }] },
        },
        data: { actualCloseDate: now },
      });

      return NextResponse.json({
        data: { updated: result.count, action },
      });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const GET = withAdminGuard(getHandler);
export const POST = withAdminGuard(postHandler);
