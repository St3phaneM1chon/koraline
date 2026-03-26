export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { withAdminGuard } from '@/lib/admin-api-guard';
import { prisma } from '@/lib/db';

/**
 * LMS: Micro-Credentials per Chapter (Feature 13)
 * Returns chapter-level completion data for students,
 * using CourseChapter + LessonProgress to track
 * which chapters are fully completed (micro-credential earned).
 */
async function handler(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const courseId = url.searchParams.get('courseId');
    const userId = url.searchParams.get('userId');

    if (!courseId) {
      return NextResponse.json(
        { error: 'courseId query parameter is required' },
        { status: 400 }
      );
    }

    // Get all chapters with their lessons
    const chapters = await prisma.courseChapter.findMany({
      where: { courseId },
      include: {
        lessons: {
          where: { isPublished: true },
          select: { id: true, title: true, sortOrder: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { sortOrder: 'asc' },
      take: 100,
    });

    // Build enrollment filter
    const enrollmentFilter = userId
      ? { courseId, userId, status: 'ACTIVE' as const }
      : { courseId, status: 'ACTIVE' as const };

    // Get enrollments for the course
    const enrollments = await prisma.enrollment.findMany({
      where: enrollmentFilter,
      select: { id: true, userId: true },
      take: 500,
    });

    const enrollmentIds = enrollments.map((e) => e.id);

    // Get all lesson progress for these enrollments
    const progress = await prisma.lessonProgress.findMany({
      where: {
        enrollmentId: { in: enrollmentIds },
        isCompleted: true,
      },
      select: {
        enrollmentId: true,
        lessonId: true,
        completedAt: true,
      },
      take: 5000,
    });

    // Group progress by enrollmentId -> Set of completed lessonIds
    const progressMap = new Map<string, Set<string>>();
    for (const p of progress) {
      if (!progressMap.has(p.enrollmentId)) {
        progressMap.set(p.enrollmentId, new Set());
      }
      progressMap.get(p.enrollmentId)!.add(p.lessonId);
    }

    // Compute micro-credentials per chapter
    const microCredentials = chapters.map((chapter) => {
      const lessonIds = chapter.lessons.map((l) => l.id);
      const totalLessons = lessonIds.length;

      // For each enrollment, check if all lessons in this chapter are completed
      const earnedBy: Array<{ enrollmentId: string; userId: string }> = [];
      for (const enrollment of enrollments) {
        const completed = progressMap.get(enrollment.id);
        if (!completed) continue;

        const completedCount = lessonIds.filter((lid) =>
          completed.has(lid)
        ).length;
        if (completedCount === totalLessons && totalLessons > 0) {
          earnedBy.push({
            enrollmentId: enrollment.id,
            userId: enrollment.userId,
          });
        }
      }

      return {
        chapterId: chapter.id,
        chapterTitle: chapter.title,
        totalLessons,
        isPublished: chapter.isPublished,
        credentialEarnedCount: earnedBy.length,
        earnedBy: userId ? earnedBy : undefined, // Only include details if filtering by user
      };
    });

    return NextResponse.json({
      data: {
        courseId,
        chapters: microCredentials,
        totalChapters: chapters.length,
        totalEnrollments: enrollments.length,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const GET = withAdminGuard(handler);
