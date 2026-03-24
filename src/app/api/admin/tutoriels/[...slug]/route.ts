export const dynamic = 'force-dynamic';

// C3-SEC-S-003 FIX: Added auth check — admin routes must require authentication
import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { auth } from '@/lib/auth-config';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  // Auth check — only EMPLOYEE and OWNER can access admin tutorials
  const session = await auth();
  if (!session?.user || !['EMPLOYEE', 'OWNER'].includes(session.user.role as string)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { slug } = await params;
  const slugPath = slug.join('/');

  // Sanitize: only allow alphanumeric, hyphens, underscores, and slashes (no dots)
  if (!/^[\w\-/]+$/.test(slugPath)) {
    return NextResponse.json({ error: 'Invalid slug' }, { status: 400 });
  }

  // Path traversal defense
  const basePath = path.join(process.cwd(), 'docs', 'user-guide');
  const filePath = path.resolve(basePath, `${slugPath}.md`);
  if (!filePath.startsWith(basePath)) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }

  try {
    const content = await readFile(filePath, 'utf-8');
    return NextResponse.json({ content, slug: slugPath });
  } catch {
    return NextResponse.json({ error: 'Guide not found', slug: slugPath }, { status: 404 });
  }
}
