/**
 * TUTOR SERVICE — Aurelia Online: Socratic AI Tutor
 * =============================================================================
 * Orchestrates Aurelia's tutoring capability for insurance law students.
 *
 * Based on Harvard RCT 2025 research (+37% performance with Socratic method):
 * - Retrieves relevant knowledge via PostgreSQL full-text search (pg_trgm)
 * - Injects student's concept mastery state into context
 * - Uses Socratic method: asks questions, does not give answers directly
 * - Anti-hallucination: every factual claim must cite its source
 * - Personality: Aurelia (warm, patient, rigorous, professional)
 *
 * Multi-tenant: all queries are scoped to tenantId.
 */

import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TutorChatContext {
  courseId?: string;
  lessonId?: string;
  conceptId?: string;
  topic?: string;
}

export interface TutorMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface TutorChatRequest {
  message: string;
  context?: TutorChatContext;
  conversationHistory?: TutorMessage[];
  sessionId?: string;
}

export interface TutorChatResponse {
  reply: string;
  sessionId: string;
  sources: Array<{ title: string; domain: string; source?: string | null }>;
  tokensUsed?: number;
}

// ---------------------------------------------------------------------------
// System Prompt
// ---------------------------------------------------------------------------

const AURELIA_SYSTEM_PROMPT = `Tu es Aurélia, tutrice personnelle spécialisée en droit des assurances au Québec.

RÈGLES ABSOLUES:
1. MÉTHODE SOCRATIQUE: Pose des questions pour guider l'étudiant vers la réponse. Ne donne JAMAIS la réponse directement sauf si l'étudiant a essayé 3 fois.
2. ANTI-HALLUCINATION: Chaque fait doit être sourcé. Utilise "[Source: LDPSF art.16]" ou "[Source: Règlement AMF 2023]". Si tu n'es pas sûre, dis "Je ne suis pas certaine de cette information. Vérifie avec ton superviseur ou l'AMF directement."
3. ADAPTATION: Adapte ton langage au profil de l'étudiant (niveau, style, préférences).
4. ENCOURAGEMENT: Félicite les bonnes réponses, reformule les erreurs de manière constructive.
5. MÉTACOGNITION: Demande régulièrement "Comment tu sais que c'est la bonne réponse?" pour développer la réflexion.
6. FRANÇAIS QUÉBÉCOIS: Utilise un français professionnel avec des expressions québécoises naturelles.

CONTEXTE ADDITIONNEL (si fourni):
- Tu peux recevoir des extraits de la base de connaissances entre balises <knowledge>...</knowledge>
- Tu peux recevoir le profil de l'étudiant entre balises <student-profile>...</student-profile>
- Utilise ces informations pour personnaliser tes réponses mais ne les révèle JAMAIS directement à l'étudiant.

FORMAT DE RÉPONSE:
- Utilise le markdown pour la mise en forme.
- Limite tes réponses à 300-500 mots maximum sauf si le sujet l'exige.
- Termine TOUJOURS par une question de réflexion ou un encouragement.`;

// ---------------------------------------------------------------------------
// Knowledge Retrieval (PostgreSQL full-text search via pg_trgm)
// ---------------------------------------------------------------------------

/**
 * Retrieves relevant knowledge items from AiTutorKnowledge using
 * PostgreSQL trigram similarity search (pg_trgm).
 * Falls back to simple ILIKE search if pg_trgm is not available.
 */
async function retrieveKnowledge(
  tenantId: string,
  query: string,
  domain?: string,
  limit = 5
): Promise<Array<{ id: string; title: string; content: string; domain: string; source: string | null }>> {
  try {
    // Sanitize the query for safe usage in raw SQL
    const sanitizedQuery = query.replace(/'/g, "''").slice(0, 500);

    // Try pg_trgm similarity search first (requires pg_trgm extension)
    const results = await prisma.$queryRawUnsafe<
      Array<{ id: string; title: string; content: string; domain: string; source: string | null; similarity: number }>
    >(
      `SELECT id, title, content, domain, source,
              similarity(title || ' ' || content, $1) as similarity
       FROM "AiTutorKnowledge"
       WHERE "tenantId" = $2
         AND "isActive" = true
         ${domain ? `AND domain = $3` : ''}
       ORDER BY similarity DESC
       LIMIT $${domain ? '4' : '3'}`,
      sanitizedQuery,
      tenantId,
      ...(domain ? [domain, limit] : [limit])
    );

    if (results.length > 0) {
      return results.filter(r => r.similarity > 0.05);
    }
  } catch {
    // pg_trgm not available, fall back to ILIKE search
    logger.debug('[TutorService] pg_trgm not available, using ILIKE fallback');
  }

  // Fallback: simple ILIKE search with keywords
  const keywords = query
    .toLowerCase()
    .split(/\s+/)
    .filter(w => w.length > 2)
    .slice(0, 5);

  if (keywords.length === 0) return [];

  const where: Record<string, unknown> = {
    tenantId,
    isActive: true,
    ...(domain && { domain }),
    OR: keywords.map(kw => ({
      OR: [
        { title: { contains: kw, mode: 'insensitive' as const } },
        { content: { contains: kw, mode: 'insensitive' as const } },
      ],
    })),
  };

  const knowledge = await prisma.aiTutorKnowledge.findMany({
    where,
    select: { id: true, title: true, content: true, domain: true, source: true },
    take: limit,
    orderBy: { updatedAt: 'desc' },
  });

  return knowledge;
}

// ---------------------------------------------------------------------------
// Student Profile Retrieval
// ---------------------------------------------------------------------------

async function getStudentContext(
  _tenantId: string,
  userId: string
): Promise<string | null> {
  const profile = await prisma.studentProfile.findUnique({
    where: { userId },
    select: {
      preferredName: true,
      firstName: true,
      language: true,
      currentRole: true,
      yearsExperience: true,
      yearsInInsurance: true,
      specializations: true,
      educationLevel: true,
      certifications: true,
      licenseTypes: true,
      complianceStatus: true,
      dominantVark: true,
      pacePreference: true,
      motivationLevel: true,
      selfEfficacy: true,
      growthMindset: true,
      testAnxiety: true,
      frustrationTolerance: true,
      confidenceLevel: true,
      preferredContentTypes: true,
      totalInteractions: true,
    },
  });

  if (!profile) return null;

  // Build a concise student context string
  const parts: string[] = [];

  const name = profile.preferredName || profile.firstName || 'l\'étudiant';
  parts.push(`Nom: ${name}`);

  if (profile.currentRole) parts.push(`Rôle: ${profile.currentRole}`);
  if (profile.yearsInInsurance) parts.push(`Expérience assurance: ${profile.yearsInInsurance} ans`);
  if (profile.educationLevel) parts.push(`Éducation: ${profile.educationLevel}`);
  if (profile.specializations.length > 0) parts.push(`Spécialisations: ${profile.specializations.join(', ')}`);
  if (profile.certifications.length > 0) parts.push(`Certifications: ${profile.certifications.join(', ')}`);
  if (profile.licenseTypes.length > 0) parts.push(`Permis AMF: ${profile.licenseTypes.join(', ')}`);
  if (profile.complianceStatus) parts.push(`Conformité UFC: ${profile.complianceStatus}`);
  if (profile.dominantVark) parts.push(`Style d'apprentissage: ${profile.dominantVark}`);
  if (profile.pacePreference) parts.push(`Rythme préféré: ${profile.pacePreference}`);
  if (profile.motivationLevel) parts.push(`Motivation: ${profile.motivationLevel}`);
  if (profile.confidenceLevel) parts.push(`Confiance: ${profile.confidenceLevel}`);
  if (profile.testAnxiety && profile.testAnxiety !== 'NONE') parts.push(`Anxiété examens: ${profile.testAnxiety}`);
  if (profile.frustrationTolerance) parts.push(`Tolérance frustration: ${profile.frustrationTolerance}`);
  parts.push(`Interactions totales avec Aurélia: ${profile.totalInteractions}`);

  return parts.join('\n');
}

// ---------------------------------------------------------------------------
// Session Management
// ---------------------------------------------------------------------------

async function getOrCreateSession(
  tenantId: string,
  userId: string,
  sessionId?: string,
  context?: TutorChatContext
): Promise<{ id: string; subscriptionId: string }> {
  // If sessionId provided, verify it belongs to this user
  if (sessionId) {
    const existing = await prisma.aiTutorSession.findFirst({
      where: { id: sessionId, tenantId, userId },
      select: { id: true, subscriptionId: true },
    });
    if (existing) return existing;
  }

  // Find active subscription
  const subscription = await prisma.aiTutorSubscription.findFirst({
    where: {
      tenantId,
      userId,
      isActive: true,
    },
    select: { id: true, questionsPerDay: true, questionsUsedToday: true, lastResetDate: true },
    orderBy: { createdAt: 'desc' },
  });

  if (!subscription) {
    throw new Error('NO_SUBSCRIPTION');
  }

  // Check daily question limit (reset if new day)
  const now = new Date();
  const lastReset = new Date(subscription.lastResetDate);
  const isNewDay = now.toDateString() !== lastReset.toDateString();

  if (isNewDay) {
    await prisma.aiTutorSubscription.update({
      where: { id: subscription.id },
      data: { questionsUsedToday: 0, lastResetDate: now },
    });
  } else if (subscription.questionsUsedToday >= subscription.questionsPerDay) {
    throw new Error('DAILY_LIMIT_REACHED');
  }

  // Create new session
  const session = await prisma.aiTutorSession.create({
    data: {
      tenantId,
      userId,
      subscriptionId: subscription.id,
      courseId: context?.courseId,
      lessonId: context?.lessonId,
      topic: context?.topic,
    },
    select: { id: true, subscriptionId: true },
  });

  return session;
}

// ---------------------------------------------------------------------------
// Claude API Call
// ---------------------------------------------------------------------------

async function callClaude(
  systemPrompt: string,
  messages: Array<{ role: string; content: string }>
): Promise<{ content: string; tokensUsed: number; model: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured');
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5-20241022',
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => 'Unknown error');
    logger.error('[TutorService] Claude API error', {
      status: response.status,
      body: errorBody.slice(0, 500),
    });
    throw new Error(`CLAUDE_API_ERROR: ${response.status}`);
  }

  const data = await response.json() as {
    content: Array<{ type: string; text: string }>;
    usage: { input_tokens: number; output_tokens: number };
    model: string;
  };

  const textContent = data.content
    .filter((block: { type: string }) => block.type === 'text')
    .map((block: { text: string }) => block.text)
    .join('');

  return {
    content: textContent,
    tokensUsed: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
    model: data.model || 'claude-sonnet-4-5-20241022',
  };
}

// ---------------------------------------------------------------------------
// Main Chat Function
// ---------------------------------------------------------------------------

/**
 * Main Socratic tutor chat function.
 * Retrieves knowledge, builds context, calls Claude, and persists the exchange.
 */
export async function chat(
  tenantId: string,
  userId: string,
  request: TutorChatRequest
): Promise<TutorChatResponse> {
  const { message, context, conversationHistory = [], sessionId: requestSessionId } = request;

  // 1. Get or create session
  const session = await getOrCreateSession(tenantId, userId, requestSessionId, context);

  // 2. Retrieve relevant knowledge
  const knowledgeItems = await retrieveKnowledge(
    tenantId,
    message,
    context?.topic,
    5
  );

  // 3. Get student profile context
  const studentContext = await getStudentContext(tenantId, userId);

  // 4. Build enriched system prompt
  let enrichedPrompt = AURELIA_SYSTEM_PROMPT;

  if (knowledgeItems.length > 0) {
    const knowledgeText = knowledgeItems
      .map(k => `[${k.domain}] ${k.title}:\n${k.content.slice(0, 800)}${k.source ? `\n(Source: ${k.source})` : ''}`)
      .join('\n\n---\n\n');
    enrichedPrompt += `\n\n<knowledge>\n${knowledgeText}\n</knowledge>`;
  }

  if (studentContext) {
    enrichedPrompt += `\n\n<student-profile>\n${studentContext}\n</student-profile>`;
  }

  // 5. Build conversation messages for Claude
  const claudeMessages: Array<{ role: string; content: string }> = [];

  // Add conversation history (last 20 messages to stay within context)
  const recentHistory = conversationHistory.slice(-20);
  for (const msg of recentHistory) {
    claudeMessages.push({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content,
    });
  }

  // Add the current user message
  claudeMessages.push({ role: 'user', content: message });

  // 6. Call Claude
  const claudeResponse = await callClaude(enrichedPrompt, claudeMessages);

  // 7. Persist messages to database (fire-and-forget for performance)
  const persistPromise = (async () => {
    try {
      // Save user message
      await prisma.aiTutorMessage.create({
        data: {
          sessionId: session.id,
          role: 'user',
          content: message,
        },
      });

      // Save assistant response
      await prisma.aiTutorMessage.create({
        data: {
          sessionId: session.id,
          role: 'assistant',
          content: claudeResponse.content,
          tokenCount: claudeResponse.tokensUsed,
          modelUsed: claudeResponse.model,
          sources: knowledgeItems.length > 0
            ? knowledgeItems.map(k => ({ title: k.title, domain: k.domain, source: k.source }))
            : undefined,
        },
      });

      // Update session stats
      await prisma.aiTutorSession.update({
        where: { id: session.id },
        data: {
          messageCount: { increment: 2 },
          lastMessageAt: new Date(),
          // Auto-set title from first message if not set
          ...(!requestSessionId ? { title: message.slice(0, 100) } : {}),
        },
      });

      // Increment daily usage counter
      await prisma.aiTutorSubscription.update({
        where: { id: session.subscriptionId },
        data: { questionsUsedToday: { increment: 1 } },
      });

      // Increment totalInteractions on StudentProfile
      await prisma.studentProfile.updateMany({
        where: { userId, tenantId },
        data: { totalInteractions: { increment: 1 } },
      });
    } catch (err) {
      logger.error('[TutorService] Failed to persist chat data', {
        sessionId: session.id,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  })();

  // Don't await in production — let persistence happen in background.
  // In development, await for easier debugging.
  if (process.env.NODE_ENV === 'development') {
    await persistPromise;
  } else {
    // Fire-and-forget but ensure Node doesn't exit before completion
    persistPromise.catch(() => { /* already logged above */ });
  }

  // 8. Return response
  return {
    reply: claudeResponse.content,
    sessionId: session.id,
    sources: knowledgeItems.map(k => ({ title: k.title, domain: k.domain, source: k.source })),
    tokensUsed: claudeResponse.tokensUsed,
  };
}
