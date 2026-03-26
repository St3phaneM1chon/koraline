export const dynamic = 'force-dynamic';

/**
 * CRM SMS Campaign Send API
 * POST /api/admin/crm/sms-campaigns/[id]/send - Start sending a campaign
 */

import { NextRequest } from 'next/server';
import { withAdminGuard } from '@/lib/admin-api-guard';
import { prisma } from '@/lib/db';
import { apiSuccess, apiError } from '@/lib/api-response';
import { ErrorCode } from '@/lib/error-codes';

// ---------------------------------------------------------------------------
// POST: Start sending a campaign
// ---------------------------------------------------------------------------

export const POST = withAdminGuard(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const { id } = params;

    // CRM-F14 FIX: Atomic status check + update to prevent TOCTOU race (double send)
    const { count } = await prisma.smsCampaign.updateMany({
      where: { id, status: { in: ['DRAFT', 'SCHEDULED'] } },
      data: { status: 'SENDING', startedAt: new Date() },
    });

    if (count === 0) {
      const campaign = await prisma.smsCampaign.findUnique({ where: { id }, select: { status: true } });
      if (!campaign) return apiError('Campaign not found', ErrorCode.RESOURCE_NOT_FOUND, { request });
      return apiError(`Cannot send campaign with status ${campaign.status}`, ErrorCode.VALIDATION_ERROR, { status: 400, request });
    }

    const updated = await prisma.smsCampaign.findUnique({
      where: { id },
      include: {
        template: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    return apiSuccess(updated, { request });
  } catch (error) {
    const logger = await import('@/lib/logger').then(m => m.logger);
    logger.error('[SMS Campaign Send] Error starting campaign send', {
      error: error instanceof Error ? error.message : String(error),
    });
    return apiError('Failed to start campaign send', ErrorCode.INTERNAL_ERROR, { status: 500, request });
  }
}, { requiredPermission: 'crm.campaigns.manage' });
