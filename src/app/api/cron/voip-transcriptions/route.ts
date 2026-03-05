export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { processPendingTranscriptions } from '@/lib/voip/transcription';
import { KeywordDetector, type KeywordAlert } from '@/lib/voip/keyword-detection';
import { withJobLock } from '@/lib/cron-lock';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

/**
 * POST /api/cron/voip-transcriptions
 * Cron job to transcribe uploaded call recordings via OpenAI Whisper + GPT-4o-mini.
 *
 * Runs every 30 minutes. Picks uploaded but untranscribed recordings,
 * sends to Whisper for STT, then GPT-4o-mini for summary/sentiment/action items.
 *
 * Authentication: Requires CRON_SECRET in Authorization header
 */
export async function POST(request: NextRequest) {
  // Verify cron secret (timing-safe comparison)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    logger.error('CRON_SECRET not configured');
    return NextResponse.json(
      { error: 'Cron secret not configured' },
      { status: 500 }
    );
  }

  const providedSecret = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : '';
  let secretsMatch = false;
  try {
    const a = Buffer.from(cronSecret, 'utf8');
    const b = Buffer.from(providedSecret, 'utf8');
    secretsMatch = a.length === b.length && timingSafeEqual(a, b);
  } catch { secretsMatch = false; }

  if (!secretsMatch) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Skip if OpenAI not configured (transcription won't work)
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({
      skipped: true,
      reason: 'OPENAI_API_KEY not configured',
    });
  }

  return withJobLock('voip-transcriptions', async () => {
    try {
      const transcribed = await processPendingTranscriptions(5);

      // ── Keyword detection on newly transcribed recordings ────────────
      let keywordAlertCount = 0;
      if (transcribed > 0) {
        keywordAlertCount = await runKeywordDetectionOnRecent(transcribed);
      }

      logger.info('[Cron] voip-transcriptions completed', {
        transcribed,
        keywordAlertCount,
      });

      return NextResponse.json({
        success: true,
        transcribed,
        keywordAlertCount,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('[Cron] voip-transcriptions failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      return NextResponse.json(
        { error: 'Transcription processing failed' },
        { status: 500 }
      );
    }
  }, { maxDurationMs: 10 * 60 * 1000 }); // 10 min timeout (Whisper can be slow)
}

// ---------------------------------------------------------------------------
// Keyword detection helper — runs after transcription completes
// ---------------------------------------------------------------------------

async function runKeywordDetectionOnRecent(limit: number): Promise<number> {
  try {
    // Fetch recently transcribed recordings (last 30 minutes, matching cron interval)
    const recent = await prisma.callTranscription.findMany({
      where: {
        createdAt: { gte: new Date(Date.now() - 30 * 60 * 1000) },
      },
      select: {
        id: true,
        callLogId: true,
        fullText: true,
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    if (recent.length === 0) return 0;

    const detector = new KeywordDetector();
    const allAlerts: Array<KeywordAlert & { transcriptionId: string; callLogId: string }> = [];

    for (const transcription of recent) {
      if (!transcription.fullText) continue;

      // Run detection on the full transcription text (assume customer speaker for post-call analysis)
      const alerts = detector.detect(transcription.fullText, 'customer');

      for (const alert of alerts) {
        allAlerts.push({
          ...alert,
          transcriptionId: transcription.id,
          callLogId: transcription.callLogId,
        });
      }

      // Reset deduplication between transcriptions
      detector.reset();
    }

    if (allAlerts.length > 0) {
      logger.info('[Cron] Keyword alerts detected in transcriptions', {
        alertCount: allAlerts.length,
        criticalCount: allAlerts.filter((a) => a.alertLevel === 'critical').length,
        categories: [...new Set(allAlerts.map((a) => a.category))],
      });
    }

    return allAlerts.length;
  } catch (error) {
    logger.warn('[Cron] Keyword detection failed (non-fatal)', {
      error: error instanceof Error ? error.message : String(error),
    });
    return 0;
  }
}
