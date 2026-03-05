/**
 * LEAD SCORING ENGINE
 * Composite score 0-100 based on Profile (30%), Engagement (40%),
 * Timing (20%), and Fit (10%) dimensions.
 */

import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

// ---------------------------------------------------------------------------
// Score weights (percentage of total)
// ---------------------------------------------------------------------------
const WEIGHT_PROFILE = 0.3;
const WEIGHT_ENGAGEMENT = 0.4;
const WEIGHT_TIMING = 0.2;
const WEIGHT_FIT = 0.1;

// ---------------------------------------------------------------------------
// Source bonus map
// ---------------------------------------------------------------------------
const SOURCE_BONUS: Record<string, number> = {
  REFERRAL: 10,
  WEB: 5,
  CAMPAIGN: 5,
  PARTNER: 8,
};

// ---------------------------------------------------------------------------
// Temperature thresholds
// ---------------------------------------------------------------------------
type Temperature = 'HOT' | 'WARM' | 'COLD';

function temperatureFromScore(score: number): Temperature {
  if (score > 70) return 'HOT';
  if (score >= 40) return 'WARM';
  return 'COLD';
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function daysSince(date: Date | null | undefined): number | null {
  if (!date) return null;
  return Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface LeadScoreResult {
  score: number;
  temperature: Temperature;
  breakdown: Record<string, number>;
}

/**
 * Calculate a composite lead score (0-100), update the DB, and return the
 * breakdown by dimension.
 */
export async function calculateLeadScore(leadId: string): Promise<LeadScoreResult> {
  const lead = await prisma.crmLead.findUniqueOrThrow({
    where: { id: leadId },
    include: {
      activities: { select: { id: true, createdAt: true } },
      deals: { select: { id: true } },
      tasks: { select: { id: true } },
    },
  });

  // --- Profile (max raw = 30) ---
  let profileRaw = 0;
  if (lead.email) profileRaw += 5;
  if (lead.phone) profileRaw += 5;
  if (lead.companyName) profileRaw += 5;
  if (lead.timezone) profileRaw += 3;
  if (lead.preferredLang) profileRaw += 2;
  profileRaw += SOURCE_BONUS[lead.source] ?? 0;
  // Max possible raw = 5+5+5+3+2+10 = 30

  // --- Engagement (max raw = 40) ---
  let engagementRaw = 0;
  if (lead.lastContactedAt) engagementRaw += 10;
  if (lead.deals.length > 0) engagementRaw += 10;
  const hasRecentActivity = lead.activities.some((a) => {
    const days = daysSince(a.createdAt);
    return days !== null && days <= 7;
  });
  if (hasRecentActivity) engagementRaw += 10;
  if (lead.tasks.length > 0) engagementRaw += 5;
  if (lead.activities.length > 3) engagementRaw += 5;
  // Max possible raw = 10+10+10+5+5 = 40

  // --- Timing (max raw = 20) ---
  let timingRaw = 0;
  const createdDaysAgo = daysSince(lead.createdAt);
  if (createdDaysAgo !== null && createdDaysAgo <= 30) timingRaw += 10;
  if (lead.nextFollowUpAt) timingRaw += 5;
  const lastContactedDaysAgo = daysSince(lead.lastContactedAt);
  if (lastContactedDaysAgo !== null && lastContactedDaysAgo <= 7) timingRaw += 5;
  // Max possible raw = 10+5+5 = 20

  // --- Fit (max raw = 10) ---
  let fitRaw = 0;
  if (lead.customFields) fitRaw += 5;
  if (lead.tags.length > 0) fitRaw += 5;
  // Max possible raw = 5+5 = 10

  // --- Composite score ---
  // Each dimension's raw max equals its weight denominator, so the weighted
  // sum naturally falls in 0-100.
  const compositeScore = Math.min(
    100,
    Math.round(
      profileRaw * WEIGHT_PROFILE +
      engagementRaw * WEIGHT_ENGAGEMENT +
      timingRaw * WEIGHT_TIMING +
      fitRaw * WEIGHT_FIT,
    ),
  );

  const temperature = temperatureFromScore(compositeScore);

  // Persist
  await prisma.crmLead.update({
    where: { id: leadId },
    data: { score: compositeScore, temperature },
  });

  const breakdown: Record<string, number> = {
    profile: Math.round(profileRaw * WEIGHT_PROFILE * 100) / 100,
    engagement: Math.round(engagementRaw * WEIGHT_ENGAGEMENT * 100) / 100,
    timing: Math.round(timingRaw * WEIGHT_TIMING * 100) / 100,
    fit: Math.round(fitRaw * WEIGHT_FIT * 100) / 100,
  };

  logger.debug('Lead score calculated', { leadId, compositeScore, temperature, breakdown });

  return { score: compositeScore, temperature, breakdown };
}

/**
 * Recalculate scores for all active leads (status not in CONVERTED, LOST).
 */
export async function recalculateAllLeadScores(): Promise<{ processed: number; updated: number }> {
  const leads = await prisma.crmLead.findMany({
    where: {
      status: { notIn: ['CONVERTED', 'LOST'] },
    },
    select: { id: true },
  });

  let updated = 0;
  for (const lead of leads) {
    try {
      await calculateLeadScore(lead.id);
      updated++;
    } catch (err) {
      logger.error('Failed to recalculate lead score', {
        leadId: lead.id,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  logger.info('Lead score recalculation complete', { processed: leads.length, updated });
  return { processed: leads.length, updated };
}
