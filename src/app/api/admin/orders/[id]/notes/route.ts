export const dynamic = 'force-dynamic';

/**
 * Admin Order Notes API
 * PATCH /api/admin/orders/[id]/notes - Update admin notes on an order
 *
 * The Order model has both `customerNotes` (set at checkout) and `adminNotes`
 * (set by admin). This endpoint manages the `adminNotes` field.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { withAdminGuard } from '@/lib/admin-api-guard';
import { logAdminAction, getClientIpFromRequest } from '@/lib/admin-audit';
import { logger } from '@/lib/logger';

const notesSchema = z.object({
  adminNotes: z.string().max(5000).nullable(),
}).strict();

// PATCH /api/admin/orders/[id]/notes - Update admin notes
export const PATCH = withAdminGuard(async (request: NextRequest, { session, params }) => {
  try {
    const id = params?.id;
    if (!id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const body = await request.json();

    // Validate with Zod
    const parsed = notesSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation error', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { adminNotes } = parsed.data;

    // Check order exists
    const existingOrder = await prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        orderNumber: true,
        adminNotes: true,
      },
    });

    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Update admin notes
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { adminNotes },
      select: {
        id: true,
        orderNumber: true,
        adminNotes: true,
        updatedAt: true,
      },
    });

    // Audit log (fire-and-forget)
    logAdminAction({
      adminUserId: session.user.id,
      action: 'UPDATE_ORDER_NOTES',
      targetType: 'Order',
      targetId: id,
      previousValue: { adminNotes: existingOrder.adminNotes },
      newValue: { adminNotes },
      ipAddress: getClientIpFromRequest(request),
      userAgent: request.headers.get('user-agent') || undefined,
    }).catch((err: unknown) => {
      logger.error('[AdminOrderNotes] Non-blocking audit log failed', {
        error: err instanceof Error ? err.message : String(err),
      });
    });

    return NextResponse.json({
      success: true,
      order: updatedOrder,
    });
  } catch (error) {
    logger.error('Admin order notes PATCH error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// GET /api/admin/orders/[id]/notes - Get admin and customer notes
export const GET = withAdminGuard(async (_request: NextRequest, { params }) => {
  try {
    const id = params?.id;
    if (!id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        orderNumber: true,
        customerNotes: true,
        adminNotes: true,
        updatedAt: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    logger.error('Admin order notes GET error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
