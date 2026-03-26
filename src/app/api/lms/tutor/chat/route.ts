export const dynamic = 'force-dynamic';

/**
 * POST /api/lms/tutor/chat — Aurelia Socratic AI Tutor
 * =============================================================================
 * Sends a message to Aurelia and receives a Socratic tutoring response.
 *
 * Body: {
 *   message: string,
 *   context?: { courseId?, lessonId?, conceptId?, topic? },
 *   conversationHistory?: Array<{ role: 'user'|'assistant', content: string }>,
 *   sessionId?: string
 * }
 *
 * Auth: Required (withUserGuard)
 * Rate limit: 30 req/min
 * CSRF: Required (POST mutation)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withUserGuard } from '@/lib/user-api-guard';
import { chat } from '@/lib/lms/tutor-service';
import { logger } from '@/lib/logger';

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const chatContextSchema = z.object({
  courseId: z.string().optional(),
  lessonId: z.string().optional(),
  conceptId: z.string().optional(),
  topic: z.string().optional(),
}).optional();

const messageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1).max(10000),
});

const chatRequestSchema = z.object({
  message: z.string().min(1, 'Message is required').max(5000, 'Message too long (max 5000 chars)'),
  context: chatContextSchema,
  conversationHistory: z.array(messageSchema).max(50).optional(),
  sessionId: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Route Handler
// ---------------------------------------------------------------------------

export const POST = withUserGuard(async (request: NextRequest, { session }) => {
  const tenantId = session.user.tenantId;
  if (!tenantId) {
    return NextResponse.json({ error: 'No tenant context' }, { status: 403 });
  }

  const userId = session.user.id;
  if (!userId) {
    return NextResponse.json({ error: 'User ID missing' }, { status: 403 });
  }

  // Parse and validate request body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = chatRequestSchema.safeParse(body);
  if (!parsed.success) {
    // LMS2-F5 FIX: Generic error (was leaking Zod details)
    return NextResponse.json(
      { error: 'Invalid chat request' },
      { status: 400 }
    );
  }

  const { message, context, conversationHistory, sessionId } = parsed.data;

  try {
    const response = await chat(tenantId, userId, {
      message,
      context,
      conversationHistory,
      sessionId,
    });

    return NextResponse.json({
      reply: response.reply,
      sessionId: response.sessionId,
      sources: response.sources,
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error('[TutorChat] Chat failed', {
      userId,
      tenantId,
      error: errorMsg,
    });

    // Return safe user-facing messages for known business errors
    if (errorMsg === 'NO_SUBSCRIPTION') {
      return NextResponse.json(
        { error: 'Aucun abonnement Aurélia actif. Souscrivez un plan pour commencer.' },
        { status: 402 }
      );
    }

    if (errorMsg === 'DAILY_LIMIT_REACHED') {
      return NextResponse.json(
        { error: 'Limite quotidienne de questions atteinte. Passez au plan mensuel pour un accès illimité.' },
        { status: 429 }
      );
    }

    if (errorMsg.startsWith('CLAUDE_API_ERROR')) {
      return NextResponse.json(
        { error: 'Aurélia est temporairement indisponible. Réessayez dans quelques instants.' },
        { status: 503 }
      );
    }

    if (errorMsg === 'ANTHROPIC_API_KEY is not configured') {
      return NextResponse.json(
        { error: 'Service de tutorat non configuré.' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Une erreur est survenue. Réessayez.' },
      { status: 500 }
    );
  }
}, { rateLimit: 30 });
