/**
 * #31 Behavioral Lead Scoring - Auto-score based on engagement signals
 */

import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

export interface BehavioralScore {
  userId: string;
  signals: { signal: string; weight: number; count: number; score: number }[];
  totalScore: number;
  temperature: 'HOT' | 'WARM' | 'COLD';
}

const WEIGHTS = {
  page_view: { weight: 1, max: 15 },
  order_complete: { weight: 10, max: 20 },
  review_submit: { weight: 3, max: 6 },
  account_create: { weight: 8, max: 8 },
} as const;

export async function calculateBehavioralScore(userId: string): Promise<BehavioralScore> {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [views, orders, reviews] = await Promise.all([
      prisma.productView.count({ where: { userId, viewedAt: { gte: thirtyDaysAgo } } }).catch(() => 0),
      prisma.order.count({ where: { userId, createdAt: { gte: thirtyDaysAgo }, paymentStatus: 'PAID' } }).catch(() => 0),
      prisma.review.count({ where: { userId, createdAt: { gte: thirtyDaysAgo } } }).catch(() => 0),
    ]);

    const calc = (signal: keyof typeof WEIGHTS, count: number) => {
      const c = WEIGHTS[signal];
      return { signal, weight: c.weight, count, score: Math.min(c.max, count * c.weight) };
    };

    const signals = [calc('page_view', views), calc('order_complete', orders), calc('review_submit', reviews), calc('account_create', 1)];
    const totalScore = Math.min(100, signals.reduce((s, sig) => s + sig.score, 0));
    const temperature = totalScore >= 60 ? 'HOT' as const : totalScore >= 30 ? 'WARM' as const : 'COLD' as const;

    return { userId, signals, totalScore, temperature };
  } catch (error) {
    logger.error('[behavioral-lead-scoring] Error:', error);
    return { userId, signals: [], totalScore: 0, temperature: 'COLD' };
  }
}