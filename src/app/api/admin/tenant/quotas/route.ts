export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { withAdminGuard } from '@/lib/admin-api-guard';
import { getTenantQuota } from '@/lib/tenant-usage-quotas';

async function handler(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get('tenantId');
  if (!tenantId) return NextResponse.json({ error: 'tenantId required' }, { status: 400 });
  const quota = await getTenantQuota(tenantId, searchParams.get('plan') || 'starter');
  return NextResponse.json({ data: quota });
}
export const GET = withAdminGuard(handler);
