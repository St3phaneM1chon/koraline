export const dynamic = 'force-dynamic';

/**
 * Agentic Storefront API — Product Catalog (G15)
 *
 * Public API optimized for AI agent consumption (ChatGPT, Claude, Perplexity).
 * Returns structured product catalog with search, filter, and pagination.
 *
 * Rate limit: 100 req/min per IP (see rate-limiter.ts config 'storefront').
 *
 * GET /api/storefront
 *   ?q=search+term          — keyword search in name/description
 *   &category=slug           — filter by category slug
 *   &minPrice=10             — minimum price filter
 *   &maxPrice=100            — maximum price filter
 *   &inStock=true            — only in-stock products
 *   &sort=price_asc|price_desc|name|newest|rating|popular
 *   &page=1                  — pagination (1-based)
 *   &limit=20                — items per page (max 50)
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

function buildSortOrder(sort: string | null): Record<string, 'asc' | 'desc'> {
  switch (sort) {
    case 'price_asc':
      return { price: 'asc' };
    case 'price_desc':
      return { price: 'desc' };
    case 'name':
      return { name: 'asc' };
    case 'newest':
      return { createdAt: 'desc' };
    case 'rating':
      return { averageRating: 'desc' };
    case 'popular':
      return { purchaseCount: 'desc' };
    default:
      return { createdAt: 'desc' };
  }
}

// ---------------------------------------------------------------------------
// GET handler
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  // Rate limiting
  const ip = getClientIp(request);
  const rl = await checkRateLimit(ip, '/api/storefront');
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
          'X-RateLimit-Limit': String(rl.limit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(rl.resetAt / 1000)),
        },
      }
    );
  }

  try {
    // Check feature flag
    const enabled = await isStorefrontEnabled();
    if (!enabled) {
      return NextResponse.json(
        {
          error: 'storefront_disabled',
          message: 'The AI Storefront API is currently disabled. Contact the store administrator.',
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
    const sort = searchParams.get('sort');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(Math.max(1, parseInt(searchParams.get('limit') || '20', 10)), 50);

    // Build where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { isActive: true };

    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { shortDescription: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { tags: { contains: q, mode: 'insensitive' } },
      ];
    }

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

    const orderBy = buildSortOrder(sort);

    // Fetch products + categories in parallel
    const [products, total, categories] = await Promise.all([
      prisma.product.findMany({
        where,
        select: {
          id: true,
          name: true,
          slug: true,
          shortDescription: true,
          productType: true,
          price: true,
          compareAtPrice: true,
          imageUrl: true,
          categoryId: true,
          averageRating: true,
          reviewCount: true,
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
              comparePrice: true,
              optionType: true,
              inStock: true,
              stockQuantity: true,
              dosageMg: true,
              volumeMl: true,
              sortOrder: true,
            },
            orderBy: { sortOrder: 'asc' },
          },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where }),
      prisma.category.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          parentId: true,
          imageUrl: true,
        },
        orderBy: { sortOrder: 'asc' },
      }),
    ]);

    // Format for AI-optimized consumption
    const formattedProducts = products.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      url: `https://attitudes.vip/products/${p.slug}`,
      description: p.shortDescription || '',
      type: p.productType,
      pricing: {
        currency: 'CAD',
        price: Number(p.price),
        compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
        onSale: p.compareAtPrice ? Number(p.compareAtPrice) > Number(p.price) : false,
      },
      category: p.category
        ? { name: p.category.name, slug: p.category.slug }
        : null,
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
      sku: p.sku || null,
      tags: p.tags ? p.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      options: p.options.map((o) => ({
        id: o.id,
        name: o.name,
        type: o.optionType,
        price: Number(o.price),
        comparePrice: o.comparePrice ? Number(o.comparePrice) : null,
        inStock: o.inStock,
        quantity: o.stockQuantity,
        dosageMg: o.dosageMg ? Number(o.dosageMg) : null,
        volumeMl: o.volumeMl ? Number(o.volumeMl) : null,
      })),
      detailUrl: `/api/storefront/product/${p.slug}`,
    }));

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json(
      {
        storefront: {
          name: 'Attitudes VIP',
          url: 'https://attitudes.vip',
          description: 'Premium peptides and supplements for research and wellness.',
          currency: 'CAD',
          apiVersion: '1.0.0',
        },
        products: formattedProducts,
        categories: categories.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          description: c.description || '',
          parentId: c.parentId,
          image: c.imageUrl || null,
          filterUrl: `/api/storefront?category=${c.slug}`,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
        _links: {
          self: `/api/storefront?page=${page}&limit=${limit}`,
          next: page < totalPages ? `/api/storefront?page=${page + 1}&limit=${limit}` : null,
          prev: page > 1 ? `/api/storefront?page=${page - 1}&limit=${limit}` : null,
          search: '/api/storefront/search',
          openapi: '/api/storefront/openapi.json',
        },
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
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
    logger.error('Storefront catalog error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: 'internal_error', message: 'Failed to fetch storefront catalog.' },
      { status: 500 }
    );
  }
}

// CORS preflight
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
