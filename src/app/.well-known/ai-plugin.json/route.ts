/**
 * OpenAI AI Plugin Manifest — /.well-known/ai-plugin.json
 *
 * Standard manifest format for AI agents (ChatGPT, Claude, Perplexity)
 * to discover and understand the storefront API capabilities.
 *
 * Specification: https://platform.openai.com/docs/plugins/getting-started
 */

import { NextResponse } from 'next/server';

const PLUGIN_MANIFEST = {
  schema_version: 'v1',
  name_for_human: 'Attitudes VIP Store',
  name_for_model: 'attitudes_vip_store',
  description_for_human:
    'Browse and search premium peptides, supplements, and research products from Attitudes VIP. View product details, pricing, availability, and customer reviews.',
  description_for_model:
    'Access the Attitudes VIP e-commerce catalog. Use this plugin to search for peptides, supplements, and research products. You can browse the full catalog, search by name or description using natural language, filter by category/price/availability, and get detailed product information including pricing, options, scientific data, reviews, and availability. All prices are in CAD (Canadian Dollars). The store specializes in research-grade peptides and wellness supplements.',
  auth: {
    type: 'none',
  },
  api: {
    type: 'openapi',
    url: 'https://attitudes.vip/api/storefront/openapi.json',
    is_user_authenticated: false,
  },
  logo_url: 'https://attitudes.vip/logo.png',
  contact_email: 'support@attitudes.vip',
  legal_info_url: 'https://attitudes.vip/terms',
};

export async function GET() {
  return NextResponse.json(PLUGIN_MANIFEST, {
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
