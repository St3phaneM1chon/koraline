export const dynamic = 'force-dynamic';

/**
 * CRON Job — Tenant Onboarding Reminders
 *
 * Sends reminder emails to tenant owners who haven't completed onboarding steps.
 *
 * Schedule:
 *   J+1 (Day 1):   "Bienvenue! Configurez votre branding"
 *   J+3 (Day 3):   "Ajoutez votre premier produit"
 *   J+7 (Day 7):   "Configurez votre domaine personnalise"
 *   J+14 (Day 14):  "Besoin d'aide? Planifiez une demo"
 *
 * Each step checks:
 *   - Tenant was created N days ago (±1 day window)
 *   - The specific onboarding step is still incomplete
 *   - Owner hasn't already received this reminder (via TenantEvent)
 *
 * Configuration: run daily at 10:00 AM
 * POST /api/cron/onboarding-reminders?secret=CRON_SECRET
 */

import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import { sendEmail } from '@/lib/email/email-service';
import { computeOnboardingStatus } from '@/lib/tenant-onboarding';
import { tenantOnboardingReminderEmail } from '@/lib/email/templates/tenant-emails';

// CRON secret verification
function verifyCronSecret(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const provided = request.headers.get('x-cron-secret')
    || request.nextUrl.searchParams.get('secret')
    || '';

  if (provided.length !== secret.length) return false;

  try {
    return timingSafeEqual(
      Buffer.from(provided, 'utf8'),
      Buffer.from(secret, 'utf8')
    );
  } catch {
    return false;
  }
}

interface ReminderStep {
  dayOffset: number;
  stepKey: string; // onboarding step to check
  eventType: string; // TenantEvent type to prevent re-send
  subject: string;
  /** Returns the step-specific body content (without greeting/wrapper — those come from the template). */
  bodyContent: (tenantName: string) => string;
}

const REMINDER_STEPS: ReminderStep[] = [
  {
    dayOffset: 1,
    stepKey: 'branding',
    eventType: 'ONBOARDING_REMINDER_BRANDING',
    subject: 'Configurez votre branding',
    bodyContent: (tenantName) => `
      <p>Votre espace <strong>${tenantName}</strong> est pr&ecirc;t&nbsp;! La premi&egrave;re &eacute;tape pour personnaliser votre boutique est de configurer votre branding.</p>
      <ul>
        <li>T&eacute;l&eacute;chargez votre logo</li>
        <li>Choisissez vos couleurs de marque</li>
        <li>S&eacute;lectionnez votre police</li>
      </ul>
    `,
  },
  {
    dayOffset: 3,
    stepKey: 'products',
    eventType: 'ONBOARDING_REMINDER_PRODUCTS',
    subject: 'Ajoutez votre premier produit',
    bodyContent: (tenantName) => `
      <p>Votre boutique <strong>${tenantName}</strong> attend ses premiers produits&nbsp;!</p>
      <p>Ajoutez votre premier produit en quelques clics depuis le menu <strong>Catalogue</strong> de votre tableau de bord.</p>
    `,
  },
  {
    dayOffset: 7,
    stepKey: 'domain',
    eventType: 'ONBOARDING_REMINDER_DOMAIN',
    subject: 'Configurez votre domaine personnalis\u00e9',
    bodyContent: (tenantName) => `
      <p>Saviez-vous que vous pouvez utiliser votre propre nom de domaine pour <strong>${tenantName}</strong>&nbsp;?</p>
      <p>Un domaine personnalis&eacute; renforce la confiance de vos clients et am&eacute;liore votre image de marque.</p>
      <p>Configurez-le dans <strong>Syst&egrave;me &gt; Param&egrave;tres &gt; Domaine</strong>.</p>
    `,
  },
  {
    dayOffset: 14,
    stepKey: 'firstOrder',
    eventType: 'ONBOARDING_REMINDER_HELP',
    subject: 'Besoin d\u0027aide pour lancer votre boutique\u00a0?',
    bodyContent: (tenantName) => `
      <p>Nous avons remarqu&eacute; que <strong>${tenantName}</strong> n&rsquo;a pas encore re&ccedil;u sa premi&egrave;re commande.</p>
      <p>C&rsquo;est normal &mdash; le lancement prend du temps. Voici quelques conseils&nbsp;:</p>
      <ul>
        <li>Partagez votre boutique sur les r&eacute;seaux sociaux</li>
        <li>Envoyez une campagne email &agrave; vos contacts existants</li>
        <li>Utilisez des codes promo pour les premiers clients</li>
      </ul>
      <p>Besoin d&rsquo;accompagnement&nbsp;? R&eacute;pondez &agrave; cet email et nous planifierons une d&eacute;mo personnalis&eacute;e.</p>
    `,
  },
];

export async function POST(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results = { sent: 0, skipped: 0, errors: 0 };
  const now = new Date();

  try {
    // Get all active tenants that aren't fully onboarded
    const tenants = await prisma.tenant.findMany({
      where: {
        status: 'ACTIVE',
        onboardingCompleted: false,
      },
      select: {
        id: true,
        name: true,
        ownerUserId: true,
        createdAt: true,
      },
    });

    for (const tenant of tenants) {
      if (!tenant.ownerUserId) {
        results.skipped++;
        continue;
      }

      const daysSinceCreation = Math.floor(
        (now.getTime() - tenant.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Check each reminder step
      for (const step of REMINDER_STEPS) {
        // Only send if within the day window (±1 day)
        if (daysSinceCreation < step.dayOffset || daysSinceCreation > step.dayOffset + 1) {
          continue;
        }

        // Check if the onboarding step is still incomplete
        const status = await computeOnboardingStatus(tenant.id);
        const stepComplete = status.steps[step.stepKey as keyof typeof status.steps];
        if (stepComplete) {
          results.skipped++;
          continue;
        }

        // Check if reminder already sent
        const alreadySent = await prisma.tenantEvent.findFirst({
          where: {
            tenantId: tenant.id,
            type: step.eventType,
          },
        });
        if (alreadySent) {
          results.skipped++;
          continue;
        }

        // Get owner email
        const owner = await prisma.user.findUnique({
          where: { id: tenant.ownerUserId },
          select: { email: true, name: true },
        });
        if (!owner) {
          results.skipped++;
          continue;
        }

        // Send reminder email with Koraline/Attitudes VIP branded template
        try {
          const adminUrl = `https://${tenant.name}.koraline.app/admin`;
          const reminderEmail = tenantOnboardingReminderEmail(
            {
              tenantName: tenant.name,
              ownerName: owner.name || 'cher client',
              adminUrl,
            },
            step.bodyContent(tenant.name),
            step.subject,
          );
          await sendEmail({
            to: { email: owner.email, name: owner.name || undefined },
            subject: reminderEmail.subject,
            html: reminderEmail.html,
            emailType: 'transactional',
          });

          // Log event to prevent re-send
          await prisma.tenantEvent.create({
            data: {
              tenantId: tenant.id,
              type: step.eventType,
              actor: 'system:onboarding-cron',
              details: { step: step.stepKey, dayOffset: step.dayOffset },
            },
          });

          results.sent++;
          logger.info('Onboarding reminder sent', {
            tenantId: tenant.id,
            step: step.stepKey,
            dayOffset: step.dayOffset,
          });
        } catch (emailError) {
          results.errors++;
          logger.error('Failed to send onboarding reminder', {
            tenantId: tenant.id,
            step: step.stepKey,
            error: emailError instanceof Error ? emailError.message : String(emailError),
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      results,
      tenantsChecked: tenants.length,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    logger.error('Onboarding reminders cron failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
