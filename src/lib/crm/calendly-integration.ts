/**
 * CRM Calendly Integration (M15)
 *
 * Calendly scheduling integration for CRM meetings.
 * - handleCalendlyWebhook: Process booking/cancellation webhooks
 * - getCalendlyEmbedUrl: Get agent's Calendly embed URL
 * - syncCalendlyBooking: Create CRM task/activity from Calendly booking
 */

import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CalendlyEvent {
  event: string; // 'invitee.created' | 'invitee.canceled'
  payload: {
    event: string;        // Calendly event URI
    invitee: {
      name: string;
      email: string;
      timezone?: string;
    };
    event_type: {
      name: string;
      duration: number;
    };
    scheduled_event: {
      uri: string;
      name: string;
      start_time: string;
      end_time: string;
      location?: {
        type: string;
        location?: string;
        join_url?: string;
      };
    };
    tracking?: {
      utm_source?: string;
      utm_medium?: string;
      utm_campaign?: string;
    };
  };
}

// ---------------------------------------------------------------------------
// Handle Calendly Webhook
// ---------------------------------------------------------------------------

/**
 * Process Calendly webhook events: booking created or cancelled.
 */
export async function handleCalendlyWebhook(event: CalendlyEvent): Promise<void> {
  const { payload } = event;

  logger.info('[calendly] Webhook received', {
    event: event.event,
    inviteeEmail: payload.invitee.email,
    eventName: payload.scheduled_event.name,
  });

  switch (event.event) {
    case 'invitee.created': {
      await syncCalendlyBooking(event);
      break;
    }
    case 'invitee.canceled': {
      // Find and cancel the CRM task
      const startTime = new Date(payload.scheduled_event.start_time);
      const task = await prisma.crmTask.findFirst({
        where: {
          title: { contains: payload.scheduled_event.name },
          dueAt: startTime,
          type: 'MEETING',
        },
      });

      if (task) {
        await prisma.crmTask.update({
          where: { id: task.id },
          data: { status: 'CANCELLED' },
        });
        logger.info('[calendly] Meeting cancelled', { taskId: task.id });
      }
      break;
    }
    default:
      logger.info('[calendly] Unhandled event type', { event: event.event });
  }
}

// ---------------------------------------------------------------------------
// Get Calendly Embed URL
// ---------------------------------------------------------------------------

/**
 * Get an agent's Calendly embed URL from their user profile settings.
 * Expects the URL to be stored in user.customFields or a settings table.
 */
export async function getCalendlyEmbedUrl(agentId: string): Promise<string | null> {
  // Check for stored Calendly URL in user settings
  const setting = await prisma.siteSetting.findFirst({
    where: {
      key: `calendly_url_${agentId}`,
    },
    select: { value: true },
  });

  if (setting?.value) {
    return setting.value;
  }

  // Fallback: check global Calendly URL
  const globalSetting = await prisma.siteSetting.findFirst({
    where: { key: 'calendly_default_url' },
    select: { value: true },
  });

  return globalSetting?.value || null;
}

// ---------------------------------------------------------------------------
// Sync Calendly Booking
// ---------------------------------------------------------------------------

/**
 * Create a CRM task and activity from a Calendly booking event.
 */
export async function syncCalendlyBooking(event: CalendlyEvent): Promise<void> {
  const { payload } = event;
  const startTime = new Date(payload.scheduled_event.start_time);

  // Try to find the lead by email
  const lead = await prisma.crmLead.findFirst({
    where: { email: payload.invitee.email },
    select: { id: true, assignedToId: true },
  });

  // Determine assignee: lead's assigned agent or first admin
  let assignedToId = lead?.assignedToId;

  if (!assignedToId) {
    const admin = await prisma.user.findFirst({
      where: { role: 'OWNER' },
      select: { id: true },
    });
    assignedToId = admin?.id;
  }

  if (!assignedToId) {
    logger.warn('[calendly] No assignee found for booking', {
      inviteeEmail: payload.invitee.email,
    });
    return;
  }

  // Create CRM task for the meeting
  const task = await prisma.crmTask.create({
    data: {
      title: `Calendly: ${payload.scheduled_event.name} - ${payload.invitee.name}`,
      description: [
        `Invitee: ${payload.invitee.name} (${payload.invitee.email})`,
        `Duration: ${payload.event_type.duration} min`,
        payload.scheduled_event.location?.join_url
          ? `Join URL: ${payload.scheduled_event.location.join_url}`
          : null,
        payload.invitee.timezone
          ? `Timezone: ${payload.invitee.timezone}`
          : null,
      ].filter(Boolean).join('\n'),
      type: 'MEETING',
      priority: 'HIGH',
      status: 'PENDING',
      dueAt: startTime,
      assignedToId,
      leadId: lead?.id || null,
    },
  });

  // Log activity
  await prisma.crmActivity.create({
    data: {
      type: 'MEETING',
      title: `Calendly booking: ${payload.scheduled_event.name}`,
      description: `Meeting scheduled with ${payload.invitee.name} (${payload.invitee.email})`,
      metadata: {
        source: 'calendly',
        calendlyEventUri: payload.scheduled_event.uri,
        duration: payload.event_type.duration,
        inviteeEmail: payload.invitee.email,
      } as unknown as Prisma.InputJsonValue,
      leadId: lead?.id || null,
      performedById: assignedToId,
    },
  });

  logger.info('[calendly] Booking synced to CRM', {
    event: 'calendly_booking_synced',
    taskId: task.id,
    leadId: lead?.id,
    inviteeEmail: payload.invitee.email,
    startTime: startTime.toISOString(),
  });
}
