export const dynamic = 'force-dynamic';
/**
 * API - Forum Categories
 * GET: List all forum categories with post counts
 *
 * Public endpoint - no authentication required.
 *
 * Response shape (matching frontend expectations):
 *   { categories: [{ id, name, slug, description, icon, color, postCount }] }
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { apiError } from '@/lib/api-response';
import { ErrorCode } from '@/lib/error-codes';
import { logger } from '@/lib/logger';

/**
 * Map category slugs to Tailwind color classes matching frontend fallback values.
 */
function getCategoryColor(slug: string): string {
  const colorMap: Record<string, string> = {
    general: 'bg-blue-100 text-blue-700',
    research: 'bg-purple-100 text-purple-700',
    howto: 'bg-green-100 text-green-700',
    results: 'bg-orange-100 text-orange-700',
    support: 'bg-red-100 text-red-700',
  };
  return colorMap[slug] || 'bg-neutral-100 text-neutral-700';
}

export async function GET(request: NextRequest) {
  try {
    const categories = await prisma.forumCategory.findMany({
      orderBy: { sortOrder: 'asc' },
      take: 100,
      include: {
        _count: {
          select: {
            posts: { where: { deletedAt: null } },
          },
        },
      },
    });

    const data = categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      icon: cat.icon,
      color: getCategoryColor(cat.slug),
      sortOrder: cat.sortOrder,
      postCount: cat._count.posts,
      createdAt: cat.createdAt.toISOString(),
    }));

    // Return { categories: [...] } at top level to match frontend expectations
    // (frontend reads data.categories directly from res.json())
    return NextResponse.json({ categories: data });
  } catch (error) {
    logger.error('Error fetching forum categories', { error: error instanceof Error ? error.message : String(error) });
    return apiError(
      'Failed to fetch forum categories',
      ErrorCode.INTERNAL_ERROR,
      { request }
    );
  }
}
