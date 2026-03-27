export const dynamic = 'force-dynamic';

/**
 * QUIZ PAGE for a lesson
 * /learn/[slug]/[chapterId]/[lessonId]/quiz
 *
 * Fetches quiz questions from the API and renders the QuizPlayer component.
 * On completion, marks the lesson as complete if passed and navigates back.
 */

import { redirect, notFound } from 'next/navigation';
import { auth } from '@/lib/auth-config';
import { prisma } from '@/lib/db';
import { getCurrentTenantIdFromContext } from '@/lib/db';
import QuizPageClient from './QuizPageClient';

interface PageProps {
  params: Promise<{ slug: string; chapterId: string; lessonId: string }>;
}

export default async function QuizPage({ params }: PageProps) {
  const { slug, chapterId, lessonId } = await params;

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

  // Fetch the course to verify access
  const course = await prisma.course.findFirst({
    where: {
      slug,
      status: 'PUBLISHED',
      ...(tenantId ? { tenantId } : {}),
    },
    select: { id: true, title: true },
  });

  if (!course) {
    notFound();
  }

  // Find the enrollment
  const enrollment = tenantId
    ? await prisma.enrollment.findUnique({
        where: {
          tenantId_courseId_userId: {
            tenantId,
            courseId: course.id,
            userId: session.user.id,
          },
        },
        select: { id: true },
      })
    : null;

  if (!enrollment) {
    redirect(`/learn/${slug}`);
  }

  // Fetch the lesson to get its quizId
  const lesson = await prisma.lesson.findFirst({
    where: {
      id: lessonId,
      chapterId,
      chapter: { courseId: course.id },
      isPublished: true,
    },
    select: {
      id: true,
      title: true,
      quizId: true,
      type: true,
    },
  });

  if (!lesson || !lesson.quizId) {
    // No quiz for this lesson — redirect back to the lesson
    redirect(`/learn/${slug}/${chapterId}/${lessonId}`);
  }

  return (
    <QuizPageClient
      courseSlug={slug}
      courseTitle={course.title}
      chapterId={chapterId}
      lessonId={lessonId}
      lessonTitle={lesson.title}
      quizId={lesson.quizId}
      enrollmentId={enrollment.id}
    />
  );
}
