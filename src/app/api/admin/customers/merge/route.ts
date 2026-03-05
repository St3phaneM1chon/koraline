export const dynamic = 'force-dynamic';

/**
 * Customer Merge API (I-CRM)
 * POST /api/admin/customers/merge
 *
 * Merges two customer accounts by transferring all data from the secondary
 * account to the primary account. The secondary account is then marked as
 * banned with reason "Merged into {primaryId}".
 *
 * This is a DANGEROUS operation — validates carefully and logs everything.
 * Requires 'users.manage_permissions' permission (highest user-management privilege).
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAdminGuard } from '@/lib/admin-api-guard';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const mergeSchema = z.object({
  primaryId: z.string().min(1).max(100),
  secondaryId: z.string().min(1).max(100),
}).refine(data => data.primaryId !== data.secondaryId, {
  message: 'Primary and secondary IDs must be different',
});

// ---------------------------------------------------------------------------
// POST: Merge customers
// ---------------------------------------------------------------------------

export const POST = withAdminGuard(async (
  request: NextRequest,
  { session }: { session: { user: { id: string } } }
) => {
  try {
    const body = await request.json();
    const parsed = mergeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { primaryId, secondaryId } = parsed.data;

    // Verify both users exist
    const [primary, secondary] = await Promise.all([
      prisma.user.findUnique({
        where: { id: primaryId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isBanned: true,
          loyaltyPoints: true,
          lifetimePoints: true,
        },
      }),
      prisma.user.findUnique({
        where: { id: secondaryId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isBanned: true,
          bannedReason: true,
          loyaltyPoints: true,
          lifetimePoints: true,
        },
      }),
    ]);

    if (!primary) {
      return NextResponse.json({ error: 'Primary user not found' }, { status: 404 });
    }
    if (!secondary) {
      return NextResponse.json({ error: 'Secondary user not found' }, { status: 404 });
    }

    // Safety checks
    if (primary.isBanned) {
      return NextResponse.json({ error: 'Cannot merge into a banned account' }, { status: 400 });
    }
    if (secondary.isBanned && secondary.bannedReason?.startsWith('Merged into')) {
      return NextResponse.json({ error: 'Secondary account was already merged' }, { status: 400 });
    }
    if (secondary.role === 'OWNER') {
      return NextResponse.json({ error: 'Cannot merge an OWNER account as secondary' }, { status: 400 });
    }
    if (primaryId === session.user.id || secondaryId === session.user.id) {
      return NextResponse.json({ error: 'Cannot merge your own account' }, { status: 400 });
    }

    // Log the merge operation before starting
    logger.info('[customers/merge] Starting customer merge', {
      primaryId,
      primaryEmail: primary.email.replace(/^(.{2}).*(@.*)$/, '$1***$2'),
      secondaryId,
      secondaryEmail: secondary.email.replace(/^(.{2}).*(@.*)$/, '$1***$2'),
      initiatedBy: session.user.id,
    });

    // Perform merge in a transaction
    const mergeResult = await prisma.$transaction(async (tx) => {
      const transferred: Record<string, number> = {};

      // 1. Transfer orders
      const ordersResult = await tx.order.updateMany({
        where: { userId: secondaryId },
        data: { userId: primaryId },
      });
      transferred.orders = ordersResult.count;

      // 2. Transfer loyalty points (add secondary's points to primary)
      if (secondary.loyaltyPoints > 0 || secondary.lifetimePoints > 0) {
        await tx.user.update({
          where: { id: primaryId },
          data: {
            loyaltyPoints: { increment: secondary.loyaltyPoints },
            lifetimePoints: { increment: secondary.lifetimePoints },
          },
        });
        transferred.loyaltyPointsMoved = secondary.loyaltyPoints;
        transferred.lifetimePointsMoved = secondary.lifetimePoints;
      }

      // 3. Transfer loyalty transactions
      const loyaltyResult = await tx.loyaltyTransaction.updateMany({
        where: { userId: secondaryId },
        data: { userId: primaryId },
      });
      transferred.loyaltyTransactions = loyaltyResult.count;

      // 4. Transfer customer notes
      const notesResult = await tx.customerNote.updateMany({
        where: { userId: secondaryId },
        data: { userId: primaryId },
      });
      transferred.customerNotes = notesResult.count;

      // 5. Transfer reviews
      const reviewsResult = await tx.review.updateMany({
        where: { userId: secondaryId },
        data: { userId: primaryId },
      });
      transferred.reviews = reviewsResult.count;

      // 6. Transfer addresses
      const addressesResult = await tx.userAddress.updateMany({
        where: { userId: secondaryId },
        data: { userId: primaryId },
      });
      transferred.addresses = addressesResult.count;

      // 7. Transfer wishlist collections
      const wishlistResult = await tx.wishlistCollection.updateMany({
        where: { userId: secondaryId },
        data: { userId: primaryId },
      });
      transferred.wishlists = wishlistResult.count;

      // 8. Transfer return requests
      const returnsResult = await tx.returnRequest.updateMany({
        where: { userId: secondaryId },
        data: { userId: primaryId },
      });
      transferred.returnRequests = returnsResult.count;

      // 9. Transfer product questions
      const questionsResult = await tx.productQuestion.updateMany({
        where: { userId: secondaryId },
        data: { userId: primaryId },
      });
      transferred.productQuestions = questionsResult.count;

      // 10. Create a merge audit note on the primary account
      await tx.customerNote.create({
        data: {
          userId: primaryId,
          authorId: session.user.id,
          content: JSON.stringify({
            type: 'MERGE',
            mergedFrom: secondaryId,
            mergedFromEmail: secondary.email,
            mergedFromName: secondary.name,
            transferred,
            timestamp: new Date().toISOString(),
          }),
        },
      });

      // 11. Mark secondary as merged (ban with reason)
      await tx.user.update({
        where: { id: secondaryId },
        data: {
          isBanned: true,
          bannedAt: new Date(),
          bannedReason: `Merged into ${primaryId}`,
          // Zero out points (already transferred)
          loyaltyPoints: 0,
          lifetimePoints: 0,
        },
      });

      // 12. Create audit log entry
      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'CUSTOMER_MERGE',
          entityType: 'User',
          entityId: primaryId,
          details: `Merged customer ${secondaryId} (${secondary.email}) into ${primaryId} (${primary.email})`,
          changes: {
            before: { primaryPoints: primary.loyaltyPoints, secondaryPoints: secondary.loyaltyPoints },
            after: { primaryPoints: primary.loyaltyPoints + secondary.loyaltyPoints, secondaryBanned: true },
            transferred,
          },
        },
      });

      return transferred;
    });

    logger.info('[customers/merge] Customer merge completed', {
      primaryId,
      secondaryId,
      transferred: mergeResult,
      initiatedBy: session.user.id,
    });

    return NextResponse.json({
      success: true,
      primaryId,
      secondaryId,
      transferred: mergeResult,
      message: `Successfully merged customer ${secondaryId} into ${primaryId}. Secondary account has been disabled.`,
    });
  } catch (error) {
    logger.error('[customers/merge] POST error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json({ error: 'Failed to merge customers' }, { status: 500 });
  }
}, { requiredPermission: 'users.manage_permissions' });
