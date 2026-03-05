export const dynamic = 'force-dynamic';

/**
 * Admin Order Timeline API
 * GET  - List all timeline events for an order (newest first)
 * POST - Add a manual admin note event to the timeline
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { withAdminGuard } from '@/lib/admin-api-guard';
import { recordOrderEvent } from '@/lib/order-events';
import { logger } from '@/lib/logger';

// Validation schema for adding a manual note
const addNoteSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title must be at most 255 characters'),
  details: z.string().max(10_000, 'Details must be at most 10,000 characters').optional(),
}).strict();

// GET /api/admin/orders/[id]/timeline – list all events newest-first
export const GET = withAdminGuard(async (_request: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const orderId = params.id;

    // Verify the order exists
    const orderExists = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true },
    });

    if (!orderExists) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const events = await prisma.orderEvent.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        orderId: true,
        type: true,
        title: true,
        details: true,
        metadata: true,
        actorId: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ events });
  } catch (error) {
    logger.error('Admin order timeline GET error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});

// POST /api/admin/orders/[id]/timeline – add a manual admin NOTE
export const POST = withAdminGuard(async (request: NextRequest, { session, params }: { session: { user: { id: string } }; params: { id: string } }) => {
  try {
    const orderId = params.id;

    // Verify the order exists
    const orderExists = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true },
    });

    if (!orderExists) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const body = await request.json();
    const parsed = addNoteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation error', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { title, details } = parsed.data;

    await recordOrderEvent(
      orderId,
      'NOTE',
      title,
      details,
      undefined,
      session.user.id
    );

    // Re-fetch the freshly created event to return it
    const created = await prisma.orderEvent.findFirst({
      where: { orderId, type: 'NOTE', actorId: session.user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        orderId: true,
        type: true,
        title: true,
        details: true,
        metadata: true,
        actorId: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ event: created }, { status: 201 });
  } catch (error) {
    logger.error('Admin order timeline POST error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
