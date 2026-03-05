export const dynamic = 'force-dynamic';

/**
 * Zapier Connector Webhook (M3)
 * POST /api/webhooks/zapier - Handle Zapier action requests (create lead, create deal, etc.)
 * GET  /api/webhooks/zapier - Provide sample data for Zapier trigger setup
 *
 * Auth: API key header validation (x-api-key)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

// ---------------------------------------------------------------------------
// API Key Validation
// ---------------------------------------------------------------------------

function validateApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get('x-api-key');
  const expectedKey = process.env.ZAPIER_API_KEY;

  if (!expectedKey) {
    logger.warn('[zapier] ZAPIER_API_KEY not configured');
    return false;
  }

  return apiKey === expectedKey;
}

// ---------------------------------------------------------------------------
// GET: Provide sample data for Zapier trigger setup
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  if (!validateApiKey(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const trigger = searchParams.get('trigger') || 'new_lead';

  switch (trigger) {
    case 'new_lead': {
      // Return a sample lead for Zapier trigger setup
      const lead = await prisma.crmLead.findFirst({
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          contactName: true,
          email: true,
          phone: true,
          companyName: true,
          source: true,
          status: true,
          score: true,
          createdAt: true,
        },
      });

      return NextResponse.json([
        lead || {
          id: 'sample_lead_001',
          contactName: 'John Doe',
          email: 'john@example.com',
          phone: '+15145551234',
          companyName: 'Acme Corp',
          source: 'WEB',
          status: 'NEW',
          score: 50,
          createdAt: new Date().toISOString(),
        },
      ]);
    }

    case 'new_deal': {
      const deal = await prisma.crmDeal.findFirst({
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          value: true,
          currency: true,
          createdAt: true,
        },
      });

      return NextResponse.json([
        deal || {
          id: 'sample_deal_001',
          title: 'Sample Deal',
          value: 5000,
          currency: 'CAD',
          createdAt: new Date().toISOString(),
        },
      ]);
    }

    default:
      return NextResponse.json({ error: `Unknown trigger: ${trigger}` }, { status: 400 });
  }
}

// ---------------------------------------------------------------------------
// POST: Handle Zapier action requests
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  if (!validateApiKey(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const action = body.action as string;

    if (!action) {
      return NextResponse.json({ error: 'action field is required' }, { status: 400 });
    }

    logger.info('[zapier] Action received', { action, body: JSON.stringify(body).slice(0, 500) });

    switch (action) {
      case 'create_lead': {
        const { contactName, email, phone, companyName, source } = body;

        if (!contactName) {
          return NextResponse.json({ error: 'contactName is required' }, { status: 400 });
        }

        const lead = await prisma.crmLead.create({
          data: {
            contactName,
            email: email || null,
            phone: phone || null,
            companyName: companyName || null,
            source: source || 'WEB',
            status: 'NEW',
          },
        });

        logger.info('[zapier] Lead created via Zapier', { leadId: lead.id });
        return NextResponse.json({ success: true, data: { id: lead.id, contactName: lead.contactName } }, { status: 201 });
      }

      case 'update_deal': {
        const { dealId, title, value, stageId } = body;

        if (!dealId) {
          return NextResponse.json({ error: 'dealId is required' }, { status: 400 });
        }

        const existing = await prisma.crmDeal.findUnique({
          where: { id: dealId },
          select: { id: true },
        });

        if (!existing) {
          return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updateData: Record<string, any> = {};
        if (title) updateData.title = title;
        if (value !== undefined) updateData.value = value;
        if (stageId) updateData.stageId = stageId;

        const deal = await prisma.crmDeal.update({
          where: { id: dealId },
          data: updateData,
          select: { id: true, title: true, value: true },
        });

        logger.info('[zapier] Deal updated via Zapier', { dealId: deal.id });
        return NextResponse.json({ success: true, data: deal });
      }

      case 'create_deal': {
        const { title: dealTitle, value: dealValue, pipelineId, stageId: dealStageId, assignedToId } = body;

        if (!dealTitle || !pipelineId || !dealStageId || !assignedToId) {
          return NextResponse.json({
            error: 'title, pipelineId, stageId, and assignedToId are required',
          }, { status: 400 });
        }

        const newDeal = await prisma.crmDeal.create({
          data: {
            title: dealTitle,
            value: dealValue || 0,
            pipelineId,
            stageId: dealStageId,
            assignedToId,
          },
          select: { id: true, title: true, value: true },
        });

        logger.info('[zapier] Deal created via Zapier', { dealId: newDeal.id });
        return NextResponse.json({ success: true, data: newDeal }, { status: 201 });
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (err) {
    logger.error('[zapier] Action failed', {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 }
    );
  }
}
