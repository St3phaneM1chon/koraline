export const dynamic = 'force-dynamic';

/**
 * CRM Duplicate Detection - Single Lead API
 * GET  /api/admin/crm/duplicates/[id] - Find duplicates for a specific lead
 * POST /api/admin/crm/duplicates/[id] - Merge two leads
 */

import { NextRequest } from 'next/server';
import { withAdminGuard } from '@/lib/admin-api-guard';
import { apiSuccess, apiError } from '@/lib/api-response';
import { findDuplicatesForLead, mergeLeads } from '@/lib/crm/dedup-engine';

// ---------------------------------------------------------------------------
// GET: Find duplicates for a specific lead
// ---------------------------------------------------------------------------

export const GET = withAdminGuard(async (
  request: NextRequest,
  { params }: { session: unknown; params: Promise<{ id: string }> }
) => {
  const { id } = await params;

  const duplicates = await findDuplicatesForLead(id);

  return apiSuccess(duplicates, { request });
});

// ---------------------------------------------------------------------------
// POST: Merge two leads (keep survivor, absorb merged)
// ---------------------------------------------------------------------------

export const POST = withAdminGuard(async (
  request: NextRequest,
  { params }: { session: unknown; params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const body = await request.json();

  const { survivorId, mergedId } = body;

  if (!survivorId || !mergedId) {
    return apiError('Missing survivorId or mergedId', 'VALIDATION_ERROR', {
      status: 400,
      request,
    });
  }

  // Ensure at least one of the IDs matches the route param
  if (survivorId !== id && mergedId !== id) {
    return apiError(
      'Route id must match either survivorId or mergedId',
      'VALIDATION_ERROR',
      { status: 400, request }
    );
  }

  const result = await mergeLeads(survivorId, mergedId);

  return apiSuccess(result, { request });
});
