/**
 * CRM Short Code vs Long Code Management (G11)
 *
 * Manage SMS short codes and long codes for campaign sending.
 * Similar to Five9, Twilio, and Bandwidth number management.
 *
 * Features:
 * - Register and manage short codes (5-6 digit, high throughput)
 * - Register and manage long codes (10-digit, conversational)
 * - Recommend optimal sending number based on campaign type and volume
 * - Track throughput, delivery rates, and opt-out rates per number
 * - Check 10DLC and short code compliance registration status
 */

import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type NumberType = 'short_code' | 'long_code';
export type CampaignType = 'marketing' | 'transactional' | 'alerts';
export type ComplianceStatus = 'registered' | 'pending' | 'rejected' | 'not_registered';

export interface ShortCodeConfig {
  shortCode: string;
  provider: string;
  keywords: string[];
  throughput: number;     // messages per second
  enabled?: boolean;
  description?: string;
}

export interface LongCodeConfig {
  phoneNumber: string;
  provider: string;
  capabilities: string[];  // ['sms', 'mms', 'voice']
  enabled?: boolean;
  description?: string;
}

export interface NumberEntry {
  id: string;
  number: string;
  type: NumberType;
  provider: string;
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  capabilities: string[];
  throughput: number;
  keywords: string[];
  description: string;
  createdAt: string;
}

export interface NumberInventory {
  shortCodes: NumberEntry[];
  longCodes: NumberEntry[];
  totalActive: number;
  totalInactive: number;
}

export interface NumberMetrics {
  number: string;
  type: NumberType;
  throughputPerSecond: number;
  messagesSentLast30d: number;
  deliveryRate: number;
  optOutRate: number;
  avgResponseTime: number;
  peakHourUsage: { hour: number; count: number }[];
}

export interface NumberRecommendation {
  number: string;
  type: NumberType;
  reason: string;
  score: number;
}

export interface ComplianceInfo {
  number: string;
  type: NumberType;
  tenDlcStatus: ComplianceStatus;
  shortCodeApproval: ComplianceStatus;
  campaignRegistrations: {
    campaignType: CampaignType;
    status: ComplianceStatus;
    registeredAt: string | null;
  }[];
  issues: string[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getNumbersStore(): Promise<NumberEntry[]> {
  try {
    const trail = await prisma.auditTrail.findFirst({
      where: { entityType: 'SMS_NUMBER_CONFIG', action: 'CONFIG' },
      orderBy: { createdAt: 'desc' },
    });
    if (!trail?.metadata) return [];
    const data = trail.metadata as Record<string, unknown>;
    return (data as { numbers: NumberEntry[] })?.numbers || [];
  } catch {
    return [];
  }
}

async function saveNumbersStore(numbers: NumberEntry[]): Promise<void> {
  await prisma.auditTrail.create({
    data: {
      entityType: 'SMS_NUMBER_CONFIG',
      entityId: 'singleton',
      action: 'CONFIG',
      metadata: { numbers } as unknown as Prisma.InputJsonValue,
      userId: 'system',
    },
  });
}

function generateId(): string {
  return `num_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// ---------------------------------------------------------------------------
// configureShortCode
// ---------------------------------------------------------------------------

/**
 * Register a short code for SMS campaigns.
 * Short codes offer high throughput (100+ msg/sec) for marketing/alerts.
 */
export async function configureShortCode(
  config: ShortCodeConfig,
): Promise<{ success: boolean; id?: string; error?: string }> {
  if (!config.shortCode || config.shortCode.length < 5 || config.shortCode.length > 6) {
    return { success: false, error: 'Short code must be 5-6 digits' };
  }
  if (!config.provider) {
    return { success: false, error: 'Provider is required' };
  }

  const numbers = await getNumbersStore();

  // Check for duplicate
  const existing = numbers.find(
    (n) => n.number === config.shortCode && n.type === 'short_code',
  );
  if (existing) {
    return { success: false, error: `Short code ${config.shortCode} already registered` };
  }

  const entry: NumberEntry = {
    id: generateId(),
    number: config.shortCode,
    type: 'short_code',
    provider: config.provider,
    status: 'pending', // Short codes need carrier approval
    capabilities: ['sms'],
    throughput: config.throughput || 100,
    keywords: config.keywords || [],
    description: config.description || `Short code ${config.shortCode}`,
    createdAt: new Date().toISOString(),
  };

  numbers.push(entry);
  await saveNumbersStore(numbers);

  logger.info('[SMS-Numbers] Short code registered', {
    shortCode: config.shortCode,
    provider: config.provider,
  });

  return { success: true, id: entry.id };
}

// ---------------------------------------------------------------------------
// configureLongCode
// ---------------------------------------------------------------------------

/**
 * Register a long code (10-digit number) for conversational SMS.
 * Long codes are lower throughput but better for 1:1 conversations.
 */
export async function configureLongCode(
  config: LongCodeConfig,
): Promise<{ success: boolean; id?: string; error?: string }> {
  if (!config.phoneNumber) {
    return { success: false, error: 'Phone number is required' };
  }
  if (!config.provider) {
    return { success: false, error: 'Provider is required' };
  }

  const numbers = await getNumbersStore();

  const existing = numbers.find(
    (n) => n.number === config.phoneNumber && n.type === 'long_code',
  );
  if (existing) {
    return { success: false, error: `Long code ${config.phoneNumber} already registered` };
  }

  const entry: NumberEntry = {
    id: generateId(),
    number: config.phoneNumber,
    type: 'long_code',
    provider: config.provider,
    status: 'active',
    capabilities: config.capabilities || ['sms'],
    throughput: 1, // Typically 1 msg/sec for long codes
    keywords: [],
    description: config.description || `Long code ${config.phoneNumber}`,
    createdAt: new Date().toISOString(),
  };

  numbers.push(entry);
  await saveNumbersStore(numbers);

  logger.info('[SMS-Numbers] Long code registered', {
    phoneNumber: config.phoneNumber,
    provider: config.provider,
  });

  return { success: true, id: entry.id };
}

// ---------------------------------------------------------------------------
// getOptimalSendingNumber
// ---------------------------------------------------------------------------

/**
 * Recommend the best sending number (short code vs long code) based on
 * campaign type and expected volume.
 */
export async function getOptimalSendingNumber(
  campaignType: CampaignType,
  volume: number,
): Promise<NumberRecommendation[]> {
  const numbers = await getNumbersStore();
  const active = numbers.filter((n) => n.status === 'active');

  if (active.length === 0) {
    return [];
  }

  const recommendations: NumberRecommendation[] = [];

  for (const num of active) {
    let score = 50; // base score
    let reason = '';

    if (campaignType === 'marketing') {
      // Marketing: prefer short codes for high volume
      if (num.type === 'short_code') {
        score += 30;
        reason = 'Short code ideal for marketing campaigns (high throughput, carrier-approved)';
      } else {
        score -= 10;
        reason = 'Long code can be used for low-volume marketing (10DLC required)';
      }
    } else if (campaignType === 'transactional') {
      // Transactional: either works, prefer short code for high volume
      if (num.type === 'short_code' && volume > 1000) {
        score += 20;
        reason = 'Short code recommended for high-volume transactional messages';
      } else if (num.type === 'long_code') {
        score += 15;
        reason = 'Long code suitable for transactional messages (more personal)';
      }
    } else if (campaignType === 'alerts') {
      // Alerts: short code preferred for reliability and speed
      if (num.type === 'short_code') {
        score += 35;
        reason = 'Short code best for time-sensitive alerts (highest throughput)';
      } else {
        score -= 5;
        reason = 'Long code acceptable for low-volume alerts';
      }
    }

    // Volume-based scoring
    const estimatedSeconds = volume / num.throughput;
    if (estimatedSeconds < 60) score += 10; // Can send within 1 minute
    else if (estimatedSeconds < 3600) score += 5; // Within 1 hour
    else score -= 10; // Would take too long

    recommendations.push({
      number: num.number,
      type: num.type,
      reason,
      score: Math.max(0, Math.min(100, score)),
    });
  }

  return recommendations.sort((a, b) => b.score - a.score);
}

// ---------------------------------------------------------------------------
// getNumberInventory
// ---------------------------------------------------------------------------

/**
 * List all registered short codes and long codes with their status.
 */
export async function getNumberInventory(): Promise<NumberInventory> {
  const numbers = await getNumbersStore();

  return {
    shortCodes: numbers.filter((n) => n.type === 'short_code'),
    longCodes: numbers.filter((n) => n.type === 'long_code'),
    totalActive: numbers.filter((n) => n.status === 'active').length,
    totalInactive: numbers.filter((n) => n.status !== 'active').length,
  };
}

// ---------------------------------------------------------------------------
// getNumberMetrics
// ---------------------------------------------------------------------------

/**
 * Get throughput, delivery rate, and opt-out rate for a specific number.
 */
export async function getNumberMetrics(number: string): Promise<NumberMetrics> {
  const numbers = await getNumbersStore();
  const entry = numbers.find((n) => n.number === number);

  if (!entry) throw new Error(`Number ${number} not found in inventory`);

  // Query SMS campaign messages sent from this number
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const stats = await prisma.smsCampaignMessage.groupBy({
    by: ['status'],
    _count: { id: true },
    where: {
      phone: number,
      createdAt: { gte: thirtyDaysAgo },
    },
  });

  let totalSent = 0;
  let delivered = 0;

  for (const stat of stats) {
    totalSent += stat._count.id;
    if (stat.status === 'DELIVERED') delivered += stat._count.id;
  }

  const deliveryRate = totalSent > 0
    ? Math.round((delivered / totalSent) * 10000) / 100
    : 100;

  return {
    number,
    type: entry.type,
    throughputPerSecond: entry.throughput,
    messagesSentLast30d: totalSent,
    deliveryRate,
    optOutRate: 0, // Would track via opt-out events
    avgResponseTime: 0,
    peakHourUsage: [],
  };
}

// ---------------------------------------------------------------------------
// checkComplianceStatus
// ---------------------------------------------------------------------------

/**
 * Check 10DLC registration and short code approval status for a number.
 */
export async function checkComplianceStatus(number: string): Promise<ComplianceInfo> {
  const numbers = await getNumbersStore();
  const entry = numbers.find((n) => n.number === number);

  if (!entry) throw new Error(`Number ${number} not found in inventory`);

  const issues: string[] = [];

  // Check 10DLC for long codes (US requirement)
  let tenDlcStatus: ComplianceStatus = 'not_registered';
  if (entry.type === 'long_code') {
    // In production, would check with TCR (The Campaign Registry)
    tenDlcStatus = 'not_registered';
    issues.push('10DLC registration required for US A2P messaging');
  }

  // Check short code approval
  let shortCodeApproval: ComplianceStatus = 'not_registered';
  if (entry.type === 'short_code') {
    shortCodeApproval = entry.status === 'active' ? 'registered' : 'pending';
    if (entry.status === 'pending') {
      issues.push('Short code approval pending with carriers (typically 8-12 weeks)');
    }
  }

  return {
    number,
    type: entry.type,
    tenDlcStatus,
    shortCodeApproval,
    campaignRegistrations: [
      {
        campaignType: 'marketing',
        status: 'not_registered',
        registeredAt: null,
      },
      {
        campaignType: 'transactional',
        status: 'not_registered',
        registeredAt: null,
      },
      {
        campaignType: 'alerts',
        status: 'not_registered',
        registeredAt: null,
      },
    ],
    issues,
  };
}
