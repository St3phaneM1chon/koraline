export const dynamic = 'force-dynamic';

/**
 * Search Health API (I-SEARCH)
 * GET /api/admin/search/health
 *
 * Checks the health of the search infrastructure:
 * - pg_trgm extension installed (for fuzzy/similarity search)
 * - tsvector columns exist on searchable models
 * - Full-text search indexes present
 * - SearchLog table health
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAdminGuard } from '@/lib/admin-api-guard';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface HealthCheck {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  details: string;
}

interface SearchHealthReport {
  timestamp: string;
  overall: 'healthy' | 'degraded' | 'unhealthy';
  checks: HealthCheck[];
  recommendations: string[];
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export const GET = withAdminGuard(async (_request: NextRequest) => {
  try {
    const checks: HealthCheck[] = [];
    const recommendations: string[] = [];

    // 1. Check if pg_trgm extension is installed
    try {
      const extensions = await prisma.$queryRaw<{ extname: string; extversion: string }[]>`
        SELECT extname, extversion FROM pg_extension WHERE extname = 'pg_trgm'
      `;
      if (extensions.length > 0) {
        checks.push({
          name: 'pg_trgm_extension',
          status: 'pass',
          details: `pg_trgm extension installed (version ${extensions[0].extversion})`,
        });
      } else {
        checks.push({
          name: 'pg_trgm_extension',
          status: 'fail',
          details: 'pg_trgm extension is NOT installed. Fuzzy search will not work.',
        });
        recommendations.push('Install pg_trgm: CREATE EXTENSION IF NOT EXISTS pg_trgm;');
      }
    } catch (error) {
      checks.push({
        name: 'pg_trgm_extension',
        status: 'fail',
        details: `Could not check pg_trgm: ${error instanceof Error ? error.message : String(error)}`,
      });
    }

    // 2. Check for tsvector columns on Product table
    try {
      const tsvectorColumns = await prisma.$queryRaw<{ column_name: string; data_type: string }[]>`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'Product'
          AND data_type = 'tsvector'
      `;
      if (tsvectorColumns.length > 0) {
        checks.push({
          name: 'tsvector_columns',
          status: 'pass',
          details: `Found ${tsvectorColumns.length} tsvector column(s): ${tsvectorColumns.map(c => c.column_name).join(', ')}`,
        });
      } else {
        checks.push({
          name: 'tsvector_columns',
          status: 'warn',
          details: 'No tsvector columns found on Product table. Full-text search uses ILIKE instead of optimized tsvector.',
        });
        recommendations.push('Consider adding a tsvector column for full-text search: ALTER TABLE "Product" ADD COLUMN search_vector tsvector;');
      }
    } catch (error) {
      checks.push({
        name: 'tsvector_columns',
        status: 'warn',
        details: `Could not check tsvector columns: ${error instanceof Error ? error.message : String(error)}`,
      });
    }

    // 3. Check for GIN/GiST indexes related to search
    try {
      const searchIndexes = await prisma.$queryRaw<{ indexname: string; tablename: string; indexdef: string }[]>`
        SELECT indexname, tablename, indexdef
        FROM pg_indexes
        WHERE (indexdef ILIKE '%gin%' OR indexdef ILIKE '%gist%' OR indexdef ILIKE '%trgm%' OR indexdef ILIKE '%tsvector%')
          AND schemaname = 'public'
      `;
      if (searchIndexes.length > 0) {
        checks.push({
          name: 'search_indexes',
          status: 'pass',
          details: `Found ${searchIndexes.length} search-related index(es): ${searchIndexes.map(i => `${i.indexname} on ${i.tablename}`).join(', ')}`,
        });
      } else {
        checks.push({
          name: 'search_indexes',
          status: 'warn',
          details: 'No GIN/GiST/trgm indexes found. Search queries may be slow on large datasets.',
        });
        recommendations.push('Consider adding GIN indexes for text search: CREATE INDEX idx_product_name_trgm ON "Product" USING gin (name gin_trgm_ops);');
      }
    } catch (error) {
      checks.push({
        name: 'search_indexes',
        status: 'warn',
        details: `Could not check indexes: ${error instanceof Error ? error.message : String(error)}`,
      });
    }

    // 4. Check B-tree indexes on Product name/description
    try {
      const btreeIndexes = await prisma.$queryRaw<{ indexname: string; indexdef: string }[]>`
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE tablename = 'Product'
          AND schemaname = 'public'
          AND (indexdef ILIKE '%name%' OR indexdef ILIKE '%description%' OR indexdef ILIKE '%sku%')
      `;
      checks.push({
        name: 'product_text_indexes',
        status: btreeIndexes.length > 0 ? 'pass' : 'warn',
        details: btreeIndexes.length > 0
          ? `Found ${btreeIndexes.length} text-related index(es) on Product: ${btreeIndexes.map(i => i.indexname).join(', ')}`
          : 'No indexes found on Product name/description/sku columns',
      });
    } catch (error) {
      checks.push({
        name: 'product_text_indexes',
        status: 'warn',
        details: `Could not check Product indexes: ${error instanceof Error ? error.message : String(error)}`,
      });
    }

    // 5. Check SearchLog table health
    try {
      const [logCount, recentCount, oldestLog] = await Promise.all([
        prisma.searchLog.count(),
        prisma.searchLog.count({
          where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
        }),
        prisma.searchLog.findFirst({
          orderBy: { createdAt: 'asc' },
          select: { createdAt: true },
        }),
      ]);

      checks.push({
        name: 'search_log_health',
        status: logCount > 0 ? 'pass' : 'warn',
        details: `SearchLog: ${logCount} total entries, ${recentCount} in last 24h. Oldest: ${oldestLog?.createdAt?.toISOString() || 'none'}`,
      });

      if (logCount > 100000) {
        recommendations.push(`SearchLog has ${logCount} entries. Consider implementing log rotation or archival.`);
      }
    } catch (error) {
      checks.push({
        name: 'search_log_health',
        status: 'fail',
        details: `Could not check SearchLog: ${error instanceof Error ? error.message : String(error)}`,
      });
    }

    // 6. Check if SearchLog has proper indexes
    try {
      const logIndexes = await prisma.$queryRaw<{ indexname: string }[]>`
        SELECT indexname
        FROM pg_indexes
        WHERE tablename = 'SearchLog'
          AND schemaname = 'public'
      `;
      checks.push({
        name: 'search_log_indexes',
        status: logIndexes.length >= 2 ? 'pass' : 'warn',
        details: `SearchLog has ${logIndexes.length} index(es): ${logIndexes.map(i => i.indexname).join(', ')}`,
      });
    } catch (error) {
      checks.push({
        name: 'search_log_indexes',
        status: 'warn',
        details: `Could not check SearchLog indexes: ${error instanceof Error ? error.message : String(error)}`,
      });
    }

    // Determine overall health
    const failCount = checks.filter(c => c.status === 'fail').length;
    const warnCount = checks.filter(c => c.status === 'warn').length;
    let overall: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (failCount > 0) overall = 'unhealthy';
    else if (warnCount > 1) overall = 'degraded';

    const report: SearchHealthReport = {
      timestamp: new Date().toISOString(),
      overall,
      checks,
      recommendations,
    };

    return NextResponse.json({ data: report });
  } catch (error) {
    logger.error('[admin/search/health] GET error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Failed to run search health check' }, { status: 500 });
  }
});
