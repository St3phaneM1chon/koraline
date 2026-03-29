export const dynamic = 'force-dynamic';

/**
 * Admin Events Management API
 * GET  - List events with registrations count
 * POST - Create a new event
 * PATCH - Update an event
 * DELETE - Delete an event
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAdminGuard } from '@/lib/admin-api-guard';
import { logger } from '@/lib/logger';
import { z } from 'zod';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

const createEventSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  slug: z.string().optional(),
  description: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  isOnline: z.boolean().optional().default(false),
  meetingUrl: z.string().url().optional().nullable(),
  startDate: z.string().transform((v) => new Date(v)),
  endDate: z.string().transform((v) => new Date(v)),
  maxAttendees: z.number().int().positive().optional().nullable(),
  price: z.number().min(0).optional().default(0),
  currency: z.string().optional().default('CAD'),
  imageUrl: z.string().url().optional().nullable(),
  isActive: z.boolean().optional().default(true),
});

const updateEventSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(200).optional(),
  slug: z.string().optional(),
  description: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  isOnline: z.boolean().optional(),
  meetingUrl: z.string().url().optional().nullable(),
  startDate: z.string().transform((v) => new Date(v)).optional(),
  endDate: z.string().transform((v) => new Date(v)).optional(),
  maxAttendees: z.number().int().positive().optional().nullable(),
  price: z.number().min(0).optional(),
  currency: z.string().optional(),
  imageUrl: z.string().url().optional().nullable(),
  isActive: z.boolean().optional(),
});

export const GET = withAdminGuard(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
    const skip = (page - 1) * limit;
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status'); // upcoming, past, all

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status === 'upcoming') {
      where.startDate = { gte: new Date() };
    } else if (status === 'past') {
      where.endDate = { lt: new Date() };
    }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        include: {
          _count: { select: { registrations: true } },
        },
        orderBy: { startDate: 'desc' },
        take: limit,
        skip,
      }),
      prisma.event.count({ where }),
    ]);

    return NextResponse.json({
      events,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    logger.error('Admin events GET error', { error });
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
});

export const POST = withAdminGuard(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const parsed = createEventSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation error', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const slug = data.slug || slugify(data.title);

    // Check slug uniqueness
    const existing = await prisma.event.findFirst({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: 'Slug already in use' }, { status: 409 });
    }

    const event = await prisma.event.create({
      data: {
        ...data,
        slug,
      },
      include: {
        _count: { select: { registrations: true } },
      },
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    logger.error('Admin events POST error', { error });
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
});

export const PATCH = withAdminGuard(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const parsed = updateEventSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation error', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { id, ...data } = parsed.data;

    // If title changed but no slug provided, regenerate slug
    if (data.title && !data.slug) {
      data.slug = slugify(data.title);
    }

    const event = await prisma.event.update({
      where: { id },
      data,
      include: {
        _count: { select: { registrations: true } },
      },
    });

    return NextResponse.json({ event });
  } catch (error) {
    logger.error('Admin events PATCH error', { error });
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
  }
});

export const DELETE = withAdminGuard(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    await prisma.event.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Admin events DELETE error', { error });
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
  }
});
