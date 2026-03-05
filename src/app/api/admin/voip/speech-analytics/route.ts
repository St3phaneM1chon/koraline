export const dynamic = 'force-dynamic';

/**
 * Speech Analytics API (VAD)
 *
 * POST /api/admin/voip/speech-analytics
 *   Analyze talk-time analytics from pre-computed VAD data.
 *
 *   Body: {
 *     action: "analyze-single" | "analyze-dual" | "get-config",
 *     agentData?: TalkTimeAnalytics,   // for dual analysis
 *     callerData?: TalkTimeAnalytics,  // for dual analysis
 *     data?: TalkTimeAnalytics,        // for single analysis
 *     config?: Partial<VadConfig>,     // for get-config / override
 *   }
 *
 *   "analyze-single": Returns TalkTimeAnalytics summary for one audio channel.
 *   "analyze-dual": Combines agent + caller analytics into DualChannelAnalytics.
 *   "get-config": Returns the default VadConfig for client-side VAD initialization.
 *
 * Authentication: Admin guard (EMPLOYEE | OWNER).
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAdminGuard } from '@/lib/admin-api-guard';
import { apiSuccess, apiError } from '@/lib/api-response';
import { ErrorCode } from '@/lib/error-codes';
import { logger } from '@/lib/logger';
import {
  VadAnalyzer,
  type TalkTimeAnalytics,
  type DualChannelAnalytics,
  type VadConfig,
} from '@/lib/voip/vad-analytics';

// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------

const talkTimeSchema = z.object({
  totalDuration: z.number(),
  totalSpeechTime: z.number(),
  totalSilenceTime: z.number(),
  talkRatio: z.number(),
  speechSegments: z.number(),
  avgSpeechDuration: z.number(),
  silenceSegments: z.number(),
  avgSilenceDuration: z.number(),
  longestSilence: z.number(),
  speakingPace: z.number(),
});

const vadConfigSchema = z.object({
  threshold: z.number().min(0).max(1).optional(),
  minSpeechDuration: z.number().positive().optional(),
  minSilenceDuration: z.number().positive().optional(),
  windowSize: z.number().positive().optional(),
  smoothing: z.number().min(0).max(1).optional(),
});

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export const POST = withAdminGuard(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'analyze-dual': {
        const agentParsed = talkTimeSchema.safeParse(body.agentData);
        const callerParsed = talkTimeSchema.safeParse(body.callerData);

        if (!agentParsed.success || !callerParsed.success) {
          return apiError(
            'agentData and callerData must be valid TalkTimeAnalytics objects',
            ErrorCode.VALIDATION_ERROR,
            {
              request,
              status: 400,
              details: {
                agentErrors: agentParsed.success ? null : agentParsed.error.flatten(),
                callerErrors: callerParsed.success ? null : callerParsed.error.flatten(),
              },
            }
          );
        }

        const result: DualChannelAnalytics = VadAnalyzer.analyzeDualChannel(
          agentParsed.data as TalkTimeAnalytics,
          callerParsed.data as TalkTimeAnalytics
        );

        return apiSuccess(
          { analytics: result, analyzedAt: new Date().toISOString() },
          { request }
        );
      }

      case 'analyze-single': {
        const dataParsed = talkTimeSchema.safeParse(body.data);
        if (!dataParsed.success) {
          return apiError(
            'data must be a valid TalkTimeAnalytics object',
            ErrorCode.VALIDATION_ERROR,
            { request, status: 400, details: dataParsed.error.flatten() }
          );
        }

        // Return enriched analytics with quality indicators
        const data = dataParsed.data as TalkTimeAnalytics;
        const qualityIndicators = {
          talkRatioLabel: data.talkRatio > 0.7
            ? 'high' : data.talkRatio > 0.4
              ? 'normal' : 'low',
          longestSilenceAlert: data.longestSilence > 10,
          speakingPaceLabel: data.speakingPace > 20
            ? 'fast' : data.speakingPace > 8
              ? 'normal' : 'slow',
        };

        return apiSuccess(
          {
            analytics: data,
            qualityIndicators,
            analyzedAt: new Date().toISOString(),
          },
          { request }
        );
      }

      case 'get-config': {
        const configOverride = body.config ? vadConfigSchema.safeParse(body.config) : null;
        const defaultConfig: VadConfig = {
          threshold: 0.015,
          minSpeechDuration: 250,
          minSilenceDuration: 500,
          windowSize: 1024,
          smoothing: 0.85,
        };

        const finalConfig = configOverride?.success
          ? { ...defaultConfig, ...configOverride.data }
          : defaultConfig;

        return apiSuccess({ config: finalConfig }, { request });
      }

      default:
        return apiError(
          `Unknown action: ${action}. Valid actions: analyze-single, analyze-dual, get-config`,
          ErrorCode.VALIDATION_ERROR,
          { request, status: 400 }
        );
    }
  } catch (error) {
    logger.error('[speech-analytics] POST error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return apiError('Speech analytics processing failed', ErrorCode.INTERNAL_ERROR, { request });
  }
});
