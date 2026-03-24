export const dynamic = 'force-dynamic';

/**
 * Public bundle catalog API
 * GET /api/lms/bundles — List available course bundles
 */
import { NextRequest, NextResponse } from 'next/server';
import { getBundles } from '@/lib/lms/lms-service';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  // Get tenantId from header or default
  const tenantId = request.headers.get('x-tenant-id') ||
    (await prisma.tenant.findFirst({ where: { status: 'ACTIVE' } }))?.id || '';

  if (!tenantId) {
    return NextResponse.json({ error: 'No tenant context' }, { status: 400 });
  }

  const bundles = await getBundles(tenantId);
  return NextResponse.json({ data: bundles });
}
