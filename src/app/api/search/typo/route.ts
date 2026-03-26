export const dynamic = 'force-dynamic';

/**
 * #12 Typo Correction API
 * GET /api/search/typo?q=semglutide
 * Returns { suggestion: "Semaglutide" } or { suggestion: null }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTypoCorrection, getTypoSuggestions } from '@/lib/search-helpers';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim();

  if (!q || q.length < 3) {
    return NextResponse.json({ suggestion: null, suggestions: [] });
  }

  const suggestion = getTypoCorrection(q);
  const suggestions = getTypoSuggestions(q, 3);

  return NextResponse.json({ suggestion, suggestions });
}
