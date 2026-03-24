export const dynamic = 'force-dynamic';

/**
 * Bundle detail API
 * GET /api/lms/bundles/[slug] — Get bundle with courses and pricing
 */
import { NextRequest, NextResponse } from 'next/server';
import { getBundleBySlug, resolvePricing } from '@/lib/lms/lms-service';
import { prisma } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const tenantId = request.headers.get('x-tenant-id') ||
    (await prisma.tenant.findFirst({ where: { status: 'ACTIVE' } }))?.id || '';

  if (!tenantId) {
    return NextResponse.json({ error: 'No tenant context' }, { status: 400 });
  }

  const bundle = await getBundleBySlug(tenantId, slug);
  if (!bundle) {
    return NextResponse.json({ error: 'Bundle not found' }, { status: 404 });
  }

  // Resolve pricing (check if user has corporate context)
  const corporateAccountId = request.headers.get('x-corporate-account-id') || null;
  const pricing = await resolvePricing(
    { price: bundle.price, corporatePrice: bundle.corporatePrice, currency: bundle.currency },
    corporateAccountId
  );

  return NextResponse.json({
    data: {
      ...bundle,
      pricing,
    },
  });
}
