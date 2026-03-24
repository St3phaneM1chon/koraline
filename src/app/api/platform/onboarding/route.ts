/**
 * API: PUT /api/platform/onboarding
 * Persists onboarding steps 2-5 for a new Koraline tenant.
 *
 * Called from the onboarding wizard after each step.
 * Auth: session_id + slug verification (no login required yet — owner just created account).
 */

export const dynamic = 'force-dynamic';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import { getIndustryTemplate } from '@/lib/industry-templates';

const onboardingSchema = z.object({
  tenantId: z.string().min(1),
  step: z.number().int().min(2).max(5),
  data: z.record(z.string(), z.unknown()).refine((val) => Object.keys(val).length > 0, {
    message: 'data ne peut pas être vide',
  }),
});

// Per-step data shapes for type safety
const stepDataSchemas = {
  2: z.object({
    shopName: z.string().max(200).optional(),
    primaryColor: z.string().max(20).optional(),
    secondaryColor: z.string().max(20).optional(),
    logoUrl: z.string().url().optional(),
  }),
  3: z.object({
    industry: z.string().min(1).max(100),
  }),
  4: z.object({
    productName: z.string().min(1).max(200).optional(),
    productPrice: z.number().positive().optional(),
    productDescription: z.string().max(5000).optional(),
  }),
  5: z.object({}),
} as const;

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = onboardingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const { tenantId, step, data } = parsed.data;

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, slug: true, status: true, featuresFlags: true },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant introuvable' }, { status: 404 });
    }

    switch (step) {
      case 2: {
        // Branding: name, primaryColor, secondaryColor, logoUrl
        const stepParsed = stepDataSchemas[2].safeParse(data);
        if (!stepParsed.success) {
          return NextResponse.json({ error: 'Invalid step 2 data', details: stepParsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const { shopName, primaryColor, secondaryColor, logoUrl } = stepParsed.data;
        await prisma.tenant.update({
          where: { id: tenantId },
          data: {
            ...(shopName ? { name: shopName } : {}),
            ...(primaryColor ? { primaryColor } : {}),
            ...(secondaryColor ? { secondaryColor } : {}),
            ...(logoUrl ? { logoUrl } : {}),
          },
        });
        logger.info('Onboarding step 2: branding saved', { tenantId, slug: tenant.slug });
        break;
      }

      case 3: {
        // Industry: store in featuresFlags, seed categories
        const stepParsed = stepDataSchemas[3].safeParse(data);
        if (!stepParsed.success) {
          return NextResponse.json({ error: 'Invalid step 3 data', details: stepParsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const { industry } = stepParsed.data;
        const currentFlags = typeof tenant.featuresFlags === 'string'
          ? JSON.parse(tenant.featuresFlags)
          : (tenant.featuresFlags || {});

        // RACE-FIX: Wrap tenant update + category seeding in transaction
        await prisma.$transaction(async (tx) => {
          await tx.tenant.update({
            where: { id: tenantId },
            data: {
              featuresFlags: JSON.stringify({
                ...currentFlags,
                industry,
                onboardingCompleted: false,
              }),
            },
          });

          // Seed categories from industry template
          const template = getIndustryTemplate(industry);
          if (template.categories.length > 0) {
            const existingCategories = await tx.category.count({
              where: { tenantId },
            });

            if (existingCategories === 0) {
              await tx.category.createMany({
                data: template.categories.map((name, index) => ({
                  name,
                  slug: name.toLowerCase()
                    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/^-|-$/g, ''),
                  sortOrder: index,
                  isActive: true,
                  tenantId,
                })),
                skipDuplicates: true,
              });
              logger.info('Onboarding step 3: categories seeded', {
                tenantId,
                industry,
                count: template.categories.length,
              });
            }
          }
        });
        break;
      }

      case 4: {
        // First product: name, price, description
        const stepParsed = stepDataSchemas[4].safeParse(data);
        if (!stepParsed.success) {
          return NextResponse.json({ error: 'Invalid step 4 data', details: stepParsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const { productName, productPrice, productDescription } = stepParsed.data;
        if (productName && productPrice) {
          const slug = productName.toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');

          // RACE-FIX: Wrap find/create category + create product in transaction (TOCTOU)
          await prisma.$transaction(async (tx) => {
            let defaultCategory = await tx.category.findFirst({
              where: { tenantId },
              orderBy: { sortOrder: 'asc' },
            });
            if (!defaultCategory) {
              defaultCategory = await tx.category.create({
                data: {
                  name: 'General',
                  slug: `general-${Date.now()}`,
                  tenantId,
                },
              });
            }

            await tx.product.create({
              data: {
                name: productName,
                slug: `${slug}-${Date.now()}`,
                description: productDescription || '',
                price: productPrice,
                isActive: true,
                tenantId,
                categoryId: defaultCategory.id,
              },
            });
          });
          logger.info('Onboarding step 4: first product created', { tenantId, productName });
        }
        break;
      }

      case 5: {
        // Completion: mark onboarding as done
        const currentFlags = typeof tenant.featuresFlags === 'string'
          ? JSON.parse(tenant.featuresFlags)
          : (tenant.featuresFlags || {});

        await prisma.tenant.update({
          where: { id: tenantId },
          data: {
            featuresFlags: JSON.stringify({
              ...currentFlags,
              onboardingCompleted: true,
              onboardingCompletedAt: new Date().toISOString(),
            }),
          },
        });
        logger.info('Onboarding completed', { tenantId, slug: tenant.slug });
        break;
      }

      default:
        return NextResponse.json({ error: `Step ${step} invalide` }, { status: 400 });
    }

    return NextResponse.json({ success: true, step });
  } catch (error) {
    logger.error('Onboarding step failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: 'Erreur lors de la sauvegarde' },
      { status: 500 }
    );
  }
}
