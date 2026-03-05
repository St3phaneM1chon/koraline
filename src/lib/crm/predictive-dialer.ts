/**
 * CRM Predictive Dialer - 3F.1
 *
 * Provides functions for predictive dialing:
 * - Calculate optimal dial ratio based on historical answer rates
 * - Get next batch of leads to call from a campaign
 * - Record dial outcomes
 */

import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Minimum dial ratio (1:1 - one call per agent) */
const MIN_DIAL_RATIO = 1.0;

/** Maximum dial ratio (3:1 - three calls per agent) */
const MAX_DIAL_RATIO = 3.0;

/** Default dial ratio when no historical data exists */
const DEFAULT_DIAL_RATIO = 1.5;

/** Number of recent activities to analyze for dial ratio calculation */
const HISTORY_SAMPLE_SIZE = 200;

/** Default abandoned call rate target (FCC mandates max 3%) */
const DEFAULT_ABANDON_RATE_TARGET = 0.03;

/** Pacing adjustment factor: how much to reduce dial ratio per 1% over target */
const PACING_REDUCTION_FACTOR = 0.3;

// ---------------------------------------------------------------------------
// calculateDialRatio
// ---------------------------------------------------------------------------

/**
 * Calculate the optimal dial ratio for a campaign based on historical answer rates.
 *
 * The dial ratio determines how many simultaneous calls to place per available agent.
 * A higher ratio means more aggressive dialing (higher risk of abandoned calls).
 * A lower ratio means more conservative dialing (lower agent utilization).
 *
 * Formula: ratio = 1 / answerRate (clamped between MIN and MAX)
 * Example: 50% answer rate -> 2.0 ratio (dial 2 calls per agent)
 *
 * @param campaignId - The CRM campaign ID
 * @returns The optimal dial ratio between 1.0 and 3.0
 */
export async function calculateDialRatio(campaignId: string): Promise<number> {
  // Get recent campaign activities to analyze answer rate
  const activities = await prisma.crmCampaignActivity.findMany({
    where: {
      campaignId,
      status: { in: ['completed', 'failed'] },
      channel: 'call',
    },
    select: {
      status: true,
      disposition: true,
    },
    orderBy: { createdAt: 'desc' },
    take: HISTORY_SAMPLE_SIZE,
  });

  if (activities.length < 10) {
    // Not enough data to calculate; use default
    logger.info('Predictive dialer: insufficient data, using default ratio', {
      event: 'dialer_default_ratio',
      campaignId,
      sampleSize: activities.length,
      ratio: DEFAULT_DIAL_RATIO,
    });
    return DEFAULT_DIAL_RATIO;
  }

  // Count answered calls (completed with non-negative dispositions)
  const answeredDispositions = new Set([
    'answered', 'connected', 'interested', 'callback',
    'sale', 'appointment', 'qualified', 'completed',
  ]);

  const answeredCount = activities.filter(
    (a) =>
      a.status === 'completed' &&
      a.disposition &&
      answeredDispositions.has(a.disposition.toLowerCase())
  ).length;

  const answerRate = answeredCount / activities.length;

  // Calculate ratio: inverse of answer rate, clamped
  let ratio: number;
  if (answerRate <= 0) {
    ratio = MAX_DIAL_RATIO;
  } else {
    ratio = Math.min(MAX_DIAL_RATIO, Math.max(MIN_DIAL_RATIO, 1 / answerRate));
  }

  // Round to 1 decimal place
  ratio = Math.round(ratio * 10) / 10;

  logger.info('Predictive dialer: calculated dial ratio', {
    event: 'dialer_ratio_calculated',
    campaignId,
    sampleSize: activities.length,
    answeredCount,
    answerRate: Math.round(answerRate * 100),
    ratio,
  });

  return ratio;
}

// ---------------------------------------------------------------------------
// getNextBatchToCall
// ---------------------------------------------------------------------------

/**
 * Get the next batch of leads to dial from a campaign.
 *
 * Respects:
 * - DNC status (only CALLABLE leads)
 * - Calling hours (9 AM - 9:30 PM ET by default, via CallingRule)
 * - Maximum attempts per lead (from campaign settings)
 * - Leads not already in progress
 *
 * @param campaignId - The CRM campaign ID
 * @param count - Number of leads to return
 * @returns Array of leads with phone numbers
 */
export async function getNextBatchToCall(
  campaignId: string,
  count: number
): Promise<Array<{ leadId: string; phone: string }>> {
  // Get campaign settings
  const campaign = await prisma.crmCampaign.findUnique({
    where: { id: campaignId },
    select: {
      id: true,
      status: true,
      maxAttemptsPerLead: true,
      targetCriteria: true,
    },
  });

  if (!campaign || campaign.status !== 'ACTIVE') {
    logger.warn('Predictive dialer: campaign not active', {
      event: 'dialer_campaign_not_active',
      campaignId,
      status: campaign?.status,
    });
    return [];
  }

  // Check calling hours using CallingRule (first active rule)
  const callingRule = await prisma.callingRule.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: 'asc' },
  });

  if (callingRule) {
    const now = new Date();
    // Convert to the rule's timezone for hour checking
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: callingRule.timezone,
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    });
    const parts = formatter.formatToParts(now);
    const currentHour = parseInt(parts.find((p) => p.type === 'hour')?.value || '0', 10);
    const currentMinute = parseInt(parts.find((p) => p.type === 'minute')?.value || '0', 10);

    const startMinutes = callingRule.startHour * 60;
    const endMinutes = callingRule.endHour * 60 + callingRule.endMinute;
    const currentMinutes = currentHour * 60 + currentMinute;

    if (currentMinutes < startMinutes || currentMinutes >= endMinutes) {
      logger.info('Predictive dialer: outside calling hours', {
        event: 'dialer_outside_hours',
        campaignId,
        timezone: callingRule.timezone,
        currentTime: `${currentHour}:${currentMinute}`,
        allowedRange: `${callingRule.startHour}:00-${callingRule.endHour}:${callingRule.endMinute}`,
      });
      return [];
    }

    // Check weekend restriction
    const dayFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: callingRule.timezone,
      weekday: 'short',
    });
    const dayOfWeek = dayFormatter.format(now);
    if (!callingRule.weekendAllowed && (dayOfWeek === 'Sat' || dayOfWeek === 'Sun')) {
      logger.info('Predictive dialer: weekend calling not allowed', {
        event: 'dialer_weekend_blocked',
        campaignId,
        dayOfWeek,
      });
      return [];
    }
  }

  // Get leads already contacted in this campaign and their attempt counts
  const existingActivities = await prisma.crmCampaignActivity.groupBy({
    by: ['leadId'],
    where: { campaignId },
    _count: { leadId: true },
  });

  const attemptMap = new Map<string, number>();
  existingActivities.forEach((a) => {
    attemptMap.set(a.leadId, a._count.leadId);
  });

  // Get leads currently being called (pending status)
  const inProgressLeadIds = await prisma.crmCampaignActivity.findMany({
    where: {
      campaignId,
      status: 'pending',
    },
    select: { leadId: true },
    distinct: ['leadId'],
  });
  const inProgressSet = new Set(inProgressLeadIds.map((a) => a.leadId));

  // Leads who exceeded max attempts
  const maxedOutLeadIds = new Set<string>();
  attemptMap.forEach((attempts, leadId) => {
    if (attempts >= campaign.maxAttemptsPerLead) {
      maxedOutLeadIds.add(leadId);
    }
  });

  // Combine exclusions
  const excludeIds = new Set([...inProgressSet, ...maxedOutLeadIds]);

  // Fetch eligible leads: callable, have phone, not excluded
  const leads = await prisma.crmLead.findMany({
    where: {
      dncStatus: 'CALLABLE',
      phone: { not: null },
      status: { notIn: ['CONVERTED', 'LOST'] },
      id: excludeIds.size > 0 ? { notIn: Array.from(excludeIds) } : undefined,
    },
    select: {
      id: true,
      phone: true,
      score: true,
    },
    orderBy: [
      { score: 'desc' },     // Higher-scored leads first
      { createdAt: 'asc' },  // Oldest first (FIFO)
    ],
    take: count,
  });

  const result = leads
    .filter((l): l is typeof l & { phone: string } => l.phone !== null)
    .map((l) => ({
      leadId: l.id,
      phone: l.phone,
    }));

  logger.info('Predictive dialer: batch prepared', {
    event: 'dialer_batch_prepared',
    campaignId,
    requested: count,
    returned: result.length,
    excludedInProgress: inProgressSet.size,
    excludedMaxAttempts: maxedOutLeadIds.size,
  });

  return result;
}

// ---------------------------------------------------------------------------
// recordDialOutcome
// ---------------------------------------------------------------------------

/**
 * Record the outcome of a dial attempt.
 *
 * Creates a CrmCampaignActivity entry and updates campaign stats.
 *
 * @param campaignId - The CRM campaign ID
 * @param leadId - The lead that was called
 * @param outcome - The disposition/outcome of the call
 * @param duration - Optional call duration in seconds
 */
export async function recordDialOutcome(
  campaignId: string,
  leadId: string,
  outcome: string,
  duration?: number
): Promise<void> {
  // Determine attempt number for this lead in this campaign
  const existingCount = await prisma.crmCampaignActivity.count({
    where: { campaignId, leadId },
  });

  // Determine status from outcome
  const failedOutcomes = new Set([
    'no_answer', 'busy', 'voicemail', 'disconnected',
    'wrong_number', 'machine', 'failed',
  ]);
  const status = failedOutcomes.has(outcome.toLowerCase()) ? 'failed' : 'completed';

  // Create activity record
  await prisma.crmCampaignActivity.create({
    data: {
      campaignId,
      leadId,
      attempt: existingCount + 1,
      channel: 'call',
      status,
      disposition: outcome,
      duration: duration ?? null,
      completedAt: new Date(),
    },
  });

  // Update campaign stats
  const connectedOutcomes = new Set([
    'answered', 'connected', 'interested', 'callback',
    'sale', 'appointment', 'qualified',
  ]);
  const convertedOutcomes = new Set(['sale', 'appointment', 'qualified']);

  const updateData: Record<string, unknown> = {
    contacted: { increment: 1 },
  };

  if (connectedOutcomes.has(outcome.toLowerCase())) {
    updateData.connected = { increment: 1 };
  }

  if (convertedOutcomes.has(outcome.toLowerCase())) {
    updateData.converted = { increment: 1 };
  }

  await prisma.crmCampaign.update({
    where: { id: campaignId },
    data: updateData,
  });

  // Update lead's last contacted date
  await prisma.crmLead.update({
    where: { id: leadId },
    data: { lastContactedAt: new Date() },
  });

  logger.info('Predictive dialer: outcome recorded', {
    event: 'dialer_outcome_recorded',
    campaignId,
    leadId,
    outcome,
    attempt: existingCount + 1,
    status,
    duration,
  });
}

// ---------------------------------------------------------------------------
// C40: Vertical Dialing Mode
// ---------------------------------------------------------------------------

/**
 * Get the next phone number to try for a contact (vertical dialing).
 *
 * Vertical dialing tries ALL phone numbers for a single contact before
 * moving to the next lead. This is the opposite of horizontal dialing
 * which calls one number per contact across many contacts.
 *
 * Phone number priority order:
 * 1. Primary phone (lead.phone)
 * 2. Additional phones from customFields.phones[] (mobile, work, home)
 *
 * @param campaignId - The campaign ID
 * @param leadId - The lead to dial vertically
 * @returns The next untried phone number, or null if all exhausted
 */
export async function getNextVerticalNumber(
  campaignId: string,
  leadId: string
): Promise<{ phone: string; phoneType: string } | null> {
  // Fetch lead with all phone numbers
  const lead = await prisma.crmLead.findUnique({
    where: { id: leadId },
    select: {
      id: true,
      phone: true,
      customFields: true,
    },
  });

  if (!lead) return null;

  // Build priority-ordered phone list
  const phoneNumbers: Array<{ phone: string; phoneType: string }> = [];
  if (lead.phone) phoneNumbers.push({ phone: lead.phone, phoneType: 'primary' });

  // Extract additional phones from customFields.phones array if present
  // Format: { phones: [{ number: "+1...", type: "mobile" }, ...] }
  const customFields = lead.customFields as Record<string, unknown> | null;
  if (customFields?.phones && Array.isArray(customFields.phones)) {
    for (const entry of customFields.phones) {
      if (typeof entry === 'object' && entry !== null) {
        const phoneEntry = entry as { number?: string; type?: string };
        if (phoneEntry.number && phoneEntry.number !== lead.phone) {
          phoneNumbers.push({
            phone: phoneEntry.number,
            phoneType: phoneEntry.type || 'other',
          });
        }
      }
    }
  }

  if (phoneNumbers.length === 0) return null;

  // Get previously dialed numbers for this lead in this campaign.
  // We store the dialed phone number in the `notes` field with prefix "phone:"
  const previousAttempts = await prisma.crmCampaignActivity.findMany({
    where: {
      campaignId,
      leadId,
      channel: 'call',
    },
    select: { notes: true },
    orderBy: { createdAt: 'desc' },
  });

  // Extract dialed phone numbers from notes (format: "phone:+15145551234")
  const dialedPhones = new Set<string>();
  for (const attempt of previousAttempts) {
    if (attempt.notes?.startsWith('phone:')) {
      dialedPhones.add(attempt.notes.slice(6));
    }
  }

  // Find the first number not yet tried
  for (const entry of phoneNumbers) {
    if (!dialedPhones.has(entry.phone)) {
      logger.info('Predictive dialer: vertical dial — next number', {
        event: 'dialer_vertical_next',
        campaignId,
        leadId,
        phoneType: entry.phoneType,
        triedCount: dialedPhones.size,
        totalNumbers: phoneNumbers.length,
      });
      return entry;
    }
  }

  // All numbers exhausted for this contact
  logger.info('Predictive dialer: vertical dial — all numbers exhausted', {
    event: 'dialer_vertical_exhausted',
    campaignId,
    leadId,
    totalNumbers: phoneNumbers.length,
  });

  return null;
}

/**
 * Get next batch using vertical dialing mode.
 *
 * Instead of getting one number per lead, this function returns leads
 * that still have untried phone numbers, allowing the dialer to
 * exhaust all numbers for a contact before moving on.
 *
 * @param campaignId - The campaign ID
 * @param count - Number of leads to return
 * @returns Leads with their next untried phone number
 */
export async function getNextBatchVertical(
  campaignId: string,
  count: number
): Promise<Array<{ leadId: string; phone: string; phoneType: string }>> {
  // Get a larger pool of leads and check which ones have untried numbers
  const candidateLeads = await getNextBatchToCall(campaignId, count * 3);
  const results: Array<{ leadId: string; phone: string; phoneType: string }> = [];

  for (const candidate of candidateLeads) {
    if (results.length >= count) break;

    const nextNumber = await getNextVerticalNumber(campaignId, candidate.leadId);
    if (nextNumber) {
      results.push({
        leadId: candidate.leadId,
        phone: nextNumber.phone,
        phoneType: nextNumber.phoneType,
      });
    }
  }

  logger.info('Predictive dialer: vertical batch prepared', {
    event: 'dialer_vertical_batch',
    campaignId,
    requested: count,
    returned: results.length,
  });

  return results;
}

// ---------------------------------------------------------------------------
// D14: Pacing Control — Abandoned Call Rate Management
// ---------------------------------------------------------------------------

/**
 * Calculate the current abandoned call rate for a campaign.
 *
 * Abandoned calls = calls connected to a customer but no agent was available.
 * The FCC limits abandoned calls to 3% of all answered calls.
 *
 * @param campaignId - The campaign ID
 * @param windowMinutes - Time window to analyze (default: 30 minutes)
 * @returns Current abandon rate (0.0 to 1.0)
 */
export async function calculateAbandonRate(
  campaignId: string,
  windowMinutes: number = 30
): Promise<{ abandonRate: number; abandonedCount: number; answeredCount: number }> {
  const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000);

  const activities = await prisma.crmCampaignActivity.findMany({
    where: {
      campaignId,
      channel: 'call',
      createdAt: { gte: windowStart },
      status: { in: ['completed', 'failed'] },
    },
    select: { disposition: true },
  });

  const answeredDispositions = new Set([
    'answered', 'connected', 'interested', 'callback',
    'sale', 'appointment', 'qualified', 'completed',
  ]);

  let answeredCount = 0;
  let abandonedCount = 0;

  for (const a of activities) {
    const disp = (a.disposition || '').toLowerCase();
    if (answeredDispositions.has(disp)) {
      answeredCount++;
    } else if (disp === 'abandoned' || disp === 'no_agent_available') {
      abandonedCount++;
    }
  }

  const totalRelevant = answeredCount + abandonedCount;
  const abandonRate = totalRelevant > 0 ? abandonedCount / totalRelevant : 0;

  return { abandonRate, abandonedCount, answeredCount };
}

/**
 * Calculate the paced dial ratio that respects the abandoned call rate target.
 *
 * Combines the historical answer-rate-based ratio with real-time abandon rate
 * monitoring. If the abandon rate exceeds the target, the dial ratio is
 * reduced to bring it back within compliance.
 *
 * @param campaignId - The campaign ID
 * @param abandonRateTarget - Target abandon rate (default: 3% FCC limit)
 * @returns Adjusted dial ratio
 */
export async function calculatePacedDialRatio(
  campaignId: string,
  abandonRateTarget: number = DEFAULT_ABANDON_RATE_TARGET
): Promise<{
  ratio: number;
  baseRatio: number;
  abandonRate: number;
  isThrottled: boolean;
}> {
  // Step 1: Get base ratio from historical answer rates
  const baseRatio = await calculateDialRatio(campaignId);

  // Step 2: Check current abandon rate
  const { abandonRate } = await calculateAbandonRate(campaignId);

  let ratio = baseRatio;
  let isThrottled = false;

  if (abandonRate > abandonRateTarget) {
    // Throttle: reduce ratio proportional to how far over target we are
    const overshoot = abandonRate - abandonRateTarget;
    const overshootPct = overshoot * 100; // Convert to percentage points
    const reduction = overshootPct * PACING_REDUCTION_FACTOR;
    ratio = Math.max(MIN_DIAL_RATIO, baseRatio - reduction);
    isThrottled = true;

    logger.warn('Predictive dialer: pacing — throttling due to high abandon rate', {
      event: 'dialer_pacing_throttle',
      campaignId,
      abandonRate: Math.round(abandonRate * 1000) / 10,
      target: Math.round(abandonRateTarget * 1000) / 10,
      baseRatio,
      adjustedRatio: ratio,
    });
  } else if (abandonRate < abandonRateTarget * 0.5) {
    // Well under target: allow slight increase (up to MAX)
    const headroom = (abandonRateTarget - abandonRate) * 100;
    const boost = Math.min(headroom * 0.1, 0.3);
    ratio = Math.min(MAX_DIAL_RATIO, baseRatio + boost);

    logger.info('Predictive dialer: pacing — room for increase', {
      event: 'dialer_pacing_boost',
      campaignId,
      abandonRate: Math.round(abandonRate * 1000) / 10,
      baseRatio,
      adjustedRatio: ratio,
    });
  }

  // Round to 1 decimal place
  ratio = Math.round(ratio * 10) / 10;

  return { ratio, baseRatio, abandonRate, isThrottled };
}

// ---------------------------------------------------------------------------
// D15: List Penetration Mode
// ---------------------------------------------------------------------------

/**
 * Get campaign list penetration statistics.
 *
 * Tracks what percentage of the campaign's eligible leads have been
 * contacted at least once, and how many remain untouched.
 *
 * @param campaignId - The campaign ID
 * @returns Penetration stats
 */
export async function getListPenetration(campaignId: string): Promise<{
  totalEligible: number;
  contacted: number;
  untouched: number;
  penetrationRate: number;
  exhausted: number;        // Leads with all attempts used
  cycleNumber: number;      // Current pass through the list
}> {
  const campaign = await prisma.crmCampaign.findUnique({
    where: { id: campaignId },
    select: { maxAttemptsPerLead: true },
  });

  const maxAttempts = campaign?.maxAttemptsPerLead || 3;

  // Count total eligible leads
  const totalEligible = await prisma.crmLead.count({
    where: {
      dncStatus: 'CALLABLE',
      phone: { not: null },
      status: { notIn: ['CONVERTED', 'LOST'] },
    },
  });

  // Get attempt counts per lead for this campaign
  const attemptGroups = await prisma.crmCampaignActivity.groupBy({
    by: ['leadId'],
    where: { campaignId, channel: 'call' },
    _count: { leadId: true },
  });

  const contacted = attemptGroups.length;
  const untouched = Math.max(0, totalEligible - contacted);
  const exhausted = attemptGroups.filter(
    (g) => g._count.leadId >= maxAttempts
  ).length;

  const penetrationRate = totalEligible > 0
    ? Math.round((contacted / totalEligible) * 1000) / 10
    : 0;

  // Calculate cycle number: how many full passes through the list
  const totalAttempts = attemptGroups.reduce(
    (sum, g) => sum + g._count.leadId,
    0
  );
  const cycleNumber = totalEligible > 0
    ? Math.floor(totalAttempts / totalEligible) + 1
    : 1;

  logger.info('Predictive dialer: list penetration stats', {
    event: 'dialer_penetration_stats',
    campaignId,
    totalEligible,
    contacted,
    untouched,
    exhausted,
    penetrationRate,
    cycleNumber,
  });

  return {
    totalEligible,
    contacted,
    untouched,
    penetrationRate,
    exhausted,
    cycleNumber,
  };
}

/**
 * Get next batch using list penetration mode.
 *
 * Ensures systematic coverage of ALL leads before cycling back.
 * Prioritizes leads that have been contacted the fewest times,
 * ensuring even distribution of call attempts across the list.
 *
 * @param campaignId - The campaign ID
 * @param count - Number of leads to return
 * @returns Leads ordered for systematic penetration
 */
export async function getNextBatchPenetration(
  campaignId: string,
  count: number
): Promise<Array<{ leadId: string; phone: string; attemptNumber: number }>> {
  const campaign = await prisma.crmCampaign.findUnique({
    where: { id: campaignId },
    select: {
      id: true,
      status: true,
      maxAttemptsPerLead: true,
    },
  });

  if (!campaign || campaign.status !== 'ACTIVE') return [];

  // Get all attempt counts for leads in this campaign
  const attemptGroups = await prisma.crmCampaignActivity.groupBy({
    by: ['leadId'],
    where: { campaignId, channel: 'call' },
    _count: { leadId: true },
  });

  const attemptMap = new Map<string, number>();
  attemptGroups.forEach((g) => {
    attemptMap.set(g.leadId, g._count.leadId);
  });

  // Get leads currently being dialed
  const inProgressLeadIds = await prisma.crmCampaignActivity.findMany({
    where: { campaignId, status: 'pending' },
    select: { leadId: true },
    distinct: ['leadId'],
  });
  const inProgressSet = new Set(inProgressLeadIds.map((a) => a.leadId));

  // Leads that hit max attempts
  const maxedOutIds = new Set<string>();
  attemptMap.forEach((attempts, leadId) => {
    if (attempts >= campaign.maxAttemptsPerLead) {
      maxedOutIds.add(leadId);
    }
  });

  const excludeIds = new Set([...inProgressSet, ...maxedOutIds]);

  // Fetch eligible leads — order by least-contacted first, then oldest
  // This ensures systematic penetration: untouched leads first, then cycle
  const leads = await prisma.crmLead.findMany({
    where: {
      dncStatus: 'CALLABLE',
      phone: { not: null },
      status: { notIn: ['CONVERTED', 'LOST'] },
      id: excludeIds.size > 0 ? { notIn: Array.from(excludeIds) } : undefined,
    },
    select: {
      id: true,
      phone: true,
      lastContactedAt: true,
    },
    orderBy: [
      { lastContactedAt: { sort: 'asc', nulls: 'first' } }, // Never contacted first
      { createdAt: 'asc' },                                   // Oldest first (FIFO)
    ],
    take: count * 2, // Fetch extra to account for filtering
  });

  // Sort by attempt count ascending (untouched leads first)
  const sorted = leads
    .filter((l): l is typeof l & { phone: string } => l.phone !== null)
    .map((l) => ({
      leadId: l.id,
      phone: l.phone,
      attemptNumber: (attemptMap.get(l.id) || 0) + 1,
    }))
    .sort((a, b) => a.attemptNumber - b.attemptNumber)
    .slice(0, count);

  logger.info('Predictive dialer: penetration batch prepared', {
    event: 'dialer_penetration_batch',
    campaignId,
    requested: count,
    returned: sorted.length,
    minAttempt: sorted[0]?.attemptNumber || 0,
    maxAttempt: sorted[sorted.length - 1]?.attemptNumber || 0,
  });

  return sorted;
}
