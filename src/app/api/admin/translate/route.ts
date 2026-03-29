export const dynamic = 'force-dynamic';
/**
 * API Admin — Automatic Translation (G30)
 *
 * POST /api/admin/translate
 * Body:
 *   { text: string, sourceLang: string, targetLang: string }
 *   OR
 *   { model: "Product"|..., entityId: string, targetLangs: string[], force?: boolean }
 *   OR
 *   { model: "Product"|..., all: true, targetLangs: string[] } (bulk translate)
 *
 * Uses DeepL API if DEEPL_API_KEY is set, otherwise falls back to the existing
 * GPT-4o-mini translation pipeline from lib/translation.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAdminGuard } from '@/lib/admin-api-guard';
import { logger } from '@/lib/logger';
import { logAdminAction, getClientIpFromRequest } from '@/lib/admin-audit';
import {
  translateText,
  translateEntity,
  translateEntityAllLocales,
  type TranslatableModel,
} from '@/lib/translation';
import { translateWithDeepL, isDeepLAvailable } from '@/lib/translation/deepl-client';

// ── Schemas ─────────────────────────────────────────────────

const textTranslateSchema = z.object({
  text: z.string().min(1),
  sourceLang: z.string().min(2).max(10),
  targetLang: z.string().min(2).max(10),
});

const entityTranslateSchema = z.object({
  model: z.enum(['Product', 'ProductOption', 'Category', 'Article', 'BlogPost', 'Video', 'Webinar', 'QuickReply', 'Faq']),
  entityId: z.string().min(1).optional(),
  targetLangs: z.array(z.string()).optional(),
  force: z.boolean().optional().default(false),
  all: z.boolean().optional().default(false),
});

export const POST = withAdminGuard(async (request: NextRequest, { session }) => {
  try {
    const body = await request.json();

    // ── Simple text translation ───────────────────────────
    if (body.text && body.sourceLang && body.targetLang) {
      const parsed = textTranslateSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
      }

      const { text, sourceLang, targetLang } = parsed.data;
      let translated: string;
      let engine: string;

      // Prefer DeepL if available
      if (isDeepLAvailable()) {
        translated = await translateWithDeepL(text, sourceLang, targetLang);
        engine = 'deepl';
      } else {
        translated = await translateText(text, targetLang);
        engine = 'gpt-4o-mini';
      }

      return NextResponse.json({ translated, engine, sourceLang, targetLang });
    }

    // ── Entity translation ────────────────────────────────
    const parsed = entityTranslateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid data', details: parsed.error.flatten() }, { status: 400 });
    }

    const { model, entityId, targetLangs, force, all } = parsed.data;

    // Bulk translate ALL entities of a model
    if (all) {
      const { prisma } = await import('@/lib/db');
      const sourceModelName = model === 'ProductOption'
        ? 'productOption'
        : model.charAt(0).toLowerCase() + model.slice(1);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Dynamic Prisma model access
      const entities = await ((prisma as Record<string, any>)[sourceModelName]).findMany({
        select: { id: true },
      });

      // Queue translations asynchronously
      let queued = 0;
      const { enqueue } = await import('@/lib/translation');
      for (const entity of entities) {
        const enqueueKey = model === 'ProductOption' ? 'productOption' :
          model === 'BlogPost' ? 'blogPost' :
          model === 'QuickReply' ? 'quickReply' :
          (model.charAt(0).toLowerCase() + model.slice(1)) as keyof typeof enqueue;
        enqueue[enqueueKey](entity.id, force);
        queued++;
      }

      logAdminAction({
        adminUserId: session.user.id,
        action: 'BULK_AUTO_TRANSLATE',
        targetType: model,
        targetId: 'all',
        newValue: { model, queued, force },
        ipAddress: getClientIpFromRequest(request),
        userAgent: request.headers.get('user-agent') || undefined,
      }).catch(err => logger.error('[Translate] Audit error', { error: String(err) }));

      return NextResponse.json({
        message: `${queued} ${model}(s) queued for translation`,
        queued,
      });
    }

    // Single entity
    if (!entityId) {
      return NextResponse.json({ error: 'entityId or all:true is required' }, { status: 400 });
    }

    if (targetLangs && targetLangs.length > 0) {
      const results = await Promise.allSettled(
        targetLangs.map(locale =>
          translateEntity(model as TranslatableModel, entityId, locale, { force })
        )
      );
      const successful = results.filter(r => r.status === 'fulfilled' && r.value).length;
      const failed = results.filter(r => r.status === 'rejected').length;

      return NextResponse.json({ successful, failed, total: targetLangs.length });
    }

    // Translate to all locales
    const results = await translateEntityAllLocales(model as TranslatableModel, entityId, { force });

    logAdminAction({
      adminUserId: session.user.id,
      action: 'AUTO_TRANSLATE_ENTITY',
      targetType: model,
      targetId: entityId,
      newValue: { model, entityId, locales: results.length },
      ipAddress: getClientIpFromRequest(request),
      userAgent: request.headers.get('user-agent') || undefined,
    }).catch(err => logger.error('[Translate] Audit error', { error: String(err) }));

    return NextResponse.json({
      message: `Translated ${model}#${entityId} to ${results.length} locales`,
      translatedLocales: results.length,
      locales: results.map(r => r.locale),
    });
  } catch (error) {
    logger.error('[Translate] Error', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Translation failed' }, { status: 500 });
  }
});
