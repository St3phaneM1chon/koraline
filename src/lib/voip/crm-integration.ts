/**
 * CRM Integration — Screen Pop, Click-to-Call, Call History
 *
 * Features:
 * - Screen pop: match inbound caller to client record
 * - Click-to-call: initiate call from client profile
 * - Call history per client
 * - Contact notes and tags
 */

import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import * as telnyx from '@/lib/telnyx';

/**
 * Screen Pop: Find client by phone number on inbound call.
 * Returns client data for display in the agent interface.
 */
export async function screenPop(callerNumber: string): Promise<{
  found: boolean;
  client?: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    recentCalls: Array<{
      id: string;
      direction: string;
      status: string;
      startedAt: Date;
      duration: number | null;
    }>;
    recentOrders: Array<{
      id: string;
      status: string;
      total: number;
      createdAt: Date;
    }>;
    tags: string[];
    notes: string | null;
  };
}> {
  const normalized = normalizeForSearch(callerNumber);

  // Search by phone number (try multiple formats)
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { phone: callerNumber },
        { phone: normalized },
        { phone: callerNumber.replace(/^\+1/, '') },
        { phone: callerNumber.replace(/^\+/, '') },
      ],
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
    },
  });

  if (!user) {
    return { found: false };
  }

  // Fetch recent calls
  const recentCalls = await prisma.callLog.findMany({
    where: {
      OR: [
        { callerNumber: { contains: normalized } },
        { calledNumber: { contains: normalized } },
        { clientId: user.id },
      ],
    },
    select: {
      id: true,
      direction: true,
      status: true,
      startedAt: true,
      duration: true,
    },
    orderBy: { startedAt: 'desc' },
    take: 10,
  });

  // Fetch recent orders (if e-commerce)
  const recentOrders = await prisma.order.findMany({
    where: { userId: user.id },
    select: {
      id: true,
      status: true,
      total: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  return {
    found: true,
    client: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      recentCalls: recentCalls.map(c => ({
        ...c,
        direction: c.direction as string,
        status: c.status as string,
      })),
      recentOrders: recentOrders.map(o => ({
        id: o.id,
        status: o.status as string,
        total: Number(o.total),
        createdAt: o.createdAt,
      })),
      tags: [],
      notes: null,
    },
  };
}

/**
 * Click-to-Call: Initiate an outbound call to a client.
 */
export async function clickToCall(options: {
  clientId?: string;
  phoneNumber: string;
  agentUserId: string;
  callerIdNumber?: string;
}): Promise<{ callControlId?: string; error?: string }> {
  const connectionId = process.env.TELNYX_CONNECTION_ID || '';
  const from = options.callerIdNumber || process.env.TELNYX_DEFAULT_CALLER_ID || '';
  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/voip/webhooks/telnyx`;

  try {
    const result = await telnyx.dialCall({
      to: options.phoneNumber,
      from,
      connectionId,
      webhookUrl,
      clientState: JSON.stringify({
        clickToCall: true,
        clientId: options.clientId,
        agentUserId: options.agentUserId,
      }),
      timeout: 30,
    });

    const callControlId = (result as { data?: { call_control_id?: string } })
      ?.data?.call_control_id;

    logger.info('[CRM] Click-to-call initiated', {
      phone: options.phoneNumber,
      clientId: options.clientId,
      callControlId,
    });

    return { callControlId };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('[CRM] Click-to-call failed', { error: message });
    return { error: message };
  }
}

/**
 * Get full call history for a client.
 */
export async function getClientCallHistory(
  clientId: string,
  options?: { page?: number; limit?: number }
): Promise<{
  calls: Array<{
    id: string;
    direction: string;
    status: string;
    callerNumber: string;
    calledNumber: string;
    startedAt: Date;
    duration: number | null;
    agentNotes: string | null;
    disposition: string | null;
    hasRecording: boolean;
    hasTranscription: boolean;
  }>;
  total: number;
}> {
  const page = options?.page || 1;
  const limit = options?.limit || 20;

  const user = await prisma.user.findUnique({
    where: { id: clientId },
    select: { phone: true },
  });

  const where = {
    OR: [
      { clientId },
      ...(user?.phone ? [
        { callerNumber: user.phone },
        { calledNumber: user.phone },
      ] : []),
    ],
  };

  const [calls, total] = await Promise.all([
    prisma.callLog.findMany({
      where,
      include: {
        recording: { select: { id: true } },
        transcription: { select: { id: true } },
      },
      orderBy: { startedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.callLog.count({ where }),
  ]);

  return {
    calls: calls.map(c => ({
      id: c.id,
      direction: c.direction as string,
      status: c.status as string,
      callerNumber: c.callerNumber,
      calledNumber: c.calledNumber,
      startedAt: c.startedAt,
      duration: c.duration,
      agentNotes: c.agentNotes,
      disposition: c.disposition,
      hasRecording: !!c.recording,
      hasTranscription: !!c.transcription,
    })),
    total,
  };
}

/**
 * Link a call to a client record.
 */
export async function linkCallToClient(
  callLogId: string,
  clientId: string
): Promise<void> {
  await prisma.callLog.update({
    where: { id: callLogId },
    data: { clientId },
  });
}

/**
 * Add notes to a call log.
 */
export async function addCallNotes(
  callLogId: string,
  notes: string,
  disposition?: string,
  tags?: string[]
): Promise<void> {
  await prisma.callLog.update({
    where: { id: callLogId },
    data: {
      agentNotes: notes,
      ...(disposition ? { disposition } : {}),
      ...(tags ? { tags } : {}),
    },
  });
}

// ── Helpers ──────────────────

function normalizeForSearch(phone: string): string {
  return phone.replace(/\D/g, '').slice(-10);
}
