/**
 * DATABASE CLIENT - Prisma
 * Singleton pattern pour éviter les connexions multiples
 * Connection pool configured for production performance
 *
 * Transient error retry: use withRetry() to wrap queries that should be
 * retried on P1001/P1002/P1017 (connection dropped, timeout, server closed).
 * Statement timeout: configured via statement_timeout URL parameter (default 30s).
 */

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Build the datasource URL with connection pool parameters.
 * Uses DATABASE_URL from env, appending pool settings if not already present.
 * - connection_limit: Max connections in the pool (default 10)
 * - pool_timeout:     Seconds to wait for a free connection (default 30)
 * - statement_timeout: Max milliseconds a single query may run (default 30000)
 */
function getDatasourceUrl(): string | undefined {
  const baseUrl = process.env.DATABASE_URL;
  if (!baseUrl) return undefined;

  // Don't append if pool params are already configured in the URL
  if (baseUrl.includes('connection_limit') || baseUrl.includes('pool_timeout')) {
    return baseUrl;
  }

  const separator = baseUrl.includes('?') ? '&' : '?';
  const connectionLimit = process.env.DATABASE_CONNECTION_LIMIT || '10';
  const poolTimeout = process.env.DATABASE_POOL_TIMEOUT || '30';
  const statementTimeout = process.env.DATABASE_STATEMENT_TIMEOUT || '30000';

  return `${baseUrl}${separator}connection_limit=${connectionLimit}&pool_timeout=${poolTimeout}&statement_timeout=${statementTimeout}`;
}

const datasourceUrl = getDatasourceUrl();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
    // Only override datasources when URL is available; otherwise let Prisma
    // use the default from schema.prisma (which reads DATABASE_URL from env).
    // This prevents "Invalid value undefined" errors during CI builds.
    ...(datasourceUrl
      ? { datasources: { db: { url: datasourceUrl } } }
      : {}),
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// ---------------------------------------------------------------------------
// Retry helper for transient connection errors
// ---------------------------------------------------------------------------
// Prisma error codes that are safe to retry automatically:
//   P1001 - Can't reach database server
//   P1002 - Database server timed out
//   P1017 - Server closed the connection
const RETRYABLE_CODES = new Set(['P1001', 'P1002', 'P1017']);

/**
 * Executes `fn` up to MAX_RETRIES times, retrying only on transient
 * Prisma connection errors (P1001, P1002, P1017) with linear backoff.
 *
 * Usage:
 *   const user = await withRetry(() => prisma.user.findUnique({ where: { id } }));
 */
export async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (e: unknown) {
      const isLast = attempt === maxRetries - 1;
      if (isLast) throw e;
      const code = (e as { code?: string })?.code;
      if (code && RETRYABLE_CODES.has(code)) {
        await new Promise(r => setTimeout(r, 100 * (attempt + 1)));
        continue;
      }
      throw e;
    }
  }
  // Unreachable, but satisfies TypeScript's control flow analysis
  throw new Error('withRetry: exhausted retries');
}

/** @deprecated Use 'prisma' instead. This alias is kept for backward compatibility. */
export const db = prisma;

export default prisma;
