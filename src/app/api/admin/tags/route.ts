export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAdminGuard } from '@/lib/admin-api-guard';
import { logger } from '@/lib/logger';

// GET: Return all unique tags used across all users (for autocomplete)
export const GET = withAdminGuard(
  async () => {
    try {
      // Unnest the PostgreSQL array column to get one row per tag, then deduplicate
      const rows = await prisma.$queryRaw<{ tag: string }[]>`
        SELECT DISTINCT tag
        FROM "User", UNNEST(tags) AS tag
        WHERE tag IS NOT NULL AND tag <> ''
        ORDER BY tag ASC
      `;

      const tags = rows.map((r) => r.tag);

      return NextResponse.json({ tags });
    } catch (error) {
      logger.error('Admin tags GET error', {
        error: error instanceof Error ? error.message : String(error),
      });
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
  },
  { requiredPermission: 'users.view', skipCsrf: true }
);
