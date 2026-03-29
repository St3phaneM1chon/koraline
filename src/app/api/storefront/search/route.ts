export const dynamic = 'force-dynamic';

/**
 * Agentic Storefront API — Natural Language Search (G15)
 *
 * AI-optimized product search with natural language queries, relevance scoring,
 * and structured filters. Designed for AI agents to discover products.
 *
 * GET /api/storefront/search
 *   ?q=natural+language+query   — search query (required)
 *   &category=slug              — filter by category
 *   &minPrice=10                — minimum price
 *   &maxPrice=100               — maximum price
 *   &inStock=true               — only in-stock
 *   &type=PEPTIDE               — filter by product type
 *   &limit=10                   — max results (default 10, max 30)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import { checkRateLimit } from '@/lib/rate-limiter';
import { getClientIp } from '@/lib/auth-jwt';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function isStorefrontEnabled(): Promise<boolean> {
  try {
    const setting = await prisma.siteSetting.findUnique({
      where: { key: 'ff.ai_storefront' },
    });
    return setting?.value === 'true';
  } catch {
    return false;
  }
}

/**
 * Compute a relevance score based on where the query matches.
 * Higher score = more relevant match.
 */
function computeRelevance(
  product: { name: string; shortDescription: string | null; description: string | null; tags: string | null },
  query: string
): number {
  const q = query.toLowerCase();
  let score = 0;

  // Exact name match = highest relevance
  const nameLower = product.name.toLowerCase();
  if (nameLower === q) {
    score += 100;
  } else if (nameLower.includes(q)) {
    score += 80;
  }

  // Word-level matching in name
  const queryWords = q.split(/\s+/).filter(Boolean);
  for (const word of queryWords) {
    if (nameLower.includes(word)) score += 20;
  }

  // Short description match
  if (product.shortDescription?.toLowerCase().includes(q)) {
    score += 40;
  } else if (product.shortDescription) {
    for (const word of queryWords) {
      if (product.shortDescription.toLowerCase().includes(word)) score += 10;
    }
  }

  // Description match
  if (product.description?.toLowerCase().includes(q)) {
    score += 20;
  } else if (product.description) {
    for (const word of queryWords) {
      if (product.description.toLowerCase().includes(word)) score += 5;
    }
  }

  // Tags match
  if (product.tags) {
    const tagsLower = product.tags.toLowerCase();
    if (tagsLower.includes(q)) {
      score += 30;
    } else {
      for (const word of queryWords) {
        if (tagsLower.includes(word)) score += 10;
      }
    }
  }

  return Math.min(score, 200); // Cap at 200
}

// ---------------------------------------------------------------------------
// GET handler
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = await checkRateLimit(ip, '/api/storefront/search');
  if (!rl.allowed) {
    return NextResponse.json(
      {
        error: 'rate_limit_exceeded',
        message: 'Too many requests. Please retry after the reset window.',
        retryAfterSeconds: Math.ceil((rl.resetAt - Date.now()) / 1000),
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
        },
      }
    );
  }

  try {
    const enabled = await isStorefrontEnabled();
    if (!enabled) {
      return NextResponse.json(
        {
          error: 'storefront_disabled',
          message: 'The AI Storefront API is currently disabled.',
        },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim() || '';
    const categorySlug = searchParams.get('category')?.trim() || '';
    const minPrice = parseFloat(searchParams.get('minPrice') || '0') || 0;
    const maxPrice = parseFloat(searchParams.get('maxPrice') || '0') || 0;
    const inStockOnly = searchParams.get('inStock') === 'true';
    const productType = searchParams.get('type')?.trim().toUpperCase() || '';
    const limit = Math.min(Math.max(1, parseInt(searchParams.get('limit') || '10', 10)), 30);

    if (!q) {
      return NextResponse.json(
        {
          error: 'missing_query',
          message: 'The "q" query parameter is required for search.',
          example: '/api/storefront/search?q=BPC-157+peptide',
        },
        { status: 400 }
      );
    }

    // Build where clause — broad search to then rank by relevance
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      isActive: true,
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { shortDescription: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { tags: { contains: q, mode: 'insensitive' } },
        { sku: { contains: q, mode: 'insensitive' } },
        { casNumber: { contains: q, mode: 'insensitive' } },
        { aminoSequence: { contains: q, mode: 'insensitive' } },
      ],
    };

    if (categorySlug) {
      where.category = { slug: categorySlug };
    }
    if (minPrice > 0) {
      where.price = { ...where.price, gte: minPrice };
    }
    if (maxPrice > 0) {
      where.price = { ...where.price, lte: maxPrice };
    }
    if (inStockOnly) {
      where.stockQuantity = { gt: 0 };
    }
    if (productType) {
      where.productType = productType;
    }

    // Fetch more than needed to allow relevance re-ranking
    const fetchLimit = Math.min(limit * 3, 90);
    const products = await prisma.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        slug: true,
        shortDescription: true,
        description: true,
        productType: true,
        price: true,
        compareAtPrice: true,
        imageUrl: true,
        averageRating: true,
        reviewCount: true,
        purchaseCount: true,
        stockQuantity: true,
        isFeatured: true,
        isBestseller: true,
        isNew: true,
        tags: true,
        sku: true,
        category: {
          select: { id: true, name: true, slug: true },
        },
        options: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            price: true,
            optionType: true,
            inStock: true,
          },
          orderBy: { sortOrder: 'asc' },
          take: 5,
        },
      },
      take: fetchLimit,
    });

    // Score and rank by relevance
    const scored = products
      .map((p) => ({
        product: p,
        relevanceScore: computeRelevance(
          {
            name: p.name,
            shortDescription: p.shortDescription,
            description: p.description,
            tags: p.tags,
          },
          q
        ),
      }))
      .sort((a, b) => {
        // Primary: relevance score
        if (b.relevanceScore !== a.relevanceScore) return b.relevanceScore - a.relevanceScore;
        // Secondary: purchase count (popularity)
        return b.product.purchaseCount - a.product.purchaseCount;
      })
      .slice(0, limit);

    const maxScore = scored.length > 0 ? scored[0].relevanceScore : 1;

    const results = scored.map(({ product: p, relevanceScore }) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      url: `https://attitudes.vip/products/${p.slug}`,
      description: p.shortDescription || '',
      type: p.productType,
      relevance: {
        score: relevanceScore,
        normalized: maxScore > 0 ? Math.round((relevanceScore / maxScore) * 100) / 100 : 0,
      },
      pricing: {
        currency: 'CAD',
        price: Number(p.price),
        compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
        onSale: p.compareAtPrice ? Number(p.compareAtPrice) > Number(p.price) : false,
      },
      category: p.category ? { name: p.category.name, slug: p.category.slug } : null,
      availability: {
        inStock: p.stockQuantity > 0,
        quantity: p.stockQuantity,
      },
      ratings: {
        average: p.averageRating ? Number(p.averageRating) : null,
        count: p.reviewCount,
      },
      badges: {
        featured: p.isFeatured,
        bestseller: p.isBestseller,
        new: p.isNew,
      },
      image: p.imageUrl || null,
      optionCount: p.options.length,
      priceRange: p.options.length > 0
        ? {
            min: Math.min(Number(p.price), ...p.options.map((o) => Number(o.price))),
            max: Math.max(Number(p.price), ...p.options.map((o) => Number(o.price))),
          }
        : null,
      detailUrl: `/api/storefront/product/${p.slug}`,
    }));

    // Log search for analytics
    try {
      await prisma.searchLog.create({
        data: {
          query: q,
          resultCount: results.length,
          filters: {
            category: categorySlug || null,
            minPrice: minPrice || null,
            maxPrice: maxPrice || null,
            inStock: inStockOnly || null,
            type: productType || null,
            source: 'ai_storefront',
          },
        },
      });
    } catch {
      // Non-critical — don't fail the response
    }

    return NextResponse.json(
      {
        query: q,
        filters: {
          category: categorySlug || null,
          minPrice: minPrice || null,
          maxPrice: maxPrice || null,
          inStock: inStockOnly,
          type: productType || null,
        },
        results,
        totalResults: results.length,
        _links: {
          self: `/api/storefront/search?q=${encodeURIComponent(q)}&limit=${limit}`,
          catalog: '/api/storefront',
          openapi: '/api/storefront/openapi.json',
        },
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
          'X-RateLimit-Limit': String(rl.limit),
          'X-RateLimit-Remaining': String(rl.remaining),
          'X-RateLimit-Reset': String(Math.ceil(rl.resetAt / 1000)),
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      }
    );
  } catch (error) {
    logger.error('Storefront search error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: 'internal_error', message: 'Search failed.' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}
