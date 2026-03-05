export const dynamic = 'force-dynamic';

/**
 * Cron: Process scheduled reports
 * Finds reports due to be sent and generates/emails them.
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();
    const reports = await prisma.crmScheduledReport.findMany({
      where: {
        isActive: true,
        nextSendAt: { lte: now },
      },
    });

    let processed = 0;
    for (const report of reports) {
      try {
        // Calculate next run time based on schedule
        const schedule = report.schedule as string; // 'daily' | 'weekly' | 'monthly'

        const nextRun = new Date(now);
        if (schedule === 'daily') nextRun.setDate(nextRun.getDate() + 1);
        else if (schedule === 'weekly') nextRun.setDate(nextRun.getDate() + 7);
        else if (schedule === 'monthly') nextRun.setMonth(nextRun.getMonth() + 1);
        nextRun.setHours(8, 0, 0, 0); // Default 8 AM

        // Update last/next run
        await prisma.crmScheduledReport.update({
          where: { id: report.id },
          data: { lastSentAt: now, nextSendAt: nextRun },
        });

        // TODO: Generate report data and send email to recipients
        // For now, just log it
        logger.info('Scheduled report processed', {
          reportId: report.id,
          name: report.name,
          recipients: report.recipients,
          nextRun: nextRun.toISOString(),
        });

        processed++;
      } catch (err) {
        logger.error('Failed to process scheduled report', {
          reportId: report.id,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return NextResponse.json({ success: true, processed, total: reports.length });
  } catch (error) {
    logger.error('Cron scheduled-reports error', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
