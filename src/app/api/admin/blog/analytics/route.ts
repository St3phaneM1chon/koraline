export const dynamic = 'force-dynamic';

/**
 * Blog Analytics API
 * GET /api/admin/blog/analytics
 *
 * Returns blog analytics:
 * - Total posts count (published/draft)
 * - Posts by category
 * - Most recent posts (ordered by publishedAt)
 * - Featured posts count
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAdminGuard } from '@/lib/admin-api-guard';
import { logger } from '@/lib/logger';

// ---------------------------------------------------------------------------
// GET /api/admin/blog/analytics
// ---------------------------------------------------------------------------

export const GET = withAdminGuard(async () => {
  try {
    // Run all queries in parallel for performance
    const [
      totalPosts,
      publishedPosts,
      draftPosts,
      featuredPosts,
      postsByCategory,
      recentPosts,
      postsThisMonth,
      postsThisWeek,
    ] = await Promise.all([
      // Total posts
      prisma.blogPost.count(),

      // Published posts
      prisma.blogPost.count({ where: { isPublished: true } }),

      // Draft posts
      prisma.blogPost.count({ where: { isPublished: false } }),

      // Featured posts
      prisma.blogPost.count({ where: { isFeatured: true } }),

      // Posts grouped by category
      prisma.blogPost.groupBy({
        by: ['category'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
      }),

      // Most recent posts (top 10 by publish date)
      prisma.blogPost.findMany({
        orderBy: { publishedAt: 'desc' },
        take: 10,
        select: {
          id: true,
          title: true,
          slug: true,
          category: true,
          isPublished: true,
          isFeatured: true,
          publishedAt: true,
          readTime: true,
          author: true,
        },
      }),

      // Posts published this month
      prisma.blogPost.count({
        where: {
          isPublished: true,
          publishedAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),

      // Posts published this week
      prisma.blogPost.count({
        where: {
          isPublished: true,
          publishedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    // Format category breakdown
    const categories = postsByCategory.map((group) => ({
      category: group.category || 'Uncategorized',
      count: group._count.id,
    }));

    // Get unique authors
    const authorStats = await prisma.blogPost.groupBy({
      by: ['author'],
      _count: { id: true },
      where: { author: { not: null } },
      orderBy: { _count: { id: 'desc' } },
    });

    const authors = authorStats.map((group) => ({
      author: group.author || 'Unknown',
      postCount: group._count.id,
    }));

    return NextResponse.json({
      overview: {
        totalPosts,
        publishedPosts,
        draftPosts,
        featuredPosts,
        publishRate: totalPosts > 0
          ? Math.round((publishedPosts / totalPosts) * 100)
          : 0,
      },
      activity: {
        postsThisWeek,
        postsThisMonth,
      },
      categories,
      authors,
      recentPosts: recentPosts.map((post) => ({
        ...post,
        readTime: post.readTime ?? null,
      })),
    });
  } catch (error) {
    logger.error('Blog analytics failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
