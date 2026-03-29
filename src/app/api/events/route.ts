export const dynamic = 'force-dynamic';

/**
 * Public Events API
 * GET  - List upcoming active events (public)
 * POST - Register for an event (public, with email-based dedup)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const registerSchema = z.object({
  eventId: z.string().min(1),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional().nullable(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (slug) {
      // Single event by slug
      const event = await prisma.event.findFirst({
        where: { slug, isActive: true },
        include: {
          _count: { select: { registrations: true } },
        },
      });
      if (!event) {
        return NextResponse.json({ error: 'Event not found' }, { status: 404 });
      }
      return NextResponse.json({ event });
    }

    // List upcoming events
    const events = await prisma.event.findMany({
      where: {
        isActive: true,
        endDate: { gte: new Date() },
      },
      include: {
        _count: { select: { registrations: true } },
      },
      orderBy: { startDate: 'asc' },
      take: 50,
    });

    return NextResponse.json({ events });
  } catch (error) {
    logger.error('Public events GET error', { error });
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation error', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { eventId, name, email, phone } = parsed.data;

    // Verify event exists and is active
    const event = await prisma.event.findFirst({
      where: { id: eventId, isActive: true },
      include: {
        _count: { select: { registrations: true } },
      },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found or inactive' }, { status: 404 });
    }

    // Check capacity
    if (event.maxAttendees && event._count.registrations >= event.maxAttendees) {
      return NextResponse.json({ error: 'Event is full' }, { status: 409 });
    }

    // Check for existing registration (email + event combo)
    const existingReg = await prisma.eventRegistration.findFirst({
      where: { eventId, email },
    });

    if (existingReg) {
      return NextResponse.json({ error: 'Already registered' }, { status: 409 });
    }

    const registration = await prisma.eventRegistration.create({
      data: {
        eventId,
        name,
        email,
        phone: phone ?? null,
        status: 'registered',
      },
    });

    return NextResponse.json({ registration }, { status: 201 });
  } catch (error) {
    logger.error('Public events POST (register) error', { error });
    return NextResponse.json({ error: 'Failed to register' }, { status: 500 });
  }
}
