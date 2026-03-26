export const dynamic = 'force-dynamic';

/**
 * CRON: Compliance Deadline Reminders
 * Runs daily — sends reminders at 7 days, 3 days, and 0 days before deadline.
 * Trigger: Railway cron or external scheduler (e.g., cron-job.org)
 * Auth: CRON_SECRET header
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendEmail } from '@/lib/email';
import { buildComplianceReminderEmail } from '@/lib/email/templates/lms-emails';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  // Verify cron secret — reject if CRON_SECRET is unset OR header doesn't match
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const reminders = [
    { daysOut: 7, label: '7-day' },
    { daysOut: 3, label: '3-day' },
    { daysOut: 0, label: 'today' },
  ];

  let sent = 0;
  let errors = 0;

  for (const { daysOut, label } of reminders) {
    const targetDate = new Date(now);
    targetDate.setDate(targetDate.getDate() + daysOut);
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 86400000);

    // Find CePeriods ending on this date with incomplete UFC
    // NOTE: Intentionally no tenantId filter — this cron processes ALL tenants' periods in one sweep.
    const periods = await prisma.cePeriod.findMany({
      where: {
        endDate: { gte: startOfDay, lt: endOfDay },
        status: { in: ['ACTIVE', 'GRACE_PERIOD'] },
      },
      include: {
        license: {
          include: {
            regulatoryBody: { select: { name: true, requiredUfc: true } },
          },
        },
      },
    });

    for (const period of periods) {
      if (Number(period.earnedUfc) >= Number(period.requiredUfc)) continue; // Already met

      // V2 P0 FIX: Deduplication — check if reminder already sent today for this period + type
      const dedupKey = `compliance_reminder_${label}`;
      const alreadySent = await prisma.lmsNotification.findFirst({
        where: {
          tenantId: period.tenantId,
          userId: period.userId,
          type: dedupKey,
          createdAt: { gte: startOfDay },
        },
        select: { id: true },
      });
      if (alreadySent) continue; // Already sent this reminder today

      // Get user email
      const user = await prisma.user.findUnique({
        where: { id: period.userId },
        select: { email: true, name: true },
      });
      if (!user?.email) continue;

      // V2 P2 FIX: Count compliance courses NOT YET completed (was counting by deadline date)
      const remainingEnrollments = await prisma.enrollment.count({
        where: {
          tenantId: period.tenantId,
          userId: period.userId,
          status: 'ACTIVE',
          complianceStatus: { in: ['NOT_STARTED', 'IN_PROGRESS', 'OVERDUE'] },
          course: { isCompliance: true },
        },
      });

      try {
        const email = buildComplianceReminderEmail({
          studentName: user.name ?? 'Etudiant',
          deadlineDate: startOfDay.toLocaleDateString('fr-CA'),
          daysRemaining: daysOut,
          coursesRemaining: remainingEnrollments,
          ufcEarned: Number(period.earnedUfc),
          ufcRequired: Number(period.requiredUfc),
          locale: 'fr',
        });

        await sendEmail({ to: { email: user.email, name: user.name ?? undefined }, subject: email.subject, html: email.html, text: email.text });

        // V2 P0 FIX: Record sent reminder for deduplication
        await prisma.lmsNotification.create({
          data: {
            tenantId: period.tenantId,
            userId: period.userId,
            type: dedupKey,
            title: `Rappel conformite (${label})`,
            message: `Echeance UFC: ${startOfDay.toLocaleDateString('fr-CA')}`,
          },
        }).catch(() => { /* dedup record failure should not block email flow */ });

        sent++;
        logger.info(`[compliance-reminder] Sent ${label} reminder to ${user.email}`);
      } catch (err) {
        errors++;
        logger.error(`[compliance-reminder] Failed to send to ${user.email}`, { error: err });
      }
    }
  }

  // QW-11: Certificate expiry reminders (90 days out)
  let certRemindersSent = 0;
  try {
    const d90 = new Date(now);
    d90.setDate(d90.getDate() + 90);
    const startOfD90 = new Date(d90.getFullYear(), d90.getMonth(), d90.getDate());
    const endOfD90 = new Date(startOfD90.getTime() + 86400000);
    const expiringCerts = await prisma.certificate.findMany({
      where: { status: 'ISSUED', expiresAt: { gte: startOfD90, lt: endOfD90 } },
      include: { course: { select: { title: true } } },
    });
    for (const cert of expiringCerts) {
      const dedupExists = await prisma.lmsNotification.findFirst({
        where: { tenantId: cert.tenantId, userId: cert.userId, type: 'cert_expiry_90d', createdAt: { gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) } },
        select: { id: true },
      });
      if (dedupExists) continue;
      const certUser = await prisma.user.findUnique({ where: { id: cert.userId }, select: { email: true, name: true } });
      if (!certUser?.email) continue;
      try {
        await sendEmail({
          to: { email: certUser.email, name: certUser.name ?? undefined },
          subject: `Votre certificat "${cert.course?.title}" expire dans 90 jours`,
          html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;"><h2>Rappel de renouvellement</h2><p>Bonjour ${certUser.name ?? 'Etudiant'},</p><p>Votre certificat pour <strong>${cert.course?.title ?? 'un cours'}</strong> expire le <strong>${cert.expiresAt?.toLocaleDateString('fr-CA') ?? ''}</strong> (dans 90 jours).</p></div>`,
        });
        certRemindersSent++;
        await prisma.lmsNotification.create({ data: { tenantId: cert.tenantId, userId: cert.userId, type: 'cert_expiry_90d', title: 'Rappel expiration certificat', message: cert.course?.title ?? '' } }).catch(() => {});
      } catch (certErr) {
        errors++;
        logger.error('[compliance-reminder] Cert email failed', { error: certErr instanceof Error ? certErr.message : String(certErr) });
      }
    }
  } catch (batchErr) {
    logger.error('[compliance-reminder] Cert batch error', { error: batchErr instanceof Error ? batchErr.message : String(batchErr) });
  }

  return NextResponse.json({ sent, certRemindersSent, errors, timestamp: now.toISOString() });
}
