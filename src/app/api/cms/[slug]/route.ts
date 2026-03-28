export const dynamic = 'force-dynamic';

/**
 * Public CMS Collection Items API
 * GET /api/cms/:slug - Get published items from a collection by slug
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;

    const collection = await prisma.cmsCollection.findFirst({
      where: { slug, isActive: true },
    });

    if (!collection) {
      return NextResponse.json(
        { success: false, error: { message: 'Collection not found', code: 'NOT_FOUND' } },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.cmsItem.findMany({
        where: { collectionId: collection.id, isPublished: true },
        take: limit,
        skip,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        select: {
          id: true,
          data: true,
          slug: true,
          sortOrder: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.cmsItem.count({ where: { collectionId: collection.id, isPublished: true } }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        collection: {
          id: collection.id,
          name: collection.name,
          slug: collection.slug,
          description: collection.description,
          fields: collection.fields,
        },
        items,
      },
      pagination: {
        page,
        pageSize: limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('[CMS Public API] Error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    );
  }
}
