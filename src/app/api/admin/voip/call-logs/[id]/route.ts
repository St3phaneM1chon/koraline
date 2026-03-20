export const dynamic = 'force-dynamic';

/**
 * Call Log Detail API
 * GET  /api/admin/voip/call-logs/[id] — Returns single call with full details + cross-module bridges
 * PATCH /api/admin/voip/call-logs/[id] — Disposition / wrap-up: update notes, disposition, tags
 *
 * Cross-module bridges:
 *   - Bridge #8:  Telephony → CRM (deals of the caller/client)
 *   - Bridge #13: Telephony → Commerce (recent orders of the client)
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAdminGuard } from '@/lib/admin-api-guard';
import { prisma } from '@/lib/db';
import { apiSuccess, apiError } from '@/lib/api-response';
import { ErrorCode } from '@/lib/error-codes';
import { getModuleFlags } from '@/lib/module-flags';
import { logger } from '@/lib/logger';
import { createPostCallActivity } from '@/lib/voip/crm-integration';

// ── Zod schema for PATCH disposition/wrap-up ──

const VALID_DISPOSITIONS = [
  'resolved',
  'callback_needed',
  'escalated',
  'sale',
  'complaint',
  'information',
  'spam',
] as const;

const dispositionSchema = z.object({
  disposition: z.enum(VALID_DISPOSITIONS).optional(),
  agentNotes: z.string().max(5000).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
});

export const GET = withAdminGuard(async (
  request: NextRequest,
  { params }: { session: unknown; params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;

    const call = await prisma.callLog.findUnique({
      where: { id },
      include: {
        phoneNumber: { select: { number: true, displayName: true } },
        agent: {
          select: {
            extension: true,
            user: { select: { id: true, name: true, email: true } },
          },
        },
        client: { select: { id: true, name: true, email: true, phone: true } },
        recording: { select: { id: true, isUploaded: true, durationSec: true, blobUrl: true } },
        survey: true,
        transcription: { select: { id: true, fullText: true, sentiment: true, summary: true } },
      },
    });

    if (!call) {
      return apiError('Call not found', ErrorCode.NOT_FOUND, { request });
    }

    // ── Cross-module bridges ──
    const flags = call.clientId
      ? await getModuleFlags(['crm', 'ecommerce'])
      : { crm: false, ecommerce: false };

    // Bridge #8: Telephony → CRM (deals of the client)
    let crmDeals: Array<{
      id: string; title: string; stageName: string; stageColor: string | null; value: number;
    }> | null = null;

    if (call.clientId && flags.crm) {
      const deals = await prisma.crmDeal.findMany({
        where: { contactId: call.clientId },
        take: 5,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          title: true,
          value: true,
          stage: { select: { name: true, color: true } },
        },
      });
      crmDeals = deals.map((d) => ({
        id: d.id,
        title: d.title,
        stageName: d.stage.name,
        stageColor: d.stage.color,
        value: Number(d.value),
      }));
    }

    // Bridge #13: Telephony → Commerce (recent orders of the client)
    let recentOrders: Array<{
      id: string; orderNumber: string; status: string; total: number; createdAt: Date;
    }> | null = null;

    if (call.clientId && flags.ecommerce) {
      const orders = await prisma.order.findMany({
        where: { userId: call.clientId },
        take: 3,
        orderBy: { createdAt: 'desc' },
        select: { id: true, orderNumber: true, status: true, total: true, createdAt: true },
      });
      recentOrders = orders.map((o) => ({ ...o, total: Number(o.total) }));
    }

    return apiSuccess({ ...call, crmDeals, recentOrders }, { request });
  } catch (error) {
    logger.error('[voip/call-logs/[id]] GET error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return apiError('Failed to fetch call detail', ErrorCode.INTERNAL_ERROR, { request });
  }
});

// ── PATCH — Disposition / Wrap-up ──────────────────────

export const PATCH = withAdminGuard(async (
  request: NextRequest,
  { params }: { session: unknown; params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;

    // Parse and validate input
    const body = await request.json();
    const parsed = dispositionSchema.safeParse(body);

    if (!parsed.success) {
      return apiError('Validation failed', ErrorCode.VALIDATION_ERROR, {
        request,
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const { disposition, agentNotes, tags } = parsed.data;

    // Verify the call log exists
    const existing = await prisma.callLog.findUnique({
      where: { id },
      select: {
        id: true,
        clientId: true,
        agentId: true,
        callerNumber: true,
        calledNumber: true,
        direction: true,
        duration: true,
        status: true,
        agentNotes: true,
        disposition: true,
        tags: true,
      },
    });

    if (!existing) {
      return apiError('Call not found', ErrorCode.NOT_FOUND, { request });
    }

    // Build update data — only include provided fields
    const updateData: Record<string, unknown> = {};
    if (disposition !== undefined) updateData.disposition = disposition;
    if (agentNotes !== undefined) updateData.agentNotes = agentNotes;
    if (tags !== undefined) updateData.tags = tags;

    if (Object.keys(updateData).length === 0) {
      return apiError('No fields to update', ErrorCode.VALIDATION_ERROR, { request });
    }

    // Update the CallLog
    const updated = await prisma.callLog.update({
      where: { id },
      data: updateData,
      include: {
        phoneNumber: { select: { number: true, displayName: true } },
        agent: {
          select: {
            extension: true,
            user: { select: { id: true, name: true, email: true } },
          },
        },
        client: { select: { id: true, name: true, email: true, phone: true } },
        recording: { select: { id: true, isUploaded: true, durationSec: true, blobUrl: true } },
        transcription: { select: { id: true, fullText: true, sentiment: true, summary: true } },
      },
    });

    // Resolve the agent's user ID from SipExtension (for workflow assignment)
    let agentUserId: string | null = null;
    if (existing.agentId) {
      const ext = await prisma.sipExtension.findUnique({
        where: { id: existing.agentId },
        select: { userId: true },
      });
      agentUserId = ext?.userId || null;
    }

    // Trigger post-call workflow based on the new disposition (non-blocking)
    if (disposition) {
      const { executePostCallWorkflow } = await import('@/lib/voip/post-call-workflow');
      executePostCallWorkflow({
        callLogId: id,
        clientId: existing.clientId,
        agentUserId,
        disposition,
        agentNotes: agentNotes ?? existing.agentNotes,
        callerNumber: existing.callerNumber,
        calledNumber: existing.calledNumber,
        duration: existing.duration,
        status: existing.status,
        tags: tags ?? existing.tags,
      }).catch((err) => {
        logger.warn('[voip/call-logs/[id]] Post-call workflow failed', {
          callLogId: id,
          disposition,
          error: err instanceof Error ? err.message : String(err),
        });
      });
    }

    // Re-create CRM Activity with updated disposition/notes (non-blocking)
    createPostCallActivity({
      id,
      clientId: existing.clientId,
      agentId: existing.agentId,
      direction: existing.direction,
      duration: existing.duration,
      status: existing.status,
      callerNumber: existing.callerNumber,
      calledNumber: existing.calledNumber,
      agentNotes: agentNotes ?? existing.agentNotes,
      disposition: disposition ?? existing.disposition,
      tags: tags ?? existing.tags,
    }).catch(() => {}); // Fire-and-forget

    logger.info('[voip/call-logs/[id]] PATCH — wrap-up saved', {
      callLogId: id,
      disposition,
      hasNotes: !!agentNotes,
      tagCount: tags?.length ?? 0,
    });

    return apiSuccess(updated, { request });
  } catch (error) {
    logger.error('[voip/call-logs/[id]] PATCH error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return apiError('Failed to update call log', ErrorCode.INTERNAL_ERROR, { request });
  }
});
