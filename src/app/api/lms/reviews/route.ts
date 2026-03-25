export const dynamic = 'force-dynamic';

/**
 * POST /api/lms/reviews — Submit a course review (star rating + text)
 *
 * Requires a COMPLETED enrollment for the course.
 * Uses upsert pattern: if the user already reviewed, update instead of duplicating.
 *
 * SEC-HARDENING: Wrapped with withUserGuard for centralized auth + CSRF + rate limiting.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withUserGuard } from '@/lib/user-api-guard';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

const reviewSchema = z.object({
  courseId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
});

export const POST = withUserGuard(async (request: NextRequest, { session }) => {
  const body = await request.json();
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const tenantId = session.user.tenantId;
  if (!tenantId) {
    return NextResponse.json({ error: 'No tenant context' }, { status: 403 });
  }

  const userId = session.user.id;
  if (!userId) {
    return NextResponse.json({ error: 'User ID missing' }, { status: 401 });
  }

  const { courseId, rating, comment } = parsed.data;

  try {
    // Verify the user has a COMPLETED enrollment for this course
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        tenantId_courseId_userId: { tenantId, courseId, userId },
      },
      select: { status: true },
    });

    if (!enrollment) {
      return NextResponse.json({ error: 'Not enrolled in this course' }, { status: 403 });
    }

    if (enrollment.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'Course must be completed before leaving a review' },
        { status: 403 },
      );
    }

    // Upsert: create or update existing review (@@unique([courseId, userId]))
    const review = await prisma.courseReview.upsert({
      where: {
        courseId_userId: { courseId, userId },
      },
      create: {
        tenantId,
        courseId,
        userId,
        rating,
        comment: comment ?? null,
      },
      update: {
        rating,
        comment: comment ?? null,
        isApproved: false, // Re-submit resets approval
      },
      select: {
        id: true,
        courseId: true,
        rating: true,
        comment: true,
        isApproved: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ review }, { status: 201 });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error('Course review submission failed', {
      courseId,
      userId,
      error: errorMsg,
    });
    return NextResponse.json({ error: 'Review submission failed' }, { status: 500 });
  }
}, { rateLimit: 20 });
