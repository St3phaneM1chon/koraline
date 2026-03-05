/**
 * KNOWLEDGE BASE ENGINE (E17)
 * KB article management, full-text search, and suggestion engine
 * for inbox replies and customer self-service portal.
 */

import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface KBArticleResult {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  categoryName: string | null;
  tags: string[];
  viewCount: number;
  helpfulYes: number;
  helpfulNo: number;
  relevanceScore?: number;
}

// ---------------------------------------------------------------------------
// Search articles (full-text on title + content)
// ---------------------------------------------------------------------------

/**
 * Search published KB articles by keyword. Matches against title and content
 * using case-insensitive contains. Returns sorted by relevance heuristic
 * (title match > content match, then by viewCount descending).
 */
export async function searchArticles(
  query: string,
  limit: number = 10,
): Promise<KBArticleResult[]> {
  if (!query.trim()) return [];

  const searchTerm = query.trim();

  // Fetch articles matching title or content
  const articles = await prisma.kBArticle.findMany({
    where: {
      status: 'PUBLISHED',
      isPublic: true,
      OR: [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { content: { contains: searchTerm, mode: 'insensitive' } },
        { tags: { hasSome: [searchTerm.toLowerCase()] } },
      ],
    },
    include: {
      category: { select: { name: true } },
    },
    orderBy: { viewCount: 'desc' },
    take: limit * 2, // over-fetch for re-ranking
  });

  // Re-rank: title matches get higher score
  const lowerQuery = searchTerm.toLowerCase();
  const scored = articles.map((a) => {
    let score = 0;
    if (a.title.toLowerCase().includes(lowerQuery)) score += 10;
    if (a.content.toLowerCase().includes(lowerQuery)) score += 5;
    if (a.tags.some((t) => t.toLowerCase() === lowerQuery)) score += 8;
    score += Math.min(a.viewCount / 100, 5); // popularity boost (max 5)
    return { article: a, score };
  });

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map(({ article, score }) => ({
    id: article.id,
    title: article.title,
    slug: article.slug,
    excerpt: article.excerpt,
    categoryName: article.category?.name ?? null,
    tags: article.tags,
    viewCount: article.viewCount,
    helpfulYes: article.helpfulYes,
    helpfulNo: article.helpfulNo,
    relevanceScore: score,
  }));
}

// ---------------------------------------------------------------------------
// Get article by slug
// ---------------------------------------------------------------------------

/**
 * Fetch a single published KB article by its slug.
 * Returns null if not found or not published.
 */
export async function getArticleBySlug(slug: string) {
  const article = await prisma.kBArticle.findUnique({
    where: { slug },
    include: {
      category: { select: { id: true, name: true, slug: true } },
    },
  });

  if (!article || (article.status !== 'PUBLISHED' && article.status !== 'DRAFT')) {
    return null;
  }

  return article;
}

// ---------------------------------------------------------------------------
// Suggest articles based on conversation content
// ---------------------------------------------------------------------------

/**
 * Given conversation text (e.g. latest customer message), extract keywords
 * and return matching KB articles that an agent could reference in their reply.
 */
export async function suggestArticles(
  conversationContent: string,
  limit: number = 5,
): Promise<KBArticleResult[]> {
  if (!conversationContent.trim()) return [];

  // Extract meaningful keywords (>3 chars, skip stop words)
  const stopWords = new Set([
    'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'her',
    'was', 'one', 'our', 'out', 'les', 'des', 'une', 'que', 'est', 'pas',
    'pour', 'dans', 'avec', 'sur', 'qui', 'par', 'nous', 'vous', 'this',
    'that', 'have', 'from', 'will', 'been', 'with', 'they', 'would', 'could',
  ]);

  const words = conversationContent
    .toLowerCase()
    .replace(/[^a-z0-9\s\u00e0-\u00ff]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !stopWords.has(w));

  // Deduplicate and limit keywords
  const keywords = [...new Set(words)].slice(0, 8);

  if (keywords.length === 0) return [];

  // Search for each keyword and aggregate results
  const resultsMap = new Map<string, KBArticleResult & { hitCount: number }>();

  for (const keyword of keywords) {
    const hits = await searchArticles(keyword, 5);
    for (const hit of hits) {
      const existing = resultsMap.get(hit.id);
      if (existing) {
        existing.hitCount++;
        existing.relevanceScore = (existing.relevanceScore ?? 0) + (hit.relevanceScore ?? 0);
      } else {
        resultsMap.set(hit.id, { ...hit, hitCount: 1 });
      }
    }
  }

  // Sort by hit count then relevance score
  const sorted = [...resultsMap.values()].sort((a, b) => {
    if (b.hitCount !== a.hitCount) return b.hitCount - a.hitCount;
    return (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0);
  });

  logger.debug('[KnowledgeBase] Article suggestions generated', {
    keywords,
    resultCount: sorted.length,
  });

  return sorted.slice(0, limit);
}

// ---------------------------------------------------------------------------
// Increment view count
// ---------------------------------------------------------------------------

/**
 * Increment the view count for an article (fire-and-forget safe).
 */
export async function incrementViewCount(articleId: string): Promise<void> {
  try {
    await prisma.kBArticle.update({
      where: { id: articleId },
      data: { viewCount: { increment: 1 } },
    });
  } catch (error) {
    logger.warn('[KnowledgeBase] Failed to increment view count', {
      articleId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

// ---------------------------------------------------------------------------
// Rate article
// ---------------------------------------------------------------------------

/**
 * Record whether a user found an article helpful or not.
 * Increments helpfulYes or helpfulNo counter.
 */
export async function rateArticle(
  articleId: string,
  helpful: boolean,
): Promise<{ helpfulYes: number; helpfulNo: number }> {
  const article = await prisma.kBArticle.update({
    where: { id: articleId },
    data: helpful
      ? { helpfulYes: { increment: 1 } }
      : { helpfulNo: { increment: 1 } },
    select: { helpfulYes: true, helpfulNo: true },
  });

  logger.info('[KnowledgeBase] Article rated', {
    articleId,
    helpful,
    helpfulYes: article.helpfulYes,
    helpfulNo: article.helpfulNo,
  });

  return article;
}
