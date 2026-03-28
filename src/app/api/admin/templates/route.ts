export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAdminGuard } from '@/lib/admin-api-guard';
import { prisma } from '@/lib/db';
import { logAdminAction, getClientIpFromRequest } from '@/lib/admin-audit';
import { rateLimitMiddleware } from '@/lib/rate-limiter';
import { validateCsrf } from '@/lib/csrf-middleware';
import { logger } from '@/lib/logger';
import { STARTER_TEMPLATES } from '@/lib/templates/starter-templates';

// ── Schemas ──────────────────────────────────────────────────────────

const createTemplateSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().max(1000).optional(),
  category: z.string().max(50).default('general'),
  thumbnail: z.string().max(2000).optional(),
  sections: z.array(z.any()).default([]),
  isPublic: z.boolean().default(true),
  /** When provided, clones sections from an existing page by ID. */
  fromPageId: z.string().optional(),
});

// ── GET /api/admin/templates — list available templates ──────────────

export const GET = withAdminGuard(async (request: NextRequest, _ctx) => {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    // 1. Fetch DB templates (system + tenant custom)
    const where: Record<string, unknown> = { isPublic: true };
    if (category && category !== 'all') {
      where.category = category;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const dbTemplates = await prisma.pageTemplate.findMany({
      where,
      orderBy: [{ isSystem: 'desc' }, { usageCount: 'desc' }, { name: 'asc' }],
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        category: true,
        thumbnail: true,
        sections: true,
        isSystem: true,
        isPublic: true,
        usageCount: true,
        createdAt: true,
      },
    });

    // 2. If no DB templates exist, return starter templates (fallback for fresh installs)
    if (dbTemplates.length === 0) {
      const starterFiltered = STARTER_TEMPLATES.filter((t) => {
        if (category && category !== 'all' && t.category !== category) return false;
        if (search) {
          const q = search.toLowerCase();
          return (
            t.name.toLowerCase().includes(q) ||
            t.description.toLowerCase().includes(q)
          );
        }
        return true;
      });

      return NextResponse.json({
        templates: starterFiltered.map((t) => ({
          id: `starter-${t.slug}`,
          slug: t.slug,
          name: t.name,
          description: t.description,
          category: t.category,
          thumbnail: t.thumbnail,
          sections: t.sections,
          isSystem: true,
          isPublic: true,
          usageCount: 0,
          createdAt: null,
        })),
        source: 'starter',
      });
    }

    return NextResponse.json({ templates: dbTemplates, source: 'database' });
  } catch (error: unknown) {
    logger.error('Error listing templates:', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});

// ── POST /api/admin/templates — create custom template ──────────────

export const POST = withAdminGuard(async (request: NextRequest, { session }) => {
  try {
    const ip = getClientIpFromRequest(request);
    const rl = await rateLimitMiddleware(ip, '/api/admin/templates');
    if (!rl.success) {
      const res = NextResponse.json({ error: 'Too many requests' }, { status: 429 });
      Object.entries(rl.headers).forEach(([k, v]) => res.headers.set(k, v));
      return res;
    }
    const csrfValid = await validateCsrf(request);
    if (!csrfValid) {
      return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = createTemplateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name, slug, description, category, thumbnail, sections, isPublic, fromPageId } =
      parsed.data;

    // If cloning from existing page, fetch its sections
    let finalSections = sections;
    if (fromPageId) {
      const sourcePage = await prisma.page.findUnique({
        where: { id: fromPageId },
        select: { sections: true },
      });
      if (sourcePage?.sections) {
        finalSections = Array.isArray(sourcePage.sections)
          ? (sourcePage.sections as unknown[])
          : [];
      }
    }

    // Check slug uniqueness (within tenant or global for system)
    const existing = await prisma.pageTemplate.findFirst({
      where: { slug, tenantId: null },
    });
    if (existing) {
      return NextResponse.json(
        { error: 'A template with this slug already exists' },
        { status: 409 }
      );
    }

    const template = await prisma.pageTemplate.create({
      data: {
        name,
        slug,
        description: description || null,
        category,
        thumbnail: thumbnail || null,
        sections: finalSections,
        isSystem: false,
        isPublic,
      },
    });

    logAdminAction({
      adminUserId: session.user.id,
      action: 'CREATE_PAGE_TEMPLATE',
      targetType: 'PageTemplate',
      targetId: template.id,
      newValue: { name, slug, category, sectionCount: finalSections.length },
      ipAddress: ip,
      userAgent: request.headers.get('user-agent') || undefined,
    }).catch((err) => {
      logger.error('[admin/templates] Non-blocking operation failed:', err);
    });

    return NextResponse.json({ template }, { status: 201 });
  } catch (error: unknown) {
    logger.error('Error creating template:', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});

// ── DELETE /api/admin/templates — delete a custom template ──────────

export const DELETE = withAdminGuard(async (request: NextRequest, { session }) => {
  try {
    const ip = getClientIpFromRequest(request);
    const rl = await rateLimitMiddleware(ip, '/api/admin/templates');
    if (!rl.success) {
      const res = NextResponse.json({ error: 'Too many requests' }, { status: 429 });
      Object.entries(rl.headers).forEach(([k, v]) => res.headers.set(k, v));
      return res;
    }
    const csrfValid = await validateCsrf(request);
    if (!csrfValid) {
      return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
    }

    // Cannot delete system templates
    const template = await prisma.pageTemplate.findUnique({ where: { id } });
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }
    if (template.isSystem) {
      return NextResponse.json(
        { error: 'System templates cannot be deleted' },
        { status: 403 }
      );
    }

    await prisma.pageTemplate.delete({ where: { id } });

    logAdminAction({
      adminUserId: session.user.id,
      action: 'DELETE_PAGE_TEMPLATE',
      targetType: 'PageTemplate',
      targetId: id,
      ipAddress: ip,
      userAgent: request.headers.get('user-agent') || undefined,
    }).catch((err) => {
      logger.error('[admin/templates] Non-blocking operation failed:', err);
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    logger.error('Error deleting template:', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
