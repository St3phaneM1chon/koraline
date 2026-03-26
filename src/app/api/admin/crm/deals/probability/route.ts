export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { withAdminGuard } from '@/lib/admin-api-guard';
import { calculateDealProbability, getPipelineProbabilities } from '@/lib/crm/deal-probability';

async function handler(request: NextRequest) {
  const dealId = new URL(request.url).searchParams.get('dealId');
  if (dealId) {
    const result = await calculateDealProbability(dealId);
    if (!result) return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    return NextResponse.json({ data: result });
  }
  const pipeline = await getPipelineProbabilities();
  return NextResponse.json({ data: { deals: pipeline } });
}
export const GET = withAdminGuard(handler);
