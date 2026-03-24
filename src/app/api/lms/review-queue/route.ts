export const dynamic = 'force-dynamic';

/**
 * Spaced Repetition Review Queue API
 * GET /api/lms/review-queue → returns concepts due for review (nextReviewAt <= now)
 *
 * Returns concept name, current level, days since last review, and practice questions.
 *
 * SEC-HARDENING: Wrapped with withUserGuard for centralized auth + CSRF + rate limiting.
 */
import { NextRequest, NextResponse } from 'next/server';
import { withUserGuard } from '@/lib/user-api-guard';
import { prisma } from '@/lib/db';

export const GET = withUserGuard(async (request: NextRequest, { session }) => {
  const tenantId = session.user.tenantId;
  if (!tenantId) {
    return NextResponse.json({ error: 'No tenant context' }, { status: 403 });
  }

  const userId = session.user.id!;
  const now = new Date();

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);
  const domain = searchParams.get('domain'); // Optional filter by domain

  // Find all concepts where nextReviewAt <= now
  const dueMasteries = await prisma.lmsConceptMastery.findMany({
    where: {
      tenantId,
      userId,
      nextReviewAt: { lte: now },
      ...(domain ? { concept: { domain } } : {}),
    },
    include: {
      concept: {
        select: {
          id: true,
          name: true,
          domain: true,
          targetBloomLevel: true,
          description: true,
        },
      },
    },
    orderBy: [
      { nextReviewAt: 'asc' }, // Most overdue first
    ],
    take: limit,
  });

  // For each due concept, fetch 2-3 practice questions
  const reviewItems = await Promise.all(
    dueMasteries.map(async (mastery) => {
      const daysSinceReview = mastery.lastTestedAt
        ? Math.floor((now.getTime() - mastery.lastTestedAt.getTime()) / (1000 * 60 * 60 * 24))
        : null;

      // Fetch practice questions at or above current mastery level
      const questions = await prisma.lmsConceptQuestion.findMany({
        where: {
          tenantId,
          conceptId: mastery.conceptId,
          bloomLevel: { gte: Math.max(1, mastery.currentLevel) },
          isActive: true,
        },
        select: {
          id: true,
          question: true,
          type: true,
          options: true,
          bloomLevel: true,
          difficulty: true,
          // Do NOT send correctAnswer to client
        },
        take: 3,
        orderBy: { difficulty: 'asc' },
      });

      return {
        conceptId: mastery.conceptId,
        conceptName: mastery.concept?.name ?? 'Unknown',
        domain: mastery.concept?.domain ?? null,
        description: mastery.concept?.description ?? null,
        currentLevel: mastery.currentLevel,
        targetLevel: mastery.concept?.targetBloomLevel ?? 3,
        confidence: mastery.confidence,
        daysSinceReview,
        nextReviewAt: mastery.nextReviewAt?.toISOString() ?? null,
        overdueBy: mastery.nextReviewAt
          ? Math.floor((now.getTime() - mastery.nextReviewAt.getTime()) / (1000 * 60 * 60 * 24))
          : 0,
        reviewCount: mastery.reviewCount,
        accuracyRate: mastery.totalAttempts > 0
          ? Math.round((mastery.totalCorrect / mastery.totalAttempts) * 100)
          : 0,
        questions: questions.map(q => ({
          id: q.id,
          question: q.question,
          type: q.type,
          options: q.options,
          bloomLevel: q.bloomLevel,
          difficulty: q.difficulty,
        })),
      };
    })
  );

  // Also get upcoming reviews (next 7 days) for context
  const upcomingCount = await prisma.lmsConceptMastery.count({
    where: {
      tenantId,
      userId,
      nextReviewAt: {
        gt: now,
        lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      },
    },
  });

  return NextResponse.json({
    dueNow: reviewItems.length,
    upcomingThisWeek: upcomingCount,
    items: reviewItems,
  });
}, { skipCsrf: true });
