export const dynamic = 'force-dynamic';

/**
 * #14 Adaptive Learning Paths API
 * POST /api/lms/adaptive
 * Returns adaptive recommendation after quiz completion.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { getAdaptiveRecommendation } from '@/lib/lms/adaptive-paths';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { lessonId, quizScore } = body;

    if (!lessonId || typeof quizScore !== 'number') {
      return NextResponse.json({ error: 'lessonId and quizScore required' }, { status: 400 });
    }

    const recommendation = await getAdaptiveRecommendation(
      session.user.id,
      lessonId,
      quizScore
    );

    return NextResponse.json({ data: recommendation });
  } catch (error) {
    logger.error('[adaptive] Error:', error);
    return NextResponse.json({ error: 'Failed to generate recommendation' }, { status: 500 });
  }
}
