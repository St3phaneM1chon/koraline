/**
 * CRM Disposition Triggers - D18
 *
 * Triggers automated actions when a call disposition is recorded.
 * Actions: send SMS, send email, create task, update lead status,
 * schedule callback, add to DNC list.
 */

import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TriggerAction = 'SEND_SMS' | 'SEND_EMAIL' | 'CREATE_TASK' | 'UPDATE_LEAD_STATUS' | 'SCHEDULE_CALLBACK' | 'ADD_TO_DNC';

export interface DispositionTrigger {
  id: string;
  campaignId: string;
  disposition: string;
  action: TriggerAction;
  config: Record<string, unknown>;
  isActive: boolean;
}

export interface TriggerResult { triggerId: string; action: TriggerAction; success: boolean; message: string; }

// ---------------------------------------------------------------------------
// getDispositionTriggers
// ---------------------------------------------------------------------------

export async function getDispositionTriggers(campaignId: string): Promise<DispositionTrigger[]> {
  const campaign = await prisma.crmCampaign.findUnique({ where: { id: campaignId }, select: { targetCriteria: true } });
  const meta = (campaign?.targetCriteria as Record<string, unknown>) || {};
  return (meta.dispositionTriggers as DispositionTrigger[]) || [];
}

// ---------------------------------------------------------------------------
// createDispositionTrigger
// ---------------------------------------------------------------------------

export async function createDispositionTrigger(config: {
  campaignId: string; disposition: string; action: TriggerAction; actionConfig: Record<string, unknown>;
}): Promise<DispositionTrigger> {
  const campaign = await prisma.crmCampaign.findUniqueOrThrow({ where: { id: config.campaignId }, select: { targetCriteria: true } });
  const meta = (campaign.targetCriteria as Record<string, unknown>) || {};
  const existing = (meta.dispositionTriggers as DispositionTrigger[]) || [];
  const trigger: DispositionTrigger = {
    // CRM-F12 FIX: Use crypto.randomUUID() instead of Math.random()
    id: `trig-${require('crypto').randomUUID().slice(0, 12)}`,
    campaignId: config.campaignId, disposition: config.disposition.toUpperCase(),
    action: config.action, config: config.actionConfig, isActive: true,
  };
  existing.push(trigger);
  meta.dispositionTriggers = existing;
  await prisma.crmCampaign.update({ where: { id: config.campaignId }, data: { targetCriteria: meta as unknown as Prisma.InputJsonValue } });
  logger.info('Disposition trigger: created', { event: 'disposition_trigger_created', campaignId: config.campaignId, disposition: trigger.disposition, action: trigger.action });
  return trigger;
}

// ---------------------------------------------------------------------------
// processDisposition
// ---------------------------------------------------------------------------

export async function processDisposition(callLogId: string, disposition: string): Promise<TriggerResult[]> {
  const results: TriggerResult[] = [];
  const activity = await prisma.crmCampaignActivity.findFirst({ where: { callLogId }, select: { campaignId: true, leadId: true } });
  if (!activity) return results;

  const triggers = await getDispositionTriggers(activity.campaignId);
  const matching = triggers.filter((t) => t.disposition === disposition.toUpperCase() && t.isActive);

  for (const trigger of matching) {
    const result = await executeAction(trigger, activity.leadId);
    results.push(result);
  }
  if (matching.length > 0) {
    logger.info('Disposition trigger: processed', { event: 'disposition_triggers_processed', callLogId, disposition, count: matching.length });
  }
  return results;
}

// ---------------------------------------------------------------------------
// Action executor
// ---------------------------------------------------------------------------

async function executeAction(trigger: DispositionTrigger, leadId: string): Promise<TriggerResult> {
  const base = { triggerId: trigger.id, action: trigger.action };
  try {
    switch (trigger.action) {
      case 'SEND_SMS':
      case 'SEND_EMAIL': {
        const type = trigger.action === 'SEND_SMS' ? 'SMS' : 'EMAIL';
        await prisma.crmActivity.create({
          data: { type, title: `Auto ${type} on disposition`, description: (trigger.config.message as string) || 'Automated', leadId,
            metadata: { automated: true, triggerId: trigger.id } as unknown as Prisma.InputJsonValue },
        });
        return { ...base, success: true, message: `${type} activity created` };
      }
      case 'CREATE_TASK': {
        const lead = await prisma.crmLead.findUnique({ where: { id: leadId }, select: { assignedToId: true } });
        await prisma.crmTask.create({
          data: { title: (trigger.config.taskTitle as string) || 'Follow up', type: 'FOLLOW_UP', priority: 'MEDIUM', status: 'PENDING',
            dueAt: new Date(Date.now() + ((trigger.config.dueDays as number) || 1) * 86_400_000), leadId,
            assignedToId: lead?.assignedToId || (trigger.config.assignedToId as string) || 'system' },
        });
        return { ...base, success: true, message: 'Task created' };
      }
      case 'UPDATE_LEAD_STATUS': {
        const s = trigger.config.status as string;
        if (!s) return { ...base, success: false, message: 'No target status' };
        await prisma.crmLead.update({ where: { id: leadId }, data: { status: s as 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'UNQUALIFIED' | 'CONVERTED' | 'LOST' } });
        return { ...base, success: true, message: `Status -> ${s}` };
      }
      case 'SCHEDULE_CALLBACK': {
        const h = (trigger.config.delayHours as number) || 24;
        await prisma.crmCampaignActivity.create({
          data: { campaignId: trigger.campaignId, leadId, channel: 'call', status: 'pending', disposition: 'CALLBACK', scheduledAt: new Date(Date.now() + h * 3_600_000) },
        });
        return { ...base, success: true, message: `Callback in ${h}h` };
      }
      case 'ADD_TO_DNC': {
        const lead = await prisma.crmLead.findUnique({ where: { id: leadId }, select: { phone: true } });
        if (!lead?.phone) return { ...base, success: false, message: 'No phone' };
        await prisma.smsOptOut.upsert({ where: { phone: lead.phone }, create: { phone: lead.phone, reason: `Disposition: ${trigger.disposition}` }, update: { reason: `Disposition: ${trigger.disposition}` } });
        await prisma.crmLead.update({ where: { id: leadId }, data: { dncStatus: 'INTERNAL_DNC' } });
        return { ...base, success: true, message: 'Added to DNC' };
      }
      default: return { ...base, success: false, message: `Unknown action: ${trigger.action}` };
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error('Disposition trigger: action failed', { triggerId: trigger.id, action: trigger.action, error: msg });
    return { ...base, success: false, message: msg };
  }
}
