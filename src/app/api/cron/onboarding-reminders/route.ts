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
  html: (tenantName: string, ownerName: string) => string;
}

const REMINDER_STEPS: ReminderStep[] = [
  {
    dayOffset: 1,
    stepKey: 'branding',
    eventType: 'ONBOARDING_REMINDER_BRANDING',
    subject: 'Bienvenue sur Koraline — Configurez votre branding',
    html: (tenantName, ownerName) => `
      <p>Bonjour ${ownerName},</p>
      <p>Votre espace <strong>${tenantName}</strong> est pret! La premiere etape pour personnaliser votre boutique est de configurer votre branding.</p>
      <ul>
        <li>Telechargez votre logo</li>
        <li>Choisissez vos couleurs de marque</li>
        <li>Selectionnez votre police</li>
      </ul>
      <p>Connectez-vous a votre tableau de bord pour commencer.</p>
      <p>L'equipe Koraline</p>
    `,
  },
  {
    dayOffset: 3,
    stepKey: 'products',
    eventType: 'ONBOARDING_REMINDER_PRODUCTS',
    subject: 'Ajoutez votre premier produit sur Koraline',
    html: (tenantName, ownerName) => `
      <p>Bonjour ${ownerName},</p>
      <p>Votre boutique <strong>${tenantName}</strong> attend ses premiers produits!</p>
      <p>Ajoutez votre premier produit en quelques clics depuis le menu Catalogue de votre tableau de bord.</p>
      <p>L'equipe Koraline</p>
    `,
  },
  {
    dayOffset: 7,
    stepKey: 'domain',
    eventType: 'ONBOARDING_REMINDER_DOMAIN',
    subject: 'Configurez votre domaine personnalise',
    html: (tenantName, ownerName) => `
      <p>Bonjour ${ownerName},</p>
      <p>Saviez-vous que vous pouvez utiliser votre propre nom de domaine pour <strong>${tenantName}</strong>?</p>
      <p>Un domaine personnalise renforce la confiance de vos clients et ameliore votre image de marque.</p>
      <p>Configurez-le dans Systeme > Parametres > Domaine.</p>
      <p>L'equipe Koraline</p>
    `,
  },
  {
    dayOffset: 14,
    stepKey: 'firstOrder',
    eventType: 'ONBOARDING_REMINDER_HELP',
    subject: 'Besoin d\'aide pour lancer votre boutique?',
    html: (tenantName, ownerName) => `
      <p>Bonjour ${ownerName},</p>
      <p>Nous avons remarque que <strong>${tenantName}</strong> n'a pas encore recu sa premiere commande.</p>
      <p>C'est normal — le lancement prend du temps. Voici quelques conseils:</p>
      <ul>
        <li>Partagez votre boutique sur les reseaux sociaux</li>
        <li>Envoyez une campagne email a vos contacts existants</li>
        <li>Utilisez des codes promo pour les premiers clients</li>
      </ul>
      <p>Besoin d'accompagnement? Repondez a cet email et nous planifierons une demo personnalisee.</p>
      <p>L'equipe Koraline</p>
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

        // Send reminder email
        try {
          await sendEmail({
            to: { email: owner.email, name: owner.name || undefined },
            subject: step.subject,
            html: step.html(tenant.name, owner.name || 'cher client'),
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
