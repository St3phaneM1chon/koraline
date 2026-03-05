/**
 * CRM Voice Biometrics / Caller Verification - C19
 *
 * Framework for verifying caller identity using voice patterns. In production,
 * real voice biometrics requires a specialized API (Nuance, NICE, ID R&D).
 * This module implements the integration scaffold + CRM data flow:
 * - Voiceprint enrollment (store reference hash in CrmLead metadata)
 * - Voice verification against stored voiceprints
 * - Verification result handling (PASS / FAIL / MANUAL_REVIEW)
 * - Statistics and audit trail
 *
 * Functions:
 * - enrollVoicePrint: Create voice print from audio samples
 * - verifyVoice: Compare current audio against stored voiceprint
 * - getVerificationScore: Similarity score between two samples
 * - handleVerificationResult: Process PASS/FAIL/MANUAL_REVIEW
 * - getVoiceBiometricStats: Verification performance metrics
 */

import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import crypto from 'crypto';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface VoicePrint {
  /** Hash of the voiceprint (simulated; in production, this is a vendor-specific ID) */
  printHash: string;
  /** When the voiceprint was created */
  enrolledAt: string;
  /** Number of audio samples used for enrollment */
  sampleCount: number;
  /** Quality score of the enrollment (0.0 - 1.0) */
  enrollmentQuality: number;
  /** Vendor used for the voiceprint (for future multi-vendor support) */
  vendor: string;
}

export interface VerificationResult {
  /** Verification outcome */
  status: 'PASS' | 'FAIL' | 'MANUAL_REVIEW';
  /** Similarity score (0.0 - 1.0) */
  score: number;
  /** Threshold used for the decision */
  threshold: number;
  /** Lead ID being verified */
  leadId: string;
  /** Timestamp of the verification */
  verifiedAt: Date;
  /** Additional context */
  reason: string;
}

export interface VoiceBiometricConfig {
  /** Minimum score for PASS (default: 0.85) */
  passThreshold: number;
  /** Minimum score for MANUAL_REVIEW (below this is FAIL) (default: 0.60) */
  reviewThreshold: number;
  /** Minimum number of samples for enrollment (default: 3) */
  minEnrollmentSamples: number;
  /** Whether voice biometrics is enabled globally */
  enabled: boolean;
  /** Vendor to use (for future multi-vendor support) */
  vendor: string;
}

export interface VoiceBiometricStats {
  /** Total verification attempts in period */
  totalVerifications: number;
  /** Successful verifications (PASS) */
  passCount: number;
  /** Failed verifications (FAIL) */
  failCount: number;
  /** Manual review verifications */
  reviewCount: number;
  /** Verification success rate (0-100) */
  successRate: number;
  /** False positive rate estimate (0-100) */
  falsePositiveRate: number;
  /** Average verification time in milliseconds */
  avgVerificationTimeMs: number;
  /** Total enrolled voiceprints */
  totalEnrolled: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Default pass threshold */
const DEFAULT_PASS_THRESHOLD = 0.85;

/** Default manual review threshold */
const DEFAULT_REVIEW_THRESHOLD = 0.60;

/** Minimum audio samples for reliable enrollment */
const DEFAULT_MIN_ENROLLMENT_SAMPLES = 3;

/** Default vendor name */
const DEFAULT_VENDOR = 'simulated';

/** Metadata key for voiceprint data in CrmLead */
const VOICE_BIOMETRICS_KEY = 'voiceBiometrics';

// ---------------------------------------------------------------------------
// enrollVoicePrint
// ---------------------------------------------------------------------------

/**
 * Create a voiceprint from audio samples for a lead.
 *
 * In a production system, the audio samples would be sent to a voice
 * biometrics API (Nuance, NICE, ID R&D) which returns a voiceprint ID.
 * In this framework implementation, we simulate by creating a hash
 * of the concatenated audio sample identifiers.
 *
 * The voiceprint reference is stored in CrmLead.metadata.voiceBiometrics.
 *
 * @param leadId - The CRM lead ID
 * @param audioSamples - Array of audio sample identifiers or base64 data
 * @returns The created voiceprint
 */
export async function enrollVoicePrint(
  leadId: string,
  audioSamples: string[],
): Promise<VoicePrint> {
  const config = await getVoiceBiometricConfig();

  if (!config.enabled) {
    throw new Error('Voice biometrics is not enabled');
  }

  if (audioSamples.length < config.minEnrollmentSamples) {
    throw new Error(
      `Enrollment requires at least ${config.minEnrollmentSamples} audio samples. Provided: ${audioSamples.length}`,
    );
  }

  // Verify lead exists
  const lead = await prisma.crmLead.findUnique({
    where: { id: leadId },
    select: { id: true, customFields: true, contactName: true },
  });

  if (!lead) {
    throw new Error(`Lead ${leadId} not found`);
  }

  // Generate voiceprint hash (simulated)
  // In production: send samples to biometrics API, receive voiceprint ID
  const printHash = generateVoicePrintHash(leadId, audioSamples);

  // Calculate enrollment quality based on sample count
  // More samples = better quality (up to 5)
  const enrollmentQuality = Math.min(
    1.0,
    Math.round((audioSamples.length / 5) * 100) / 100,
  );

  const voicePrint: VoicePrint = {
    printHash,
    enrolledAt: new Date().toISOString(),
    sampleCount: audioSamples.length,
    enrollmentQuality,
    vendor: config.vendor,
  };

  // Store in lead customFields
  const customFields = (lead.customFields as Record<string, unknown>) || {};
  customFields[VOICE_BIOMETRICS_KEY] = voicePrint;

  await prisma.crmLead.update({
    where: { id: leadId },
    data: {
      customFields: customFields as unknown as Prisma.InputJsonValue,
    },
  });

  // Record enrollment activity
  await prisma.crmActivity.create({
    data: {
      type: 'NOTE',
      title: 'Voice Biometrics Enrollment',
      leadId,
      description: `Voice biometrics: enrolled voiceprint (${audioSamples.length} samples, quality: ${enrollmentQuality})`,
      metadata: {
        source: 'voice_biometrics',
        action: 'enrollment',
        sampleCount: audioSamples.length,
        enrollmentQuality,
        vendor: config.vendor,
      },
    },
  });

  logger.info('Voice biometrics: voiceprint enrolled', {
    event: 'voice_bio_enrolled',
    leadId,
    sampleCount: audioSamples.length,
    enrollmentQuality,
    vendor: config.vendor,
  });

  return voicePrint;
}

// ---------------------------------------------------------------------------
// verifyVoice
// ---------------------------------------------------------------------------

/**
 * Verify a caller's voice against their stored voiceprint.
 *
 * In production, the current audio sample is sent to the biometrics API
 * along with the stored voiceprint ID for comparison. In this framework
 * implementation, we simulate the comparison using hash similarity.
 *
 * @param leadId - The CRM lead ID to verify against
 * @param currentAudioSample - Current audio sample identifier or data
 * @returns Verification result with score and status
 */
export async function verifyVoice(
  leadId: string,
  currentAudioSample: string,
): Promise<VerificationResult> {
  const startTime = Date.now();
  const config = await getVoiceBiometricConfig();

  if (!config.enabled) {
    throw new Error('Voice biometrics is not enabled');
  }

  // Get stored voiceprint
  const lead = await prisma.crmLead.findUnique({
    where: { id: leadId },
    select: { id: true, customFields: true },
  });

  if (!lead) {
    throw new Error(`Lead ${leadId} not found`);
  }

  const customFields = (lead.customFields as Record<string, unknown>) || {};
  const storedPrint = customFields[VOICE_BIOMETRICS_KEY] as VoicePrint | undefined;

  if (!storedPrint) {
    throw new Error(`No voiceprint enrolled for lead ${leadId}`);
  }

  // Generate hash for current sample and compare
  const currentHash = generateSampleHash(currentAudioSample);
  const score = getVerificationScore(storedPrint.printHash, currentHash);

  // Determine result based on thresholds
  const result = handleVerificationResult(
    leadId,
    score,
    config.passThreshold,
    config.reviewThreshold,
  );

  const verificationTimeMs = Date.now() - startTime;

  // Record verification activity
  await prisma.crmActivity.create({
    data: {
      type: 'NOTE',
      title: 'Voice Biometrics Verification',
      leadId,
      description: `Voice biometrics: verification ${result.status} (score: ${score.toFixed(2)})`,
      metadata: {
        source: 'voice_biometrics',
        action: 'verification',
        status: result.status,
        score,
        threshold: config.passThreshold,
        verificationTimeMs,
        vendor: config.vendor,
      },
    },
  });

  logger.info('Voice biometrics: verification completed', {
    event: 'voice_bio_verified',
    leadId,
    status: result.status,
    score,
    passThreshold: config.passThreshold,
    reviewThreshold: config.reviewThreshold,
    verificationTimeMs,
  });

  return result;
}

// ---------------------------------------------------------------------------
// getVerificationScore
// ---------------------------------------------------------------------------

/**
 * Calculate similarity score between two voiceprint hashes.
 *
 * This is a SIMULATED implementation. In production, the score comes from
 * the voice biometrics vendor API (Nuance, NICE, ID R&D) which uses
 * deep neural networks for speaker recognition.
 *
 * The simulated score uses string distance between hashes to approximate
 * a verification score. This allows testing the full workflow without
 * a real biometrics backend.
 *
 * @param sample1Hash - The enrolled voiceprint hash
 * @param sample2Hash - The current sample hash
 * @returns Similarity score between 0.0 and 1.0
 */
export function getVerificationScore(
  sample1Hash: string,
  sample2Hash: string,
): number {
  if (!sample1Hash || !sample2Hash) return 0;

  // Simulated comparison: calculate character-level similarity
  // In production: this would be an API call to the biometrics vendor
  const maxLen = Math.max(sample1Hash.length, sample2Hash.length);
  if (maxLen === 0) return 0;

  let matchCount = 0;
  const minLen = Math.min(sample1Hash.length, sample2Hash.length);

  for (let i = 0; i < minLen; i++) {
    if (sample1Hash[i] === sample2Hash[i]) {
      matchCount++;
    }
  }

  // Base similarity from character matching
  const baseSimilarity = matchCount / maxLen;

  // Add some randomness to simulate real biometric variance
  // (in production, this comes from the actual voice analysis)
  const variance = (hashToNumber(sample2Hash) % 20 - 10) / 100;
  const score = Math.max(0, Math.min(1, baseSimilarity + variance));

  return Math.round(score * 100) / 100;
}

// ---------------------------------------------------------------------------
// handleVerificationResult
// ---------------------------------------------------------------------------

/**
 * Determine verification outcome based on score and thresholds.
 *
 * Three possible outcomes:
 * - PASS: Score >= passThreshold — caller verified
 * - MANUAL_REVIEW: Score between reviewThreshold and passThreshold — needs agent
 * - FAIL: Score < reviewThreshold — verification failed
 *
 * @param leadId - The lead being verified
 * @param score - The verification similarity score
 * @param passThreshold - Minimum score for automatic pass
 * @param reviewThreshold - Minimum score for manual review (below = fail)
 * @returns Verification result
 */
export function handleVerificationResult(
  leadId: string,
  score: number,
  passThreshold: number = DEFAULT_PASS_THRESHOLD,
  reviewThreshold: number = DEFAULT_REVIEW_THRESHOLD,
): VerificationResult {
  let status: VerificationResult['status'];
  let reason: string;

  if (score >= passThreshold) {
    status = 'PASS';
    reason = `Voice verification passed: score ${score.toFixed(2)} >= threshold ${passThreshold}`;
  } else if (score >= reviewThreshold) {
    status = 'MANUAL_REVIEW';
    reason = `Voice verification inconclusive: score ${score.toFixed(2)} between ${reviewThreshold} and ${passThreshold}. Manual review required.`;
  } else {
    status = 'FAIL';
    reason = `Voice verification failed: score ${score.toFixed(2)} < threshold ${reviewThreshold}`;
  }

  return {
    status,
    score,
    threshold: passThreshold,
    leadId,
    verifiedAt: new Date(),
    reason,
  };
}

// ---------------------------------------------------------------------------
// getVoiceBiometricStats
// ---------------------------------------------------------------------------

/**
 * Get voice biometrics performance statistics for a time period.
 *
 * @param period - Time period for statistics
 * @returns Voice biometrics performance stats
 */
export async function getVoiceBiometricStats(period: {
  start: Date;
  end: Date;
}): Promise<VoiceBiometricStats> {
  // Query verification activities
  const activities = await prisma.crmActivity.findMany({
    where: {
      type: 'NOTE',
      createdAt: {
        gte: period.start,
        lte: period.end,
      },
      description: { startsWith: 'Voice biometrics: verification' },
    },
    select: {
      metadata: true,
    },
  });

  let totalVerifications = 0;
  let passCount = 0;
  let failCount = 0;
  let reviewCount = 0;
  let totalVerificationTimeMs = 0;

  for (const activity of activities) {
    const meta = (activity.metadata as Record<string, unknown>) || {};

    if (meta.action !== 'verification') continue;

    totalVerifications++;
    const status = meta.status as string;
    const timeMs = (meta.verificationTimeMs as number) || 0;

    switch (status) {
      case 'PASS':
        passCount++;
        break;
      case 'FAIL':
        failCount++;
        break;
      case 'MANUAL_REVIEW':
        reviewCount++;
        break;
    }

    totalVerificationTimeMs += timeMs;
  }

  // Count total enrolled voiceprints
  // We look for leads that have voiceBiometrics in their metadata
  const enrolledCount = await prisma.crmActivity.count({
    where: {
      type: 'NOTE',
      description: { startsWith: 'Voice biometrics: enrolled' },
    },
  });

  const successRate =
    totalVerifications > 0
      ? Math.round((passCount / totalVerifications) * 1000) / 10
      : 0;

  // Estimate false positive rate (simplified: review cases that passed on retry)
  // In production, this would come from manual audit data
  const falsePositiveRate =
    totalVerifications > 0
      ? Math.round((reviewCount * 0.1 / Math.max(1, totalVerifications)) * 1000) / 10
      : 0;

  const avgVerificationTimeMs =
    totalVerifications > 0
      ? Math.round(totalVerificationTimeMs / totalVerifications)
      : 0;

  logger.info('Voice biometrics: stats calculated', {
    event: 'voice_bio_stats',
    totalVerifications,
    passCount,
    failCount,
    reviewCount,
    successRate,
    avgVerificationTimeMs,
    totalEnrolled: enrolledCount,
    periodStart: period.start.toISOString(),
    periodEnd: period.end.toISOString(),
  });

  return {
    totalVerifications,
    passCount,
    failCount,
    reviewCount,
    successRate,
    falsePositiveRate,
    avgVerificationTimeMs,
    totalEnrolled: enrolledCount,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Get voice biometric configuration from SiteSettings or defaults.
 */
async function getVoiceBiometricConfig(): Promise<VoiceBiometricConfig> {
  const trail = await prisma.auditTrail.findFirst({
    where: { entityType: 'VOICE_BIOMETRICS_CONFIG', action: 'CONFIG' },
    orderBy: { createdAt: 'desc' },
  });

  if (trail?.metadata) {
    try {
      const parsed = trail.metadata as Partial<VoiceBiometricConfig>;
      return {
        passThreshold: parsed.passThreshold ?? DEFAULT_PASS_THRESHOLD,
        reviewThreshold: parsed.reviewThreshold ?? DEFAULT_REVIEW_THRESHOLD,
        minEnrollmentSamples:
          parsed.minEnrollmentSamples ?? DEFAULT_MIN_ENROLLMENT_SAMPLES,
        enabled: parsed.enabled ?? true,
        vendor: parsed.vendor ?? DEFAULT_VENDOR,
      };
    } catch {
      // Fall through to defaults
    }
  }

  return {
    passThreshold: DEFAULT_PASS_THRESHOLD,
    reviewThreshold: DEFAULT_REVIEW_THRESHOLD,
    minEnrollmentSamples: DEFAULT_MIN_ENROLLMENT_SAMPLES,
    enabled: true,
    vendor: DEFAULT_VENDOR,
  };
}

/**
 * Generate a voiceprint hash from lead ID and audio samples.
 * In production, this would be replaced by a real biometrics API call.
 */
function generateVoicePrintHash(leadId: string, samples: string[]): string {
  const content = `${leadId}:${samples.join(':')}`;
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Generate a hash for a single audio sample.
 */
function generateSampleHash(sample: string): string {
  return crypto.createHash('sha256').update(sample).digest('hex');
}

/**
 * Convert a hash string to a number for variance calculation.
 */
function hashToNumber(hash: string): number {
  let num = 0;
  for (let i = 0; i < Math.min(hash.length, 8); i++) {
    num = num * 31 + hash.charCodeAt(i);
  }
  return Math.abs(num);
}
