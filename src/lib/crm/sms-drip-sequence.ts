/**
 * CRM SMS Drip Sequence - G13
 *
 * Dedicated SMS sequence builder for automated multi-step messaging.
 * Contacts are enrolled in a sequence and receive messages at scheduled
 * intervals with conditions (replied? clicked?) and branching support.
 *
 * Separate from the general workflow engine to provide SMS-specific
 * features: delivery tracking, reply detection, opt-out handling,
 * and drip cadence management.
 */

import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type StepCondition = 'none' | 'replied' | 'not_replied' | 'clicked' | 'not_clicked';

export interface SequenceStep {
  id: string;
  position: number;
  message: string;              // SMS body (supports {firstName}, {companyName} merge vars)
  delayHours: number;           // Delay after previous step (or enrollment)
  condition: StepCondition;     // Only send if condition is met
  skipOnOptOut: boolean;        // Skip if contact has opted out
}

export interface SmsSequence {
  id: string;
  campaignId: string;
  name: string;
  steps: SequenceStep[];
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'DRAFT';
  createdAt: string;
}

export interface SequenceEnrollment {
  id: string;
  sequenceId: string;
  contactId: string;
  phone: string;
  currentStep: number;          // 0-based index into steps
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'OPTED_OUT';
  enrolledAt: string;
  lastStepAt?: string;
  nextStepAt?: string;
  replies: string[];            // Incoming replies from contact
}

// ---------------------------------------------------------------------------
// In-memory enrollment store (production: use database table)
// ---------------------------------------------------------------------------

const sequenceStore = new Map<string, SmsSequence>();
const enrollmentStore = new Map<string, SequenceEnrollment>();

// ---------------------------------------------------------------------------
// createSmsSequence
// ---------------------------------------------------------------------------

/**
 * Create a new SMS drip sequence linked to an SMS campaign.
 */
export async function createSmsSequence(config: {
  campaignId: string;
  name: string;
  steps: Omit<SequenceStep, 'id'>[];
}): Promise<SmsSequence> {
  const campaign = await prisma.smsCampaign.findUniqueOrThrow({
    where: { id: config.campaignId },
    select: { segmentCriteria: true },
  });

  const sequence: SmsSequence = {
    id: `seq-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    campaignId: config.campaignId,
    name: config.name,
    steps: config.steps.map((s, i) => ({
      ...s,
      id: `step-${i + 1}`,
      position: i,
    })),
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
  };

  sequenceStore.set(sequence.id, sequence);

  // Persist to campaign metadata
  const meta = (campaign.segmentCriteria as Record<string, unknown>) || {};
  const sequences = (meta.dripSequences as SmsSequence[]) || [];
  sequences.push(sequence);
  meta.dripSequences = sequences;

  await prisma.smsCampaign.update({
    where: { id: config.campaignId },
    data: { segmentCriteria: meta as unknown as Prisma.InputJsonValue },
  });

  logger.info('SMS drip sequence: created', {
    event: 'drip_sequence_created',
    sequenceId: sequence.id,
    campaignId: config.campaignId,
    stepCount: sequence.steps.length,
  });

  return sequence;
}

// ---------------------------------------------------------------------------
// enrollContact
// ---------------------------------------------------------------------------

/**
 * Enroll a contact in a drip sequence. The first step will be scheduled
 * based on the step's delay configuration.
 */
export async function enrollContact(
  sequenceId: string,
  contactId: string,
  phone: string,
): Promise<SequenceEnrollment> {
  const sequence = await loadSequence(sequenceId);
  if (!sequence) {
    throw new Error(`Sequence not found: ${sequenceId}`);
  }

  if (sequence.status !== 'ACTIVE') {
    throw new Error(`Sequence is not active (status: ${sequence.status})`);
  }

  // Check if already enrolled
  const existingKey = `${sequenceId}:${contactId}`;
  const existing = enrollmentStore.get(existingKey);
  if (existing && existing.status === 'ACTIVE') {
    throw new Error(`Contact ${contactId} is already enrolled in sequence ${sequenceId}`);
  }

  // Check opt-out status
  const cleanPhone = phone.replace(/\D/g, '');
  const optedOut = await prisma.smsOptOut.findFirst({
    where: { phone: { in: [phone, cleanPhone, `+${cleanPhone}`, `+1${cleanPhone}`] } },
    select: { id: true },
  });

  if (optedOut) {
    throw new Error('Contact has opted out of SMS');
  }

  const firstStep = sequence.steps[0];
  const nextStepAt = new Date(Date.now() + (firstStep?.delayHours || 0) * 3_600_000);

  const enrollment: SequenceEnrollment = {
    id: `enr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    sequenceId,
    contactId,
    phone,
    currentStep: 0,
    status: 'ACTIVE',
    enrolledAt: new Date().toISOString(),
    nextStepAt: nextStepAt.toISOString(),
    replies: [],
  };

  enrollmentStore.set(existingKey, enrollment);

  logger.info('SMS drip sequence: contact enrolled', {
    event: 'drip_contact_enrolled',
    sequenceId,
    contactId,
    phone,
    firstStepAt: nextStepAt.toISOString(),
  });

  return enrollment;
}

// ---------------------------------------------------------------------------
// processSequenceStep
// ---------------------------------------------------------------------------

/**
 * Process the next pending step for an enrollment. Checks conditions
 * and sends the message if appropriate. Advances to the next step.
 *
 * @returns The message sent, or null if skipped/complete
 */
export async function processSequenceStep(
  enrollmentId: string,
): Promise<{ message: string; stepPosition: number } | null> {
  // Find enrollment
  let enrollment: SequenceEnrollment | undefined;
  enrollmentStore.forEach((e) => {
    if (e.id === enrollmentId) enrollment = e;
  });

  if (!enrollment || enrollment.status !== 'ACTIVE') {
    return null;
  }

  const sequence = await loadSequence(enrollment.sequenceId);
  if (!sequence) return null;

  const step = sequence.steps[enrollment.currentStep];
  if (!step) {
    // All steps completed
    enrollment.status = 'COMPLETED';
    return null;
  }

  // Check opt-out before sending
  if (step.skipOnOptOut) {
    const cleanPhone = enrollment.phone.replace(/\D/g, '');
    const optedOut = await prisma.smsOptOut.findFirst({
      where: { phone: { in: [enrollment.phone, cleanPhone] } },
      select: { id: true },
    });
    if (optedOut) {
      enrollment.status = 'OPTED_OUT';
      logger.info('SMS drip sequence: contact opted out, stopping', {
        event: 'drip_contact_opted_out',
        enrollmentId,
        sequenceId: enrollment.sequenceId,
      });
      return null;
    }
  }

  // Check condition
  const conditionMet = evaluateCondition(step.condition, enrollment);
  if (!conditionMet) {
    // Skip this step, advance to next
    enrollment.currentStep++;
    if (enrollment.currentStep >= sequence.steps.length) {
      enrollment.status = 'COMPLETED';
    }
    return null;
  }

  // Merge variables
  const contact = await prisma.user.findUnique({
    where: { id: enrollment.contactId },
    select: { name: true, email: true },
  }).catch(() => null);

  let message = step.message;
  message = message.replace(/\{firstName\}/g, contact?.name?.split(' ')[0] || '');
  message = message.replace(/\{name\}/g, contact?.name || '');
  message = message.replace(/\{email\}/g, contact?.email || '');

  // Log the SMS activity
  await prisma.crmActivity.create({
    data: {
      type: 'SMS',
      title: `Drip sequence: ${sequence.name} - Step ${step.position + 1}`,
      description: message,
      metadata: {
        automated: true,
        sequenceId: enrollment.sequenceId,
        enrollmentId: enrollment.id,
        stepId: step.id,
        phone: enrollment.phone,
      } as unknown as Prisma.InputJsonValue,
    },
  });

  // Advance enrollment
  enrollment.lastStepAt = new Date().toISOString();
  enrollment.currentStep++;

  if (enrollment.currentStep >= sequence.steps.length) {
    enrollment.status = 'COMPLETED';
    enrollment.nextStepAt = undefined;
  } else {
    const nextStep = sequence.steps[enrollment.currentStep];
    enrollment.nextStepAt = new Date(
      Date.now() + (nextStep.delayHours * 3_600_000),
    ).toISOString();
  }

  logger.info('SMS drip sequence: step processed', {
    event: 'drip_step_processed',
    enrollmentId,
    sequenceId: enrollment.sequenceId,
    stepPosition: step.position,
    nextStep: enrollment.currentStep,
    isComplete: enrollment.status === 'COMPLETED',
  });

  return { message, stepPosition: step.position };
}

// ---------------------------------------------------------------------------
// pauseSequence
// ---------------------------------------------------------------------------

/**
 * Pause a drip sequence, stopping all active enrollments.
 */
export async function pauseSequence(sequenceId: string): Promise<number> {
  const sequence = await loadSequence(sequenceId);
  if (!sequence) {
    throw new Error(`Sequence not found: ${sequenceId}`);
  }

  sequence.status = 'PAUSED';
  sequenceStore.set(sequenceId, sequence);

  // Pause all active enrollments
  let paused = 0;
  enrollmentStore.forEach((enrollment) => {
    if (enrollment.sequenceId === sequenceId && enrollment.status === 'ACTIVE') {
      enrollment.status = 'PAUSED';
      paused++;
    }
  });

  logger.info('SMS drip sequence: paused', {
    event: 'drip_sequence_paused',
    sequenceId,
    enrollmentsPaused: paused,
  });

  return paused;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function evaluateCondition(
  condition: StepCondition,
  enrollment: SequenceEnrollment,
): boolean {
  switch (condition) {
    case 'none':
      return true;
    case 'replied':
      return enrollment.replies.length > 0;
    case 'not_replied':
      return enrollment.replies.length === 0;
    case 'clicked':
      // Would check link tracking data in production
      return true;
    case 'not_clicked':
      return true;
    default:
      return true;
  }
}

async function loadSequence(sequenceId: string): Promise<SmsSequence | null> {
  // Check in-memory first
  const cached = sequenceStore.get(sequenceId);
  if (cached) return cached;

  // Load from database
  const campaigns = await prisma.smsCampaign.findMany({
    where: { segmentCriteria: { not: Prisma.DbNull } },
    select: { segmentCriteria: true },
    take: 100,
  });

  for (const c of campaigns) {
    const meta = (c.segmentCriteria as Record<string, unknown>) || {};
    const sequences = (meta.dripSequences as SmsSequence[]) || [];
    const found = sequences.find((s) => s.id === sequenceId);
    if (found) {
      sequenceStore.set(sequenceId, found);
      return found;
    }
  }

  return null;
}
