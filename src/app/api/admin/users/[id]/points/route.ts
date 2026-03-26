export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { withAdminGuard } from '@/lib/admin-api-guard';
import { logAdminAction, getClientIpFromRequest } from '@/lib/admin-audit';
import { logger } from '@/lib/logger';

// G1-FLAW-10 FIX: Safety cap for admin point adjustments
const MAX_ADMIN_POINTS_ADJUSTMENT = 1_000_000;

// Zod schema for POST /api/admin/users/[id]/points (adjust loyalty points)
const adjustPointsSchema = z.object({
  amount: z.number().int()
    .refine((v) => v !== 0, 'Amount must be non-zero')
    .refine((v) => Math.abs(v) <= MAX_ADMIN_POINTS_ADJUSTMENT, `Amount cannot exceed ${MAX_ADMIN_POINTS_ADJUSTMENT.toLocaleString()} points`),
  reason: z.string().min(1, 'Reason is required'),
}).strict();

export const POST = withAdminGuard(async (request: NextRequest, { session, params }) => {
  try {
    const id = params!.id;

    // LOY-F3 FIX: Block admins from awarding points to themselves
    if (id === session.user.id) {
      return NextResponse.json(
        { error: 'Admins cannot adjust their own loyalty points. Another admin must perform this action.' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate with Zod
    const parsed = adjustPointsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid data' },
        { status: 400 }
      );
    }
    const { amount, reason } = parsed.data;

    // LOY-F6 FIX: Use interactive $transaction with atomic increment to prevent
    // TOCTOU race where concurrent adjustments corrupt the balance.
    // Previous code: read loyaltyPoints → compute newPoints → write (race window).
    // Now: atomic increment inside transaction, read confirmed balance for audit.
    const MAX_POINTS_BALANCE = 10_000_000;

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id },
        select: { id: true, loyaltyPoints: true },
      });
      if (!user) {
        return { error: 'Utilisateur non trouvé', status: 404 } as const;
      }

      const projectedPoints = user.loyaltyPoints + amount;
      if (projectedPoints < 0) {
        return { error: 'Points insuffisants', status: 400 } as const;
      }
      if (projectedPoints > MAX_POINTS_BALANCE) {
        return {
          error: `Resulting balance (${projectedPoints.toLocaleString()}) would exceed maximum allowed (${MAX_POINTS_BALANCE.toLocaleString()})`,
          status: 400,
        } as const;
      }

      // Atomic increment — confirmed by DB
      const updatedUser = await tx.user.update({
        where: { id },
        data: {
          loyaltyPoints: { increment: amount },
          ...(amount > 0 ? { lifetimePoints: { increment: amount } } : {}),
        },
        select: {
          id: true,
          email: true,
          name: true,
          loyaltyPoints: true,
          lifetimePoints: true,
          loyaltyTier: true,
        },
      });

      const transaction = await tx.loyaltyTransaction.create({
        data: {
          userId: id,
          type: amount > 0 ? 'EARN_BONUS' : 'ADJUST',
          points: amount,
          description: `[Admin adjustment] ${reason}`,
          balanceAfter: updatedUser.loyaltyPoints,
        },
      });

      return { updatedUser, transaction, previousPoints: user.loyaltyPoints };
    });

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const { updatedUser, transaction, previousPoints } = result;

    // Audit log for points adjustment (fire-and-forget)
    logAdminAction({
      adminUserId: session.user.id,
      action: 'ADJUST_USER_POINTS',
      targetType: 'User',
      targetId: id,
      previousValue: { loyaltyPoints: previousPoints },
      newValue: { loyaltyPoints: updatedUser.loyaltyPoints, amount, reason },
      ipAddress: getClientIpFromRequest(request),
      userAgent: request.headers.get('user-agent') || undefined,
    }).catch((err) => { logger.error('[admin/users/id/points] Non-blocking operation failed:', err); });

    return NextResponse.json({
      user: updatedUser,
      transaction,
      newBalance: updatedUser.loyaltyPoints,
    });
  } catch (error) {
    logger.error('Admin points adjustment error', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}, { requiredPermission: 'users.edit' });
