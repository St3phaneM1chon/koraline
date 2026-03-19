/**
 * Post-Call Workflow Engine
 *
 * Automatically triggers CRM actions based on call disposition:
 * - resolved    → Close open InboxConversation tickets for the client
 * - callback    → Create CrmTask "Rappeler [caller]" due in 24h
 * - escalated   → Create high-priority CrmTask assigned to OWNER
 * - sale/vente  → Create CrmDeal in default pipeline if none exists
 * - complaint   → Create HIGH CrmTask + open InboxConversation (PHONE)
 * - spam        → Add caller to internal DNCL
 *
 * This module is non-blocking: errors are logged but never thrown.
 */

import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

export interface PostCallContext {
  callLogId: string;
  clientId?: string | null;
  agentUserId?: string | null;
  disposition?: string | null;
  agentNotes?: string | null;
  callerNumber: string;
  calledNumber: string;
  duration?: number | null;
  status: string;
  tags?: string[];
}

/**
 * Execute post-call workflow based on disposition.
 * Non-blocking — errors are logged but never thrown.
 */
export async function executePostCallWorkflow(ctx: PostCallContext): Promise<void> {
  if (!ctx.disposition) return;

  try {
    const disposition = ctx.disposition.toLowerCase();

    switch (disposition) {
      case 'resolved':
        await handleResolved(ctx);
        break;
      case 'callback_needed':
      case 'callback':
        await handleCallbackNeeded(ctx);
        break;
      case 'escalated':
      case 'escalation':
        await handleEscalated(ctx);
        break;
      case 'sale':
      case 'vente':
      case 'interested':
        await handleSale(ctx);
        break;
      case 'complaint':
      case 'plainte':
        await handleComplaint(ctx);
        break;
      case 'information':
      case 'info':
        // No additional action needed — CRM Activity already created by crm-integration.ts
        break;
      case 'spam':
      case 'do_not_call':
        await handleSpam(ctx);
        break;
      default:
        logger.debug('[PostCallWorkflow] No workflow for disposition', { disposition });
    }
  } catch (error) {
    logger.error('[PostCallWorkflow] Failed', {
      callLogId: ctx.callLogId,
      disposition: ctx.disposition,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

// ── Disposition Handlers ─────────────────────────

async function handleResolved(ctx: PostCallContext): Promise<void> {
  if (!ctx.clientId) return;

  // Close any open InboxConversation tickets for this client
  const openConversations = await prisma.inboxConversation.findMany({
    where: { contactId: ctx.clientId, status: 'OPEN' },
    select: { id: true },
  });

  for (const conv of openConversations) {
    await prisma.inboxConversation.update({
      where: { id: conv.id },
      data: { status: 'CLOSED' },
    });
  }

  if (openConversations.length > 0) {
    logger.info('[PostCallWorkflow] Closed conversations on resolve', {
      callLogId: ctx.callLogId,
      conversationsClosed: openConversations.length,
    });
  }
}

async function handleCallbackNeeded(ctx: PostCallContext): Promise<void> {
  if (!ctx.agentUserId) return;

  await prisma.crmTask.create({
    data: {
      title: `Rappeler ${ctx.callerNumber}`,
      description: ctx.agentNotes
        || `Suite à l'appel du ${new Date().toLocaleDateString('fr-CA')}. Rappel demandé.`,
      type: 'CALL',
      priority: 'MEDIUM',
      status: 'PENDING',
      assignedToId: ctx.agentUserId,
      contactId: ctx.clientId || undefined,
      dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // +24h
    },
  });

  logger.info('[PostCallWorkflow] Callback task created', {
    callLogId: ctx.callLogId,
    assignedTo: ctx.agentUserId,
  });
}

async function handleEscalated(ctx: PostCallContext): Promise<void> {
  // Find an OWNER to assign the escalation
  const supervisor = await prisma.user.findFirst({
    where: { role: 'OWNER' },
    select: { id: true },
  });

  const assigneeId = supervisor?.id || ctx.agentUserId;
  if (!assigneeId) {
    logger.warn('[PostCallWorkflow] Escalation skipped — no OWNER or agent found', {
      callLogId: ctx.callLogId,
    });
    return;
  }

  await prisma.crmTask.create({
    data: {
      title: `ESCALADE: ${ctx.callerNumber}`,
      description: `Appel escaladé par l'agent.\n${ctx.agentNotes || 'Aucune note.'}\nDurée: ${ctx.duration || 0}s`,
      type: 'CALL',
      priority: 'HIGH',
      status: 'PENDING',
      assignedToId: assigneeId,
      contactId: ctx.clientId || undefined,
      dueAt: new Date(Date.now() + 4 * 60 * 60 * 1000), // +4h urgence
    },
  });

  logger.info('[PostCallWorkflow] Escalation task created', {
    callLogId: ctx.callLogId,
    assignedTo: assigneeId,
  });
}

async function handleSale(ctx: PostCallContext): Promise<void> {
  if (!ctx.clientId) return;

  // Check if there's already an active deal for this client in the default pipeline
  const existingDeal = await prisma.crmDeal.findFirst({
    where: {
      contactId: ctx.clientId,
      pipeline: { isDefault: true },
    },
    select: { id: true },
  });

  if (existingDeal) {
    logger.debug('[PostCallWorkflow] Deal already exists for client, skipping creation', {
      callLogId: ctx.callLogId,
      clientId: ctx.clientId,
      dealId: existingDeal.id,
    });
    return;
  }

  // Find the first stage in the default pipeline (lowest position)
  const firstStage = await prisma.crmPipelineStage.findFirst({
    where: { pipeline: { isDefault: true } },
    orderBy: { position: 'asc' },
    select: { id: true, pipelineId: true },
  });

  if (!firstStage) {
    logger.warn('[PostCallWorkflow] No default pipeline found, cannot create deal', {
      callLogId: ctx.callLogId,
    });
    return;
  }

  // assignedToId is required on CrmDeal — use agent or find an OWNER
  const assigneeId = ctx.agentUserId
    || (await prisma.user.findFirst({ where: { role: 'OWNER' }, select: { id: true } }))?.id;

  if (!assigneeId) {
    logger.warn('[PostCallWorkflow] No assignee found for deal creation', {
      callLogId: ctx.callLogId,
    });
    return;
  }

  await prisma.crmDeal.create({
    data: {
      title: `Vente téléphonique — ${ctx.callerNumber}`,
      contactId: ctx.clientId,
      assignedToId: assigneeId,
      stageId: firstStage.id,
      pipelineId: firstStage.pipelineId,
      value: 0, // To be filled by agent in CRM
      currency: 'CAD',
    },
  });

  logger.info('[PostCallWorkflow] Deal created from sale call', {
    callLogId: ctx.callLogId,
    clientId: ctx.clientId,
  });
}

async function handleComplaint(ctx: PostCallContext): Promise<void> {
  // Find an OWNER for assignment
  const supervisor = await prisma.user.findFirst({
    where: { role: 'OWNER' },
    select: { id: true },
  });

  const assigneeId = supervisor?.id || ctx.agentUserId;

  // Create high-priority CRM task
  if (assigneeId) {
    await prisma.crmTask.create({
      data: {
        title: `PLAINTE: ${ctx.callerNumber}`,
        description: `Plainte client reçue par téléphone.\n${ctx.agentNotes || 'Aucune note.'}\nDurée: ${ctx.duration || 0}s`,
        type: 'CALL',
        priority: 'HIGH',
        status: 'PENDING',
        assignedToId: assigneeId,
        contactId: ctx.clientId || undefined,
        dueAt: new Date(Date.now() + 8 * 60 * 60 * 1000), // +8h
      },
    });
  }

  // Create InboxConversation (support ticket) if client is identified
  if (ctx.clientId) {
    await prisma.inboxConversation.create({
      data: {
        contactId: ctx.clientId,
        assignedToId: supervisor?.id || undefined,
        channel: 'PHONE',
        subject: `Plainte téléphonique — ${new Date().toLocaleDateString('fr-CA')}`,
        status: 'OPEN',
      },
    });
  }

  logger.info('[PostCallWorkflow] Complaint task + ticket created', {
    callLogId: ctx.callLogId,
  });
}

async function handleSpam(ctx: PostCallContext): Promise<void> {
  try {
    const { addToDncl } = await import('./dncl');
    await addToDncl(
      ctx.callerNumber,
      `Spam — appel du ${new Date().toISOString()}`,
    );
    logger.info('[PostCallWorkflow] Spam caller added to DNCL', {
      callerNumber: ctx.callerNumber,
    });
  } catch (error) {
    logger.warn('[PostCallWorkflow] Failed to add spam caller to DNCL', {
      callerNumber: ctx.callerNumber,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
