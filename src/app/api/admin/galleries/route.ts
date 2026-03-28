export const dynamic = 'force-dynamic';

/**
 * Admin Galleries API
 * GET    /api/admin/galleries - List galleries with pagination
 * POST   /api/admin/galleries - Create a new gallery
 * PUT    /api/admin/galleries - Update an existing gallery
 * DELETE /api/admin/galleries?id=xxx - Delete a gallery
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { withAdminGuard } from '@/lib/admin-api-guard';
import { apiPaginated, apiSuccess, apiError } from '@/lib/api-response';

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const createGallerySchema = z.object({
  name: z.string().min(1, 'Name is required').max(200).trim(),
  slug: z.string().min(1).max(200).trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with hyphens'),
  description: z.string().max(1000).trim().optional(),
  layout: z.enum(['grid', 'masonry', 'carousel', 'lightbox']).optional().default('grid'),
  columns: z.number().int().min(1).max(6).optional().default(3),
  isActive: z.boolean().optional().default(true),
});

const updateGallerySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(200).trim().optional(),
  slug: z.string().min(1).max(200).trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with hyphens').optional(),
  description: z.string().max(1000).trim().optional().nullable(),
  layout: z.enum(['grid', 'masonry', 'carousel', 'lightbox']).optional(),
  columns: z.number().int().min(1).max(6).optional(),
  isActive: z.boolean().optional(),
});

// ---------------------------------------------------------------------------
// GET: List galleries
// ---------------------------------------------------------------------------

export const GET = withAdminGuard(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
  const skip = (page - 1) * limit;
  const search = searchParams.get('search');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: Record<string, any> = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { slug: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.gallery.findMany({
      where,
      take: limit,
      skip,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { images: true } },
      },
    }),
    prisma.gallery.count({ where }),
  ]);

  return apiPaginated(data, page, limit, total, { request });
});

// ---------------------------------------------------------------------------
// POST: Create a gallery
// ---------------------------------------------------------------------------

export const POST = withAdminGuard(async (request: NextRequest) => {
  const body = await request.json();
  const parsed = createGallerySchema.safeParse(body);

  if (!parsed.success) {
    return apiError('Validation failed', 'VALIDATION_ERROR', { status: 400, details: parsed.error.flatten().fieldErrors });
  }

  // Check slug uniqueness
  const existing = await prisma.gallery.findFirst({
    where: { slug: parsed.data.slug },
  });

  if (existing) {
    return apiError('A gallery with this slug already exists', 'CONFLICT', { status: 409 });
  }

  const gallery = await prisma.gallery.create({
    data: parsed.data,
    include: {
      _count: { select: { images: true } },
    },
  });

  return apiSuccess(gallery, { status: 201 });
});

// ---------------------------------------------------------------------------
// PUT: Update a gallery
// ---------------------------------------------------------------------------

export const PUT = withAdminGuard(async (request: NextRequest) => {
  const body = await request.json();
  const parsed = updateGallerySchema.safeParse(body);

  if (!parsed.success) {
    return apiError('Validation failed', 'VALIDATION_ERROR', { status: 400, details: parsed.error.flatten().fieldErrors });
  }

  const { id, ...updateData } = parsed.data;

  const existing = await prisma.gallery.findUnique({ where: { id } });
  if (!existing) {
    return apiError('Gallery not found', 'NOT_FOUND', { status: 404 });
  }

  // Check slug uniqueness if changed
  if (updateData.slug && updateData.slug !== existing.slug) {
    const slugConflict = await prisma.gallery.findFirst({
      where: { slug: updateData.slug, id: { not: id } },
    });
    if (slugConflict) {
      return apiError('A gallery with this slug already exists', 'CONFLICT', { status: 409 });
    }
  }

  const gallery = await prisma.gallery.update({
    where: { id },
    data: updateData,
    include: {
      _count: { select: { images: true } },
    },
  });

  return apiSuccess(gallery);
});

// ---------------------------------------------------------------------------
// DELETE: Delete a gallery
// ---------------------------------------------------------------------------

export const DELETE = withAdminGuard(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return apiError('Missing gallery id', 'VALIDATION_ERROR', { status: 400 });
  }

  const existing = await prisma.gallery.findUnique({ where: { id } });
  if (!existing) {
    return apiError('Gallery not found', 'NOT_FOUND', { status: 404 });
  }

  await prisma.gallery.delete({ where: { id } });

  return apiSuccess({ deleted: true });
});
