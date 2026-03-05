/**
 * CRM TCPA Manual Touch Mode (L15)
 *
 * FCC TCPA compliance: 1-to-1 consent mode for cell phone calls.
 * - requiresManualTouch: Check if a phone number is a cell requiring manual dial
 * - enforceManualTouch: Switch a campaign to manual touch mode
 * - logManualConsent: Record agent-confirmed consent before dialing
 * - getManualTouchStats: Manual vs auto-dial statistics for a campaign
 */

import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ManualTouchStats {
  campaignId: string;
  totalContacts: number;
  manualRequired: number;
  autoDialAllowed: number;
  consentsLogged: number;
  manualPercent: number;
}

export interface ConsentLog {
  agentId: string;
  phone: string;
  consentType: 'verbal' | 'written' | 'express_written';
  timestamp: Date;
}

// ---------------------------------------------------------------------------
// Cell phone detection patterns
// ---------------------------------------------------------------------------

/**
 * North American cell phone number prefixes and patterns.
 * In production, this would use a phone type lookup API (e.g., Twilio Lookup).
 */
const KNOWN_LANDLINE_PREFIXES = new Set([
  // Common landline prefixes (simplified for illustration)
  '800', '888', '877', '866', '855', '844', '833', // Toll-free
]);

// ---------------------------------------------------------------------------
// Requires Manual Touch
// ---------------------------------------------------------------------------

/**
 * Check if a phone number is a cell phone that requires manual dial (TCPA).
 * Under TCPA, autodialing or using prerecorded messages to cell phones
 * requires prior express written consent.
 */
export async function requiresManualTouch(phoneNumber: string): Promise<boolean> {
  // Strip non-digits
  const digits = phoneNumber.replace(/\D/g, '');

  // Toll-free numbers don't require manual touch
  const areaCode = digits.length >= 10 ? digits.slice(digits.length - 10, digits.length - 7) : '';
  if (KNOWN_LANDLINE_PREFIXES.has(areaCode)) {
    return false;
  }

  // Check for existing express written consent
  const consent = await prisma.crmConsentRecord.findFirst({
    where: {
      phone: phoneNumber,
      type: 'express',
      revokedAt: null,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    },
  });

  // If express written consent exists, auto-dial is allowed
  if (consent) {
    return false;
  }

  // Default: treat as cell phone requiring manual touch
  // In production, integrate with Twilio Lookup API to determine phone type
  logger.debug('[tcpa] Manual touch required', { phoneNumber, reason: 'no_express_consent' });
  return true;
}

// ---------------------------------------------------------------------------
// Enforce Manual Touch
// ---------------------------------------------------------------------------

/**
 * Switch a campaign to manual touch mode, preventing autodialer usage.
 */
export async function enforceManualTouch(campaignId: string): Promise<{ affected: number }> {
  const campaign = await prisma.crmCampaign.findUnique({
    where: { id: campaignId },
    select: { id: true, targetCriteria: true },
  });

  if (!campaign) {
    throw new Error(`Campaign ${campaignId} not found`);
  }

  // Store manual touch flag in campaign metadata
  const existing = (campaign.targetCriteria || {}) as Record<string, unknown>;
  await prisma.crmCampaign.update({
    where: { id: campaignId },
    data: {
      targetCriteria: JSON.parse(JSON.stringify({
        ...existing,
        _manualTouchMode: true,
        _manualTouchEnforcedAt: new Date().toISOString(),
      })),
    },
  });

  // Count contacts that will be affected
  const activities = await prisma.crmCampaignActivity.count({
    where: { campaignId, status: 'pending' },
  });

  logger.info('[tcpa] Manual touch enforced', {
    event: 'tcpa_manual_touch_enforced',
    campaignId,
    affectedContacts: activities,
  });

  return { affected: activities };
}

// ---------------------------------------------------------------------------
// Log Manual Consent
// ---------------------------------------------------------------------------

/**
 * Record that an agent confirmed consent before manually dialing a number.
 */
export async function logManualConsent(
  agentId: string,
  phone: string,
  consentType: 'verbal' | 'written' | 'express_written'
): Promise<void> {
  // Map consent types
  const typeMap: Record<string, string> = {
    verbal: 'implied',
    written: 'express',
    express_written: 'express',
  };

  await prisma.crmConsentRecord.create({
    data: {
      phone,
      channel: 'PHONE',
      type: typeMap[consentType] || 'implied',
      source: 'verbal',
      grantedAt: new Date(),
      notes: `Manual consent logged by agent. Type: ${consentType}`,
      userId: agentId,
    },
  });

  logger.info('[tcpa] Manual consent logged', {
    event: 'tcpa_manual_consent_logged',
    agentId,
    phone,
    consentType,
  });
}

// ---------------------------------------------------------------------------
// Get Manual Touch Stats
// ---------------------------------------------------------------------------

/**
 * Get manual vs auto-dial statistics for a campaign.
 */
export async function getManualTouchStats(campaignId: string): Promise<ManualTouchStats> {
  const campaign = await prisma.crmCampaign.findUnique({
    where: { id: campaignId },
    select: { id: true, targetCriteria: true },
  });

  if (!campaign) {
    throw new Error(`Campaign ${campaignId} not found`);
  }

  // Get distinct contacts in the campaign
  const activities = await prisma.crmCampaignActivity.findMany({
    where: { campaignId },
    select: { leadId: true },
    distinct: ['leadId'],
  });

  const leadIds = activities.map((a) => a.leadId);

  // Get phone numbers for leads
  const leads = await prisma.crmLead.findMany({
    where: { id: { in: leadIds } },
    select: { id: true, phone: true },
  });

  let manualRequired = 0;
  let autoDialAllowed = 0;

  for (const lead of leads) {
    if (lead.phone) {
      const manual = await requiresManualTouch(lead.phone);
      if (manual) manualRequired++;
      else autoDialAllowed++;
    }
  }

  // Count consent records for this campaign's contacts
  const phones = leads.filter((l) => l.phone).map((l) => l.phone!);
  const consentsLogged = phones.length > 0
    ? await prisma.crmConsentRecord.count({
        where: {
          phone: { in: phones },
          channel: 'PHONE',
        },
      })
    : 0;

  const totalContacts = leads.length;
  const manualPercent = totalContacts > 0
    ? Math.round((manualRequired / totalContacts) * 100)
    : 0;

  return {
    campaignId,
    totalContacts,
    manualRequired,
    autoDialAllowed,
    consentsLogged,
    manualPercent,
  };
}
