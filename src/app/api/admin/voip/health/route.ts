export const dynamic = 'force-dynamic';

/**
 * VoIP Health Check API
 * GET /api/admin/voip/health — Returns basic health info for pre-call test
 * HEAD /api/admin/voip/health — Quick connectivity check
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { prisma } from '@/lib/db';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Check DB connectivity
    const dbOk = await prisma.$queryRaw`SELECT 1`.then(() => true).catch(() => false);

    // Check if user has a SIP extension
    const ext = await prisma.sipExtension.findFirst({
      where: { userId: session.user.id },
      select: { id: true, sipDomain: true, status: true, isRegistered: true },
    });

    // Check VoIP connection config
    const connection = await prisma.voipConnection.findFirst({
      where: { isEnabled: true },
      select: { id: true, provider: true, pbxHost: true, syncStatus: true },
    });

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: dbOk ? 'connected' : 'error',
      sipExtension: ext ? {
        configured: true,
        domain: ext.sipDomain,
        agentStatus: ext.status,
        registered: ext.isRegistered,
      } : { configured: false },
      pbx: connection ? {
        provider: connection.provider,
        host: connection.pbxHost,
        syncStatus: connection.syncStatus,
      } : { provider: null },
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Health check failed',
    }, { status: 500 });
  }
}

export async function HEAD() {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse(null, { status: 401 });
  }
  return new NextResponse(null, { status: 200 });
}
