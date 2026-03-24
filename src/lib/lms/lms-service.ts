import { prisma } from '@/lib/db';
import type { Prisma, CourseStatus } from '@prisma/client';

// ── Courses ──────────────────────────────────────────────────

export async function getCourses(tenantId: string, options?: {
  status?: CourseStatus;
  categoryId?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const { status, categoryId, search, page = 1, limit = 20 } = options ?? {};
  const skip = (page - 1) * limit;

  const where: Prisma.CourseWhereInput = {
    tenantId,
    ...(status && { status }),
    ...(categoryId && { categoryId }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
  };

  const [courses, total] = await Promise.all([
    prisma.course.findMany({
      where,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        instructor: { select: { id: true, userId: true, title: true, avatarUrl: true } },
        _count: { select: { chapters: true, enrollments: true, reviews: true } },
      },
      orderBy: { updatedAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.course.count({ where }),
  ]);

  return { courses, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getCourseBySlug(tenantId: string, slug: string) {
  return prisma.course.findUnique({
    where: { tenantId_slug: { tenantId, slug } },
    include: {
      category: true,
      instructor: true,
      certificateTemplate: true,
      chapters: {
        where: { isPublished: true },
        orderBy: { sortOrder: 'asc' },
        include: {
          lessons: {
            where: { isPublished: true },
            orderBy: { sortOrder: 'asc' },
            select: {
              id: true,
              title: true,
              type: true,
              sortOrder: true,
              isFree: true,
              videoDuration: true,
              estimatedMinutes: true,
            },
          },
        },
      },
      prerequisites: {
        include: {
          prerequisite: { select: { id: true, title: true, slug: true } },
        },
      },
    },
  });
}

export async function getCourseById(tenantId: string, id: string) {
  return prisma.course.findFirst({
    where: { id, tenantId },
    include: {
      category: true,
      instructor: true,
      certificateTemplate: true,
      chapters: {
        orderBy: { sortOrder: 'asc' },
        include: {
          lessons: {
            orderBy: { sortOrder: 'asc' },
          },
        },
      },
    },
  });
}

export async function createCourse(tenantId: string, data: Prisma.CourseCreateInput) {
  return prisma.course.create({ data: { ...data, tenantId } });
}

export async function updateCourse(tenantId: string, id: string, data: Prisma.CourseUpdateInput) {
  // C3-SEC-S-001 FIX: Verify tenant ownership before update
  const course = await prisma.course.findFirst({ where: { id, tenantId } });
  if (!course) throw new Error('Course not found');
  return prisma.course.update({
    where: { id },
    data,
  });
}

export async function deleteCourse(tenantId: string, id: string) {
  // Verify ownership before delete
  const course = await prisma.course.findFirst({ where: { id, tenantId } });
  if (!course) throw new Error('Course not found');
  return prisma.course.delete({ where: { id } });
}

// ── Enrollments ──────────────────────────────────────────────

export async function enrollUser(tenantId: string, courseId: string, userId: string, enrolledBy?: string) {
  // C3-BIZ-B-004 FIX: Check for duplicate enrollment before creating
  const existing = await prisma.enrollment.findUnique({
    where: { tenantId_courseId_userId: { tenantId, courseId, userId } },
    select: { id: true },
  });
  if (existing) throw new Error('Already enrolled');

  const course = await prisma.course.findFirst({
    where: { id: courseId, tenantId, status: 'PUBLISHED' },
    include: { _count: { select: { enrollments: true } }, chapters: { include: { lessons: true } } },
  });
  if (!course) throw new Error('Course not found or not published');

  // Check max enrollments
  if (course.maxEnrollments && course._count.enrollments >= course.maxEnrollments) {
    throw new Error('Course is full');
  }

  // Count total lessons
  const totalLessons = course.chapters.reduce((sum, ch) => sum + ch.lessons.length, 0);

  // Calculate compliance deadline
  let complianceDeadline: Date | undefined;
  if (course.isCompliance && course.complianceDeadlineDays) {
    complianceDeadline = new Date();
    complianceDeadline.setDate(complianceDeadline.getDate() + course.complianceDeadlineDays);
  }

  const enrollment = await prisma.enrollment.create({
    data: {
      tenantId,
      courseId,
      userId,
      totalLessons,
      enrolledBy: enrolledBy ?? null,
      enrollmentSource: enrolledBy ? 'admin' : 'self',
      complianceStatus: course.isCompliance ? 'NOT_STARTED' : null,
      complianceDeadline: complianceDeadline ?? null,
    },
  });

  // Increment enrollment count on course
  await prisma.course.update({
    where: { id: courseId },
    data: { enrollmentCount: { increment: 1 } },
  });

  return enrollment;
}

export async function getEnrollment(tenantId: string, courseId: string, userId: string) {
  return prisma.enrollment.findUnique({
    where: { tenantId_courseId_userId: { tenantId, courseId, userId } },
    include: {
      course: { select: { id: true, title: true, slug: true, thumbnailUrl: true } },
      lessonProgress: true,
    },
  });
}

export async function getUserEnrollments(tenantId: string, userId: string) {
  return prisma.enrollment.findMany({
    where: { tenantId, userId },
    include: {
      course: {
        select: {
          id: true, title: true, slug: true, thumbnailUrl: true,
          level: true, estimatedHours: true, instructor: { select: { title: true } },
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
    take: 100,
  });
}

// ── Progress ─────────────────────────────────────────────────

export async function updateLessonProgress(
  tenantId: string,
  enrollmentId: string,
  lessonId: string,
  userId: string,
  data: {
    isCompleted?: boolean;
    videoProgress?: number;
    videoCompleted?: boolean;
    timeSpent?: number;
    quizScore?: number;
    quizPassed?: boolean;
  }
) {
  // C2-FEAT-I-002 FIX: Server-side validation of progress claims
  // Verify the enrollment belongs to this user and tenant
  const enrollment = await prisma.enrollment.findFirst({
    where: { id: enrollmentId, tenantId, userId },
    select: { id: true, status: true },
  });
  if (!enrollment) {
    throw new Error('Enrollment not found or access denied');
  }
  if (enrollment.status === 'COMPLETED') {
    throw new Error('Course already completed');
  }

  // Validate: if videoCompleted is true, videoProgress must be > 0
  if (data.videoCompleted && (data.videoProgress === undefined || data.videoProgress <= 0)) {
    throw new Error('Cannot mark video as completed without video progress');
  }

  // Validate: timeSpent must be reasonable (max 8 hours per update)
  if (data.timeSpent && data.timeSpent > 28800) {
    throw new Error('Time spent per update cannot exceed 8 hours');
  }

  const progress = await prisma.lessonProgress.upsert({
    where: { enrollmentId_lessonId: { enrollmentId, lessonId } },
    create: {
      tenantId,
      enrollmentId,
      lessonId,
      userId,
      ...data,
      completedAt: data.isCompleted ? new Date() : null,
      lastAccessedAt: new Date(),
    },
    update: {
      ...data,
      completedAt: data.isCompleted ? new Date() : undefined,
      lastAccessedAt: new Date(),
      timeSpent: data.timeSpent ? { increment: data.timeSpent } : undefined,
    },
  });

  // C3-BIZ-B-007 FIX: Recalculate on both isCompleted=true AND isCompleted=false
  // so that revoking a lesson completion also decrements progress
  if (data.isCompleted !== undefined) {
    await recalculateEnrollmentProgress(enrollmentId);
  }

  return progress;
}

async function recalculateEnrollmentProgress(enrollmentId: string) {
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: { lessonProgress: true },
  });
  if (!enrollment) return;

  const completed = enrollment.lessonProgress.filter(lp => lp.isCompleted).length;
  const total = enrollment.totalLessons || 1;
  const progressPercent = Math.round((completed / total) * 10000) / 100;

  const updateData: Prisma.EnrollmentUpdateInput = {
    lessonsCompleted: completed,
    progress: progressPercent,
    lastAccessedAt: new Date(),
  };

  if (progressPercent >= 100 && !enrollment.completedAt) {
    updateData.completedAt = new Date();
    updateData.status = 'COMPLETED';
    if (enrollment.complianceStatus) {
      updateData.complianceStatus = 'COMPLETED';
    }

    // Increment course completion count
    await prisma.course.update({
      where: { id: enrollment.courseId },
      data: { completionCount: { increment: 1 } },
    });

    // C3-LMS FIX: Auto-issue certificate on course completion
    const course = await prisma.course.findUnique({
      where: { id: enrollment.courseId },
      select: { certificateTemplateId: true, title: true },
    });
    if (course?.certificateTemplateId) {
      try {
        // Look up student name
        const user = await prisma.user.findUnique({
          where: { id: enrollment.userId },
          select: { name: true, email: true },
        });
        const studentName = user?.name || user?.email || 'Student';
        await issueCertificate(enrollment.tenantId, enrollmentId, enrollment.userId, studentName);
      } catch {
        // Certificate issuance failure should not block completion
      }
    }
  }

  await prisma.enrollment.update({ where: { id: enrollmentId }, data: updateData });
}

// ── Quiz ─────────────────────────────────────────────────────

export async function submitQuizAttempt(
  tenantId: string,
  quizId: string,
  userId: string,
  answers: Array<{ questionId: string; answer: string | string[] }>
) {
  const quiz = await prisma.quiz.findFirst({
    where: { id: quizId, tenantId },
    include: { questions: true },
  });
  if (!quiz) throw new Error('Quiz not found');

  // Check max attempts
  const attemptCount = await prisma.quizAttempt.count({
    where: { quizId, userId, tenantId },
  });
  if (attemptCount >= quiz.maxAttempts) {
    throw new Error('Maximum attempts reached');
  }

  // C3-BIZ-B-006 FIX: Validate that ALL submitted questionIds exist in the quiz
  const quizQuestionIds = new Set(quiz.questions.map(q => q.id));
  const invalidIds = answers.filter(a => !quizQuestionIds.has(a.questionId));
  if (invalidIds.length > 0) {
    throw new Error('Invalid question IDs submitted');
  }

  // C3-BIZ-B-001 FIX: totalPoints from ALL quiz questions, not just answered ones.
  // Prevents gaming by skipping hard questions (skip = 0 earned but still in denominator).
  const totalPoints = quiz.questions.reduce((sum, q) => sum + q.points, 0);
  let earnedPoints = 0;
  const gradedAnswers = quiz.questions.map(question => {
    const studentAnswer = answers.find(a => a.questionId === question.id);
    if (!studentAnswer) {
      // Unanswered question = 0 points
      return { questionId: question.id, answer: null, isCorrect: false, points: 0 };
    }

    const isCorrect = gradeQuestion(question, studentAnswer.answer);
    if (isCorrect) earnedPoints += question.points;

    return { ...studentAnswer, isCorrect, points: isCorrect ? question.points : 0 };
  });

  const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
  const passed = score >= quiz.passingScore;

  return prisma.quizAttempt.create({
    data: {
      tenantId,
      quizId,
      userId,
      score,
      totalPoints,
      earnedPoints,
      answers: gradedAnswers,
      passed,
      completedAt: new Date(),
    },
  });
}

function gradeQuestion(
  question: { type: string; options: unknown; correctAnswer: string | null; caseSensitive: boolean },
  answer: string | string[]
): boolean {
  switch (question.type) {
    case 'MULTIPLE_CHOICE': {
      const options = question.options as Array<{ id: string; isCorrect: boolean }>;
      const correctIds = options.filter(o => o.isCorrect).map(o => o.id).sort();
      const selectedIds = (Array.isArray(answer) ? answer : [answer]).sort();
      return JSON.stringify(correctIds) === JSON.stringify(selectedIds);
    }
    case 'TRUE_FALSE': {
      const options = question.options as Array<{ id: string; isCorrect: boolean }>;
      const correct = options.find(o => o.isCorrect);
      return correct?.id === answer;
    }
    case 'FILL_IN': {
      if (!question.correctAnswer) return false;
      const userAnswer = Array.isArray(answer) ? answer[0] : answer;
      return question.caseSensitive
        ? userAnswer.trim() === question.correctAnswer.trim()
        : userAnswer.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase();
    }
    default:
      return false;
  }
}

// ── Certificates ─────────────────────────────────────────────

export async function issueCertificate(
  tenantId: string,
  enrollmentId: string,
  userId: string,
  studentName: string
) {
  const enrollment = await prisma.enrollment.findFirst({
    where: { id: enrollmentId, tenantId, userId, status: 'COMPLETED' },
    include: {
      course: {
        include: {
          chapters: {
            include: {
              lessons: { select: { quizId: true } },
            },
          },
        },
      },
    },
  });
  if (!enrollment) throw new Error('Enrollment not found or not completed');

  const course = enrollment.course;
  const templateId = course.certificateTemplateId;
  if (!templateId) throw new Error('No certificate template configured for this course');

  // C3-BIZ-B-003 FIX: Verify quiz completion before issuing certificate
  // Quizzes are on Lessons (not Chapters), so collect quizIds from all lessons
  const courseQuizIds = course.chapters
    .flatMap(ch => ch.lessons)
    .map(l => l.quizId)
    .filter((id): id is string => id !== null);
  if (courseQuizIds.length > 0) {
    const passingAttempts = await prisma.quizAttempt.findMany({
      where: { userId, quizId: { in: courseQuizIds }, tenantId, passed: true },
      select: { quizId: true },
    });
    const passedQuizIds = new Set(passingAttempts.map(a => a.quizId));
    const unpassedQuizzes = courseQuizIds.filter(id => !passedQuizIds.has(id));
    if (unpassedQuizzes.length > 0) {
      throw new Error('Required quizzes not passed');
    }
  }

  const verificationCode = crypto.randomUUID();

  const certificate = await prisma.certificate.create({
    data: {
      tenantId,
      templateId,
      userId,
      courseTitle: course.title,
      studentName,
      verificationCode,
      expiresAt: null, // Can be configured per template
    },
  });

  await prisma.enrollment.update({
    where: { id: enrollmentId },
    data: { certificateId: certificate.id },
  });

  return certificate;
}

export async function verifyCertificate(verificationCode: string) {
  return prisma.certificate.findUnique({
    where: { verificationCode },
    select: {
      id: true,
      courseTitle: true,
      studentName: true,
      status: true,
      issuedAt: true,
      expiresAt: true,
      tenantId: true,
    },
  });
}

// ── Analytics ────────────────────────────────────────────────

export async function getLmsDashboardStats(tenantId: string) {
  const [
    totalCourses,
    publishedCourses,
    totalEnrollments,
    activeEnrollments,
    completedEnrollments,
    totalCertificates,
    overdueCompliance,
  ] = await Promise.all([
    prisma.course.count({ where: { tenantId } }),
    prisma.course.count({ where: { tenantId, status: 'PUBLISHED' } }),
    prisma.enrollment.count({ where: { tenantId } }),
    prisma.enrollment.count({ where: { tenantId, status: 'ACTIVE' } }),
    prisma.enrollment.count({ where: { tenantId, status: 'COMPLETED' } }),
    prisma.certificate.count({ where: { tenantId, status: 'ISSUED' } }),
    prisma.enrollment.count({
      where: {
        tenantId,
        complianceStatus: 'OVERDUE',
      },
    }),
  ]);

  const completionRate = totalEnrollments > 0
    ? Math.round((completedEnrollments / totalEnrollments) * 100)
    : 0;

  return {
    totalCourses,
    publishedCourses,
    totalEnrollments,
    activeEnrollments,
    completedEnrollments,
    completionRate,
    totalCertificates,
    overdueCompliance,
  };
}

// ── Categories ───────────────────────────────────────────────

export async function getCourseCategories(tenantId: string) {
  return prisma.courseCategory.findMany({
    where: { tenantId, isActive: true },
    include: {
      _count: { select: { courses: true, children: true } },
      children: {
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
        include: { _count: { select: { courses: true } } },
      },
    },
    orderBy: { sortOrder: 'asc' },
    take: 100,
  });
}

// ── Instructors ──────────────────────────────────────────────

export async function getInstructors(tenantId: string) {
  return prisma.instructorProfile.findMany({
    where: { tenantId, isActive: true },
    include: { _count: { select: { courses: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
}
