/**
 * NEXT BEST ACTION ENGINE
 * Context-aware suggestions for leads and deals.
 */

import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Priority = 'high' | 'medium' | 'low';

interface Suggestion {
  action: string;
  reason: string;
  priority: Priority;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function daysSince(date: Date | null | undefined): number | null {
  if (!date) return null;
  return Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
}

const PRIORITY_ORDER: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

function sortByPriority(suggestions: Suggestion[]): Suggestion[] {
  return suggestions.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
}

// ---------------------------------------------------------------------------
// Lead suggestions
// ---------------------------------------------------------------------------

async function getLeadActions(leadId: string): Promise<Suggestion[]> {
  const lead = await prisma.crmLead.findUniqueOrThrow({
    where: { id: leadId },
    include: {
      activities: { select: { id: true, createdAt: true }, orderBy: { createdAt: 'desc' }, take: 1 },
      tasks: { where: { status: 'PENDING' }, select: { id: true } },
    },
  });

  const suggestions: Suggestion[] = [];

  // "Call lead" if not contacted in 3+ days
  const daysSinceContact = daysSince(lead.lastContactedAt);
  if (daysSinceContact === null || daysSinceContact >= 3) {
    suggestions.push({
      action: 'Call lead',
      reason:
        daysSinceContact === null
          ? 'Lead has never been contacted'
          : `Last contacted ${daysSinceContact} days ago`,
      priority: daysSinceContact === null || daysSinceContact >= 7 ? 'high' : 'medium',
    });
  }

  // "Send email" if no activity in 7+ days
  const latestActivity = lead.activities[0];
  const daysSinceActivity = latestActivity ? daysSince(latestActivity.createdAt) : null;
  if (daysSinceActivity === null || daysSinceActivity >= 7) {
    suggestions.push({
      action: 'Send email',
      reason:
        daysSinceActivity === null
          ? 'No activity recorded for this lead'
          : `No activity in ${daysSinceActivity} days`,
      priority: 'medium',
    });
  }

  // "Convert to deal" if score > 70
  if (lead.score > 70) {
    suggestions.push({
      action: 'Convert to deal',
      reason: `Lead score is ${lead.score} (HOT) - ready for conversion`,
      priority: 'high',
    });
  }

  // "Update info" if missing email or phone
  if (!lead.email || !lead.phone) {
    const missing: string[] = [];
    if (!lead.email) missing.push('email');
    if (!lead.phone) missing.push('phone');
    suggestions.push({
      action: 'Update info',
      reason: `Missing contact info: ${missing.join(', ')}`,
      priority: 'low',
    });
  }

  // "Schedule follow-up" if no nextFollowUpAt
  if (!lead.nextFollowUpAt) {
    suggestions.push({
      action: 'Schedule follow-up',
      reason: 'No follow-up date scheduled',
      priority: lead.tasks.length === 0 ? 'high' : 'medium',
    });
  }

  return suggestions;
}

// ---------------------------------------------------------------------------
// Deal suggestions
// ---------------------------------------------------------------------------

async function getDealActions(dealId: string): Promise<Suggestion[]> {
  const deal = await prisma.crmDeal.findUniqueOrThrow({
    where: { id: dealId },
    include: {
      stage: { select: { name: true } },
      stageHistory: { orderBy: { createdAt: 'desc' }, take: 1, select: { createdAt: true } },
      tasks: { where: { status: 'PENDING' }, select: { id: true } },
    },
  });

  const suggestions: Suggestion[] = [];

  // Days in current stage
  const lastStageChange = deal.stageHistory[0];
  const daysInStage = lastStageChange ? daysSince(lastStageChange.createdAt) : daysSince(deal.createdAt);
  const stageName = deal.stage.name;

  // "Follow up" if >7 days in stage
  if (daysInStage !== null && daysInStage > 7) {
    suggestions.push({
      action: 'Follow up',
      reason: `Deal has been in "${stageName}" stage for ${daysInStage} days`,
      priority: daysInStage > 14 ? 'high' : 'medium',
    });
  }

  // "Send proposal" if in Discovery stage >5 days
  if (stageName.toLowerCase().includes('discovery') && daysInStage !== null && daysInStage > 5) {
    suggestions.push({
      action: 'Send proposal',
      reason: `In Discovery stage for ${daysInStage} days - time to present a proposal`,
      priority: 'high',
    });
  }

  // "Close the deal" if in Negotiation >10 days
  if (stageName.toLowerCase().includes('negotiation') && daysInStage !== null && daysInStage > 10) {
    suggestions.push({
      action: 'Close the deal',
      reason: `In Negotiation stage for ${daysInStage} days - push to close`,
      priority: 'high',
    });
  }

  // "Review deal" if past expectedCloseDate
  if (deal.expectedCloseDate) {
    const daysPastClose = daysSince(deal.expectedCloseDate);
    if (daysPastClose !== null && daysPastClose > 0) {
      suggestions.push({
        action: 'Review deal',
        reason: `Expected close date was ${daysPastClose} days ago - reassess timeline`,
        priority: 'high',
      });
    }
  }

  return suggestions;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generate contextual next-best-action suggestions for a lead or deal.
 * Returns at most 5 suggestions, sorted by priority (high first).
 */
export async function getNextBestActions(
  entityType: 'lead' | 'deal',
  entityId: string,
): Promise<Suggestion[]> {
  try {
    const suggestions =
      entityType === 'lead'
        ? await getLeadActions(entityId)
        : await getDealActions(entityId);

    const sorted = sortByPriority(suggestions).slice(0, 5);

    logger.debug('Next best actions generated', {
      entityType,
      entityId,
      count: sorted.length,
    });

    return sorted;
  } catch (err) {
    logger.error('Failed to generate next best actions', {
      entityType,
      entityId,
      error: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
}
