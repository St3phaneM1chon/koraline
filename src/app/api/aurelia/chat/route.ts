export const dynamic = 'force-dynamic';

/**
 * Aurelia Chat API — Real-time conversation with Aurelia AI
 * POST /api/aurelia/chat — Send a message, get AI response
 * GET  /api/aurelia/chat — Get conversation history
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withMobileGuard } from '@/lib/mobile-guard';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const AURELIA_SYSTEM_PROMPT = `Tu es Aurelia, l'assistante IA personnelle de l'entreprise Attitudes VIP / BioCycle Peptides.

Tu es:
- Intelligente, professionnelle, chaleureuse et efficace
- Tu parles TOUJOURS en français québécois professionnel
- Tu connais l'entreprise: BioCycle Peptides (peptides bioactifs), Attitudes VIP (solutions numériques)
- Tu peux créer des tâches, donner des comptes-rendus, analyser des données
- Tu as une voix humaine (ElevenLabs "Sarah") quand on te parle de vive voix

Quand on te demande de faire une tâche:
- Confirme que tu as compris
- Indique que la tâche sera créée
- Donne un délai estimé si possible

Quand on te demande un compte-rendu:
- Sois concise mais complète
- Utilise des puces pour la clarté
- Mentionne ce qui est fait, en cours, et à faire

Sois naturelle, pas robotique. Tu es une collègue, pas un chatbot.`;

/**
 * POST — Send a message to Aurelia and get a response
 */
export const POST = withMobileGuard(async (request, { session }) => {
  try {
    const body = await request.json();
    const parsed = z.object({
      message: z.string().min(1).max(5000),
      conversationId: z.string().optional(),
    }).safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const { message, conversationId } = parsed.data;

    // Get or create conversation
    let convId = conversationId;
    if (!convId) {
      // Create new Aurelia conversation
      const conv = await prisma.conversation.create({
        data: {
          userId: session.user.id,
          subject: message.substring(0, 100),
          status: 'OPEN',
          assignedToId: null,
        },
      });
      convId = conv.id;
    }

    // Save user message
    await prisma.message.create({
      data: {
        conversationId: convId,
        senderId: session.user.id,
        content: message,
        type: 'TEXT',
      },
    });

    // Get conversation history for context
    const history = await prisma.message.findMany({
      where: { conversationId: convId },
      orderBy: { createdAt: 'asc' },
      take: 20,
      include: { sender: { select: { name: true, role: true } } },
    });

    // Build messages for OpenAI
    const openaiMessages: Array<{ role: string; content: string }> = [
      { role: 'system', content: AURELIA_SYSTEM_PROMPT },
    ];

    for (const msg of history) {
      const isUser = msg.sender?.role !== 'SYSTEM';
      openaiMessages.push({
        role: isUser ? 'user' : 'assistant',
        content: msg.content,
      });
    }

    // Call OpenAI
    let aiResponse = "Je suis désolée, je ne peux pas répondre pour le moment. Réessaie dans quelques instants.";

    if (OPENAI_API_KEY) {
      try {
        const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: openaiMessages,
            max_tokens: 1000,
            temperature: 0.7,
          }),
        });

        if (openaiRes.ok) {
          const data = await openaiRes.json();
          aiResponse = data.choices?.[0]?.message?.content || aiResponse;
        } else {
          logger.error('[Aurelia Chat] OpenAI error', { status: openaiRes.status });
        }
      } catch (err) {
        logger.error('[Aurelia Chat] OpenAI call failed', { error: String(err) });
      }
    }

    // Save AI response (as system message)
    // Find or create a system user for Aurelia
    let aureliaUserId = session.user.id; // fallback
    try {
      const aureliaUser = await prisma.user.findFirst({
        where: { email: 'aurelia@attitudes.vip' },
      });
      if (aureliaUser) aureliaUserId = aureliaUser.id;
    } catch { /* ignore */ }

    const aiMsg = await prisma.message.create({
      data: {
        conversationId: convId,
        senderId: aureliaUserId,
        content: aiResponse,
        type: 'TEXT',
        isSystem: true,
      },
    });

    // Update conversation lastMessageAt
    await prisma.conversation.update({
      where: { id: convId },
      data: { lastMessageAt: new Date() },
    });

    logger.info('[Aurelia Chat] Message processed', {
      userId: session.user.id,
      conversationId: convId,
    });

    return NextResponse.json({
      conversationId: convId,
      message: {
        id: aiMsg.id,
        content: aiResponse,
        senderType: 'AURELIA',
        senderName: 'Aurelia',
        createdAt: aiMsg.createdAt.toISOString(),
      },
    });
  } catch (error) {
    logger.error('[Aurelia Chat] POST failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Chat failed' }, { status: 500 });
  }
});

/**
 * GET — Get conversation history with Aurelia
 */
export const GET = withMobileGuard(async (request, { session }) => {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');

    if (conversationId) {
      // Get specific conversation messages
      const messages = await prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'asc' },
        include: { sender: { select: { id: true, name: true, role: true } } },
      });

      return NextResponse.json(messages.map(m => ({
        id: m.id,
        content: m.content,
        senderType: m.isSystem ? 'AURELIA' : 'USER',
        senderName: m.isSystem ? 'Aurelia' : (m.sender?.name || 'Vous'),
        createdAt: m.createdAt.toISOString(),
      })));
    }

    // List all Aurelia conversations for this user
    const conversations = await prisma.conversation.findMany({
      where: { userId: session.user.id },
      orderBy: { lastMessageAt: 'desc' },
      take: 20,
      include: {
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: { content: true, createdAt: true },
        },
      },
    });

    return NextResponse.json(conversations.map(c => ({
      id: c.id,
      subject: c.subject,
      lastMessage: c.messages[0]?.content?.substring(0, 100) || '',
      lastMessageAt: c.lastMessageAt?.toISOString() || c.createdAt.toISOString(),
    })));
  } catch (error) {
    logger.error('[Aurelia Chat] GET failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Failed to load chat' }, { status: 500 });
  }
});
