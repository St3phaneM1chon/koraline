/**
 * Seat Enforcement — Validates tenant employee limits before creating/promoting staff users.
 *
 * Counts users with staff roles (EMPLOYEE, OWNER) for the tenant and compares
 * against tenant.maxEmployees. CUSTOMER role users are unlimited and excluded
 * from the count.
 */

import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

/** Roles that consume a seat (staff). CUSTOMER and PUBLIC are unlimited. */
const SEAT_ROLES = ['EMPLOYEE', 'OWNER'] as const;

export interface SeatCheckResult {
  allowed: boolean;
  current: number;
  max: number;
  message?: string;
}

/**
 * Check whether a tenant can add another staff user (EMPLOYEE/OWNER).
 *
 * @param tenantId - The tenant to check
 * @returns SeatCheckResult with allowed flag, current count, max, and optional error message
 */
export async function checkSeatLimit(tenantId: string): Promise<SeatCheckResult> {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, maxEmployees: true },
    });

    if (!tenant) {
      logger.warn('checkSeatLimit: tenant not found', { tenantId });
      return {
        allowed: false,
        current: 0,
        max: 0,
        message: 'Tenant introuvable.',
      };
    }

    // Count current staff users (EMPLOYEE + OWNER) for this tenant
    const currentStaff = await prisma.user.count({
      where: {
        tenantId,
        role: { in: [...SEAT_ROLES] },
      },
    });

    const allowed = currentStaff < tenant.maxEmployees;

    return {
      allowed,
      current: currentStaff,
      max: tenant.maxEmployees,
      message: allowed
        ? undefined
        : `Limite de sièges atteinte (${currentStaff}/${tenant.maxEmployees}). Veuillez mettre à niveau votre plan.`,
    };
  } catch (error) {
    logger.error('checkSeatLimit error', {
      tenantId,
      error: error instanceof Error ? error.message : String(error),
    });
    // Fail-open would be dangerous for billing — fail closed instead
    return {
      allowed: false,
      current: 0,
      max: 0,
      message: 'Erreur lors de la vérification des sièges.',
    };
  }
}
