'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from '@/hooks/useTranslations';
import { PageHeader, Button, StatusBadge, EmptyState, DataTable, type Column } from '@/components/admin';
import { Plus, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Course {
  id: string;
  title: string;
  slug: string;
  status: string;
  level: string;
  enrollmentCount: number;
  category: { id: string; name: string } | null;
  _count: { chapters: number; enrollments: number };
  updatedAt: string;
}

const statusVariants: Record<string, 'success' | 'warning' | 'error' | 'neutral'> = {
  PUBLISHED: 'success',
  UNDER_REVIEW: 'warning',
  ARCHIVED: 'error',
  DRAFT: 'neutral',
};

export default function CoursesListPage() {
  const { t } = useTranslations();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/lms/courses?page=1&limit=50');
    const data = await res.json();
    setCourses(data.data?.courses ?? data.courses ?? []);
    setTotal(data.data?.total ?? data.total ?? 0);
    setLoading(false);
  }, []);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  const columns: Column<Course>[] = [
    {
      key: 'title',
      header: t('admin.lms.courseTitle'),
      render: (course) => (
        <div>
          <span className="font-medium">{course.title}</span>
          {course.category && (
            <span className="block text-xs text-muted-foreground">{course.category.name}</span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: t('common.status'),
      render: (course) => (
        <StatusBadge variant={statusVariants[course.status] ?? 'neutral'}>
          {course.status}
        </StatusBadge>
      ),
    },
    {
      key: 'level',
      header: t('admin.lms.level'),
      render: (course) => course.level,
    },
    {
      key: 'enrollmentCount',
      header: t('admin.lms.students'),
      render: (course) => String(course.enrollmentCount),
    },
    {
      key: 'chapters',
      header: t('admin.lms.chapters'),
      render: (course) => String(course._count.chapters),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('admin.lms.courses')}
        subtitle={`${total} ${t('admin.lms.coursesTotal')}`}
        actions={
          <Link href="/admin/formation/cours/nouveau">
            <Button><Plus className="mr-2 h-4 w-4" />{t('admin.lms.newCourse')}</Button>
          </Link>
        }
      />

      {!loading && courses.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title={t('admin.lms.noCourses')}
          description={t('admin.lms.noCoursesDesc')}
          action={
            <Link href="/admin/formation/cours/nouveau">
              <Button><Plus className="mr-2 h-4 w-4" />{t('admin.lms.createFirstCourse')}</Button>
            </Link>
          }
        />
      ) : (
        <DataTable
          columns={columns}
          data={courses}
          keyExtractor={(c) => c.id}
          loading={loading}
          onRowClick={(course) => router.push(`/admin/formation/cours/${course.id}`)}
          emptyTitle={t('admin.lms.noCourses')}
        />
      )}
    </div>
  );
}
