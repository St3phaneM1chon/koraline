export const dynamic = 'force-dynamic';

/**
 * G27 — Test webhook endpoint
 * POST - Send a test ping to verify connectivity
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAdminGuard } from '@/lib/admin-api-guard';
import { testWebhook } from '@/lib/integrations/webhook-dispatcher';
import { logger } from '@/lib/logger';

export const POST = withAdminGuard(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const { id } = await params;

  try {
    const result = await testWebhook(id);

    logger.info('[Integrations] Webhook test completed', {
      webhookId: id,
      success: result.success,
      statusCode: result.statusCode,
    });

    return NextResponse.json(result);
  } catch (error) {
    logger.error('[Integrations] Webhook test error', {
      webhookId: id,
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: 'Test failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
});
