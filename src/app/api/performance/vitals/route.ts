/**
 * POST /api/performance/vitals
 * Receives batched Core Web Vitals from the client-side tracker.
 * Public endpoint — accepts data from any visitor.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { checkRateLimit } from '@/lib/security';
import { logger } from '@/lib/logger';

const VitalSchema = z.object({
  page: z.string().max(500),
  metric: z.enum(['LCP', 'FID', 'CLS', 'TTFB', 'INP']),
  value: z.number().min(0).max(100000),
  rating: z.enum(['good', 'needs-improvement', 'poor']),
});

const BatchSchema = z.object({
  vitals: z.array(VitalSchema).min(1).max(20),
});

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const rl = checkRateLimit(`perf-vitals:${ip}`, 30, 60000);
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  try {
    const body = await request.json();
    const parsed = BatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const tenantId = request.headers.get('x-tenant-id') || 'default';
    const userAgent = request.headers.get('user-agent') || null;

    // Batch insert all vitals in a single transaction
    await prisma.$transaction(
      parsed.data.vitals.map((v) =>
        prisma.webVitalEntry.create({
          data: {
            tenantId,
            page: v.page,
            metric: v.metric,
            value: v.value,
            rating: v.rating,
            userAgent,
          },
        }),
      ),
    );

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    logger.error('[performance] Failed to store vitals', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
