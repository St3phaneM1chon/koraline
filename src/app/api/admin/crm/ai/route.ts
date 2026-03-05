export const dynamic = 'force-dynamic';

/**
 * CRM AI Assistant API
 * POST /api/admin/crm/ai - Perform AI-powered CRM actions
 *
 * Actions:
 * - score_lead:      Score a lead using AI analysis
 * - score_deal:      Score a deal using AI analysis
 * - email_suggestion: Generate an email suggestion for a lead/deal
 * - call_summary:    Summarize a call transcription
 */

import { NextRequest } from 'next/server';
import { withAdminGuard } from '@/lib/admin-api-guard';
import { apiSuccess, apiError } from '@/lib/api-response';
import {
  aiLeadScore,
  aiDealScore,
  generateEmailSuggestion,
  generateCallSummary,
} from '@/lib/crm/ai-assistant';

// ---------------------------------------------------------------------------
// POST: Dispatch AI action
// ---------------------------------------------------------------------------

export const POST = withAdminGuard(async (request: NextRequest) => {
  const body = await request.json();
  const { action } = body;

  if (!action) {
    return apiError('Missing action field', 'VALIDATION_ERROR', {
      status: 400,
      request,
    });
  }

  switch (action) {
    case 'score_lead': {
      if (!body.leadId) {
        return apiError('Missing leadId for score_lead action', 'VALIDATION_ERROR', {
          status: 400,
          request,
        });
      }
      const result = await aiLeadScore(body.leadId);
      return apiSuccess(result, { request });
    }

    case 'score_deal': {
      if (!body.dealId) {
        return apiError('Missing dealId for score_deal action', 'VALIDATION_ERROR', {
          status: 400,
          request,
        });
      }
      const result = await aiDealScore(body.dealId);
      return apiSuccess(result, { request });
    }

    case 'email_suggestion': {
      if (!body.leadId && !body.dealId) {
        return apiError('Missing leadId or dealId for email_suggestion action', 'VALIDATION_ERROR', {
          status: 400,
          request,
        });
      }
      const result = await generateEmailSuggestion({
        leadId: body.leadId,
        dealId: body.dealId,
        purpose: body.purpose,
        language: body.language,
      });
      return apiSuccess(result, { request });
    }

    case 'call_summary': {
      if (!body.transcriptionText) {
        return apiError('Missing transcriptionText for call_summary action', 'VALIDATION_ERROR', {
          status: 400,
          request,
        });
      }
      const result = await generateCallSummary(body.transcriptionText);
      return apiSuccess(result, { request });
    }

    default:
      return apiError(
        `Unknown action: ${action}. Valid actions: score_lead, score_deal, email_suggestion, call_summary`,
        'VALIDATION_ERROR',
        { status: 400, request }
      );
  }
});
