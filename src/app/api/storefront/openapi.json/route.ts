/**
 * Agentic Storefront — OpenAPI 3.1 Specification (G15)
 *
 * Machine-readable API specification for AI agents to understand
 * the storefront endpoints, parameters, and response shapes.
 */

import { NextResponse } from 'next/server';

const OPENAPI_SPEC = {
  openapi: '3.1.0',
  info: {
    title: 'Attitudes VIP — Agentic Storefront API',
    description:
      'Public API for AI agents to browse, search, and discover products from the Attitudes VIP store. Specializes in premium peptides, supplements, and research products. All prices in CAD.',
    version: '1.0.0',
    contact: {
      name: 'Attitudes VIP Support',
      email: 'support@attitudes.vip',
      url: 'https://attitudes.vip',
    },
    license: {
      name: 'Proprietary',
    },
  },
  servers: [
    {
      url: 'https://attitudes.vip',
      description: 'Production',
    },
  ],
  paths: {
    '/api/storefront': {
      get: {
        operationId: 'listProducts',
        summary: 'Browse the product catalog',
        description:
          'Returns a paginated list of products with categories. Supports keyword search, category filtering, price ranges, and sorting. Optimized for AI agent consumption with structured data.',
        parameters: [
          {
            name: 'q',
            in: 'query',
            description: 'Search keyword to filter products by name, description, or tags',
            required: false,
            schema: { type: 'string' },
          },
          {
            name: 'category',
            in: 'query',
            description: 'Filter by category slug (e.g., "peptides", "supplements")',
            required: false,
            schema: { type: 'string' },
          },
          {
            name: 'minPrice',
            in: 'query',
            description: 'Minimum price filter in CAD',
            required: false,
            schema: { type: 'number', minimum: 0 },
          },
          {
            name: 'maxPrice',
            in: 'query',
            description: 'Maximum price filter in CAD',
            required: false,
            schema: { type: 'number', minimum: 0 },
          },
          {
            name: 'inStock',
            in: 'query',
            description: 'If true, only return products that are currently in stock',
            required: false,
            schema: { type: 'boolean' },
          },
          {
            name: 'sort',
            in: 'query',
            description: 'Sort order for results',
            required: false,
            schema: {
              type: 'string',
              enum: ['price_asc', 'price_desc', 'name', 'newest', 'rating', 'popular'],
            },
          },
          {
            name: 'page',
            in: 'query',
            description: 'Page number (1-based)',
            required: false,
            schema: { type: 'integer', minimum: 1, default: 1 },
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Items per page (max 50)',
            required: false,
            schema: { type: 'integer', minimum: 1, maximum: 50, default: 20 },
          },
        ],
        responses: {
          '200': {
            description: 'Product catalog with pagination and category list',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    storefront: {
                      type: 'object',
                      properties: {
                        name: { type: 'string' },
                        url: { type: 'string' },
                        description: { type: 'string' },
                        currency: { type: 'string' },
                        apiVersion: { type: 'string' },
                      },
                    },
                    products: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/ProductSummary' },
                    },
                    categories: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Category' },
                    },
                    pagination: { $ref: '#/components/schemas/Pagination' },
                  },
                },
              },
            },
          },
          '429': { description: 'Rate limit exceeded' },
          '503': { description: 'AI Storefront is disabled by the store administrator' },
        },
      },
    },
    '/api/storefront/product/{slug}': {
      get: {
        operationId: 'getProductDetail',
        summary: 'Get full product details',
        description:
          'Returns comprehensive product information including descriptions, all options with pricing, scientific data (for peptides), customer reviews, images, documents, and related products.',
        parameters: [
          {
            name: 'slug',
            in: 'path',
            description: 'Product URL slug',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Detailed product information',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    product: { $ref: '#/components/schemas/ProductDetail' },
                  },
                },
              },
            },
          },
          '404': { description: 'Product not found' },
          '429': { description: 'Rate limit exceeded' },
          '503': { description: 'AI Storefront is disabled' },
        },
      },
    },
    '/api/storefront/search': {
      get: {
        operationId: 'searchProducts',
        summary: 'Natural language product search',
        description:
          'Search for products using natural language queries. Returns results ranked by relevance score. Supports filters for category, price range, availability, and product type.',
        parameters: [
          {
            name: 'q',
            in: 'query',
            description: 'Natural language search query (e.g., "anti-aging peptide under $100")',
            required: true,
            schema: { type: 'string' },
          },
          {
            name: 'category',
            in: 'query',
            description: 'Filter by category slug',
            required: false,
            schema: { type: 'string' },
          },
          {
            name: 'minPrice',
            in: 'query',
            description: 'Minimum price in CAD',
            required: false,
            schema: { type: 'number' },
          },
          {
            name: 'maxPrice',
            in: 'query',
            description: 'Maximum price in CAD',
            required: false,
            schema: { type: 'number' },
          },
          {
            name: 'inStock',
            in: 'query',
            description: 'Only return in-stock products',
            required: false,
            schema: { type: 'boolean' },
          },
          {
            name: 'type',
            in: 'query',
            description: 'Filter by product type',
            required: false,
            schema: {
              type: 'string',
              enum: ['PEPTIDE', 'SUPPLEMENT', 'ACCESSORY', 'BUNDLE', 'CAPSULE', 'LAB_SUPPLY', 'FORMATION'],
            },
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Maximum number of results (max 30)',
            required: false,
            schema: { type: 'integer', minimum: 1, maximum: 30, default: 10 },
          },
        ],
        responses: {
          '200': {
            description: 'Search results ranked by relevance',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    query: { type: 'string' },
                    filters: { type: 'object' },
                    results: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/SearchResult' },
                    },
                    totalResults: { type: 'integer' },
                  },
                },
              },
            },
          },
          '400': { description: 'Missing required "q" parameter' },
          '429': { description: 'Rate limit exceeded' },
          '503': { description: 'AI Storefront is disabled' },
        },
      },
    },
  },
  components: {
    schemas: {
      ProductSummary: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          slug: { type: 'string' },
          url: { type: 'string', description: 'Direct link to product page' },
          description: { type: 'string' },
          type: { type: 'string', enum: ['PEPTIDE', 'SUPPLEMENT', 'ACCESSORY', 'BUNDLE', 'CAPSULE', 'LAB_SUPPLY', 'FORMATION'] },
          pricing: {
            type: 'object',
            properties: {
              currency: { type: 'string' },
              price: { type: 'number' },
              compareAtPrice: { type: 'number', nullable: true },
              onSale: { type: 'boolean' },
            },
          },
          category: {
            type: 'object',
            nullable: true,
            properties: {
              name: { type: 'string' },
              slug: { type: 'string' },
            },
          },
          availability: {
            type: 'object',
            properties: {
              inStock: { type: 'boolean' },
              quantity: { type: 'integer' },
            },
          },
          ratings: {
            type: 'object',
            properties: {
              average: { type: 'number', nullable: true },
              count: { type: 'integer' },
            },
          },
          badges: {
            type: 'object',
            properties: {
              featured: { type: 'boolean' },
              bestseller: { type: 'boolean' },
              new: { type: 'boolean' },
            },
          },
          image: { type: 'string', nullable: true },
          tags: { type: 'array', items: { type: 'string' } },
          options: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                type: { type: 'string' },
                price: { type: 'number' },
                inStock: { type: 'boolean' },
              },
            },
          },
          detailUrl: { type: 'string', description: 'API URL for full product details' },
        },
      },
      ProductDetail: {
        type: 'object',
        description: 'Full product information including all options, science data, reviews, and related products',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          slug: { type: 'string' },
          url: { type: 'string' },
          type: { type: 'string' },
          descriptions: {
            type: 'object',
            properties: {
              short: { type: 'string' },
              full: { type: 'string' },
              details: { type: 'string' },
              specifications: { type: 'string' },
              researchSummary: { type: 'string' },
            },
          },
          pricing: {
            type: 'object',
            properties: {
              currency: { type: 'string' },
              price: { type: 'number' },
              compareAtPrice: { type: 'number', nullable: true },
              onSale: { type: 'boolean' },
              savingsPercent: { type: 'integer', nullable: true },
            },
          },
          availability: {
            type: 'object',
            properties: {
              inStock: { type: 'boolean' },
              quantity: { type: 'integer' },
              allowBackorder: { type: 'boolean' },
              requiresShipping: { type: 'boolean' },
            },
          },
          science: {
            type: 'object',
            description: 'Scientific data for research products (peptides)',
            properties: {
              aminoSequence: { type: 'string', nullable: true },
              casNumber: { type: 'string', nullable: true },
              molecularFormula: { type: 'string', nullable: true },
              molecularWeight: { type: 'number', nullable: true },
              purity: { type: 'string', nullable: true },
              storageConditions: { type: 'string', nullable: true },
            },
          },
          options: { type: 'array', items: { type: 'object' } },
          images: { type: 'array', items: { type: 'object' } },
          reviews: { type: 'array', items: { type: 'object' } },
          relatedProducts: { type: 'array', items: { type: 'object' } },
        },
      },
      SearchResult: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          slug: { type: 'string' },
          url: { type: 'string' },
          description: { type: 'string' },
          relevance: {
            type: 'object',
            properties: {
              score: { type: 'integer', description: 'Raw relevance score' },
              normalized: { type: 'number', description: 'Normalized 0-1 score relative to best match' },
            },
          },
          pricing: { type: 'object' },
          availability: { type: 'object' },
          detailUrl: { type: 'string' },
        },
      },
      Category: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          slug: { type: 'string' },
          description: { type: 'string' },
          parentId: { type: 'string', nullable: true },
          image: { type: 'string', nullable: true },
          filterUrl: { type: 'string', description: 'API URL to list products in this category' },
        },
      },
      Pagination: {
        type: 'object',
        properties: {
          page: { type: 'integer' },
          limit: { type: 'integer' },
          total: { type: 'integer' },
          totalPages: { type: 'integer' },
          hasNextPage: { type: 'boolean' },
          hasPreviousPage: { type: 'boolean' },
        },
      },
    },
  },
};

export async function GET() {
  return NextResponse.json(OPENAPI_SPEC, {
    headers: {
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Content-Type': 'application/json',
    },
  });
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
