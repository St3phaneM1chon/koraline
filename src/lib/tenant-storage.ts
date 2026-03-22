/**
 * TENANT STORAGE — Isolation des fichiers par tenant
 *
 * Chaque tenant a son propre namespace de stockage.
 * Empêche l'accès cross-tenant aux fichiers uploadés.
 */

import { getCurrentTenantIdFromContext } from '@/lib/db';

/**
 * Génère un chemin de fichier isolé par tenant.
 * Format: uploads/{tenantId}/{folder}/{filename}
 */
export function tenantUploadPath(folder: string, filename: string): string {
  const tenantId = getCurrentTenantIdFromContext();
  if (!tenantId) {
    throw new Error('SECURITY: File upload attempted without tenant context');
  }
  // Sanitize folder and filename to prevent path traversal
  const safeFolder = folder.replace(/\.\./g, '').replace(/[^a-zA-Z0-9_-]/g, '');
  const safeFilename = filename.replace(/\.\./g, '').replace(/\//g, '_');
  return `uploads/${tenantId}/${safeFolder}/${safeFilename}`;
}

/**
 * Vérifie qu'un chemin de fichier appartient au tenant courant.
 * Retourne false si le chemin pointe vers un autre tenant.
 */
export function isPathOwnedByCurrentTenant(filePath: string): boolean {
  const tenantId = getCurrentTenantIdFromContext();
  if (!tenantId) return false;
  // Le path doit contenir le tenantId après "uploads/"
  return filePath.includes(`uploads/${tenantId}/`) || !filePath.includes('uploads/');
}

/**
 * Retourne le dossier racine d'un tenant pour le stockage.
 */
export function getTenantStorageRoot(): string {
  const tenantId = getCurrentTenantIdFromContext();
  if (!tenantId) throw new Error('No tenant context for storage');
  return `uploads/${tenantId}`;
}
