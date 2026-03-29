/**
 * Cross-Module Event Dispatcher
 *
 * Central event bus that connects all modules (commerce, LMS, booking,
 * membership, forms) to the workflow automation engine and accounting.
 *
 * Usage:
 *   import { dispatchModuleEvent } from '@/lib/events/cross-module-dispatcher';
 *   await dispatchModuleEvent({ type: 'ORDER_PAID', tenantId, entityId: orderId, data: { ... } });
 */

import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

export type ModuleEventType =
  | 'ORDER_CREATED'
  | 'ORDER_PAID'
  | 'BOOKING_CREATED'
  | 'BOOKING_CANCELLED'
  | 'BOOKING_PAID'
  | 'MEMBERSHIP_CREATED'
  | 'MEMBERSHIP_CANCELLED'
  | 'EVENT_REGISTRATION'
  | 'COURSE_ENROLLED'
  | 'FORM_SUBMITTED';

export interface ModuleEvent {
  type: ModuleEventType;
  tenantId: string;
  entityId: string;
  entityType?: string;
  userId?: string;
  data?: Record<string, unknown>;
}

/**
 * Dispatch a cross-module event.
 * 1. Log the event
 * 2. Check for matching CRM workflows → execute
 * 3. Trigger accounting entry if applicable
 */
export async function dispatchModuleEvent(event: ModuleEvent): Promise<void> {
  try {
    logger.info('Cross-module event dispatched', {
      type: event.type,
      tenantId: event.tenantId,
      entityId: event.entityId,
    });

    // 1. Find matching active CRM workflows for this trigger type
    const triggerType = event.type as string;
    const workflows = await prisma.crmWorkflow.findMany({
      where: {
        tenantId: event.tenantId,
        status: 'ACTIVE',
        triggerType: triggerType as never,
      },
      include: {
        steps: { orderBy: { position: 'asc' } },
      },
    });

    if (workflows.length > 0) {
      logger.info(`Found ${workflows.length} workflows for ${event.type}`, {
        tenantId: event.tenantId,
      });

      // Execute each workflow (fire-and-forget for non-blocking)
      for (const workflow of workflows) {
        try {
          // Dynamic import to avoid circular dependency
          const { processWorkflowTrigger } = await import('@/lib/crm/workflow-engine');
          await processWorkflowTrigger({
            type: triggerType as never,
            entityType: (event.entityType || 'deal') as 'lead' | 'deal',
            entityId: event.entityId,
            data: event.data,
            userId: event.userId,
          });
        } catch (wfError) {
          logger.error('Workflow execution failed', {
            workflowId: workflow.id,
            error: wfError instanceof Error ? wfError.message : String(wfError),
          });
        }
      }
    }

    // 2. Trigger accounting entry for payment events
    if (['BOOKING_PAID', 'COURSE_ENROLLED', 'MEMBERSHIP_CREATED'].includes(event.type)) {
      try {
        const { createAccountingEntryForTransaction } = await import(
          '@/lib/accounting/unified-accounting.service'
        );

        const typeMap: Record<string, 'booking' | 'course_order' | 'membership'> = {
          BOOKING_PAID: 'booking',
          COURSE_ENROLLED: 'course_order',
          MEMBERSHIP_CREATED: 'membership',
        };

        await createAccountingEntryForTransaction({
          type: typeMap[event.type],
          referenceId: event.entityId,
          tenantId: event.tenantId,
          amount: (event.data?.amount as number) || 0,
          currency: (event.data?.currency as string) || 'CAD',
          description: (event.data?.description as string) || event.type,
          stripePaymentIntentId: event.data?.stripePaymentIntentId as string | undefined,
          paidAt: new Date(),
        });
      } catch (accError) {
        logger.error('Auto-accounting failed for event', {
          type: event.type,
          error: accError instanceof Error ? accError.message : String(accError),
        });
      }
    }

    // 3. Log event for CRM analytics (deal auto-creation deferred to Phase 3)
    if (['ORDER_PAID', 'BOOKING_PAID'].includes(event.type)) {
      logger.info('Payment event logged for CRM', {
        type: event.type,
        tenantId: event.tenantId,
        entityId: event.entityId,
        amount: event.data?.amount,
      });
    }
  } catch (error) {
    logger.error('Cross-module event dispatch failed', {
      type: event.type,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
