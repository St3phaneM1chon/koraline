export const dynamic = 'force-dynamic';

/**
 * Admin Gallery Images API
 * GET    /api/admin/galleries/:id/images - List images in a gallery
 * POST   /api/admin/galleries/:id/images - Add image(s) to gallery
 * PUT    /api/admin/galleries/:id/images - Update an image
 * DELETE /api/admin/galleries/:id/images?imageId=xxx - Remove an image
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { withAdminGuard } from '@/lib/admin-api-guard';
import { apiSuccess, apiError } from '@/lib/api-response';

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const addImageSchema = z.object({
  imageUrl: z.string().url().max(2048),
  title: z.string().max(200).trim().optional().nullable(),
  caption: z.string().max(1000).trim().optional().nullable(),
  altText: z.string().max(500).trim().optional().nullable(),
  sortOrder: z.number().int().min(0).max(99999).optional().default(0),
});

const addImagesSchema = z.union([
  addImageSchema,
  z.array(addImageSchema).min(1).max(50),
]);

const updateImageSchema = z.object({
  imageId: z.string().min(1),
  imageUrl: z.string().url().max(2048).optional(),
  title: z.string().max(200).trim().optional().nullable(),
  caption: z.string().max(1000).trim().optional().nullable(),
  altText: z.string().max(500).trim().optional().nullable(),
  sortOrder: z.number().int().min(0).max(99999).optional(),
});

// ---------------------------------------------------------------------------
// GET: List images in a gallery
// ---------------------------------------------------------------------------

export const GET = withAdminGuard(async (_request: NextRequest, context: { params: Promise<{ id: string }> }) => {
  const { id: galleryId } = await context.params;

  const gallery = await prisma.gallery.findUnique({ where: { id: galleryId } });
  if (!gallery) {
    return apiError('Gallery not found', 'NOT_FOUND', { status: 404 });
  }

  const images = await prisma.galleryImage.findMany({
    where: { galleryId },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
  });

  return apiSuccess({ gallery, images });
});

// ---------------------------------------------------------------------------
// POST: Add image(s) to a gallery (single or batch)
// ---------------------------------------------------------------------------

export const POST = withAdminGuard(async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
  const { id: galleryId } = await context.params;
  const body = await request.json();
  const parsed = addImagesSchema.safeParse(body);

  if (!parsed.success) {
    return apiError('Validation failed', 'VALIDATION_ERROR', { status: 400, details: parsed.error.flatten() });
  }

  // Verify gallery exists
  const gallery = await prisma.gallery.findUnique({ where: { id: galleryId } });
  if (!gallery) {
    return apiError('Gallery not found', 'NOT_FOUND', { status: 404 });
  }

  const items = Array.isArray(parsed.data) ? parsed.data : [parsed.data];

  const images = await prisma.$transaction(
    items.map((item) =>
      prisma.galleryImage.create({
        data: {
          galleryId,
          imageUrl: item.imageUrl,
          title: item.title,
          caption: item.caption,
          altText: item.altText,
          sortOrder: item.sortOrder,
        },
      })
    )
  );

  return apiSuccess(images.length === 1 ? images[0] : images, { status: 201 });
});

// ---------------------------------------------------------------------------
// PUT: Update an image
// ---------------------------------------------------------------------------

export const PUT = withAdminGuard(async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
  const { id: galleryId } = await context.params;
  const body = await request.json();
  const parsed = updateImageSchema.safeParse(body);

  if (!parsed.success) {
    return apiError('Validation failed', 'VALIDATION_ERROR', { status: 400, details: parsed.error.flatten().fieldErrors });
  }

  const { imageId, ...updateData } = parsed.data;

  // Verify image belongs to this gallery
  const existing = await prisma.galleryImage.findFirst({
    where: { id: imageId, galleryId },
  });
  if (!existing) {
    return apiError('Image not found in this gallery', 'NOT_FOUND', { status: 404 });
  }

  const image = await prisma.galleryImage.update({
    where: { id: imageId },
    data: updateData,
  });

  return apiSuccess(image);
});

// ---------------------------------------------------------------------------
// DELETE: Remove an image
// ---------------------------------------------------------------------------

export const DELETE = withAdminGuard(async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
  const { id: galleryId } = await context.params;
  const { searchParams } = new URL(request.url);
  const imageId = searchParams.get('imageId');

  if (!imageId) {
    return apiError('Missing image id', 'VALIDATION_ERROR', { status: 400 });
  }

  const existing = await prisma.galleryImage.findFirst({
    where: { id: imageId, galleryId },
  });
  if (!existing) {
    return apiError('Image not found in this gallery', 'NOT_FOUND', { status: 404 });
  }

  await prisma.galleryImage.delete({ where: { id: imageId } });

  return apiSuccess({ deleted: true });
});
