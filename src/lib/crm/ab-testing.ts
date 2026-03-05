/**
 * CRM A/B TESTING ENGINE
 * Split campaign leads into two variants, track outcomes,
 * and determine statistical significance using chi-squared test.
 */

import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ABTestVariant {
  message: string;
  subject?: string;
}

export interface ABTestResults {
  variantA: {
    sent: number;
    opens: number;
    clicks: number;
    converts: number;
    rate: number;
  };
  variantB: {
    sent: number;
    opens: number;
    clicks: number;
    converts: number;
    rate: number;
  };
  winner: 'A' | 'B' | 'none';
  confidence: number;
}

interface ABTestRecord {
  testId: string;
  campaignId: string;
  variantA: ABTestVariant;
  variantB: ABTestVariant;
  assignments: Record<string, 'A' | 'B'>;
  outcomes: Record<string, { variant: 'A' | 'B'; outcomes: string[] }>;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// In-memory store (backed by CrmCampaign.customFields or metadata)
// In production, this would be a dedicated ABTest model.
// We store test data in the campaign's targetCriteria JSON field under _abTest.
// ---------------------------------------------------------------------------

/**
 * Read AB test data from campaign metadata.
 */
async function getTestData(testId: string): Promise<ABTestRecord | null> {
  // testId format: "abtest_{campaignId}_{timestamp}"
  const parts = testId.split('_');
  if (parts.length < 3) return null;

  const campaignId = parts[1];

  const campaign = await prisma.crmCampaign.findUnique({
    where: { id: campaignId },
    select: { id: true, targetCriteria: true },
  });

  if (!campaign) return null;

  const criteria = (campaign.targetCriteria || {}) as Record<string, unknown>;
  const abTest = criteria._abTest as ABTestRecord | undefined;

  if (!abTest || abTest.testId !== testId) return null;

  return abTest;
}

/**
 * Save AB test data to campaign metadata.
 */
async function saveTestData(campaignId: string, data: ABTestRecord): Promise<void> {
  const campaign = await prisma.crmCampaign.findUnique({
    where: { id: campaignId },
    select: { targetCriteria: true },
  });

  const existing = (campaign?.targetCriteria || {}) as Record<string, unknown>;

  await prisma.crmCampaign.update({
    where: { id: campaignId },
    data: {
      targetCriteria: JSON.parse(JSON.stringify({
        ...existing,
        _abTest: data,
      })),
    },
  });
}

// ---------------------------------------------------------------------------
// Create A/B Test
// ---------------------------------------------------------------------------

/**
 * Create an A/B test for a campaign, splitting its leads 50/50 into two variants.
 */
export async function createABTest(
  campaignId: string,
  variantA: ABTestVariant,
  variantB: ABTestVariant
): Promise<{ testId: string }> {
  const campaign = await prisma.crmCampaign.findUnique({
    where: { id: campaignId },
    select: { id: true, name: true },
  });

  if (!campaign) {
    throw new Error(`Campaign ${campaignId} not found`);
  }

  const testId = `abtest_${campaignId}_${Date.now()}`;

  // Get campaign leads from activities
  const activities = await prisma.crmCampaignActivity.findMany({
    where: { campaignId },
    select: { leadId: true },
    distinct: ['leadId'],
  });

  // Assign leads 50/50 deterministically
  const assignments: Record<string, 'A' | 'B'> = {};
  activities.forEach((activity, index) => {
    assignments[activity.leadId] = index % 2 === 0 ? 'A' : 'B';
  });

  const testData: ABTestRecord = {
    testId,
    campaignId,
    variantA,
    variantB,
    assignments,
    outcomes: {},
    createdAt: new Date().toISOString(),
  };

  await saveTestData(campaignId, testData);

  logger.info('A/B test created', {
    testId,
    campaignId,
    totalLeads: activities.length,
    variantACount: Object.values(assignments).filter((v) => v === 'A').length,
    variantBCount: Object.values(assignments).filter((v) => v === 'B').length,
  });

  return { testId };
}

// ---------------------------------------------------------------------------
// Assign Variant
// ---------------------------------------------------------------------------

/**
 * Deterministically assign a lead to variant A or B based on leadId hash.
 * If the lead was already assigned during test creation, returns that assignment.
 * Otherwise, uses a simple hash to determine the variant.
 */
export function assignVariant(testId: string, leadId: string): 'A' | 'B' {
  // Deterministic assignment using simple hash of leadId
  let hash = 0;
  const str = `${testId}:${leadId}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  return Math.abs(hash) % 2 === 0 ? 'A' : 'B';
}

// ---------------------------------------------------------------------------
// Record Outcome
// ---------------------------------------------------------------------------

/**
 * Record an outcome event for a lead in an A/B test.
 * Outcomes: 'open', 'click', 'reply', 'convert'
 */
export async function recordOutcome(
  testId: string,
  leadId: string,
  outcome: 'open' | 'click' | 'reply' | 'convert'
): Promise<void> {
  const testData = await getTestData(testId);
  if (!testData) {
    logger.warn('A/B test not found for outcome recording', { testId, leadId });
    return;
  }

  const variant = testData.assignments[leadId] || assignVariant(testId, leadId);

  if (!testData.outcomes[leadId]) {
    testData.outcomes[leadId] = { variant, outcomes: [] };
  }

  // Avoid duplicate outcomes
  if (!testData.outcomes[leadId].outcomes.includes(outcome)) {
    testData.outcomes[leadId].outcomes.push(outcome);
  }

  await saveTestData(testData.campaignId, testData);

  logger.info('A/B test outcome recorded', {
    testId,
    leadId,
    variant,
    outcome,
  });
}

// ---------------------------------------------------------------------------
// Get Results
// ---------------------------------------------------------------------------

/**
 * Get the results of an A/B test with conversion rates and statistical significance.
 */
export async function getABTestResults(testId: string): Promise<ABTestResults> {
  const testData = await getTestData(testId);

  if (!testData) {
    return {
      variantA: { sent: 0, opens: 0, clicks: 0, converts: 0, rate: 0 },
      variantB: { sent: 0, opens: 0, clicks: 0, converts: 0, rate: 0 },
      winner: 'none',
      confidence: 0,
    };
  }

  const variantA = { sent: 0, opens: 0, clicks: 0, converts: 0, rate: 0 };
  const variantB = { sent: 0, opens: 0, clicks: 0, converts: 0, rate: 0 };

  // Count assignments (sent)
  for (const variant of Object.values(testData.assignments)) {
    if (variant === 'A') variantA.sent++;
    else variantB.sent++;
  }

  // Count outcomes
  for (const record of Object.values(testData.outcomes)) {
    const target = record.variant === 'A' ? variantA : variantB;

    if (record.outcomes.includes('open')) target.opens++;
    if (record.outcomes.includes('click')) target.clicks++;
    if (record.outcomes.includes('convert')) target.converts++;
  }

  // Calculate conversion rates (based on converts/sent)
  variantA.rate = variantA.sent > 0
    ? Math.round((variantA.converts / variantA.sent) * 10000) / 100
    : 0;
  variantB.rate = variantB.sent > 0
    ? Math.round((variantB.converts / variantB.sent) * 10000) / 100
    : 0;

  // Determine winner and confidence
  const { significant, confidence } = isStatisticallySignificant(
    variantA.converts,
    variantA.sent,
    variantB.converts,
    variantB.sent
  );

  let winner: 'A' | 'B' | 'none' = 'none';
  if (significant) {
    winner = variantA.rate > variantB.rate ? 'A' : 'B';
  }

  logger.info('A/B test results calculated', {
    testId,
    winner,
    confidence,
    variantARate: variantA.rate,
    variantBRate: variantB.rate,
  });

  return { variantA, variantB, winner, confidence };
}

// ---------------------------------------------------------------------------
// Statistical Significance (Chi-Squared Test)
// ---------------------------------------------------------------------------

/**
 * Test whether the difference between two conversion rates is statistically
 * significant using the chi-squared test.
 *
 * @param a - Number of conversions in variant A
 * @param totalA - Total sent in variant A
 * @param b - Number of conversions in variant B
 * @param totalB - Total sent in variant B
 * @returns { significant: boolean, confidence: number }
 */
export function isStatisticallySignificant(
  a: number,
  totalA: number,
  b: number,
  totalB: number
): { significant: boolean; confidence: number } {
  // Need minimum sample size
  if (totalA < 10 || totalB < 10) {
    return { significant: false, confidence: 0 };
  }

  // 2x2 contingency table:
  //              Converted    Not Converted    Total
  // Variant A:      a          totalA - a      totalA
  // Variant B:      b          totalB - b      totalB
  // Total:        a+b     (totalA+totalB)-(a+b) totalA+totalB

  const total = totalA + totalB;
  const totalConverted = a + b;
  const totalNotConverted = total - totalConverted;

  if (totalConverted === 0 || totalNotConverted === 0) {
    return { significant: false, confidence: 0 };
  }

  // Expected values
  const expectedA = (totalA * totalConverted) / total;
  const expectedNotA = (totalA * totalNotConverted) / total;
  const expectedB = (totalB * totalConverted) / total;
  const expectedNotB = (totalB * totalNotConverted) / total;

  // Guard against zero expected values
  if (expectedA === 0 || expectedNotA === 0 || expectedB === 0 || expectedNotB === 0) {
    return { significant: false, confidence: 0 };
  }

  // Chi-squared statistic
  const chiSquared =
    Math.pow(a - expectedA, 2) / expectedA +
    Math.pow(totalA - a - expectedNotA, 2) / expectedNotA +
    Math.pow(b - expectedB, 2) / expectedB +
    Math.pow(totalB - b - expectedNotB, 2) / expectedNotB;

  // Convert chi-squared to approximate confidence level
  // Critical values for 1 degree of freedom:
  // 90% = 2.706, 95% = 3.841, 99% = 6.635
  let confidence = 0;
  if (chiSquared >= 6.635) {
    confidence = 99;
  } else if (chiSquared >= 3.841) {
    confidence = 95;
  } else if (chiSquared >= 2.706) {
    confidence = 90;
  } else if (chiSquared >= 1.642) {
    confidence = 80;
  } else {
    // Linear interpolation for lower confidence
    confidence = Math.round((chiSquared / 2.706) * 90);
  }

  return {
    significant: confidence >= 95,
    confidence,
  };
}
