export const dynamic = 'force-dynamic';

/**
 * API - Admin Bulk Review Actions
 * POST: Approve or reject multiple reviews at once.
 *
 * Body: { reviewIds: string[], action: 'approve' | 'reject' }
 * - Maximum 100 reviews per request
 * - Requires EMPLOYEE or OWNER role
 * - Logs each action in admin audit trail
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAdminGuard } from '@/lib/admin-api-guard';
import { logAdminAction, getClientIpFromRequest } from '@/lib/admin-audit';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

const bulkReviewSchema = z.object({
  reviewIds: z.array(z.string().min(1)).min(1).max(100, 'Maximum 100 reviews per bulk action'),
  action: z.enum(['approve', 'reject']),
});

export const POST = withAdminGuard(async (request: NextRequest, { session }) => {
  try {
    const body = await request.json();
    const parsed = bulkReviewSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid data' },
        { status: 400 }
      );
    }

    const { reviewIds, action } = parsed.data;

    // Verify all reviews exist
    const existingReviews = await prisma.review.findMany({
      where: { id: { in: reviewIds } },
      select: { id: true, isApproved: true, isPublished: true },
    });

    const existingIds = new Set(existingReviews.map(r => r.id));
    const missingIds = reviewIds.filter(id => !existingIds.has(id));

    if (missingIds.length > 0) {
      return NextResponse.json(
        { error: `Reviews not found: ${missingIds.join(', ')}` },
        { status: 404 }
      );
    }

    // Build update data based on action
    const updateData = action === 'approve'
      ? { isApproved: true, isPublished: true }
      : { isApproved: false, isPublished: false };

    // Bulk update in a single transaction
    const result = await prisma.review.updateMany({
      where: { id: { in: reviewIds } },
      data: updateData,
    });

    // Audit log (non-blocking)
    logAdminAction({
      adminUserId: session.user.id,
      action: action === 'approve' ? 'BULK_APPROVE_REVIEWS' : 'BULK_REJECT_REVIEWS',
      targetType: 'Review',
      targetId: reviewIds.join(','),
      previousValue: existingReviews.map(r => ({
        id: r.id,
        isApproved: r.isApproved,
        isPublished: r.isPublished,
      })),
      newValue: { action, count: result.count, ...updateData },
      ipAddress: getClientIpFromRequest(request),
      userAgent: request.headers.get('user-agent') || undefined,
    }).catch((err) => logger.error('Audit log failed for bulk review action', {
      error: err instanceof Error ? err.message : String(err),
    }));

    logger.info('Bulk review action completed', {
      action,
      requested: reviewIds.length,
      updated: result.count,
      adminId: session.user.id,
    });

    return NextResponse.json({
      success: true,
      action,
      updated: result.count,
      reviewIds,
    });
  } catch (error) {
    logger.error('Error in bulk review action', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: 'Failed to process bulk review action' },
      { status: 500 }
    );
  }
});
