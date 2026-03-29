export const dynamic = 'force-dynamic';

/**
 * Admin Affiliate Management API
 * GET  - List all affiliate links with stats
 * POST - Create a new affiliate link
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAdminGuard } from '@/lib/admin-api-guard';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const createAffiliateLinkSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  code: z.string().min(3, 'Code must be at least 3 characters').max(50),
  url: z.string().url().optional().nullable(),
  isActive: z.boolean().optional().default(true),
});

const updateAffiliateLinkSchema = z.object({
  id: z.string().min(1),
  url: z.string().url().optional().nullable(),
  isActive: z.boolean().optional(),
});

export const GET = withAdminGuard(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
    const skip = (page - 1) * limit;
    const search = searchParams.get('search') || '';

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [links, total] = await Promise.all([
      prisma.affiliateLink.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
      }),
      prisma.affiliateLink.count({ where }),
    ]);

    // Aggregate totals
    const totals = await prisma.affiliateLink.aggregate({
      _sum: {
        clicks: true,
        conversions: true,
        revenue: true,
        commission: true,
      },
    });

    return NextResponse.json({
      links,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      stats: {
        totalClicks: totals._sum.clicks || 0,
        totalConversions: totals._sum.conversions || 0,
        totalRevenue: Number(totals._sum.revenue || 0),
        totalCommission: Number(totals._sum.commission || 0),
      },
    });
  } catch (error) {
    logger.error('Admin affiliate GET error', { error });
    return NextResponse.json({ error: 'Failed to fetch affiliate links' }, { status: 500 });
  }
});

export const POST = withAdminGuard(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const parsed = createAffiliateLinkSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation error', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { userId, code, url, isActive } = parsed.data;

    // Check if code already exists
    const existing = await prisma.affiliateLink.findFirst({
      where: { code },
    });
    if (existing) {
      return NextResponse.json({ error: 'Code already in use' }, { status: 409 });
    }

    // Verify user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const link = await prisma.affiliateLink.create({
      data: { userId, code, url: url ?? null, isActive },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
      },
    });

    return NextResponse.json({ link }, { status: 201 });
  } catch (error) {
    logger.error('Admin affiliate POST error', { error });
    return NextResponse.json({ error: 'Failed to create affiliate link' }, { status: 500 });
  }
});

export const PATCH = withAdminGuard(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const parsed = updateAffiliateLinkSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation error', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { id, ...data } = parsed.data;

    const link = await prisma.affiliateLink.update({
      where: { id },
      data,
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
      },
    });

    return NextResponse.json({ link });
  } catch (error) {
    logger.error('Admin affiliate PATCH error', { error });
    return NextResponse.json({ error: 'Failed to update affiliate link' }, { status: 500 });
  }
});

export const DELETE = withAdminGuard(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    await prisma.affiliateLink.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Admin affiliate DELETE error', { error });
    return NextResponse.json({ error: 'Failed to delete affiliate link' }, { status: 500 });
  }
});
