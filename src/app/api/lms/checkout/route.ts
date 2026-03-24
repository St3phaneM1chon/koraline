export const dynamic = 'force-dynamic';

/**
 * LMS Checkout API
 * POST /api/lms/checkout — Create Stripe checkout session for course or bundle
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withUserGuard } from '@/lib/user-api-guard';
import { prisma } from '@/lib/db';
import { resolvePricing, enrollUser, enrollUserInBundle } from '@/lib/lms/lms-service';

const checkoutSchema = z.object({
  type: z.enum(['course', 'bundle']),
  id: z.string().min(1),
  promoCode: z.string().optional(),
});

export const POST = withUserGuard(async (request: NextRequest, { session }) => {
  const tenantId = session.user.tenantId;
  if (!tenantId) {
    return NextResponse.json({ error: 'No tenant context' }, { status: 403 });
  }

  const body = await request.json();
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }

  const { type, id } = parsed.data;
  const userId = session.user.id;

  // Check if user has a corporate account
  const corpEmployee = await prisma.corporateEmployee.findFirst({
    where: { tenantId, userId, isActive: true },
    include: { corporateAccount: true },
  });
  const corporateAccountId = corpEmployee?.corporateAccountId ?? null;

  if (type === 'course') {
    const course = await prisma.course.findFirst({ where: { id, tenantId } });
    if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 });

    // Free course — enroll directly
    if (course.isFree) {
      await enrollUser(tenantId, id, userId);
      return NextResponse.json({ data: { enrolled: true, free: true } });
    }

    const pricing = await resolvePricing(
      { price: course.price, corporatePrice: course.corporatePrice, currency: course.currency },
      corporateAccountId
    );

    // If corporate-sponsored and price is 0, enroll directly
    if (pricing.isCorporate && pricing.price === 0) {
      await enrollUser(tenantId, id, userId);
      await prisma.enrollment.updateMany({
        where: { tenantId, courseId: id, userId },
        data: { corporateAccountId, paymentType: 'corporate', enrollmentSource: 'corporate' },
      });
      return NextResponse.json({ data: { enrolled: true, corporate: true } });
    }

    // Create Stripe checkout session
    // For now, return pricing info — Stripe integration will be in Phase 2
    return NextResponse.json({
      data: {
        type: 'course',
        itemId: id,
        title: course.title,
        pricing,
        corporateSponsored: pricing.isCorporate,
        // stripeSessionUrl: will be added when Stripe checkout is wired
        message: 'Stripe checkout session will be created here',
      },
    });

  } else {
    // Bundle
    const bundle = await prisma.courseBundle.findFirst({
      where: { id, tenantId, isActive: true },
      include: { items: { include: { course: { select: { id: true, title: true, isFree: true } } } } },
    });
    if (!bundle) return NextResponse.json({ error: 'Bundle not found' }, { status: 404 });

    const pricing = await resolvePricing(
      { price: bundle.price, corporatePrice: bundle.corporatePrice, currency: bundle.currency },
      corporateAccountId
    );

    // If corporate-sponsored and price is 0, enroll directly
    if (pricing.isCorporate && pricing.price === 0) {
      const result = await enrollUserInBundle(tenantId, id, userId, {
        corporateAccountId: corporateAccountId ?? undefined,
        paymentType: 'corporate',
      });
      return NextResponse.json({ data: { enrolled: true, corporate: true, ...result } });
    }

    return NextResponse.json({
      data: {
        type: 'bundle',
        itemId: id,
        title: bundle.name,
        courseCount: bundle.items.length,
        courses: bundle.items.map(i => ({ id: i.course.id, title: i.course.title })),
        pricing,
        corporateSponsored: pricing.isCorporate,
        message: 'Stripe checkout session will be created here',
      },
    });
  }
});
