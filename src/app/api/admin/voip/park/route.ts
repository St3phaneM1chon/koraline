export const dynamic = 'force-dynamic';

/**
 * VoIP Call Park API (proxy to park-slots)
 * Called by Softphone.tsx — aliases /api/admin/voip/park-slots
 *
 * GET  — List parked calls
 * POST — Park or retrieve a call
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { getParkedCalls, parkCall, retrieveParkedCall } from '@/lib/voip/call-park';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const companyId = 'default';
    const parkedCalls = getParkedCalls(companyId);

    return NextResponse.json({
      parkedCalls,
      count: parkedCalls.length,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to list parked calls' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action, callControlId, orbit } = body as {
      action: 'park' | 'retrieve';
      callControlId?: string;
      orbit?: number;
    };

    if (action === 'retrieve' && orbit && callControlId) {
      const result = await retrieveParkedCall(orbit, callControlId);
      if (!result.success) {
        return NextResponse.json({ error: result.error || 'Retrieve failed' }, { status: 422 });
      }
      return NextResponse.json({ retrieved: true });
    }

    if (action === 'park' && callControlId) {
      const result = await parkCall(callControlId, session.user.id, 'default');
      if (!result.success) {
        return NextResponse.json({ error: result.error || 'Park failed' }, { status: 422 });
      }
      return NextResponse.json({ parked: true, orbit: result.orbit });
    }

    return NextResponse.json({ error: 'Invalid action or missing params' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: 'Park operation failed' }, { status: 500 });
  }
}
