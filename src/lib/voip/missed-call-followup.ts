/**
 * Missed Call Follow-up — Automatically sends SMS and creates CRM tasks for missed calls.
 *
 * When an inbound call is missed (no answer, no voicemail), this module:
 * 1. Creates a CRM callback task assigned to the first available agent
 * 2. Schedules an SMS follow-up after 5 minutes via Telnyx Messaging API
 *
 * Called from call-control.ts handleCallHangup() for MISSED calls without voicemail.
 */

import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

/**
 * Handle a missed call — schedule follow-up actions.
 * Called from call-control.ts when a call ends with status MISSED and no voicemail.
 */
export async function handleMissedCallFollowup(callLog: {
  id: string;
  callerNumber: string;
  calledNumber: string;
  clientId?: string | null;
  direction: string;
}): Promise<void> {
  // Only follow up on inbound missed calls
  if (callLog.direction !== 'INBOUND') return;

  // Don't follow up unknown/blocked numbers
  if (
    !callLog.callerNumber ||
    callLog.callerNumber === 'anonymous' ||
    callLog.callerNumber === 'unknown'
  ) {
    return;
  }

  try {
    // 1. Create a CRM task for the agent to call back
    const agent = await prisma.user.findFirst({
      where: { role: { in: ['OWNER', 'EMPLOYEE'] } },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });

    if (agent) {
      // Check if a callback task already exists for this number today
      const existingTask = await prisma.crmTask.findFirst({
        where: {
          title: { contains: callLog.callerNumber },
          status: 'PENDING',
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      });

      if (!existingTask) {
        await prisma.crmTask.create({
          data: {
            title: `Appel manqué: ${callLog.callerNumber}`,
            description:
              `Appel entrant manqué le ${new Date().toLocaleString('fr-CA')}. ` +
              `Aucun message vocal laissé. Rappeler le client.`,
            type: 'CALL',
            priority: 'MEDIUM',
            status: 'PENDING',
            assignedToId: agent.id,
            ...(callLog.clientId ? { contactId: callLog.clientId } : {}),
            dueAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // Due in 2h
          },
        });

        logger.info('[MissedCallFollowup] Callback task created', {
          callLogId: callLog.id,
          callerNumber: callLog.callerNumber,
          assignedToId: agent.id,
        });
      } else {
        logger.debug('[MissedCallFollowup] Callback task already exists, skipping', {
          callerNumber: callLog.callerNumber,
          existingTaskId: existingTask.id,
        });
      }
    }

    // 2. Schedule SMS follow-up (5 min delay)
    setTimeout(async () => {
      try {
        await sendFollowUpSMS(callLog.callerNumber, callLog.calledNumber);
      } catch (err) {
        logger.warn('[MissedCallFollowup] SMS follow-up failed', {
          callerNumber: callLog.callerNumber,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }, 5 * 60 * 1000); // 5 minutes delay

    logger.info('[MissedCallFollowup] Follow-up scheduled', {
      callLogId: callLog.id,
      callerNumber: callLog.callerNumber,
      smsDelayMinutes: 5,
    });
  } catch (error) {
    logger.error('[MissedCallFollowup] Failed to process missed call', {
      callLogId: callLog.id,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Send a follow-up SMS to the missed caller via Telnyx Messaging API.
 */
async function sendFollowUpSMS(toNumber: string, fromNumber: string): Promise<void> {
  const message =
    'Bonjour, nous avons manqué votre appel chez Attitudes VIP. ' +
    'Nous vous rappellerons dans les plus brefs délais. ' +
    'Si urgent, rappelez-nous au ' + formatPhone(fromNumber) + '. ' +
    'Merci!';

  const apiKey = process.env.TELNYX_API_KEY;
  if (!apiKey) {
    logger.warn('[MissedCallFollowup] No TELNYX_API_KEY configured, skipping SMS');
    return;
  }

  const response = await fetch('https://api.telnyx.com/v2/messages', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromNumber,
      to: toNumber,
      text: message,
      type: 'SMS',
    }),
  });

  if (!response.ok) {
    const errData = await response.text();
    throw new Error(`Telnyx SMS ${response.status}: ${errData}`);
  }

  logger.info('[MissedCallFollowup] Follow-up SMS sent', {
    to: toNumber,
    from: fromNumber,
  });
}

/**
 * Format a phone number for display in the SMS message.
 */
function formatPhone(number: string): string {
  const digits = number.replace(/\D/g, '');
  if (digits.length === 11 && digits[0] === '1') {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return number;
}
