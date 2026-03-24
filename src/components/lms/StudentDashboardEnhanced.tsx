'use client';

/**
 * STUDENT DASHBOARD ENHANCED — Client-side enrichment layer
 * ==========================================================
 * Wraps the server-provided enrollment data with Phase 4 differentiators:
 * - ProgressRing for each course
 * - BadgeDisplay for earned badges
 * - Streak counter
 * - "Continue where you left off" section
 * - Upcoming deadlines
 * - Overall stats
 *
 * Receives serialized data from the server component and fetches
 * additional data (badges, streak) client-side from the dashboard API.
 */

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useI18n } from '@/i18n/client';
import ProgressRing from '@/components/lms/ProgressRing';
import BadgeDisplay, { type Badge } from '@/components/lms/BadgeDisplay';

// ── Types ────────────────────────────────────────────────────

export interface SerializedEnrollment {
  id: string;
  status: string;
  progress: number;
  lessonsCompleted: number;
  totalLessons: number;
  lastAccessedAt: string | null;
  completedAt: string | null;
  complianceDeadline: string | null;
  enrolledAt: string;
  courseTitle: string;
  courseSlug: string;
  courseThumbnailUrl: string | null;
  courseLevel: string | null;
  instructorTitle: string | null;
  nextLessonUrl: string | null;
}

interface DashboardExtra {
  badges: Badge[];
  streak: number;
  stats: {
    totalCourses: number;
    completed: number;
    inProgress: number;
    totalHoursSpent: number;
  };
  deadlines: Array<{
    courseTitle: string;
    courseSlug: string;
    deadline: string;
    status: string;
  }>;
}

interface StudentDashboardEnhancedProps {
  enrollments: SerializedEnrollment[];
}

export default function StudentDashboardEnhanced({ enrollments }: StudentDashboardEnhancedProps) {
  const { t, formatDate } = useI18n();
  const [extra, setExtra] = useState<DashboardExtra | null>(null);

  // Fetch extra data (badges, streak, deadlines) client-side
  useEffect(() => {
    fetch('/api/lms/student/dashboard')
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data) setExtra(data); })
      .catch(() => { /* silent */ });
  }, []);

  // Continue where you left off
  const lastAccessed = useMemo(() => {
    const active = enrollments
      .filter(e => e.lastAccessedAt && e.status === 'ACTIVE')
      .sort((a, b) => new Date(b.lastAccessedAt!).getTime() - new Date(a.lastAccessedAt!).getTime());
    return active[0] ?? null;
  }, [enrollments]);

  const activeCourses = enrollments.filter(e => e.status === 'ACTIVE');
  const completedCourses = enrollments.filter(e => e.status === 'COMPLETED');

  const upcomingDeadlines = useMemo(
    () => (extra?.deadlines ?? []).filter(d => {
      return new Date(d.deadline) > new Date() && d.status !== 'COMPLETED';
    }).sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()),
    [extra]
  );

  return (
    <div className="space-y-8">
      {/* Overall Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label={t('learn.studentDashboard.totalCourses')}
          value={extra?.stats.totalCourses ?? enrollments.length}
          icon="📚"
        />
        <StatCard
          label={t('learn.studentDashboard.completedCourses')}
          value={extra?.stats.completed ?? completedCourses.length}
          icon="✅"
        />
        <StatCard
          label={t('learn.studentDashboard.inProgressCourses')}
          value={extra?.stats.inProgress ?? activeCourses.length}
          icon="📖"
        />
        <StatCard
          label={t('learn.studentDashboard.hoursSpent')}
          value={extra?.stats.totalHoursSpent ?? 0}
          icon="⏱️"
          suffix="h"
        />
      </div>

      {/* Continue where you left off */}
      {lastAccessed && (
        <section>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
            {t('learn.studentDashboard.continueWhere')}
          </h2>
          <Link
            href={lastAccessed.nextLessonUrl ?? `/learn/${lastAccessed.courseSlug}`}
            className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-2xl border border-blue-200 dark:border-blue-800 shadow-sm hover:shadow-md transition-shadow group"
          >
            <ProgressRing
              progress={lastAccessed.progress}
              size="lg"
              showPercent
            />
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">
                {lastAccessed.courseTitle}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {lastAccessed.lessonsCompleted} / {lastAccessed.totalLessons} {t('learn.lessons')}
                {lastAccessed.instructorTitle && (
                  <span> &middot; {lastAccessed.instructorTitle}</span>
                )}
              </p>
              {lastAccessed.lastAccessedAt && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {t('learn.studentDashboard.lastAccessed')}: {formatDate(lastAccessed.lastAccessedAt)}
                </p>
              )}
            </div>
            <svg className="w-6 h-6 text-gray-400 group-hover:text-blue-500 flex-shrink-0 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </section>
      )}

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main: Course Cards with ProgressRing */}
        <div className="lg:col-span-2 space-y-6">
          {activeCourses.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                {t('learn.studentDashboard.activeCourses')} ({activeCourses.length})
              </h2>
              <div className="space-y-3">
                {activeCourses.map(enrollment => (
                  <EnrichedCourseCard
                    key={enrollment.id}
                    enrollment={enrollment}
                    t={t}
                    formatDate={formatDate}
                  />
                ))}
              </div>
            </section>
          )}

          {completedCourses.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                {t('learn.studentDashboard.completedLabel')} ({completedCourses.length})
              </h2>
              <div className="space-y-3">
                {completedCourses.map(enrollment => (
                  <EnrichedCourseCard
                    key={enrollment.id}
                    enrollment={enrollment}
                    t={t}
                    formatDate={formatDate}
                  />
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Badges & Streak */}
          <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4">
              {t('learn.studentDashboard.badgesAndStreak')}
            </h3>
            <BadgeDisplay
              badges={extra?.badges ?? []}
              streak={extra?.streak ?? 0}
              compact={false}
            />
          </section>

          {/* Upcoming Deadlines */}
          {upcomingDeadlines.length > 0 && (
            <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
              <h3 className="text-base font-bold text-gray-900 dark:text-white mb-3">
                {t('learn.studentDashboard.upcomingDeadlines')}
              </h3>
              <ul className="space-y-3">
                {upcomingDeadlines.slice(0, 5).map((dl, idx) => {
                  const isUrgent = new Date(dl.deadline).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000;
                  return (
                    <li key={idx}>
                      <Link
                        href={`/learn/${dl.courseSlug}`}
                        className="flex items-start gap-3 group"
                      >
                        <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-1.5 ${
                          isUrgent ? 'bg-red-500' : 'bg-yellow-500'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate group-hover:text-blue-600">
                            {dl.courseTitle}
                          </p>
                          <p className={`text-xs mt-0.5 ${
                            isUrgent ? 'text-red-600 dark:text-red-400 font-medium' : 'text-gray-500 dark:text-gray-400'
                          }`}>
                            {t('learn.studentDashboard.dueBy')} {formatDate(dl.deadline)}
                          </p>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {/* Quick Links */}
          <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-3">
              {t('learn.quickLinks')}
            </h3>
            <nav className="space-y-2">
              <QuickLink href="/learn/mastery" label={t('learn.mastery.title')} icon="🎯" />
              <QuickLink href="/learn/review" label={t('learn.review.title')} icon="🔄" />
              <QuickLink href="/learn/roleplay" label={t('learn.roleplay.title')} icon="🎭" />
              <QuickLink href="/dashboard/student/certificates" label={t('lms.certificates')} icon="🏆" />
              <QuickLink href="/learn/catalog" label={t('learn.catalog')} icon="📚" />
            </nav>
          </section>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────

function StatCard({ label, value, icon, suffix }: {
  label: string; value: number; icon: string; suffix?: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg" role="img" aria-hidden="true">{icon}</span>
        <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">
        {value}{suffix}
      </p>
    </div>
  );
}

function EnrichedCourseCard({ enrollment, t, formatDate }: {
  enrollment: SerializedEnrollment;
  t: (key: string, params?: Record<string, string | number>) => string;
  formatDate: (date: Date | string) => string;
}) {
  const isCompleted = enrollment.status === 'COMPLETED';
  const url = enrollment.nextLessonUrl ?? `/learn/${enrollment.courseSlug}`;

  return (
    <Link
      href={url}
      className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow group"
    >
      <ProgressRing
        progress={enrollment.progress}
        size="md"
        color={isCompleted ? 'green' : 'auto'}
        showPercent
      />
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">
          {enrollment.courseTitle}
        </h4>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {enrollment.lessonsCompleted} / {enrollment.totalLessons} {t('learn.lessons')}
          {enrollment.instructorTitle && (
            <span> &middot; {enrollment.instructorTitle}</span>
          )}
        </p>
        {isCompleted && enrollment.completedAt && (
          <p className="text-xs text-green-600 dark:text-green-400 mt-1 font-medium">
            {t('lms.completedOn')} {formatDate(enrollment.completedAt)}
          </p>
        )}
        {!isCompleted && enrollment.complianceDeadline && (
          <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
            {t('learn.studentDashboard.dueBy')} {formatDate(enrollment.complianceDeadline)}
          </p>
        )}
        {enrollment.courseLevel && (
          <span className="inline-block mt-1.5 px-2 py-0.5 text-[10px] font-medium rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
            {enrollment.courseLevel}
          </span>
        )}
      </div>
      <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-500 flex-shrink-0 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}

function QuickLink({ href, label, icon }: { href: string; label: string; icon: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
    >
      <span className="text-base" role="img" aria-hidden="true">{icon}</span>
      <span>{label}</span>
    </Link>
  );
}
