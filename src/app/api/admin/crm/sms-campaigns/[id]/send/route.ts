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
  const { id } = params;

  const campaign = await prisma.smsCampaign.findUnique({
    where: { id },
    select: { id: true, status: true, name: true },
  });

  if (!campaign) {
    return apiError('Campaign not found', ErrorCode.RESOURCE_NOT_FOUND, { request });
  }

  // Only DRAFT or SCHEDULED campaigns can be sent
  if (campaign.status !== 'DRAFT' && campaign.status !== 'SCHEDULED') {
    return apiError(
      `Cannot send campaign with status ${campaign.status}. Must be DRAFT or SCHEDULED.`,
      ErrorCode.VALIDATION_ERROR,
      { status: 400, request }
    );
  }

  const updated = await prisma.smsCampaign.update({
    where: { id },
    data: {
      status: 'SENDING',
      startedAt: new Date(),
    },
    include: {
      template: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });

  return apiSuccess(updated, { request });
});
