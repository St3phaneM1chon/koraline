export const dynamic = 'force-dynamic';

/**
 * VoIP Call Park Slots API
 *
 * GET  /api/admin/voip/park-slots — List currently parked calls
 * POST /api/admin/voip/park-slots — Park an active call
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { auth } from '@/lib/auth-config';
import { getParkedCalls, parkCall } from '@/lib/voip/call-park';

/**
 * GET - List all currently parked calls for a company.
 * Query: ?companyId=xxx
 */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json(
        { error: 'Missing companyId query parameter' },
        { status: 400 }
      );
    }

    const parkedCalls = getParkedCalls(companyId);

    return NextResponse.json({
      data: {
        parkedCalls,
        count: parkedCalls.length,
        totalSlots: 20, // 701-720
        availableSlots: 20 - parkedCalls.length,
      },
    });
  } catch (error) {
    logger.error('[VoIP ParkSlots] Failed to list parked calls', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Failed to list parked calls' }, { status: 500 });
  }
}

/**
 * POST - Park an active call on the next available orbit slot.
 * Body: { callControlId, companyId, callerNumber?, callerName?, preferredOrbit?, timeout? }
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { callControlId, companyId, callerNumber, callerName, preferredOrbit, timeout } =
      body as {
        callControlId: string;
        companyId: string;
        callerNumber?: string;
        callerName?: string;
        preferredOrbit?: number;
        timeout?: number;
      };

    if (!callControlId || !companyId) {
      return NextResponse.json(
        { error: 'Missing required fields: callControlId, companyId' },
        { status: 400 }
      );
    }

    const result = await parkCall(callControlId, session.user.id, companyId, {
      callerNumber,
      callerName,
      preferredOrbit,
      timeout,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error ?? 'Failed to park call' },
        { status: 422 }
      );
    }

    return NextResponse.json({
      data: {
        orbit: result.orbit,
        callControlId,
        parkedBy: session.user.id,
      },
    }, { status: 201 });
  } catch (error) {
    logger.error('[VoIP ParkSlots] Failed to park call', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Failed to park call' }, { status: 500 });
  }
}
