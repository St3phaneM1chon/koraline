export const dynamic = 'force-dynamic';

/**
 * @deprecated Use /api/cron/fx-rate-sync instead (Bank of Canada official rates).
 * This route existed as a duplicate using open.er-api.com.
 * It now returns a deprecation notice and a redirect pointer.
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(_request: NextRequest) {
  return NextResponse.json(
    {
      deprecated: true,
      message: 'This endpoint is deprecated. Use /api/cron/fx-rate-sync instead.',
      redirect: '/api/cron/fx-rate-sync',
    },
    { status: 410 }
  );
}

export async function POST(request: NextRequest) {
  return GET(request);
}
