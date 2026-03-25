export const dynamic = 'force-dynamic';

/**
 * Public LMS Course Catalog API
 * GET /api/lms/courses — Browse published courses (authenticated or not)
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentTenantIdFromContext } from '@/lib/db';
import type { CourseLevel } from '@prisma/client';

export async function GET(request: NextRequest) {
  const tenantId = getCurrentTenantIdFromContext();

  // C2-SEC-S-006 FIX: Require tenant context — never return unscoped courses
  if (!tenantId) {
    return NextResponse.json({ courses: [], total: 0, page: 1, limit: 12, totalPages: 0 });
  }

  const { searchParams } = new URL(request.url);
  const categorySlug = searchParams.get('category') ?? undefined;
  const search = searchParams.get('search') ?? undefined;
  const level = searchParams.get('level') ?? undefined;
  // FIX P2: NaN-safe parseInt with fallback
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1);
  const limit = Math.min(Math.max(1, parseInt(searchParams.get('limit') ?? '12', 10) || 12), 50);

  const where = {
    tenantId,
    status: 'PUBLISHED' as const,
    ...(categorySlug && { category: { slug: categorySlug } }),
    ...(level && { level: level.toUpperCase() as CourseLevel }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } },
        { tags: { has: search.toLowerCase() } },
      ],
    }),
  };

  const [courses, total] = await Promise.all([
    prisma.course.findMany({
      where,
      select: {
        id: true,
        slug: true,
        title: true,
        subtitle: true,
        description: true,
        thumbnailUrl: true,
        level: true,
        isFree: true,
        price: true,
        currency: true,
        estimatedHours: true,
        enrollmentCount: true,
        averageRating: true,
        reviewCount: true,
        tags: true,
        category: { select: { name: true, slug: true } },
        instructor: { select: { title: true, avatarUrl: true } },
        _count: { select: { chapters: true } },
      },
      orderBy: { publishedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.course.count({ where }),
  ]);

  return NextResponse.json({
    courses,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}
