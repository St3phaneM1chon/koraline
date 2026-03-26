export const dynamic = 'force-dynamic';

/**
 * #43 Financial Ratio Analysis API
 * GET /api/admin/accounting/ratios
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAdminGuard } from '@/lib/admin-api-guard';
import { calculateFinancialRatios } from '@/lib/accounting/financial-ratios';
import { logger } from '@/lib/logger';

async function handler(_request: NextRequest) {
  try {
    const report = await calculateFinancialRatios();
    return NextResponse.json({ data: report });
  } catch (error) {
    logger.error('[financial-ratios] API error:', error);
    return NextResponse.json({ error: 'Failed to calculate ratios' }, { status: 500 });
  }
}

export const GET = withAdminGuard(handler);
