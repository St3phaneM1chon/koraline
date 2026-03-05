/**
 * CRM Whisper Pre-Connect - D11
 *
 * Plays an audio or TTS whisper message to the agent before connecting
 * them to the customer. Gives the agent context about the lead and
 * campaign before the customer hears anything.
 *
 * Integration: Telnyx call control API (playback_start / speak).
 */

import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WhisperConfig {
  campaignId: string;
  enabled: boolean;
  mode: 'tts' | 'audio';
  message?: string;
  audioUrl?: string;
  includeLeadName: boolean;
  includeCampaignName: boolean;
  language: string;
  voice?: string;
}

export interface WhisperPlayResult {
  success: boolean;
  message: string;
  whisperText?: string;
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const DEFAULT_CONFIG: Omit<WhisperConfig, 'campaignId'> = {
  enabled: true,
  mode: 'tts',
  message: 'Incoming call from campaign: {campaignName}. Lead: {leadName}.',
  includeLeadName: true,
  includeCampaignName: true,
  language: 'en-US',
};

// ---------------------------------------------------------------------------
// getWhisperConfig
// ---------------------------------------------------------------------------

export async function getWhisperConfig(campaignId: string): Promise<WhisperConfig> {
  const campaign = await prisma.crmCampaign.findUnique({
    where: { id: campaignId },
    select: { targetCriteria: true },
  });
  const meta = (campaign?.targetCriteria as Record<string, unknown>) || {};
  const stored = meta.whisperConfig as Partial<WhisperConfig> | undefined;
  return { ...DEFAULT_CONFIG, ...stored, campaignId };
}

// ---------------------------------------------------------------------------
// configureWhisper
// ---------------------------------------------------------------------------

export async function configureWhisper(
  campaignId: string,
  config: Partial<Omit<WhisperConfig, 'campaignId'>>,
): Promise<WhisperConfig> {
  const campaign = await prisma.crmCampaign.findUniqueOrThrow({
    where: { id: campaignId },
    select: { targetCriteria: true },
  });
  const meta = (campaign.targetCriteria as Record<string, unknown>) || {};
  const existing = (meta.whisperConfig as Partial<WhisperConfig>) || {};
  const merged: WhisperConfig = { ...DEFAULT_CONFIG, ...existing, ...config, campaignId };
  meta.whisperConfig = merged;
  await prisma.crmCampaign.update({ where: { id: campaignId }, data: { targetCriteria: meta as unknown as Prisma.InputJsonValue } });
  logger.info('Whisper pre-connect: config saved', { event: 'whisper_config_saved', campaignId, mode: merged.mode });
  return merged;
}

// ---------------------------------------------------------------------------
// playWhisperMessage
// ---------------------------------------------------------------------------

/**
 * Play a whisper message to the agent before connecting to the customer.
 * In production, integrates with Telnyx speak/playback_start API.
 */
export async function playWhisperMessage(
  agentCallId: string,
  config: WhisperConfig,
  context?: { leadName?: string; leadPhone?: string; campaignName?: string },
): Promise<WhisperPlayResult> {
  if (!config.enabled) {
    return { success: true, message: 'Whisper disabled for this campaign' };
  }

  if (config.mode === 'audio' && config.audioUrl) {
    // TODO: telnyx.calls.playbackStart(agentCallId, { audio_url: config.audioUrl })
    logger.info('Whisper pre-connect: audio queued', { event: 'whisper_audio_played', agentCallId, audioUrl: config.audioUrl });
    return { success: true, message: `Audio whisper queued: ${config.audioUrl}` };
  }

  // TTS mode: substitute variables
  let whisperText = config.message || DEFAULT_CONFIG.message || '';
  const vars: Record<string, string> = {
    campaignName: context?.campaignName || 'Unknown Campaign',
    leadName: context?.leadName || 'Unknown',
    leadPhone: context?.leadPhone || '',
  };
  whisperText = whisperText.replace(/\{(\w+)\}/g, (_m, k: string) => vars[k] || '');

  // TODO: telnyx.calls.speak(agentCallId, { payload: whisperText, language: config.language })
  logger.info('Whisper pre-connect: TTS queued', { event: 'whisper_tts_played', agentCallId, campaignId: config.campaignId, textLength: whisperText.length });
  return { success: true, message: 'TTS whisper queued for agent', whisperText };
}
