/**
 * POST /api/personalization/track
 * Track visitor events (page views, product views, cart actions, purchases).
 * Public endpoint — no auth required (uses anonymous visitorId from cookie).
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { trackEvent } from '@/lib/personalization/engine';
import { checkRateLimit } from '@/lib/security';

const TrackSchema = z.object({
  visitorId: z.string().min(1).max(128),
  userId: z.string().optional(),
  type: z.enum(['page_view', 'product_view', 'add_to_cart', 'purchase', 'search', 'click']),
  target: z.string().max(500).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export async function POST(request: NextRequest) {
  // Rate limit: 120 events per minute per IP (generous for page tracking)
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const rl = checkRateLimit(`perso-track:${ip}`, 120, 60000);
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  try {
    const body = await request.json();
    const parsed = TrackSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }

    const { visitorId, userId, type, target, metadata } = parsed.data;

    // tenantId from header or default
    const tenantId = request.headers.get('x-tenant-id') || 'default';

    await trackEvent({
      tenantId,
      visitorId,
      userId,
      type,
      target,
      metadata,
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal error', message: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 },
    );
  }
}
