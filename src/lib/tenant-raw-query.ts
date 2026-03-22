/**
 * TENANT RAW QUERY — Sécurisation des requêtes SQL brutes
 *
 * Les requêtes $queryRaw et $executeRaw bypasse le middleware Prisma.
 * Ce wrapper injecte automatiquement le filtre tenantId.
 * UTILISER CE WRAPPER au lieu de prisma.$queryRaw directement.
 */

import { prisma } from '@/lib/db';
import { getCurrentTenantIdFromContext, isCurrentContextSuperAdmin } from '@/lib/db';
import { logger } from '@/lib/logger';

/**
 * Exécute une requête SQL brute avec filtre tenant automatique.
 * Pour les requêtes SELECT.
 */
export async function tenantQueryRaw<T = unknown>(
  sql: string,
  ...params: unknown[]
): Promise<T[]> {
  const tenantId = getCurrentTenantIdFromContext();
  const isSuperAdmin = isCurrentContextSuperAdmin();

  // Super-admin voit tout
  if (isSuperAdmin) {
    return prisma.$queryRawUnsafe<T[]>(sql, ...params);
  }

  // Si pas de tenantId et pas super-admin → erreur de sécurité
  if (!tenantId) {
    logger.warn('[SECURITY] Raw query attempted without tenant context', {
      sql: sql.substring(0, 200),
    });
    return [] as T[];
  }

  // Injecter le filtre tenant dans la requête
  const tenantSql = injectTenantFilter(sql, tenantId, params.length + 1);
  return prisma.$queryRawUnsafe<T[]>(tenantSql, ...params, tenantId);
}

/**
 * Exécute une commande SQL brute avec filtre tenant automatique.
 * Pour les requêtes INSERT/UPDATE/DELETE.
 */
export async function tenantExecuteRaw(
  sql: string,
  ...params: unknown[]
): Promise<number> {
  const tenantId = getCurrentTenantIdFromContext();
  const isSuperAdmin = isCurrentContextSuperAdmin();

  if (isSuperAdmin) {
    return prisma.$executeRawUnsafe(sql, ...params);
  }

  if (!tenantId) {
    logger.warn('[SECURITY] Raw execute attempted without tenant context', {
      sql: sql.substring(0, 200),
    });
    return 0;
  }

  const tenantSql = injectTenantFilter(sql, tenantId, params.length + 1);
  return prisma.$executeRawUnsafe(tenantSql, ...params, tenantId);
}

/**
 * Injecte AND "tenantId" = $N dans une requête SQL.
 * Gère les cas : WHERE existant, pas de WHERE, GROUP BY, ORDER BY.
 */
function injectTenantFilter(sql: string, _tenantId: string, paramIndex: number): string {
  const tenantClause = `"tenantId" = $${paramIndex}`;

  // Si la requête contient déjà un filtre tenantId, ne pas doubler
  if (sql.includes('"tenantId"') || sql.includes("'tenantId'")) {
    return sql;
  }

  // Cas 1: WHERE existe déjà → ajouter AND
  const whereMatch = sql.match(/\bWHERE\b/i);
  if (whereMatch) {
    const whereIndex = sql.indexOf(whereMatch[0]);
    const afterWhere = whereIndex + whereMatch[0].length;
    return sql.slice(0, afterWhere) + ` ${tenantClause} AND` + sql.slice(afterWhere);
  }

  // Cas 2: Pas de WHERE mais GROUP BY, ORDER BY, LIMIT, etc.
  const clauseMatch = sql.match(/\b(GROUP BY|ORDER BY|LIMIT|HAVING|OFFSET|RETURNING)\b/i);
  if (clauseMatch && clauseMatch.index !== undefined) {
    return sql.slice(0, clauseMatch.index) + `WHERE ${tenantClause} ` + sql.slice(clauseMatch.index);
  }

  // Cas 3: Pas de WHERE ni clause → ajouter à la fin
  return sql + ` WHERE ${tenantClause}`;
}
