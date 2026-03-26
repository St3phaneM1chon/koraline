/**
 * #13 SM-2 Spaced Repetition Algorithm
 *
 * Classic SuperMemo-2 algorithm as a lightweight alternative to FSRS.
 * Used in FlashcardDeck for quick review sessions where full FSRS
 * state tracking is unnecessary.
 *
 * SM-2 variables:
 *   - EF (easiness factor): starts at 2.5, min 1.3
 *   - interval: days until next review
 *   - repetitions: consecutive correct answers
 *
 * Rating: 0-5 (0-2 = fail, 3 = hard, 4 = good, 5 = easy)
 */

export interface SM2Card {
  easinessFactor: number;  // 1.3 - 2.5+
  interval: number;        // days
  repetitions: number;     // consecutive successes
  lastReview: Date | null;
}

export interface SM2ReviewResult {
  nextReview: Date;
  newEF: number;
  newInterval: number;
  newRepetitions: number;
}

export type SM2Rating = 0 | 1 | 2 | 3 | 4 | 5;

/**
 * Map 4-button rating (1=Again, 2=Hard, 3=Good, 4=Easy) to SM-2 scale (0-5)
 */
export function mapFlashcardRatingToSM2(rating: 1 | 2 | 3 | 4): SM2Rating {
  const mapping: Record<number, SM2Rating> = { 1: 1, 2: 3, 3: 4, 4: 5 };
  return mapping[rating] ?? 3;
}

/**
 * Create a new SM-2 card with default values.
 */
export function createSM2Card(): SM2Card {
  return {
    easinessFactor: 2.5,
    interval: 0,
    repetitions: 0,
    lastReview: null,
  };
}

/**
 * Schedule next review using SM-2 algorithm.
 *
 * @param card - Current card state
 * @param rating - User's self-assessment (0-5)
 * @param now - Current timestamp (for testing)
 * @returns Updated card state and next review date
 */
export function sm2Schedule(
  card: SM2Card,
  rating: SM2Rating,
  now: Date = new Date()
): SM2ReviewResult {
  let { easinessFactor, interval, repetitions } = card;

  // Update easiness factor
  const newEF = Math.max(
    1.3,
    easinessFactor + (0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02))
  );

  if (rating < 3) {
    // Failed — reset to beginning
    repetitions = 0;
    interval = 1;
  } else {
    // Success — increase interval
    repetitions += 1;

    if (repetitions === 1) {
      interval = 1;
    } else if (repetitions === 2) {
      interval = 6;
    } else {
      interval = Math.round(interval * newEF);
    }
  }

  // Calculate next review date
  const nextReview = new Date(now);
  nextReview.setDate(nextReview.getDate() + interval);

  return {
    nextReview,
    newEF: Math.round(newEF * 100) / 100,
    newInterval: interval,
    newRepetitions: repetitions,
  };
}

/**
 * Calculate retention rate from SM-2 parameters.
 * Approximation based on interval and EF.
 */
export function estimateRetention(card: SM2Card, now: Date = new Date()): number {
  if (!card.lastReview) return 0;

  const daysSinceReview =
    (now.getTime() - card.lastReview.getTime()) / (1000 * 60 * 60 * 24);

  if (daysSinceReview <= 0) return 1;
  if (card.interval <= 0) return 0;

  // Exponential forgetting curve
  const retention = Math.exp(-0.5 * daysSinceReview / Math.max(card.interval, 1));
  return Math.max(0, Math.min(1, retention));
}

/**
 * Sort cards by review priority (most urgent first).
 * Cards overdue or with low EF should be reviewed first.
 */
export function sortByReviewPriority(
  cards: (SM2Card & { id: string })[],
  now: Date = new Date()
): (SM2Card & { id: string })[] {
  return [...cards].sort((a, b) => {
    const retA = estimateRetention(a, now);
    const retB = estimateRetention(b, now);
    // Lower retention = higher priority
    return retA - retB;
  });
}
