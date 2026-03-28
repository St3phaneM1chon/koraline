export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { withAdminGuard } from '@/lib/admin-api-guard';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import { STARTER_TEMPLATES } from '@/lib/templates/starter-templates';

/**
 * POST /api/admin/templates/seed
 *
 * Seeds the PageTemplate table with the 12 built-in starter templates.
 * Idempotent: skips templates whose slug already exists.
 */
export const POST = withAdminGuard(async (_request, _ctx) => {
  try {
    let created = 0;
    let skipped = 0;

    for (const tpl of STARTER_TEMPLATES) {
      const existing = await prisma.pageTemplate.findFirst({
        where: { slug: tpl.slug, tenantId: null },
      });

      if (existing) {
        skipped++;
        continue;
      }

      await prisma.pageTemplate.create({
        data: {
          slug: tpl.slug,
          name: tpl.name,
          description: tpl.description,
          category: tpl.category,
          thumbnail: tpl.thumbnail,
          sections: tpl.sections as unknown as import('@prisma/client').Prisma.InputJsonValue,
          isSystem: true,
          isPublic: true,
          usageCount: 0,
        },
      });
      created++;
    }

    logger.info(`[templates/seed] Created ${created}, skipped ${skipped} templates`);

    return NextResponse.json({
      success: true,
      created,
      skipped,
      total: STARTER_TEMPLATES.length,
    });
  } catch (error: unknown) {
    logger.error('Error seeding templates:', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
