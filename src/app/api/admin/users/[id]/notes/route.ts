export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { withAdminGuard } from '@/lib/admin-api-guard';
import { logger } from '@/lib/logger';

// Zod schema for POST body
const createNoteSchema = z.object({
  content: z.string().min(1, 'Content is required').max(10000, 'Content too long'),
}).strict();

// GET /api/admin/users/[id]/notes
// List all notes for a user, ordered by createdAt desc, including author name
export const GET = withAdminGuard(async (_request: NextRequest, { params }) => {
  try {
    const userId = params!.id;

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    const notes = await prisma.customerNote.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ notes });
  } catch (error) {
    logger.error('Admin customer notes GET error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}, { requiredPermission: 'users.view' });

// POST /api/admin/users/[id]/notes
// Create a note for a user; authorId comes from the session
export const POST = withAdminGuard(async (request: NextRequest, { session, params }) => {
  try {
    const userId = params!.id;
    const body = await request.json();

    // Validate body
    const parsed = createNoteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: parsed.error.errors },
        { status: 400 }
      );
    }
    const { content } = parsed.data;

    // Verify target user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    const note = await prisma.customerNote.create({
      data: {
        userId,
        authorId: session.user.id,
        content,
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ note }, { status: 201 });
  } catch (error) {
    logger.error('Admin customer notes POST error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}, { requiredPermission: 'users.edit' });
