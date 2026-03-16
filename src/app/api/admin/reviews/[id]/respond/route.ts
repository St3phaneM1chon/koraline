export const dynamic = 'force-dynamic';
/**
 * API - Admin Review Response
 * POST: Add or update admin response to a review
 * DELETE: Remove the admin response from a review
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAdminGuard } from '@/lib/admin-api-guard';
import { logAdminAction, getClientIpFromRequest } from '@/lib/admin-audit';
import { prisma } from '@/lib/db';
import { stripHtml, stripControlChars } from '@/lib/sanitize';
import { logger } from '@/lib/logger';

const respondToReviewSchema = z.object({
  response: z.string().min(1, 'La réponse ne peut pas être vide').max(5000, 'La réponse ne doit pas dépasser 5000 caractères'),
});

export const POST = withAdminGuard(async (request: NextRequest, { session, params }) => {
  try {
    const id = params!.id;
    const body = await request.json();

    const parsed = respondToReviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid data' },
        { status: 400 }
      );
    }
    const data = parsed.data;

    // BE-SEC-03: Sanitize response text - strip HTML and control characters
    const response = stripControlChars(stripHtml(data.response)).trim();

    // BE-SEC-05: Enforce max length on sanitized response text
    if (response.length > 5000) {
      return NextResponse.json(
        { error: 'La réponse ne doit pas dépasser 5000 caractères' },
        { status: 400 }
      );
    }

    if (!response) {
      return NextResponse.json(
        { error: 'La réponse ne peut pas être vide' },
        { status: 400 }
      );
    }

    // Check review exists
    const existing = await prisma.review.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Avis introuvable' }, { status: 404 });
    }

    const updated = await prisma.review.update({
      where: { id },
      data: {
        reply: response.trim(),
        repliedAt: new Date(),
        repliedBy: session.user.id,
      },
    });

    // IMP-025: Log admin modifications with who, when, and previous state for audit trail
    logAdminAction({
      adminUserId: session.user.id,
      action: 'RESPOND_TO_REVIEW',
      targetType: 'Review',
      targetId: id,
      previousValue: existing.reply ? { reply: existing.reply.substring(0, 200) } : null,
      newValue: { reply: response.substring(0, 200) },
      ipAddress: getClientIpFromRequest(request),
      userAgent: request.headers.get('user-agent') || undefined,
    }).catch((err) => logger.error('IMP-025: Audit log failed for RESPOND_TO_REVIEW', { error: err instanceof Error ? err.message : String(err) }));

    return NextResponse.json({ review: updated });
  } catch (error) {
    logger.error('Error responding to review', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: 'Erreur lors de l\'ajout de la réponse' },
      { status: 500 }
    );
  }
});

export const DELETE = withAdminGuard(async (request: NextRequest, { session, params }) => {
  try {
    const id = params!.id;

    // Check review exists
    const existing = await prisma.review.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Avis introuvable' }, { status: 404 });
    }

    // Nothing to delete if there is no reply
    if (!existing.reply) {
      return NextResponse.json({ error: 'Aucune réponse à supprimer' }, { status: 404 });
    }

    const updated = await prisma.review.update({
      where: { id },
      data: {
        reply: null,
        repliedAt: null,
        repliedBy: null,
      },
    });

    // Audit trail: log response removal with previous state
    logAdminAction({
      adminUserId: session.user.id,
      action: 'DELETE_REVIEW_RESPONSE',
      targetType: 'Review',
      targetId: id,
      previousValue: { reply: existing.reply.substring(0, 200), repliedBy: existing.repliedBy },
      newValue: null,
      ipAddress: getClientIpFromRequest(request),
      userAgent: request.headers.get('user-agent') || undefined,
    }).catch((err) => logger.error('Audit log failed for DELETE_REVIEW_RESPONSE', { error: err instanceof Error ? err.message : String(err) }));

    return NextResponse.json({ review: updated });
  } catch (error) {
    logger.error('Error deleting review response', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de la réponse' },
      { status: 500 }
    );
  }
});
