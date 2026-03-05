/**
 * CRM Email A/B Testing (H8)
 *
 * A/B split testing for email campaigns.
 * - createEmailAbTest: Set up A/B test with variants (subject, content, send time)
 * - assignVariant: Randomly assign A or B to a contact
 * - getAbTestResults: Open rates, click rates, conversion per variant
 * - declareWinner: Pick winning variant based on metrics
 */

import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EmailAbTestConfig {
  campaignId: string;
  name: string;
  variantA: EmailVariant;
  variantB: EmailVariant;
  splitPercent?: number; // % going to variant A (default 50)
  metric: 'open_rate' | 'click_rate' | 'conversion_rate';
}

export interface EmailVariant {
  subject: string;
  content?: string;
  sendTime?: string; // ISO 8601 for send-time testing
}

export interface EmailAbTestResult {
  testId: string;
  variantA: VariantMetrics;
  variantB: VariantMetrics;
  winner: 'A' | 'B' | 'none';
  confidence: number;
  metric: string;
}

interface VariantMetrics {
  sent: number;
  delivered: number;
  opens: number;
  clicks: number;
  conversions: number;
  openRate: number;
  clickRate: number;
  conversionRate: number;
}

interface AbTestData {
  testId: string;
  name: string;
  campaignId: string;
  variantA: EmailVariant;
  variantB: EmailVariant;
  splitPercent: number;
  metric: string;
  assignments: Record<string, 'A' | 'B'>;
  winnerId: string | null;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Create Email A/B Test
// ---------------------------------------------------------------------------

/**
 * Set up an A/B test for an email campaign.
 */
export async function createEmailAbTest(config: EmailAbTestConfig): Promise<{ testId: string }> {
  const campaign = await prisma.crmCampaign.findUnique({
    where: { id: config.campaignId },
    select: { id: true, targetCriteria: true },
  });

  if (!campaign) {
    throw new Error(`Campaign ${config.campaignId} not found`);
  }

  const testId = `emailab_${config.campaignId}_${Date.now()}`;
  const splitPercent = config.splitPercent ?? 50;

  const testData: AbTestData = {
    testId,
    name: config.name,
    campaignId: config.campaignId,
    variantA: config.variantA,
    variantB: config.variantB,
    splitPercent,
    metric: config.metric,
    assignments: {},
    winnerId: null,
    createdAt: new Date().toISOString(),
  };

  // Store test data in campaign targetCriteria JSON
  const existing = (campaign.targetCriteria || {}) as Record<string, unknown>;
  await prisma.crmCampaign.update({
    where: { id: config.campaignId },
    data: {
      targetCriteria: JSON.parse(JSON.stringify({
        ...existing,
        _emailAbTest: testData,
      })),
    },
  });

  logger.info('[email-ab-testing] Test created', {
    event: 'email_ab_test_created',
    testId,
    campaignId: config.campaignId,
    metric: config.metric,
    splitPercent,
  });

  return { testId };
}

// ---------------------------------------------------------------------------
// Assign Variant
// ---------------------------------------------------------------------------

/**
 * Deterministically assign a contact to variant A or B.
 */
export function assignVariant(contactId: string, testId: string): 'A' | 'B' {
  // Simple deterministic hash-based assignment
  let hash = 0;
  const str = `${testId}:${contactId}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash) % 2 === 0 ? 'A' : 'B';
}

// ---------------------------------------------------------------------------
// Get A/B Test Results
// ---------------------------------------------------------------------------

/**
 * Get results of an email A/B test with open/click/conversion rates per variant.
 */
export async function getAbTestResults(testId: string): Promise<EmailAbTestResult> {
  const emptyMetrics = (): VariantMetrics => ({
    sent: 0, delivered: 0, opens: 0, clicks: 0, conversions: 0,
    openRate: 0, clickRate: 0, conversionRate: 0,
  });

  // Extract campaignId from testId format: emailab_{campaignId}_{timestamp}
  const parts = testId.split('_');
  if (parts.length < 3) {
    return { testId, variantA: emptyMetrics(), variantB: emptyMetrics(), winner: 'none', confidence: 0, metric: 'open_rate' };
  }

  const campaignId = parts[1];
  const campaign = await prisma.crmCampaign.findUnique({
    where: { id: campaignId },
    select: { targetCriteria: true },
  });

  if (!campaign) {
    return { testId, variantA: emptyMetrics(), variantB: emptyMetrics(), winner: 'none', confidence: 0, metric: 'open_rate' };
  }

  const criteria = (campaign.targetCriteria || {}) as Record<string, unknown>;
  const testData = criteria._emailAbTest as AbTestData | undefined;

  if (!testData || testData.testId !== testId) {
    return { testId, variantA: emptyMetrics(), variantB: emptyMetrics(), winner: 'none', confidence: 0, metric: 'open_rate' };
  }

  // Gather metrics from campaign activities
  const activities = await prisma.crmCampaignActivity.findMany({
    where: { campaignId },
    select: { leadId: true, status: true, disposition: true },
  });

  const variantA = emptyMetrics();
  const variantB = emptyMetrics();

  for (const activity of activities) {
    const variant = testData.assignments[activity.leadId] || assignVariant(activity.leadId, testId);
    const target = variant === 'A' ? variantA : variantB;

    target.sent++;
    if (activity.status === 'completed') {
      target.delivered++;
      // Use disposition to determine engagement
      if (activity.disposition === 'opened') target.opens++;
      if (activity.disposition === 'clicked') { target.opens++; target.clicks++; }
      if (activity.disposition === 'converted') { target.opens++; target.clicks++; target.conversions++; }
    }
  }

  // Calculate rates
  for (const v of [variantA, variantB]) {
    v.openRate = v.delivered > 0 ? Math.round((v.opens / v.delivered) * 10000) / 100 : 0;
    v.clickRate = v.delivered > 0 ? Math.round((v.clicks / v.delivered) * 10000) / 100 : 0;
    v.conversionRate = v.delivered > 0 ? Math.round((v.conversions / v.delivered) * 10000) / 100 : 0;
  }

  // Determine winner based on configured metric
  const metricKey = testData.metric === 'click_rate' ? 'clickRate'
    : testData.metric === 'conversion_rate' ? 'conversionRate'
    : 'openRate';

  let winner: 'A' | 'B' | 'none' = 'none';
  let confidence = 0;

  const totalSamples = variantA.sent + variantB.sent;
  if (totalSamples >= 20) {
    const diff = Math.abs(variantA[metricKey] - variantB[metricKey]);
    confidence = Math.min(99, Math.round(diff * 10));

    if (confidence >= 95) {
      winner = variantA[metricKey] > variantB[metricKey] ? 'A' : 'B';
    }
  }

  return { testId, variantA, variantB, winner, confidence, metric: testData.metric };
}

// ---------------------------------------------------------------------------
// Declare Winner
// ---------------------------------------------------------------------------

/**
 * Declare the winning variant based on current metrics.
 */
export async function declareWinner(testId: string): Promise<{ winner: 'A' | 'B' | 'none' }> {
  const results = await getAbTestResults(testId);

  if (results.winner === 'none') {
    logger.info('[email-ab-testing] No clear winner yet', { testId, confidence: results.confidence });
    return { winner: 'none' };
  }

  // Update test data with winner
  const parts = testId.split('_');
  if (parts.length >= 3) {
    const campaignId = parts[1];
    const campaign = await prisma.crmCampaign.findUnique({
      where: { id: campaignId },
      select: { targetCriteria: true },
    });

    if (campaign) {
      const criteria = (campaign.targetCriteria || {}) as Record<string, unknown>;
      const testData = criteria._emailAbTest as AbTestData | undefined;

      if (testData) {
        testData.winnerId = results.winner;
        await prisma.crmCampaign.update({
          where: { id: campaignId },
          data: {
            targetCriteria: JSON.parse(JSON.stringify({
              ...criteria,
              _emailAbTest: testData,
            })),
          },
        });
      }
    }
  }

  logger.info('[email-ab-testing] Winner declared', {
    event: 'email_ab_test_winner',
    testId,
    winner: results.winner,
    confidence: results.confidence,
  });

  return { winner: results.winner };
}
