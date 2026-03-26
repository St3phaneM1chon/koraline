export const dynamic = 'force-dynamic';

/**
 * #60 Tenant Usage Quotas API
 * GET /api/admin/tenant/quotas?tenantId=xxx
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAdminGuard } from '@/lib/admin-api-guard';
import { getTenantQuota } from '@/lib/tenant-usage-quotas';
import { logger } from '@/lib/logger';

async function handler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const plan = searchParams.get('plan') || 'starter';

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId is required' }, { status: 400 });
    }

    const quota = await getTenantQuota(tenantId, plan);
    return NextResponse.json({ data: quota });
  } catch (error) {
    logger.error('[tenant-quotas] API error:', error);
    return NextResponse.json({ error: 'Failed to fetch quotas' }, { status: 500 });
  }
}

export const GET = withAdminGuard(handler);
