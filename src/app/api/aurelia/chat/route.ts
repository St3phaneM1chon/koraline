export const dynamic = 'force-dynamic';

/**
 * Aurelia Chat API — Bridge to Real Aurelia (Mac Studio)
 * POST /api/aurelia/chat — Save user message as PENDING, daemon picks it up
 * GET  /api/aurelia/chat — Get conversation messages (poll for answers)
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withMobileGuard } from '@/lib/mobile-guard';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

/**
 * POST — Send a message to Aurelia (async via daemon bridge)
 * Saves message with status PENDING. The Mac Studio daemon polls for these
 * and responds via /api/aurelia/chat/respond.
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

    // Use provided conversationId or generate a new one
    const convId = conversationId || `aurelia-conv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    // Save user message with status PENDING (daemon will pick it up)
    const userMsg = await prisma.aureliaChat.create({
      data: {
        conversationId: convId,
        userId: session.user.id,
        content: message,
        role: 'USER',
        status: 'PENDING',
      },
    });

    logger.info('[Aurelia Chat] Message saved as PENDING', {
      userId: session.user.id,
      conversationId: convId,
      messageId: userMsg.id,
    });

    return NextResponse.json({
      conversationId: convId,
      message: {
        id: userMsg.id,
        content: message,
        senderType: 'USER',
        senderName: session.user.name || 'Vous',
        createdAt: userMsg.createdAt.toISOString(),
        status: 'PENDING',
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
 * GET — Get conversation messages (poll for Aurelia's response)
 * Query params:
 *   - conversationId: get messages for a specific conversation
 *   - afterId: get only messages after this ID (for efficient polling)
 *   - (none): list all conversations for this user
 */
export const GET = withMobileGuard(async (request, { session }) => {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    const afterId = searchParams.get('afterId');

    if (conversationId) {
      // Build where clause
      const where: Record<string, unknown> = { conversationId };

      // If afterId provided, only get messages created after that message
      if (afterId) {
        const afterMsg = await prisma.aureliaChat.findUnique({
          where: { id: afterId },
          select: { createdAt: true },
        });
        if (afterMsg) {
          where.createdAt = { gt: afterMsg.createdAt };
        }
      }

      const messages = await prisma.aureliaChat.findMany({
        where,
        orderBy: { createdAt: 'asc' },
        include: { user: { select: { name: true } } },
      });

      return NextResponse.json(messages.map(m => ({
        id: m.id,
        content: m.content,
        senderType: m.role === 'USER' ? 'USER' : 'AURELIA',
        senderName: m.role === 'USER' ? (m.user?.name || 'Vous') : 'Aurelia',
        createdAt: m.createdAt.toISOString(),
        status: m.status,
        processingTimeMs: m.processingTimeMs,
      })));
    }

    // List all Aurelia conversations for this user
    const conversations = await prisma.aureliaChat.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      distinct: ['conversationId'],
      select: {
        conversationId: true,
        content: true,
        createdAt: true,
      },
      take: 20,
    });

    // Get last message for each conversation
    const convList = await Promise.all(
      conversations.map(async (c) => {
        const lastMsg = await prisma.aureliaChat.findFirst({
          where: { conversationId: c.conversationId },
          orderBy: { createdAt: 'desc' },
          select: { content: true, createdAt: true, role: true },
        });
        const firstMsg = await prisma.aureliaChat.findFirst({
          where: { conversationId: c.conversationId, role: 'USER' },
          orderBy: { createdAt: 'asc' },
          select: { content: true },
        });
        return {
          id: c.conversationId,
          subject: firstMsg?.content?.substring(0, 100) || 'Conversation',
          lastMessage: lastMsg?.content?.substring(0, 100) || '',
          lastMessageAt: lastMsg?.createdAt?.toISOString() || c.createdAt.toISOString(),
        };
      })
    );

    return NextResponse.json(convList);
  } catch (error) {
    logger.error('[Aurelia Chat] GET failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Failed to load chat' }, { status: 500 });
  }
});
