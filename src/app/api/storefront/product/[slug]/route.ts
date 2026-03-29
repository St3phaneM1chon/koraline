export const dynamic = 'force-dynamic';

/**
 * Agentic Storefront API — Product Detail (G15)
 *
 * Returns full product detail optimized for AI agent understanding.
 * Includes structured descriptions, options, pricing, reviews, and related products.
 *
 * GET /api/storefront/product/:slug
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

// ---------------------------------------------------------------------------
// GET handler
// ---------------------------------------------------------------------------

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
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

    const { slug } = await params;

    const product = await prisma.product.findUnique({
      where: { slug, isActive: true },
      select: {
        id: true,
        name: true,
        subtitle: true,
        slug: true,
        shortDescription: true,
        description: true,
        fullDetails: true,
        specifications: true,
        productType: true,
        price: true,
        compareAtPrice: true,
        imageUrl: true,
        videoUrl: true,
        certificateUrl: true,
        certificateName: true,
        dataSheetUrl: true,
        dataSheetName: true,
        weight: true,
        dimensions: true,
        requiresShipping: true,
        sku: true,
        barcode: true,
        manufacturer: true,
        origin: true,
        averageRating: true,
        reviewCount: true,
        purchaseCount: true,
        stockQuantity: true,
        allowBackorder: true,
        isFeatured: true,
        isBestseller: true,
        isNew: true,
        tags: true,
        aminoSequence: true,
        casNumber: true,
        molecularFormula: true,
        molecularWeight: true,
        purity: true,
        storageConditions: true,
        researchSays: true,
        customSections: true,
        createdAt: true,
        updatedAt: true,
        category: {
          select: { id: true, name: true, slug: true, description: true },
        },
        options: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            comparePrice: true,
            sku: true,
            optionType: true,
            inStock: true,
            stockQuantity: true,
            dosageMg: true,
            volumeMl: true,
            weightGrams: true,
            unitCount: true,
            sortOrder: true,
            availability: true,
          },
          orderBy: { sortOrder: 'asc' },
        },
        images: {
          select: {
            id: true,
            url: true,
            alt: true,
            caption: true,
            isPrimary: true,
            sortOrder: true,
          },
          orderBy: { sortOrder: 'asc' },
        },
        reviews: {
          where: { isPublished: true, isApproved: true },
          select: {
            id: true,
            rating: true,
            title: true,
            comment: true,
            isVerified: true,
            helpfulCount: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'not_found', message: `Product "${slug}" not found.` },
        { status: 404 }
      );
    }

    // Fetch related products (same category, different product)
    const relatedProducts = await prisma.product.findMany({
      where: {
        isActive: true,
        categoryId: product.category?.id,
        NOT: { id: product.id },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        shortDescription: true,
        price: true,
        compareAtPrice: true,
        imageUrl: true,
        averageRating: true,
        reviewCount: true,
      },
      orderBy: { purchaseCount: 'desc' },
      take: 6,
    });

    // Format product for AI agents
    const formatted = {
      id: product.id,
      name: product.name,
      subtitle: product.subtitle || null,
      slug: product.slug,
      url: `https://attitudes.vip/products/${product.slug}`,
      type: product.productType,

      descriptions: {
        short: product.shortDescription || '',
        full: product.description || '',
        details: product.fullDetails || '',
        specifications: product.specifications || '',
        researchSummary: product.researchSays || '',
      },

      pricing: {
        currency: 'CAD',
        price: Number(product.price),
        compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
        onSale: product.compareAtPrice ? Number(product.compareAtPrice) > Number(product.price) : false,
        savingsPercent: product.compareAtPrice && Number(product.compareAtPrice) > Number(product.price)
          ? Math.round((1 - Number(product.price) / Number(product.compareAtPrice)) * 100)
          : null,
      },

      category: product.category
        ? {
            name: product.category.name,
            slug: product.category.slug,
            description: product.category.description || '',
          }
        : null,

      availability: {
        inStock: product.stockQuantity > 0 || product.allowBackorder,
        quantity: product.stockQuantity,
        allowBackorder: product.allowBackorder,
        requiresShipping: product.requiresShipping,
      },

      ratings: {
        average: product.averageRating ? Number(product.averageRating) : null,
        count: product.reviewCount,
        totalPurchases: product.purchaseCount,
      },

      badges: {
        featured: product.isFeatured,
        bestseller: product.isBestseller,
        new: product.isNew,
      },

      images: product.images.map((img) => ({
        url: img.url,
        alt: img.alt || product.name,
        caption: img.caption || null,
        isPrimary: img.isPrimary,
      })),
      primaryImage: product.imageUrl || product.images.find((i) => i.isPrimary)?.url || null,

      options: product.options.map((o) => ({
        id: o.id,
        name: o.name,
        description: o.description || null,
        type: o.optionType,
        sku: o.sku || null,
        price: Number(o.price),
        comparePrice: o.comparePrice ? Number(o.comparePrice) : null,
        inStock: o.inStock,
        quantity: o.stockQuantity,
        availability: o.availability,
        dosageMg: o.dosageMg ? Number(o.dosageMg) : null,
        volumeMl: o.volumeMl ? Number(o.volumeMl) : null,
        weightGrams: o.weightGrams || null,
        unitCount: o.unitCount || null,
      })),

      physicalAttributes: {
        weight: product.weight ? Number(product.weight) : null,
        dimensions: product.dimensions || null,
        sku: product.sku || null,
        barcode: product.barcode || null,
      },

      science: {
        aminoSequence: product.aminoSequence || null,
        casNumber: product.casNumber || null,
        molecularFormula: product.molecularFormula || null,
        molecularWeight: product.molecularWeight ? Number(product.molecularWeight) : null,
        purity: product.purity ? `${Number(product.purity)}%` : null,
        storageConditions: product.storageConditions || null,
      },

      documents: {
        certificate: product.certificateUrl
          ? { url: product.certificateUrl, name: product.certificateName || 'Certificate' }
          : null,
        dataSheet: product.dataSheetUrl
          ? { url: product.dataSheetUrl, name: product.dataSheetName || 'Data Sheet' }
          : null,
        video: product.videoUrl || null,
      },

      manufacturer: product.manufacturer || null,
      origin: product.origin || null,
      tags: product.tags ? product.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],

      reviews: product.reviews.map((r) => ({
        rating: r.rating,
        title: r.title || null,
        comment: r.comment || null,
        verified: r.isVerified,
        helpfulCount: r.helpfulCount,
        date: r.createdAt.toISOString().split('T')[0],
      })),

      relatedProducts: relatedProducts.map((rp) => ({
        name: rp.name,
        slug: rp.slug,
        description: rp.shortDescription || '',
        price: Number(rp.price),
        compareAtPrice: rp.compareAtPrice ? Number(rp.compareAtPrice) : null,
        image: rp.imageUrl || null,
        rating: rp.averageRating ? Number(rp.averageRating) : null,
        reviewCount: rp.reviewCount,
        url: `https://attitudes.vip/products/${rp.slug}`,
        detailUrl: `/api/storefront/product/${rp.slug}`,
      })),

      metadata: {
        createdAt: product.createdAt.toISOString(),
        updatedAt: product.updatedAt.toISOString(),
      },

      _links: {
        self: `/api/storefront/product/${product.slug}`,
        catalog: '/api/storefront',
        categoryProducts: product.category
          ? `/api/storefront?category=${product.category.slug}`
          : null,
        buyPage: `https://attitudes.vip/products/${product.slug}`,
      },
    };

    return NextResponse.json(
      { product: formatted },
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
    logger.error('Storefront product detail error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: 'internal_error', message: 'Failed to fetch product details.' },
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
