export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { withAdminGuard } from '@/lib/admin-api-guard';
import { prisma } from '@/lib/db';

/**
 * LMS: CEU (Continuing Education Units) Tracking (Feature 14)
 * Tracks earned CEU hours using Course.estimatedHours + Enrollment.completedAt.
 * CEU = estimatedHours of each completed course.
 */
async function handler(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const year = parseInt(
      url.searchParams.get('year') || new Date().getFullYear().toString(),
      10
    );

    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59);

    const whereFilter = {
      status: 'COMPLETED' as const,
      completedAt: { gte: startOfYear, lte: endOfYear },
      ...(userId ? { userId } : {}),
    };

    // Get completed enrollments with course info
    const completedEnrollments = await prisma.enrollment.findMany({
      where: whereFilter,
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            estimatedHours: true,
          },
        },
      },
      orderBy: { completedAt: 'desc' },
      take: 500,
    });

    // Calculate total CEU hours
    let totalCeuHours = 0;
    const courseCredits = completedEnrollments.map((enrollment) => {
      const hours = enrollment.course.estimatedHours
        ? Number(enrollment.course.estimatedHours)
        : 0;
      totalCeuHours += hours;

      return {
        enrollmentId: enrollment.id,
        userId: enrollment.userId,
        courseId: enrollment.course.id,
        courseTitle: enrollment.course.title,
        courseSlug: enrollment.course.slug,
        estimatedHours: hours,
        completedAt: enrollment.completedAt,
      };
    });

    // If no userId filter, aggregate by user
    let perUserSummary: Array<{
      userId: string;
      totalHours: number;
      coursesCompleted: number;
    }> | null = null;

    if (!userId) {
      const userMap = new Map<
        string,
        { totalHours: number; coursesCompleted: number }
      >();
      for (const credit of courseCredits) {
        const existing = userMap.get(credit.userId) || {
          totalHours: 0,
          coursesCompleted: 0,
        };
        existing.totalHours += credit.estimatedHours;
        existing.coursesCompleted += 1;
        userMap.set(credit.userId, existing);
      }

      perUserSummary = Array.from(userMap.entries())
        .map(([uid, data]) => ({
          userId: uid,
          totalHours: Number(data.totalHours.toFixed(1)),
          coursesCompleted: data.coursesCompleted,
        }))
        .sort((a, b) => b.totalHours - a.totalHours);
    }

    return NextResponse.json({
      data: {
        year,
        totalCeuHours: Number(totalCeuHours.toFixed(1)),
        totalCoursesCompleted: courseCredits.length,
        credits: courseCredits,
        ...(perUserSummary ? { perUserSummary } : {}),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const GET = withAdminGuard(handler);
