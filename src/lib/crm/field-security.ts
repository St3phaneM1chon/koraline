/**
 * CRM Field-Level Security (L8)
 *
 * Controls access to specific CRM fields based on user role.
 * - getFieldPermissions: Get permission map for entity type + role
 * - filterFields: Strip hidden/unauthorized fields from response data
 * - canWriteField: Check if a specific field is writable for a role
 * - getFieldSecurityConfig: Return all configured field restrictions
 */

import { logger } from '@/lib/logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type FieldPermission = 'read' | 'write' | 'hidden';

export interface FieldPermissionMap {
  [field: string]: FieldPermission;
}

export interface FieldSecurityRule {
  entityType: string;
  role: string;
  fields: FieldPermissionMap;
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/**
 * Field security rules by entity type and role.
 * Fields not listed default to 'write' for OWNER/ADMIN and 'read' for others.
 */
const FIELD_SECURITY_CONFIG: FieldSecurityRule[] = [
  // CRM Lead restrictions
  {
    entityType: 'lead',
    role: 'AGENT',
    fields: {
      score: 'read',
      temperature: 'read',
      customFields: 'write',
      dncStatus: 'read',
      qualificationData: 'write',
    },
  },
  {
    entityType: 'lead',
    role: 'VIEWER',
    fields: {
      phone: 'hidden',
      email: 'hidden',
      score: 'read',
      temperature: 'read',
      customFields: 'read',
      dncStatus: 'hidden',
      qualificationData: 'read',
    },
  },

  // CRM Deal restrictions
  {
    entityType: 'deal',
    role: 'AGENT',
    fields: {
      value: 'read',
      mrrValue: 'read',
      wonReason: 'read',
      lostReason: 'read',
    },
  },
  {
    entityType: 'deal',
    role: 'VIEWER',
    fields: {
      value: 'hidden',
      mrrValue: 'hidden',
      customFields: 'read',
      wonReason: 'hidden',
      lostReason: 'hidden',
    },
  },

  // CRM Contract restrictions
  {
    entityType: 'contract',
    role: 'AGENT',
    fields: {
      value: 'read',
      terms: 'read',
    },
  },
  {
    entityType: 'contract',
    role: 'VIEWER',
    fields: {
      value: 'hidden',
      terms: 'hidden',
      documentUrl: 'hidden',
    },
  },
];

// ---------------------------------------------------------------------------
// Functions
// ---------------------------------------------------------------------------

/**
 * Get field permissions for a given entity type and user role.
 * Returns a map of field name -> permission level.
 */
export function getFieldPermissions(entityType: string, userRole: string): FieldPermissionMap {
  const rule = FIELD_SECURITY_CONFIG.find(
    (r) => r.entityType === entityType && r.role === userRole
  );

  if (!rule) {
    // OWNER and ADMIN have full write access by default
    if (userRole === 'OWNER' || userRole === 'ADMIN') {
      return {};
    }
    // Other roles get read-only by default for unlisted entities
    return {};
  }

  return { ...rule.fields };
}

/**
 * Filter response data by removing hidden fields and marking read-only ones.
 * Returns a new object with unauthorized fields stripped.
 */
export function filterFields<T extends Record<string, unknown>>(
  data: T,
  entityType: string,
  userRole: string
): Partial<T> {
  // OWNER and ADMIN see everything
  if (userRole === 'OWNER' || userRole === 'ADMIN') {
    return { ...data };
  }

  const permissions = getFieldPermissions(entityType, userRole);

  // If no specific rules, return all data as read-only
  if (Object.keys(permissions).length === 0) {
    return { ...data };
  }

  const filtered: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    const permission = permissions[key];

    // If field is explicitly hidden, skip it
    if (permission === 'hidden') {
      continue;
    }

    // Otherwise include the field (read or write)
    filtered[key] = value;
  }

  logger.debug('[field-security] Fields filtered', {
    entityType,
    userRole,
    originalFields: Object.keys(data).length,
    filteredFields: Object.keys(filtered).length,
    hiddenFields: Object.keys(data).length - Object.keys(filtered).length,
  });

  return filtered as Partial<T>;
}

/**
 * Check if a specific field is writable for a given role and entity type.
 */
export function canWriteField(field: string, entityType: string, userRole: string): boolean {
  // OWNER and ADMIN can write everything
  if (userRole === 'OWNER' || userRole === 'ADMIN') {
    return true;
  }

  const permissions = getFieldPermissions(entityType, userRole);
  const permission = permissions[field];

  // If not listed, default to read-only for non-admin roles
  if (!permission) {
    return false;
  }

  return permission === 'write';
}

/**
 * Return the full field security configuration for admin review.
 */
export function getFieldSecurityConfig(): FieldSecurityRule[] {
  return [...FIELD_SECURITY_CONFIG];
}
