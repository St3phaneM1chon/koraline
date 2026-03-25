export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { withAdminGuard } from '@/lib/admin-api-guard';
import { apiSuccess, apiError } from '@/lib/api-response';
import { ErrorCode } from '@/lib/error-codes';
import { prisma } from '@/lib/db';

export const GET = withAdminGuard(async (request: NextRequest, { session }) => {
  const tenantId = session.user.tenantId;
  const { searchParams } = new URL(request.url);
  const courseId = searchParams.get('courseId');

  if (!courseId) {
    return apiError('courseId required', ErrorCode.VALIDATION_ERROR, { request });
  }

  // Get or compute gradebook entries for all enrolled students
  const enrollments = await prisma.enrollment.findMany({
    where: { tenantId, courseId },
    include: {
      lessonProgress: {
        select: { quizScore: true, quizPassed: true, isCompleted: true },
      },
      course: { select: { passingScore: true, examQuizId: true } },
    },
  });

  const grades = await Promise.all(enrollments.map(async (enrollment) => {
    // Quiz average
    const quizScores = enrollment.lessonProgress
      .filter(p => p.quizScore !== null)
      .map(p => Number(p.quizScore));
    const quizAverage = quizScores.length > 0
      ? quizScores.reduce((a, b) => a + b, 0) / quizScores.length
      : null;

    // Exam score
    let examScore: number | null = null;
    if (enrollment.course.examQuizId) {
      const examAttempt = await prisma.quizAttempt.findFirst({
        where: { tenantId, userId: enrollment.userId, quizId: enrollment.course.examQuizId, passed: true },
        orderBy: { score: 'desc' },
        select: { score: true },
      });
      examScore = examAttempt ? Number(examAttempt.score) : null;
    }

    // Participation score (discussions + Q&A)
    const [discussionCount, qaCount] = await Promise.all([
      prisma.courseDiscussion.count({ where: { tenantId, courseId, userId: enrollment.userId } }),
      prisma.lessonQA.count({ where: { tenantId, userId: enrollment.userId } }),
    ]);
    const participationScore = Math.min(100, (discussionCount + qaCount) * 10);

    // Weighted final grade (30% quiz, 40% exam, 20% assignments, 10% participation)
    const weights = { quiz: 30, exam: 40, assignment: 20, participation: 10 };
    let finalGrade: number | null = null;
    if (quizAverage !== null || examScore !== null) {
      finalGrade = 0;
      let totalWeight = 0;
      if (quizAverage !== null) { finalGrade += quizAverage * weights.quiz; totalWeight += weights.quiz; }
      if (examScore !== null) { finalGrade += examScore * weights.exam; totalWeight += weights.exam; }
      finalGrade += participationScore * weights.participation;
      totalWeight += weights.participation;
      finalGrade = totalWeight > 0 ? finalGrade / totalWeight : null;
    }

    const letterGrade = finalGrade !== null ? getLetterGrade(finalGrade) : null;

    // Upsert gradebook
    await prisma.gradebook.upsert({
      where: { tenantId_courseId_userId: { tenantId, courseId, userId: enrollment.userId } },
      create: {
        tenantId, courseId, userId: enrollment.userId,
        quizAverage, examScore, participationScore,
        finalGrade, letterGrade,
        passed: (finalGrade ?? 0) >= (enrollment.course.passingScore ?? 70),
        lastCalculatedAt: new Date(),
      },
      update: {
        quizAverage, examScore, participationScore,
        finalGrade, letterGrade,
        passed: (finalGrade ?? 0) >= (enrollment.course.passingScore ?? 70),
        lastCalculatedAt: new Date(),
      },
    });

    return {
      userId: enrollment.userId,
      enrollmentId: enrollment.id,
      progress: Number(enrollment.progress),
      status: enrollment.status,
      quizAverage,
      examScore,
      participationScore,
      finalGrade: finalGrade !== null ? Math.round(finalGrade * 10) / 10 : null,
      letterGrade,
      passed: (finalGrade ?? 0) >= (enrollment.course.passingScore ?? 70),
    };
  }));

  return apiSuccess({ courseId, grades, count: grades.length }, { request });
});

function getLetterGrade(score: number): string {
  if (score >= 93) return 'A+';
  if (score >= 86) return 'A';
  if (score >= 80) return 'B+';
  if (score >= 73) return 'B';
  if (score >= 67) return 'C+';
  if (score >= 60) return 'C';
  if (score >= 50) return 'D';
  return 'F';
}
