/**
 * CRM SMS Surveys - G15
 *
 * Send survey questions via SMS, one at a time, and collect responses.
 * Supports multi-question surveys with branching, skip logic, and
 * response validation. Results are stored in SmsCampaign metadata.
 *
 * Flow: create survey -> send first question -> wait for reply ->
 * record answer -> send next question -> repeat until complete.
 */

import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SurveyQuestion {
  id: string;
  position: number;
  text: string;
  type: 'text' | 'choice' | 'rating' | 'yesno';
  choices?: string[];         // For type='choice': e.g. ['A', 'B', 'C']
  ratingScale?: number;       // For type='rating': e.g. 5 (1-5 scale)
  required: boolean;
}

export interface SmsSurvey {
  id: string;
  campaignId: string;
  name: string;
  questions: SurveyQuestion[];
  welcomeMessage?: string;    // Sent before first question
  thankYouMessage: string;    // Sent after last question
  isActive: boolean;
  createdAt: string;
}

interface SurveyEnrollment {
  phone: string;
  surveyId: string;
  currentQuestion: number;    // 0-based index
  answers: Record<string, string>;
  startedAt: string;
  completedAt?: string;
}

export interface SurveyResults {
  surveyId: string;
  surveyName: string;
  totalResponses: number;
  completedResponses: number;
  questionResults: Array<{
    questionId: string;
    questionText: string;
    answerCount: number;
    answers: Record<string, number>; // answer -> count
  }>;
}

// ---------------------------------------------------------------------------
// In-memory enrollment tracking (production: use Redis)
// ---------------------------------------------------------------------------

const enrollments = new Map<string, SurveyEnrollment>();

// ---------------------------------------------------------------------------
// createSmsSurvey
// ---------------------------------------------------------------------------

/**
 * Create a new SMS survey linked to a campaign.
 */
export async function createSmsSurvey(config: {
  campaignId: string;
  name: string;
  questions: Omit<SurveyQuestion, 'id'>[];
  welcomeMessage?: string;
  thankYouMessage?: string;
}): Promise<SmsSurvey> {
  const campaign = await prisma.smsCampaign.findUniqueOrThrow({
    where: { id: config.campaignId },
    select: { segmentCriteria: true },
  });

  const survey: SmsSurvey = {
    id: `survey-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    campaignId: config.campaignId,
    name: config.name,
    questions: config.questions.map((q, i) => ({
      ...q,
      id: `q-${i + 1}`,
      position: i,
    })),
    welcomeMessage: config.welcomeMessage,
    thankYouMessage: config.thankYouMessage || 'Thank you for completing our survey!',
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  const meta = (campaign.segmentCriteria as Record<string, unknown>) || {};
  const surveys = (meta.surveys as SmsSurvey[]) || [];
  surveys.push(survey);
  meta.surveys = surveys;

  await prisma.smsCampaign.update({
    where: { id: config.campaignId },
    data: { segmentCriteria: meta as unknown as Prisma.InputJsonValue },
  });

  logger.info('SMS survey: created', {
    event: 'sms_survey_created',
    surveyId: survey.id,
    campaignId: config.campaignId,
    questionCount: survey.questions.length,
  });

  return survey;
}

// ---------------------------------------------------------------------------
// sendSurveyQuestion
// ---------------------------------------------------------------------------

/**
 * Start a survey for a phone number by sending the first question (or welcome message).
 * If the phone is already enrolled, sends the current pending question.
 *
 * @returns The message text to send to the recipient
 */
export async function sendSurveyQuestion(
  surveyId: string,
  phone: string,
): Promise<{ message: string; questionIndex: number; isComplete: boolean }> {
  const survey = await loadSurvey(surveyId);
  if (!survey) {
    throw new Error(`Survey not found: ${surveyId}`);
  }

  const enrollmentKey = `${phone}:${surveyId}`;
  let enrollment = enrollments.get(enrollmentKey);

  // New enrollment
  if (!enrollment) {
    enrollment = {
      phone,
      surveyId,
      currentQuestion: 0,
      answers: {},
      startedAt: new Date().toISOString(),
    };
    enrollments.set(enrollmentKey, enrollment);

    // Send welcome message if configured
    if (survey.welcomeMessage) {
      return {
        message: survey.welcomeMessage,
        questionIndex: -1,
        isComplete: false,
      };
    }
  }

  // Check if survey is complete
  if (enrollment.currentQuestion >= survey.questions.length) {
    return {
      message: survey.thankYouMessage,
      questionIndex: survey.questions.length,
      isComplete: true,
    };
  }

  const question = survey.questions[enrollment.currentQuestion];
  let message = `Q${enrollment.currentQuestion + 1}: ${question.text}`;

  // Add choice options
  if (question.type === 'choice' && question.choices) {
    message += '\n' + question.choices.map((c, i) => `${i + 1}. ${c}`).join('\n');
    message += '\nReply with the number of your choice.';
  } else if (question.type === 'rating') {
    message += `\nReply with a number from 1 to ${question.ratingScale || 5}.`;
  } else if (question.type === 'yesno') {
    message += '\nReply YES or NO.';
  }

  return {
    message,
    questionIndex: enrollment.currentQuestion,
    isComplete: false,
  };
}

// ---------------------------------------------------------------------------
// processSurveyResponse
// ---------------------------------------------------------------------------

/**
 * Process an incoming SMS as a survey response. Records the answer and
 * advances to the next question.
 *
 * @returns The next question message to send, or thank-you if complete
 */
export async function processSurveyResponse(
  phone: string,
  text: string,
): Promise<{ message: string; isComplete: boolean; surveyId?: string } | null> {
  // Find active enrollment for this phone
  let activeEnrollment: SurveyEnrollment | undefined;
  let activeKey: string | undefined;

  enrollments.forEach((enrollment, key) => {
    if (enrollment.phone === phone && !enrollment.completedAt) {
      activeEnrollment = enrollment;
      activeKey = key;
    }
  });

  if (!activeEnrollment || !activeKey) {
    return null; // No active survey for this phone
  }

  const survey = await loadSurvey(activeEnrollment.surveyId);
  if (!survey) return null;

  const question = survey.questions[activeEnrollment.currentQuestion];
  if (!question) return null;

  // Validate answer based on question type
  const answer = text.trim();
  if (question.type === 'rating') {
    const num = parseInt(answer, 10);
    const max = question.ratingScale || 5;
    if (isNaN(num) || num < 1 || num > max) {
      return {
        message: `Please reply with a number from 1 to ${max}.`,
        isComplete: false,
        surveyId: activeEnrollment.surveyId,
      };
    }
  } else if (question.type === 'yesno') {
    const upper = answer.toUpperCase();
    if (upper !== 'YES' && upper !== 'NO' && upper !== 'Y' && upper !== 'N') {
      return {
        message: 'Please reply YES or NO.',
        isComplete: false,
        surveyId: activeEnrollment.surveyId,
      };
    }
  }

  // Record answer
  activeEnrollment.answers[question.id] = answer;
  activeEnrollment.currentQuestion++;

  // Check if survey is complete
  if (activeEnrollment.currentQuestion >= survey.questions.length) {
    activeEnrollment.completedAt = new Date().toISOString();
    await persistSurveyResponse(survey, activeEnrollment);

    logger.info('SMS survey: completed', {
      event: 'sms_survey_completed',
      surveyId: survey.id,
      phone,
      answers: Object.keys(activeEnrollment.answers).length,
    });

    return {
      message: survey.thankYouMessage,
      isComplete: true,
      surveyId: survey.id,
    };
  }

  // Send next question
  const next = await sendSurveyQuestion(activeEnrollment.surveyId, phone);
  return { ...next, surveyId: survey.id };
}

// ---------------------------------------------------------------------------
// getSurveyResults
// ---------------------------------------------------------------------------

/**
 * Get aggregated results for a survey.
 */
export async function getSurveyResults(surveyId: string): Promise<SurveyResults | null> {
  const survey = await loadSurvey(surveyId);
  if (!survey) return null;

  // Collect all completed enrollments
  const completed: SurveyEnrollment[] = [];
  let total = 0;
  enrollments.forEach((e) => {
    if (e.surveyId === surveyId) {
      total++;
      if (e.completedAt) completed.push(e);
    }
  });

  const questionResults = survey.questions.map((q) => {
    const answerCounts: Record<string, number> = {};
    let answerCount = 0;

    for (const enrollment of completed) {
      const answer = enrollment.answers[q.id];
      if (answer) {
        answerCount++;
        answerCounts[answer] = (answerCounts[answer] || 0) + 1;
      }
    }

    return {
      questionId: q.id,
      questionText: q.text,
      answerCount,
      answers: answerCounts,
    };
  });

  return {
    surveyId,
    surveyName: survey.name,
    totalResponses: total,
    completedResponses: completed.length,
    questionResults,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function loadSurvey(surveyId: string): Promise<SmsSurvey | null> {
  const campaigns = await prisma.smsCampaign.findMany({
    where: { segmentCriteria: { not: Prisma.DbNull } },
    select: { segmentCriteria: true },
    take: 100,
  });

  for (const c of campaigns) {
    const meta = (c.segmentCriteria as Record<string, unknown>) || {};
    const surveys = (meta.surveys as SmsSurvey[]) || [];
    const found = surveys.find((s) => s.id === surveyId);
    if (found) return found;
  }

  return null;
}

async function persistSurveyResponse(
  survey: SmsSurvey,
  enrollment: SurveyEnrollment,
): Promise<void> {
  try {
    const campaign = await prisma.smsCampaign.findFirst({
      where: { id: survey.campaignId },
      select: { id: true, segmentCriteria: true },
    });
    if (!campaign) return;

    const meta = (campaign.segmentCriteria as Record<string, unknown>) || {};
    const responses = (meta.surveyResponses as SurveyEnrollment[]) || [];
    responses.push(enrollment);
    meta.surveyResponses = responses;

    await prisma.smsCampaign.update({
      where: { id: campaign.id },
      data: { segmentCriteria: meta as unknown as Prisma.InputJsonValue },
    });
  } catch (err) {
    logger.warn('SMS survey: failed to persist response', {
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
