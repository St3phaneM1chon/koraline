/**
 * Tenant Onboarding — Koraline SaaS
 * Computes onboarding status by checking actual data in DB.
 */

import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface OnboardingSteps {
  branding: boolean;     // Logo + colors configured
  domain: boolean;       // Custom domain verified
  products: boolean;     // At least 1 product created
  payment: boolean;      // Stripe subscription active
  firstOrder: boolean;   // At least 1 order received
}

export interface OnboardingStatus {
  steps: OnboardingSteps;
  progress: number; // 0-100
  completedCount: number;
  totalSteps: number;
}

const STEP_LABELS: Record<keyof OnboardingSteps, string> = {
  branding: 'Logo et couleurs configurees',
  domain: 'Domaine personnalise verifie',
  products: 'Au moins 1 produit cree',
  payment: 'Abonnement Stripe actif',
  firstOrder: 'Premiere commande recue',
};

export { STEP_LABELS };

// ---------------------------------------------------------------------------
// Compute onboarding status
// ---------------------------------------------------------------------------

export async function computeOnboardingStatus(tenantId: string): Promise<OnboardingStatus> {
  try {
    const [tenant, productCount, orderCount] = await Promise.all([
      prisma.tenant.findUnique({
        where: { id: tenantId },
        select: {
          logoUrl: true,
          primaryColor: true,
          secondaryColor: true,
          domainCustom: true,
          domainVerified: true,
          stripeSubscriptionId: true,
        },
      }),
      prisma.product.count({ where: { tenantId } }),
      prisma.order.count({ where: { tenantId } }),
    ]);

    if (!tenant) {
      return {
        steps: { branding: false, domain: false, products: false, payment: false, firstOrder: false },
        progress: 0,
        completedCount: 0,
        totalSteps: 5,
      };
    }

    const steps: OnboardingSteps = {
      branding: Boolean(tenant.logoUrl) && (tenant.primaryColor !== '#0066CC' || tenant.secondaryColor !== '#003366'),
      domain: Boolean(tenant.domainCustom) && Boolean(tenant.domainVerified),
      products: productCount > 0,
      payment: Boolean(tenant.stripeSubscriptionId),
      firstOrder: orderCount > 0,
    };

    const completedCount = Object.values(steps).filter(Boolean).length;
    const totalSteps = Object.keys(steps).length;
    const progress = Math.round((completedCount / totalSteps) * 100);

    return { steps, progress, completedCount, totalSteps };
  } catch (error) {
    logger.error('Failed to compute onboarding status', {
      tenantId,
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      steps: { branding: false, domain: false, products: false, payment: false, firstOrder: false },
      progress: 0,
      completedCount: 0,
      totalSteps: 5,
    };
  }
}

// ---------------------------------------------------------------------------
// Update persisted onboarding state
// ---------------------------------------------------------------------------

export async function syncOnboardingState(tenantId: string): Promise<OnboardingStatus> {
  const status = await computeOnboardingStatus(tenantId);

  await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      onboardingSteps: status.steps as unknown as Record<string, boolean>,
      onboardingCompleted: status.progress === 100,
      onboardingStartedAt: status.progress > 0 ? new Date() : undefined,
    },
  });

  return status;
}
