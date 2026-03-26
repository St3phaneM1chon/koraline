export const dynamic = 'force-dynamic';

/**
 * Cron: Process scheduled reports
 * Finds reports due to be sent and generates/emails them.
 */
import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import { withJobLock } from '@/lib/cron-lock';
import { sendEmail } from '@/lib/email/email-service'; // #17

export async function GET(request: NextRequest) {
  // SECURITY: Timing-safe CRON_SECRET verification (prevents timing attacks)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || !authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const provided = Buffer.from(authHeader.replace('Bearer ', ''));
    const expected = Buffer.from(cronSecret);
    if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return withJobLock('scheduled-reports', async () => {
    try {
      const now = new Date();
      const reports = await prisma.crmScheduledReport.findMany({
        where: {
          isActive: true,
          nextSendAt: { lte: now },
        },
      });

      // Compute next run times for all reports upfront
      const updateOperations: Array<ReturnType<typeof prisma.crmScheduledReport.update>> = [];
      for (const report of reports) {
        const schedule = report.schedule as string; // 'daily' | 'weekly' | 'monthly'

        const nextRun = new Date(now);
        if (schedule === 'daily') nextRun.setDate(nextRun.getDate() + 1);
        else if (schedule === 'weekly') nextRun.setDate(nextRun.getDate() + 7);
        else if (schedule === 'monthly') nextRun.setMonth(nextRun.getMonth() + 1);
        nextRun.setHours(8, 0, 0, 0); // Default 8 AM

        updateOperations.push(
          prisma.crmScheduledReport.update({
            where: { id: report.id },
            data: { lastSentAt: now, nextSendAt: nextRun },
          })
        );

        // #17: Send scheduled report email to recipients
        const recipients = (report.recipients as string[] | undefined) || [];
        const reportName = report.name || 'Scheduled Report';
        const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://attitudes.vip';
        const reportDate = now.toLocaleDateString('fr-CA');

        for (const email of recipients) {
          if (!email || typeof email !== 'string') continue;
          try {
            await sendEmail({
              to: { email },
              subject: `[Rapport] ${reportName} - ${reportDate}`,
              html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;"><h2>${reportName}</h2><p>Votre rapport planifie est pret.</p><p><strong>Date:</strong> ${reportDate}</p><p><strong>Frequence:</strong> ${schedule}</p><p style="margin-top:20px;"><a href="${baseUrl}/admin/dashboard" style="display:inline-block;padding:10px 24px;background:#6366f1;color:white;text-decoration:none;border-radius:8px;">Voir le tableau de bord</a></p></div>`,
              tags: ['scheduled-report', 'automated'],
            });
          } catch (emailErr) {
            logger.error('Failed to send scheduled report email', { reportId: report.id, email, error: emailErr instanceof Error ? emailErr.message : String(emailErr) });
          }
        }
        logger.info('Scheduled report processed', { reportId: report.id, name: report.name, recipientCount: recipients.length, nextRun: nextRun.toISOString() });
      }

      // Batch all updates in a single transaction instead of N sequential updates
      let processed = 0;
      if (updateOperations.length > 0) {
        try {
          await prisma.$transaction(updateOperations);
          processed = updateOperations.length;
        } catch (err) {
          logger.error('Failed to batch-update scheduled reports', {
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }

      return NextResponse.json({ success: true, processed, total: reports.length });
    } catch (error) {
      logger.error('Cron scheduled-reports error', { error: error instanceof Error ? error.message : String(error) });
      return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
  });
}
