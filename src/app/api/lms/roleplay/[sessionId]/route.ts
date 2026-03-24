export const dynamic = 'force-dynamic';

/**
 * Role-Play Session API
 * POST  /api/lms/roleplay/[sessionId] { message } — Send student message, get client response
 * PATCH /api/lms/roleplay/[sessionId] { action: "complete" } — End session, get evaluation
 *
 * SEC-HARDENING: Wrapped with withUserGuard for centralized auth + CSRF + rate limiting.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withUserGuard } from '@/lib/user-api-guard';
import { prisma } from '@/lib/db';

// ── POST: Student sends a message ─────────────────────────────

const messageSchema = z.object({
  message: z.string().min(1).max(2000),
});

export const POST = withUserGuard(async (request: NextRequest, { session, params }) => {
  const tenantId = session.user.tenantId;
  if (!tenantId) {
    return NextResponse.json({ error: 'No tenant context' }, { status: 403 });
  }

  const sessionId = params?.sessionId;
  if (!sessionId) {
    return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
  }

  const body = await request.json();
  const parsed = messageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Message is required (max 2000 chars)' }, { status: 400 });
  }

  // Fetch the session with scenario
  const rpSession = await prisma.rolePlaySession.findFirst({
    where: { id: sessionId, tenantId, userId: session.user.id! },
    include: { scenario: true },
  });

  if (!rpSession) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  if (rpSession.status !== 'IN_PROGRESS') {
    return NextResponse.json({ error: 'Session is not in progress' }, { status: 400 });
  }

  // Check time limit
  const elapsedSec = (Date.now() - rpSession.startedAt.getTime()) / 1000;
  const maxSec = rpSession.scenario.maxMinutes * 60;
  if (elapsedSec > maxSec) {
    return NextResponse.json({ error: 'Time limit exceeded' }, { status: 400 });
  }

  // Add student message
  const currentMessages = rpSession.messages as Array<{ role: string; content: string; timestamp: string }>;
  const studentMessage = {
    role: 'student',
    content: parsed.data.message,
    timestamp: new Date().toISOString(),
  };
  currentMessages.push(studentMessage);

  // Generate client response based on scenario and conversation context
  const clientResponse = generateClientResponse(
    rpSession.scenario,
    currentMessages,
    rpSession.messageCount
  );
  currentMessages.push(clientResponse);

  // Update session
  await prisma.rolePlaySession.update({
    where: { id: sessionId },
    data: {
      messages: currentMessages,
      messageCount: currentMessages.length,
    },
  });

  return NextResponse.json({
    studentMessage,
    clientResponse,
    messageCount: currentMessages.length,
    elapsedSec: Math.round(elapsedSec),
    maxSec,
  });
});

// ── PATCH: Complete session with evaluation ────────────────────

const completeSchema = z.object({
  action: z.literal('complete'),
});

export const PATCH = withUserGuard(async (request: NextRequest, { session, params }) => {
  const tenantId = session.user.tenantId;
  if (!tenantId) {
    return NextResponse.json({ error: 'No tenant context' }, { status: 403 });
  }

  const sessionId = params?.sessionId;
  if (!sessionId) {
    return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
  }

  const body = await request.json();
  const parsed = completeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'action "complete" is required' }, { status: 400 });
  }

  // Fetch the session with scenario
  const rpSession = await prisma.rolePlaySession.findFirst({
    where: { id: sessionId, tenantId, userId: session.user.id! },
    include: { scenario: true },
  });

  if (!rpSession) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  if (rpSession.status === 'COMPLETED') {
    // Return existing evaluation
    return NextResponse.json({
      session: {
        id: rpSession.id,
        status: rpSession.status,
        score: rpSession.score,
        passed: rpSession.passed,
      },
      evaluation: rpSession.evaluation,
      strengths: rpSession.strengths,
      weaknesses: rpSession.weaknesses,
    });
  }

  const messages = rpSession.messages as Array<{ role: string; content: string; timestamp: string }>;
  const durationSec = Math.round((Date.now() - rpSession.startedAt.getTime()) / 1000);

  // Generate evaluation
  const evaluation = evaluateSession(rpSession.scenario, messages);

  // Update session
  const updated = await prisma.rolePlaySession.update({
    where: { id: sessionId },
    data: {
      status: 'COMPLETED',
      score: evaluation.overallScore,
      passed: evaluation.overallScore >= rpSession.scenario.passingScore,
      evaluation: JSON.parse(JSON.stringify(evaluation)),
      strengths: evaluation.strengths,
      weaknesses: evaluation.weaknesses,
      durationSec,
      completedAt: new Date(),
    },
  });

  return NextResponse.json({
    session: {
      id: updated.id,
      status: updated.status,
      score: updated.score,
      passed: updated.passed,
      durationSec,
    },
    evaluation,
    strengths: evaluation.strengths,
    weaknesses: evaluation.weaknesses,
  });
});

// ── Helpers ────────────────────────────────────────────────────

interface ScenarioData {
  clientName: string;
  clientPersonality: string;
  clientObjective: string;
  situationBrief: string;
  hiddenInfo: string | null;
  regulatoryTrap: string | null;
}

function generateClientResponse(
  scenario: ScenarioData,
  messages: Array<{ role: string; content: string }>,
  _messageCount: number
): { role: string; content: string; timestamp: string } {
  const studentMessages = messages.filter(m => m.role === 'student');
  const lastStudentMsg = studentMessages[studentMessages.length - 1]?.content ?? '';
  const turnNumber = studentMessages.length;

  // Personality-driven response patterns
  const personalityResponses = getPersonalityResponses(scenario, lastStudentMsg, turnNumber);

  return {
    role: 'client',
    content: personalityResponses,
    timestamp: new Date().toISOString(),
  };
}

function getPersonalityResponses(
  scenario: ScenarioData,
  lastStudentMsg: string,
  turnNumber: number
): string {
  const isQuestion = lastStudentMsg.includes('?');
  const isLongResponse = lastStudentMsg.length > 200;

  // Progressive conversation based on turn number
  if (turnNumber <= 2) {
    // Early: client provides more context
    const earlyResponses: Record<string, string> = {
      ANXIOUS: `Oui, justement... ${scenario.situationBrief}. J'ai vraiment peur de ne pas etre bien protege(e). Qu'est-ce que vous me conseillez?`,
      DEMANDING: `Bon, pour etre plus precis: ${scenario.situationBrief}. Je veux savoir exactement ce que vous allez faire pour moi.`,
      CONFUSED: `D'accord... En fait ma situation c'est que ${scenario.situationBrief}. Mais je ne comprends pas bien les termes que vous utilisez, pouvez-vous simplifier?`,
      ANGRY: `Le probleme c'est que ${scenario.situationBrief}. Et personne ne m'a jamais explique correctement mes options!`,
      FRIENDLY: `Oui, bien sur! Alors voila, ${scenario.situationBrief}. J'ai confiance en votre expertise pour me guider.`,
    };
    return earlyResponses[scenario.clientPersonality] ??
      `${scenario.situationBrief}. Qu'en pensez-vous?`;
  }

  if (turnNumber >= 3 && turnNumber <= 5) {
    // Middle: client reveals more or pushes back
    if (scenario.hiddenInfo && turnNumber === 4) {
      return `Ah, j'avais oublie de mentionner... ${scenario.hiddenInfo}. Est-ce que ca change quelque chose?`;
    }

    if (isQuestion) {
      const questionResponses: Record<string, string> = {
        ANXIOUS: `Euh... Je ne suis pas sur(e) de la reponse. C'est normal de ne pas savoir? Ca m'inquiete un peu.`,
        DEMANDING: `Oui, mais ce que je veux savoir c'est combien ca va me couter. Le temps c'est de l'argent.`,
        CONFUSED: `Hmm, je pense que oui? Mais pouvez-vous m'expliquer pourquoi c'est important?`,
        ANGRY: `Ecoutez, la question c'est pas ca. La question c'est pourquoi on ne m'a pas informe(e) avant!`,
        FRIENDLY: `Bonne question! Laissez-moi y reflechir... Oui, je crois que c'est le cas.`,
      };
      return questionResponses[scenario.clientPersonality] ??
        `C'est une bonne question. Je dois y reflechir.`;
    }

    if (isLongResponse) {
      return `D'accord, je comprends mieux maintenant. Mais concretement, qu'est-ce que ca implique pour moi au quotidien?`;
    }

    return `Mmm, je vois. Est-ce qu'il y a d'autres options que je devrais considerer?`;
  }

  // Late: client wraps up
  if (scenario.regulatoryTrap && turnNumber === 6) {
    return `Au fait, mon beau-frere qui est aussi courtier m'a dit qu'il pourrait me faire un meilleur prix. Qu'est-ce que vous en pensez?`;
  }

  const lateResponses: Record<string, string> = {
    ANXIOUS: `Merci de prendre le temps de m'expliquer. Je me sens un peu plus rassure(e). On fait quoi maintenant?`,
    DEMANDING: `Bien. Faites-moi une proposition chiffree et on en reparle. Je veux ca pour la semaine prochaine.`,
    CONFUSED: `OK, je commence a comprendre un peu mieux. Vous pourriez me faire un resume par ecrit?`,
    ANGRY: `Bon... C'est deja mieux que ce qu'on m'avait propose avant. Mais je vais quand meme verifier ailleurs.`,
    FRIENDLY: `Parfait! Je suis content(e) de cette conversation. On avance dans la bonne direction!`,
  };

  return lateResponses[scenario.clientPersonality] ??
    `D'accord, merci pour ces explications. Comment on procede?`;
}

interface EvaluationResult {
  overallScore: number;
  criterionScores: Array<{
    criterion: string;
    score: number;
    maxScore: number;
    feedback: string;
  }>;
  overallFeedback: string;
  strengths: string[];
  weaknesses: string[];
}

function evaluateSession(
  scenario: {
    evaluationCriteria: unknown;
    passingScore: number;
    clientObjective: string;
    regulatoryTrap: string | null;
  },
  messages: Array<{ role: string; content: string }>
): EvaluationResult {
  const studentMessages = messages.filter(m => m.role === 'student');
  const totalStudentChars = studentMessages.reduce((sum, m) => sum + m.content.length, 0);
  const avgMessageLength = totalStudentChars / Math.max(studentMessages.length, 1);
  const messageCount = studentMessages.length;

  // Parse evaluation criteria from scenario
  const criteria = (scenario.evaluationCriteria as Array<{
    criterion: string;
    weight: number;
    description: string;
  }>) ?? [
    { criterion: 'Ecoute active', weight: 20, description: 'Poser des questions pertinentes et ecouter les reponses' },
    { criterion: 'Connaissance produit', weight: 25, description: 'Maitriser les produits et les expliquer clairement' },
    { criterion: 'Communication', weight: 20, description: 'Clarte, professionnalisme et adaptation au client' },
    { criterion: 'Conformite', weight: 20, description: 'Respect des regles de deontologie et divulgation' },
    { criterion: 'Resolution', weight: 15, description: 'Proposer une solution adaptee aux besoins du client' },
  ];

  const criterionScores: EvaluationResult['criterionScores'] = [];
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  for (const c of criteria) {
    let score = 0;
    let feedback = '';

    switch (c.criterion) {
      case 'Ecoute active': {
        const questionsAsked = studentMessages.filter(m => m.content.includes('?')).length;
        const ratio = questionsAsked / Math.max(messageCount, 1);
        score = Math.min(c.weight, Math.round(c.weight * Math.min(1, ratio * 2.5)));
        feedback = questionsAsked >= 3
          ? 'Bonne ecoute active avec des questions pertinentes.'
          : 'Pourrait poser davantage de questions pour bien comprendre la situation du client.';
        if (score >= c.weight * 0.7) strengths.push('Ecoute active et questionnement');
        else weaknesses.push('Ameliorer l\'ecoute active en posant plus de questions');
        break;
      }
      case 'Connaissance produit': {
        score = Math.min(c.weight, Math.round(c.weight * Math.min(1, avgMessageLength / 150)));
        feedback = avgMessageLength > 100
          ? 'Bonnes explications detaillees des produits et services.'
          : 'Les reponses manquent de detail sur les produits proposes.';
        if (score >= c.weight * 0.7) strengths.push('Bonne connaissance des produits');
        else weaknesses.push('Approfondir les explications sur les produits');
        break;
      }
      case 'Communication': {
        score = Math.min(c.weight, Math.round(c.weight * Math.min(1, messageCount / 5)));
        feedback = messageCount >= 4
          ? 'Communication fluide et professionnelle.'
          : 'La conversation aurait pu etre plus developpee.';
        if (score >= c.weight * 0.7) strengths.push('Communication claire et professionnelle');
        else weaknesses.push('Developper davantage la conversation');
        break;
      }
      case 'Conformite': {
        // Check if student addressed the regulatory trap
        const allText = studentMessages.map(m => m.content).join(' ').toLowerCase();
        const mentionsEthics = allText.includes('deontolog') || allText.includes('conflit') ||
          allText.includes('divulgat') || allText.includes('obligat') || allText.includes('ethiq');
        score = mentionsEthics
          ? Math.round(c.weight * 0.9)
          : Math.round(c.weight * 0.5);
        feedback = mentionsEthics
          ? 'Bonne prise en compte des aspects reglementaires et deontologiques.'
          : 'Les aspects de conformite et deontologie auraient du etre abordes.';
        if (score >= c.weight * 0.7) strengths.push('Sensibilite aux enjeux deontologiques');
        else weaknesses.push('Aborder systematiquement les obligations deontologiques');
        break;
      }
      case 'Resolution': {
        const allText = studentMessages.map(m => m.content).join(' ').toLowerCase();
        const proposesSolution = allText.includes('propose') || allText.includes('recommand') ||
          allText.includes('solution') || allText.includes('option') || allText.includes('suggere');
        score = proposesSolution
          ? Math.round(c.weight * 0.85)
          : Math.round(c.weight * 0.4);
        feedback = proposesSolution
          ? 'Bonne capacite a proposer des solutions adaptees.'
          : 'N\'a pas formule de proposition concrete au client.';
        if (score >= c.weight * 0.7) strengths.push('Propositions de solutions pertinentes');
        else weaknesses.push('Formuler des propositions concretes pour le client');
        break;
      }
      default: {
        score = Math.round(c.weight * 0.6);
        feedback = 'Performance moyenne sur ce critere.';
      }
    }

    criterionScores.push({
      criterion: c.criterion,
      score,
      maxScore: c.weight,
      feedback,
    });
  }

  const overallScore = criterionScores.reduce((sum, c) => sum + c.score, 0);
  const maxPossible = criterionScores.reduce((sum, c) => sum + c.maxScore, 0);
  const normalizedScore = maxPossible > 0 ? Math.round((overallScore / maxPossible) * 100) : 0;

  const overallFeedback = normalizedScore >= 80
    ? 'Excellente performance! Vous avez demontre une bonne maitrise de la relation client.'
    : normalizedScore >= 60
      ? 'Bonne performance avec quelques axes d\'amelioration. Continuez a pratiquer.'
      : 'Performance a ameliorer. Concentrez-vous sur les points faibles identifies.';

  return {
    overallScore: normalizedScore,
    criterionScores,
    overallFeedback,
    strengths,
    weaknesses,
  };
}
