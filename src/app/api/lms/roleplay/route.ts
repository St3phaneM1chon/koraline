export const dynamic = 'force-dynamic';

/**
 * Role-Play Scenario API
 * GET  /api/lms/roleplay?domain=iard&difficulty=INTERMEDIATE — List available scenarios
 * POST /api/lms/roleplay { scenarioId } — Start a new role-play session
 *
 * SEC-HARDENING: Wrapped with withUserGuard for centralized auth + CSRF + rate limiting.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withUserGuard } from '@/lib/user-api-guard';
import { prisma } from '@/lib/db';

// ── GET: List available scenarios ──────────────────────────────
export const GET = withUserGuard(async (request: NextRequest, { session }) => {
  const tenantId = session.user.tenantId;
  if (!tenantId) {
    return NextResponse.json({ error: 'No tenant context' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const domain = searchParams.get('domain') ?? undefined;
  const difficulty = searchParams.get('difficulty') ?? undefined;

  const where = {
    tenantId,
    isActive: true,
    ...(domain && { domain }),
    ...(difficulty && { difficulty: difficulty.toUpperCase() }),
  };

  const scenarios = await prisma.rolePlayScenario.findMany({
    where,
    select: {
      id: true,
      title: true,
      description: true,
      domain: true,
      difficulty: true,
      clientName: true,
      clientPersonality: true,
      bloomLevel: true,
      passingScore: true,
      maxMinutes: true,
      conceptsTested: true,
    },
    orderBy: [{ domain: 'asc' }, { difficulty: 'asc' }, { title: 'asc' }],
    take: 100,
  });

  // Fetch completion status for the current user
  const completedSessions = await prisma.rolePlaySession.findMany({
    where: {
      tenantId,
      userId: session.user.id!,
      status: 'COMPLETED',
      scenarioId: { in: scenarios.map(s => s.id) },
    },
    select: {
      scenarioId: true,
      score: true,
      passed: true,
    },
    orderBy: { completedAt: 'desc' },
  });

  const completionMap = new Map<string, { score: number | null; passed: boolean }>();
  for (const s of completedSessions) {
    if (!completionMap.has(s.scenarioId)) {
      completionMap.set(s.scenarioId, { score: s.score, passed: s.passed });
    }
  }

  const scenariosWithStatus = scenarios.map(scenario => ({
    ...scenario,
    completion: completionMap.get(scenario.id) ?? null,
  }));

  return NextResponse.json({ scenarios: scenariosWithStatus });
}, { skipCsrf: true });

// ── POST: Start a new role-play session ────────────────────────

const startSessionSchema = z.object({
  scenarioId: z.string().min(1),
});

export const POST = withUserGuard(async (request: NextRequest, { session }) => {
  const tenantId = session.user.tenantId;
  if (!tenantId) {
    return NextResponse.json({ error: 'No tenant context' }, { status: 403 });
  }

  const body = await request.json();
  const parsed = startSessionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'scenarioId is required' }, { status: 400 });
  }

  // Fetch the scenario
  const scenario = await prisma.rolePlayScenario.findFirst({
    where: { id: parsed.data.scenarioId, tenantId, isActive: true },
  });

  if (!scenario) {
    return NextResponse.json({ error: 'Scenario not found' }, { status: 404 });
  }

  // Build the first Aurelia (client) message based on the scenario
  const firstMessage = {
    role: 'client',
    content: buildClientGreeting(scenario),
    timestamp: new Date().toISOString(),
  };

  // Create the session
  const rolePlaySession = await prisma.rolePlaySession.create({
    data: {
      tenantId,
      userId: session.user.id!,
      scenarioId: scenario.id,
      messages: [firstMessage],
      messageCount: 1,
      status: 'IN_PROGRESS',
    },
  });

  return NextResponse.json({
    session: {
      id: rolePlaySession.id,
      scenarioId: scenario.id,
      status: rolePlaySession.status,
    },
    scenario: {
      title: scenario.title,
      domain: scenario.domain,
      difficulty: scenario.difficulty,
      clientName: scenario.clientName,
      clientPersonality: scenario.clientPersonality,
      situationBrief: scenario.situationBrief,
      maxMinutes: scenario.maxMinutes,
      passingScore: scenario.passingScore,
      evaluationCriteria: scenario.evaluationCriteria,
    },
    messages: [firstMessage],
  }, { status: 201 });
});

// ── Helpers ────────────────────────────────────────────────────

function buildClientGreeting(scenario: {
  clientName: string;
  clientPersonality: string;
  clientObjective: string;
  situationBrief: string;
}): string {
  const greetings: Record<string, string> = {
    ANXIOUS: `Bonjour... Je suis ${scenario.clientName}. Je vous avoue que je suis un peu inquiet(e) par rapport a ma situation. ${scenario.clientObjective}. Est-ce que vous pouvez m'aider?`,
    DEMANDING: `Bonjour. ${scenario.clientName}. J'ai besoin que vous me trouviez une solution rapidement. ${scenario.clientObjective}. J'attends des resultats concrets.`,
    CONFUSED: `Euh, bonjour... ${scenario.clientName} ici. On m'a dit de venir vous voir mais honnêtement je ne comprends pas trop tout ca. ${scenario.clientObjective}. Vous pouvez m'expliquer?`,
    ANGRY: `Bonjour! C'est ${scenario.clientName}. Ecoutez, je ne suis vraiment pas satisfait(e) de ce qui se passe. ${scenario.clientObjective}. Il faut que ca change!`,
    FRIENDLY: `Bonjour! ${scenario.clientName}, enchante(e)! On m'a recommande vos services. ${scenario.clientObjective}. J'espère qu'on pourra trouver quelque chose ensemble.`,
  };

  return greetings[scenario.clientPersonality] ??
    `Bonjour, je suis ${scenario.clientName}. ${scenario.clientObjective}.`;
}
