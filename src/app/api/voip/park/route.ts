export const dynamic = 'force-dynamic';

/**
 * VoIP Park Proxy
 * POST /api/voip/park — Park an active call
 *
 * Called by useVoip.ts parkCall(). Proxies to the admin park route logic.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { parkCall, getParkedCalls } from '@/lib/voip/call-park';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const parkedCalls = getParkedCalls('default');
    return NextResponse.json({ parkedCalls, count: parkedCalls.length });
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
    const { callId } = body as {
      callId: string;
      lineNumber?: number;
      remoteNumber?: string;
    };

    if (!callId) {
      return NextResponse.json({ error: 'callId required' }, { status: 400 });
    }

    const result = await parkCall(callId, session.user.id, 'default');

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Park failed' }, { status: 422 });
    }

    return NextResponse.json({ parked: true, orbit: result.orbit });
  } catch {
    return NextResponse.json({ error: 'Park operation failed' }, { status: 500 });
  }
}
