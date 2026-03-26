export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { withAdminGuard } from '@/lib/admin-api-guard';
import { prisma } from '@/lib/db';

/**
 * Workflow Automation (Feature 15)
 * Uses Order.status changes as triggers for automated workflows.
 * GET - Returns recent status changes and pending automations
 * POST - Manually trigger a workflow for specific orders
 */
async function getHandler(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const hours = Math.min(
      Math.max(parseInt(url.searchParams.get('hours') || '24', 10), 1),
      168
    );

    const since = new Date();
    since.setHours(since.getHours() - hours);

    // Get recently updated orders (status changes)
    const recentOrders = await prisma.order.findMany({
      where: { updatedAt: { gte: since } },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        userId: true,
        total: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: 100,
    });

    // Get active workflow rules
    const rules = await prisma.workflowRule.findMany({
      where: { isActive: true, entityType: 'ORDER', deletedAt: null },
      select: {
        id: true,
        name: true,
        triggerEvent: true,
        conditions: true,
        actions: true,
      },
      take: 50,
    });

    // Determine which orders match which rules
    const pendingAutomations = recentOrders.map((order) => {
      const matchingRules = rules.filter((rule) => {
        if (rule.triggerEvent === 'STATUS_CHANGE') return true;
        // More specific matching can be added based on conditions JSON
        return false;
      });

      return {
        orderId: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        total: Number(order.total),
        updatedAt: order.updatedAt,
        matchingRules: matchingRules.map((r) => ({
          ruleId: r.id,
          ruleName: r.name,
          triggerEvent: r.triggerEvent,
        })),
      };
    });

    return NextResponse.json({
      data: {
        period: `${hours} hours`,
        recentStatusChanges: recentOrders.length,
        activeRules: rules.length,
        pendingAutomations: pendingAutomations.filter(
          (a) => a.matchingRules.length > 0
        ),
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
    const { ruleId, orderIds } = body as {
      ruleId: string;
      orderIds: string[];
    };

    if (!ruleId || !orderIds || !Array.isArray(orderIds)) {
      return NextResponse.json(
        { error: 'ruleId and orderIds[] are required' },
        { status: 400 }
      );
    }

    const rule = await prisma.workflowRule.findUnique({
      where: { id: ruleId },
    });

    if (!rule || !rule.isActive) {
      return NextResponse.json(
        { error: 'Workflow rule not found or inactive' },
        { status: 404 }
      );
    }

    // Log an approval request for tracking
    const created = await prisma.approvalRequest.createMany({
      data: orderIds.map((orderId) => ({
        workflowRuleId: ruleId,
        entityType: 'ORDER',
        entityId: orderId,
        entitySummary: `Workflow trigger: ${rule.name}`,
        status: 'PENDING',
      })),
    });

    return NextResponse.json({
      data: {
        triggered: created.count,
        ruleId,
        ruleName: rule.name,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const GET = withAdminGuard(getHandler);
export const POST = withAdminGuard(postHandler);
