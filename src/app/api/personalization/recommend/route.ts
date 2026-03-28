/**
 * GET /api/personalization/recommend?visitorId=xxx
 * Returns personalized recommendations and active rules for a visitor.
 * Public endpoint — returns only non-sensitive recommendation data.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRecommendations } from '@/lib/personalization/engine';
import { checkRateLimit } from '@/lib/security';

export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const rl = checkRateLimit(`perso-rec:${ip}`, 60, 60000);
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const visitorId = searchParams.get('visitorId');

  if (!visitorId || visitorId.length > 128) {
    return NextResponse.json({ error: 'visitorId is required' }, { status: 400 });
  }

  const tenantId = request.headers.get('x-tenant-id') || 'default';
  const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 50);

  try {
    const result = await getRecommendations(tenantId, visitorId, limit);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal error', message: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 },
    );
  }
}
