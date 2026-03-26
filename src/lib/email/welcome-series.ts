/**
 * Email: Welcome Series
 * Identifies new mailing list subscribers who confirmed within the last
 * N days and have not yet received welcome emails.
 */
import { prisma } from '@/lib/db';

export interface WelcomeRecipient {
  subscriberId: string;
  email: string;
  name: string | null;
  confirmedAt: Date;
  daysSinceConfirmation: number;
  suggestedEmailStep: number;
}

/**
 * Find subscribers eligible for the welcome email series.
 * Welcome series is typically 3 emails:
 *   Step 1: Day 0 (immediately after confirmation)
 *   Step 2: Day 2
 *   Step 3: Day 7
 *
 * @param lookbackDays - How far back to look for new subscribers (default 7)
 */
export async function getWelcomeSeriesRecipients(
  lookbackDays: number = 7
): Promise<WelcomeRecipient[]> {
  const since = new Date();
  since.setDate(since.getDate() - lookbackDays);

  const newSubs = await prisma.mailingListSubscriber.findMany({
    where: {
      status: 'ACTIVE',
      confirmedAt: { gte: since },
    },
    select: {
      id: true,
      email: true,
      name: true,
      confirmedAt: true,
    },
    take: 500,
  });

  const now = Date.now();

  return newSubs
    .filter((sub) => sub.confirmedAt !== null)
    .map((sub) => {
      const confirmedAt = sub.confirmedAt as Date;
      const daysSince = Math.floor(
        (now - confirmedAt.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Determine which step of the welcome series they should receive
      let suggestedEmailStep: number;
      if (daysSince < 1) {
        suggestedEmailStep = 1; // Welcome email (immediate)
      } else if (daysSince < 4) {
        suggestedEmailStep = 2; // Follow-up (day 2)
      } else {
        suggestedEmailStep = 3; // Final welcome (day 7)
      }

      return {
        subscriberId: sub.id,
        email: sub.email,
        name: sub.name,
        confirmedAt,
        daysSinceConfirmation: daysSince,
        suggestedEmailStep,
      };
    });
}
