export const dynamic = 'force-dynamic';

/**
 * STUDENT DASHBOARD - My Courses
 * Lists enrolled courses with progress, links to continue learning
 */

import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { auth } from '@/lib/auth-config';
import { prisma } from '@/lib/db';
import { getCurrentTenantIdFromContext } from '@/lib/db';
import { getApiTranslator } from '@/i18n/server';

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

  const { t, formatDate } = await getApiTranslator();

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
  const getNextLesson = (enrollment: typeof enrollments[0]) => {
    const completedIds = new Set(enrollment.lessonProgress.map((lp) => lp.lessonId));
    for (const ch of enrollment.course.chapters) {
      for (const l of ch.lessons) {
        if (!completedIds.has(l.id)) {
          return { chapterId: ch.id, lessonId: l.id };
        }
      }
    }
    return null;
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-blue-100 text-blue-700';
      case 'COMPLETED': return 'bg-green-100 text-green-700';
      case 'SUSPENDED': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE': return t('lms.studentDashboard.active');
      case 'COMPLETED': return t('lms.studentDashboard.completed');
      case 'SUSPENDED': return t('lms.studentDashboard.suspended');
      default: return status;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            {t('lms.studentDashboard.title')}
          </h1>
          <p className="text-gray-500 mt-1">{t('lms.studentDashboard.subtitle')}</p>
        </div>

        {enrollments.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <p className="text-gray-500 mb-4">{t('lms.studentDashboard.noCourses')}</p>
            <Link
              href="/learn"
              className="inline-flex items-center px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              {t('lms.studentDashboard.browseCourses')}
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {enrollments.map((enrollment) => {
              const progress = Number(enrollment.progress);
              const nextLesson = getNextLesson(enrollment);
              return (
                <div
                  key={enrollment.id}
                  className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col sm:flex-row gap-5"
                >
                  {/* Thumbnail */}
                  <div className="w-full sm:w-48 h-32 relative rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    {enrollment.course.thumbnailUrl ? (
                      <Image
                        src={enrollment.course.thumbnailUrl}
                        alt={enrollment.course.title}
                        fill
                        sizes="192px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <Link
                          href={`/learn/${enrollment.course.slug}`}
                          className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                        >
                          {enrollment.course.title}
                        </Link>
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-gray-500">
                          {enrollment.course.instructor?.title && (
                            <span>{enrollment.course.instructor.title}</span>
                          )}
                          {enrollment.course.level && (
                            <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">
                              {t(`lms.levels.${enrollment.course.level}`)}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0 ${statusColor(enrollment.status)}`}>
                        {statusLabel(enrollment.status)}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-600">
                          {t('lms.studentDashboard.courseProgress', { percent: Math.round(progress) })}
                        </span>
                        <span className="text-gray-400">
                          {t('lms.studentDashboard.lessonsCompleted', {
                            completed: enrollment.lessonsCompleted,
                            total: enrollment.totalLessons,
                          })}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${progress >= 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-3 flex items-center gap-3 text-sm">
                      {enrollment.status === 'ACTIVE' && nextLesson ? (
                        <Link
                          href={`/learn/${enrollment.course.slug}/${nextLesson.chapterId}/${nextLesson.lessonId}`}
                          className="inline-flex items-center gap-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          {t('lms.studentDashboard.continueCourse')}
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      ) : (
                        <Link
                          href={`/learn/${enrollment.course.slug}`}
                          className="inline-flex items-center gap-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          {t('lms.studentDashboard.viewCourse')}
                        </Link>
                      )}
                      <span className="text-gray-400">
                        {t('lms.studentDashboard.enrolledOn', {
                          date: formatDate(enrollment.enrolledAt),
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
