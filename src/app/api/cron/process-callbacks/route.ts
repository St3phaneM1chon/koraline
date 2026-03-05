export const dynamic = 'force-dynamic';

/**
 * Cron: Process Upcoming Callbacks
 *
 * POST /api/cron/process-callbacks
 *
 * Finds CrmTask records where:
 *   - type = CALL
 *   - status = PENDING
 *   - dueAt <= now + 5 minutes
 *
 * For each due callback:
 *   1. Creates a CrmActivity (type=CALL) to notify the assigned agent.
 *   2. Marks the CrmTask status as IN_PROGRESS so it is not re-triggered.
 *
 * The CrmActivity record serves as the notification mechanism — the frontend
 * dashboard polls or subscribes to activity feeds. When WebSocket/SSE push is
 * added, trigger it here by reading the newly created activity ID.
 *
 * Authentication: Requires CRON_SECRET in Authorization header (Bearer token).
 * Rate: Intended to run every 1–5 minutes via Vercel Cron or an external scheduler.
 */

import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { prisma } from '@/lib/db';
import { withJobLock } from '@/lib/cron-lock';
import { logger } from '@/lib/logger';

// ---------------------------------------------------------------------------
// Auth helper
// ---------------------------------------------------------------------------

function verifyCronSecret(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    logger.error('[cron/process-callbacks] CRON_SECRET not configured');
    return false;
  }

  const authHeader = request.headers.get('authorization');
  const provided = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : '';

  try {
    const a = Buffer.from(cronSecret, 'utf8');
    const b = Buffer.from(provided, 'utf8');
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return withJobLock('process-callbacks', async () => {
    // Look ahead 5 minutes so agents have time to prepare
    const lookAheadMs = 5 * 60 * 1000;
    const cutoff = new Date(Date.now() + lookAheadMs);

    let processed = 0;
    let failed = 0;

    try {
      // Find all due callbacks that are still PENDING
      const dueCallbacks = await prisma.crmTask.findMany({
        where: {
          type: 'CALL',
          status: 'PENDING',
          dueAt: { lte: cutoff },
        },
        include: {
          assignedTo: {
            select: { id: true, name: true, email: true },
          },
          lead: {
            select: { id: true, contactName: true, email: true, phone: true },
          },
          deal: {
            select: { id: true, title: true },
          },
        },
        take: 100, // Cap per run to avoid overwhelming the system
        orderBy: { dueAt: 'asc' },
      });

      if (dueCallbacks.length === 0) {
        logger.info('[cron/process-callbacks] No due callbacks found');
        return NextResponse.json({
          success: true,
          processed: 0,
          failed: 0,
          timestamp: new Date().toISOString(),
        });
      }

      logger.info('[cron/process-callbacks] Processing due callbacks', {
        count: dueCallbacks.length,
        cutoff: cutoff.toISOString(),
      });

      // Process each callback
      for (const task of dueCallbacks) {
        try {
          // Build context for the notification title
          const contactName = task.lead?.contactName || task.deal?.title || 'Contact inconnu';
          const scheduledTime = task.dueAt
            ? task.dueAt.toLocaleTimeString('fr-CA', {
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'America/Toronto',
              })
            : '';

          const activityTitle = `Rappel à effectuer${scheduledTime ? ` à ${scheduledTime}` : ''}: ${contactName}`;
          const activityDescription = [
            task.description ? `Note: ${task.description}` : null,
            task.lead?.phone ? `Téléphone: ${task.lead.phone}` : null,
            task.lead?.email ? `Email: ${task.lead.email}` : null,
          ]
            .filter(Boolean)
            .join(' | ');

          // Use a transaction to atomically create the activity and update the task
          await prisma.$transaction([
            // 1. Create a notification activity for the assigned agent
            prisma.crmActivity.create({
              data: {
                type: 'CALL',
                title: activityTitle,
                description: activityDescription || null,
                leadId: task.leadId || null,
                dealId: task.dealId || null,
                contactId: null,
                performedById: task.assignedToId,
                metadata: {
                  callbackTaskId: task.id,
                  scheduledAt: task.dueAt?.toISOString(),
                  priority: task.priority,
                  triggerSource: 'cron:process-callbacks',
                },
              },
            }),

            // 2. Move task to IN_PROGRESS to prevent re-triggering on the next cron run
            prisma.crmTask.update({
              where: { id: task.id },
              data: { status: 'IN_PROGRESS' },
            }),
          ]);

          logger.info('[cron/process-callbacks] Callback processed', {
            taskId: task.id,
            assignedToId: task.assignedToId,
            leadId: task.leadId,
            dealId: task.dealId,
            dueAt: task.dueAt?.toISOString(),
          });

          processed++;
        } catch (taskError) {
          logger.error('[cron/process-callbacks] Failed to process callback', {
            taskId: task.id,
            error: taskError instanceof Error ? taskError.message : String(taskError),
          });
          failed++;
        }
      }

      logger.info('[cron/process-callbacks] Run complete', { processed, failed });

      return NextResponse.json({
        success: true,
        processed,
        failed,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('[cron/process-callbacks] Cron run failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      return NextResponse.json(
        { error: 'Callback processing failed', processed, failed },
        { status: 500 }
      );
    }
  }, { maxDurationMs: 3 * 60 * 1000 }); // 3 minute timeout
}
