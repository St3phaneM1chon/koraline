export const dynamic = 'force-dynamic';

/**
 * G21 - Express Checkout (Buy Now)
 * Creates a Stripe Checkout Session for a single product, skipping the cart.
 * Returns the Stripe-hosted checkout URL so the client can redirect.
 *
 * POST /api/checkout/express
 * Body: { productId, optionId?, quantity? }
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { z } from 'zod';
import { auth } from '@/lib/auth-config';
import { prisma } from '@/lib/db';
import { STRIPE_API_VERSION } from '@/lib/stripe';
import { validateCsrf } from '@/lib/csrf-middleware';
import { rateLimitMiddleware } from '@/lib/rate-limiter';
import { toCents } from '@/lib/decimal-calculator';
import { logger } from '@/lib/logger';
import { getClientIpFromRequest } from '@/lib/admin-audit';

// KB-PP-BUILD-002: Lazy init to avoid crash when STRIPE_SECRET_KEY is absent at build time
let _stripe: Stripe | null = null;
function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY not configured');
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: STRIPE_API_VERSION });
  }
  return _stripe;
}

const expressSchema = z.object({
  productId: z.string().min(1, 'productId is required'),
  optionId: z.string().optional().nullable(),
  quantity: z.number().int().min(1).max(100).optional().default(1),
});

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIpFromRequest(request);
    const rl = await rateLimitMiddleware(ip, '/api/checkout/express');
    if (!rl.success) {
      const res = NextResponse.json({ error: 'Too many requests' }, { status: 429 });
      Object.entries(rl.headers).forEach(([k, v]) => res.headers.set(k, v));
      return res;
    }

    // CSRF protection
    const csrfValid = await validateCsrf(request);
    if (!csrfValid) {
      return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
    }

    // Auth required
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Parse body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const parsed = expressSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { productId, optionId, quantity } = parsed.data;

    // Fetch product
    const product = await prisma.product.findUnique({
      where: { id: productId, isActive: true },
      select: {
        id: true,
        name: true,
        price: true,
        isActive: true,
        images: { where: { isPrimary: true }, take: 1, select: { url: true } },
      },
    });

    if (!product || !product.isActive) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Resolve price from option if provided
    let unitPrice = Number(product.price);
    let lineItemName = product.name;

    if (optionId) {
      const option = await prisma.productOption.findUnique({
        where: { id: optionId },
        select: {
          price: true,
          name: true,
          productId: true,
          stockQuantity: true,
          trackInventory: true,
        },
      });

      if (!option) {
        return NextResponse.json({ error: 'Option not found' }, { status: 404 });
      }
      if (option.productId !== productId) {
        return NextResponse.json({ error: 'Option does not belong to product' }, { status: 400 });
      }
      if (option.trackInventory && option.stockQuantity < quantity) {
        return NextResponse.json(
          { error: `Insufficient stock. Available: ${option.stockQuantity}` },
          { status: 400 },
        );
      }

      unitPrice = Number(option.price);
      lineItemName = `${product.name} - ${option.name}`;
    }

    // Build the Stripe Checkout session
    const origin = request.headers.get('origin') || process.env.NEXTAUTH_URL || 'https://attitudes.vip';
    const imageUrl = product.images[0]?.url;

    const checkoutSession = await getStripe().checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'cad',
            unit_amount: toCents(unitPrice),
            product_data: {
              name: lineItemName,
              ...(imageUrl ? { images: [imageUrl.startsWith('http') ? imageUrl : `${origin}${imageUrl}`] } : {}),
            },
          },
          quantity,
        },
      ],
      // Collect tax via Stripe's automatic tax or shipping address
      shipping_address_collection: {
        allowed_countries: ['CA', 'US', 'FR', 'DE', 'GB', 'AU', 'JP'],
      },
      billing_address_collection: 'required',
      payment_method_types: ['card', 'link'],
      payment_method_options: {
        card: {
          setup_future_usage: 'on_session',
          request_three_d_secure: 'any',
        },
      },
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/product/${product.id}`,
      metadata: {
        expressCheckout: 'true',
        userId: session.user.id,
        productId,
        optionId: optionId || '',
        quantity: String(quantity),
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'EXPRESS_BUY_NOW_SESSION_CREATED',
        entityType: 'CheckoutSession',
        entityId: checkoutSession.id,
        details: JSON.stringify({ productId, optionId, quantity, amount: toCents(unitPrice) * quantity }),
      },
    });

    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    });
  } catch (error) {
    logger.error('Express checkout error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Error creating express checkout session' }, { status: 500 });
  }
}
