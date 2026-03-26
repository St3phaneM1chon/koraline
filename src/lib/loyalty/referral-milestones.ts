/**
 * Referral Milestone Bonus System
 *
 * Awards bonus points to a referrer when they cross cumulative
 * successful-referral thresholds (5, 10, 25, 50).
 *
 * Idempotency: milestones are tracked as LoyaltyTransaction rows with
 * type EARN_REFERRAL_MILESTONE.  Before awarding, we check whether a
 * transaction whose `description` encodes the milestone count already
 * exists for the user, so the bonus can never be granted twice.
 */

import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

// ---------------------------------------------------------------------------
// Milestone definitions
// ---------------------------------------------------------------------------

export interface ReferralMilestone {
  /** Number of successful referrals required to unlock this milestone */
  count: number;
  /** Bonus points awarded */
  points: number;
  /** Human-readable description (stored in LoyaltyTransaction.description) */
  description: string;
}

export const REFERRAL_MILESTONES: ReferralMilestone[] = [
  { count: 5,  points: 500,   description: 'Referral milestone: 5 successful referrals'  },
  { count: 10, points: 1500,  description: 'Referral milestone: 10 successful referrals' },
  { count: 25, points: 5000,  description: 'Referral milestone: 25 successful referrals' },
  { count: 50, points: 15000, description: 'Referral milestone: 50 successful referrals' },
];

// ---------------------------------------------------------------------------
// Public function
// ---------------------------------------------------------------------------

/**
 * Check whether the referrer has crossed any new milestone thresholds and
 * award the corresponding bonus points if they haven't been awarded yet.
 *
 * Safe to call after every successful referral qualification.  It only
 * writes to the DB when a new milestone is actually crossed.
 *
 * @param userId - The referrer's user ID
 * @returns Array of milestones that were newly awarded (empty if none)
 */
export async function checkReferralMilestones(
  userId: string
): Promise<ReferralMilestone[]> {
  try {
    // Count the referrer's total QUALIFIED / REWARDED referrals
    const totalReferrals = await prisma.referral.count({
      where: {
        referrerId: userId,
        status: { in: ['QUALIFIED', 'REWARDED'] },
      },
    });

    // Determine which milestones are eligible (total >= threshold)
    const eligible = REFERRAL_MILESTONES.filter(m => totalReferrals >= m.count);
    if (eligible.length === 0) return [];

    // Load already-awarded milestone transactions for this user so we can
    // skip ones that have already been granted (idempotency guard).
    const existing = await prisma.loyaltyTransaction.findMany({
      where: {
        userId,
        type: 'EARN_REFERRAL_MILESTONE',
      },
      select: { description: true },
    });
    const awardedDescriptions = new Set(existing.map(t => t.description ?? ''));

    // Filter to milestones not yet awarded
    const toAward = eligible.filter(m => !awardedDescriptions.has(m.description));
    if (toAward.length === 0) return [];

    // Award all pending milestones inside a single transaction so the
    // user balance stays consistent even if two concurrent requests arrive.
    const awarded: ReferralMilestone[] = [];

    for (const milestone of toAward) {
      // LOY-F1 FIX: Re-check inside transaction to prevent TOCTOU race where
      // two concurrent calls both pass the outer idempotency guard and both award.
      const wasAwarded = await prisma.$transaction(async (tx) => {
        // Re-verify no existing milestone inside the serializable transaction
        const existingInTx = await tx.loyaltyTransaction.findFirst({
          where: {
            userId,
            type: 'EARN_REFERRAL_MILESTONE',
            description: milestone.description,
          },
          select: { id: true },
        });

        if (existingInTx) {
          // Already awarded by a concurrent request — skip
          return false;
        }

        // Atomic increment – returns the confirmed post-increment balance
        const updatedUser = await tx.user.update({
          where: { id: userId },
          data: {
            loyaltyPoints: { increment: milestone.points },
            lifetimePoints: { increment: milestone.points },
          },
          select: { loyaltyPoints: true },
        });

        await tx.loyaltyTransaction.create({
          data: {
            userId,
            type: 'EARN_REFERRAL_MILESTONE',
            points: milestone.points,
            description: milestone.description,
            balanceAfter: updatedUser.loyaltyPoints,
          },
        });

        return true;
      });

      if (wasAwarded) {
        awarded.push(milestone);
        logger.info(
          `Referral milestone awarded: ${milestone.points} pts to user ${userId} (${milestone.description})`
        );
      }
    }

    return awarded;
  } catch (error) {
    // Log but do not re-throw: a milestone failure must never block the
    // primary referral qualification flow.
    logger.error('Error checking referral milestones:', error);
    return [];
  }
}
