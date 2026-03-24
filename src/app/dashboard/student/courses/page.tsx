export const dynamic = 'force-dynamic';

/**
 * STUDENT DASHBOARD - My Courses (Enhanced with Phase 4 differentiators)
 * ======================================================================
 * Server component that fetches enrollment data and renders the enriched
 * client-side dashboard with ProgressRing, BadgeDisplay, streak counter,
 * "continue where you left off", upcoming deadlines, and overall stats.
 *
 * Original server-side data fetching is preserved. The client-side
 * StudentDashboardEnhanced component adds badges/streak via a separate
 * API call, keeping the initial render fast with SSR.
 */

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth-config';
import { prisma } from '@/lib/db';
import { getCurrentTenantIdFromContext } from '@/lib/db';
import { getApiTranslator } from '@/i18n/server';
import StudentDashboardEnhanced, {
  type SerializedEnrollment,
} from '@/components/lms/StudentDashboardEnhanced';

export default async function StudentCoursesPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  let tenantId: string | null = null;
  try {
    tenantId = getCurrentTenantIdFromContext();
  } catch {
    // no tenant
  }

  if (!tenantId) {
    redirect('/dashboard');
  }

  const { t } = await getApiTranslator();

  const enrollments = await prisma.enrollment.findMany({
    where: { tenantId, userId: session.user.id },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          slug: true,
          thumbnailUrl: true,
          level: true,
          estimatedHours: true,
          instructor: { select: { title: true } },
          chapters: {
            where: { isPublished: true },
            orderBy: { sortOrder: 'asc' },
            include: {
              lessons: {
                where: { isPublished: true },
                orderBy: { sortOrder: 'asc' },
                select: { id: true },
              },
            },
          },
        },
      },
      lessonProgress: {
        where: { isCompleted: true },
        select: { lessonId: true },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  // Find the first incomplete lesson for each enrollment
  const getNextLessonUrl = (enrollment: typeof enrollments[0]): string | null => {
    const completedIds = new Set(enrollment.lessonProgress.map((lp) => lp.lessonId));
    for (const ch of enrollment.course.chapters) {
      for (const l of ch.lessons) {
        if (!completedIds.has(l.id)) {
          return `/learn/${enrollment.course.slug}/${ch.id}/${l.id}`;
        }
      }
    }
    return null;
  };

  // Serialize enrollments for client component (strip non-serializable fields)
  const serializedEnrollments: SerializedEnrollment[] = enrollments.map(e => ({
    id: e.id,
    status: e.status,
    progress: Number(e.progress),
    lessonsCompleted: e.lessonsCompleted,
    totalLessons: e.totalLessons,
    lastAccessedAt: e.lastAccessedAt?.toISOString() ?? null,
    completedAt: e.completedAt?.toISOString() ?? null,
    complianceDeadline: e.complianceDeadline?.toISOString() ?? null,
    enrolledAt: e.enrolledAt.toISOString(),
    courseTitle: e.course.title,
    courseSlug: e.course.slug,
    courseThumbnailUrl: e.course.thumbnailUrl,
    courseLevel: e.course.level,
    instructorTitle: e.course.instructor?.title ?? null,
    nextLessonUrl: getNextLessonUrl(e),
  }));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <section className="bg-[#143C78] text-white py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/learn"
            className="inline-flex items-center gap-2 text-blue-300 hover:text-blue-200 mb-4 text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t('learn.backToLearning')}
          </Link>
          <h1 className="text-3xl font-bold mb-2">
            {t('learn.studentDashboard.title')}
          </h1>
          <p className="text-blue-200 text-base">
            {t('learn.studentDashboard.subtitle')}
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {enrollments.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
            <svg className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <p className="text-gray-500 dark:text-gray-400 mb-4">{t('learn.studentDashboard.noCourses')}</p>
            <Link
              href="/learn"
              className="inline-flex items-center px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              {t('learn.catalog')}
            </Link>
          </div>
        ) : (
          <StudentDashboardEnhanced enrollments={serializedEnrollments} />
        )}
      </div>
    </div>
  );
}
