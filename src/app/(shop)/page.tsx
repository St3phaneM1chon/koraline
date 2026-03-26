import { Metadata } from 'next';
import { prisma } from '@/lib/db';
import HomePageClient from './HomePageClient';
import HomePageEmpty from './HomePageEmpty';
import HomePageLearning from './HomePageLearning';
import type { TestimonialData } from './HomePageClient';
import { JsonLd } from '@/components/seo/JsonLd';
import { getTenantBranding } from '@/lib/tenant-branding';
import { headers } from 'next/headers';

// Revalidate hero slides every 60 seconds (ISR) for fresh content without blocking render
export const revalidate = 60;

// Static fallback metadata — overridden at render time by JSON-LD with tenant name
const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'Attitudes VIP';
const siteDescription = "Canada's trusted source for premium research peptides. Lab-tested, 99%+ purity, fast shipping.";

export const metadata: Metadata = {
  title: `${siteName} - Premium Research Peptides Canada`,
  description:
    `${siteDescription} Shop BPC-157, TB-500, Semaglutide and more.`,
  alternates: {
    canonical: process.env.NEXT_PUBLIC_APP_URL || 'https://attitudes.vip',
  },
  openGraph: {
    title: `${siteName} - Premium Research Peptides Canada`,
    description: siteDescription,
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://attitudes.vip',
    type: 'website',
    images: [
      {
        url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://attitudes.vip'}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: `${siteName} - Premium Research Peptides Canada`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${siteName} - Premium Research Peptides Canada`,
    description: siteDescription,
    images: [`${process.env.NEXT_PUBLIC_APP_URL || 'https://attitudes.vip'}/opengraph-image`],
  },
};

/** Fetch active hero slides server-side for instant LCP (no client-side loading flash). */
async function getHeroSlides() {
  try {
    const now = new Date();
    const slides = await prisma.heroSlide.findMany({
      where: {
        isActive: true,
        OR: [
          { startDate: null, endDate: null },
          { startDate: { lte: now }, endDate: null },
          { startDate: null, endDate: { gte: now } },
          { startDate: { lte: now }, endDate: { gte: now } },
        ],
      },
      include: { translations: true },
      orderBy: { sortOrder: 'asc' },
    });
    // Serialize to plain objects to avoid Date serialization issues across the server/client boundary
    return JSON.parse(JSON.stringify(slides));
  } catch (error) {
    console.warn('[getHeroSlides] Failed to fetch hero slides, returning empty array:', error);
    return [];
  }
}

/** Fetch published testimonials server-side, preferring locale-specific translations. */
async function getTestimonials(): Promise<TestimonialData[]> {
  try {
    const testimonials = await prisma.testimonial.findMany({
      where: { isPublished: true },
      include: { translations: true },
      orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }, { createdAt: 'desc' }],
      take: 6,
    });
    return JSON.parse(JSON.stringify(testimonials));
  } catch (error) {
    console.warn('[getTestimonials] Failed to fetch testimonials, returning empty array:', error);
    return [];
  }
}

/** Count active products for the current tenant. */
async function getProductCount(): Promise<number> {
  try {
    return await prisma.product.count({ where: { isActive: true } });
  } catch {
    return 0;
  }
}

/** Count published courses for the current tenant (LMS module). */
async function getCourseCount(): Promise<number> {
  try {
    return await prisma.course.count({ where: { status: 'PUBLISHED' } });
  } catch {
    return 0;
  }
}

/** Check if a specific module is enabled for the current tenant. */
async function isModuleEnabled(tenantSlug: string, moduleName: string): Promise<boolean> {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      select: { modulesEnabled: true },
    });
    if (!tenant) return false;
    const modules: string[] = (() => {
      try {
        const raw = tenant.modulesEnabled;
        if (Array.isArray(raw)) return raw;
        if (typeof raw === 'string') return JSON.parse(raw);
        return [];
      } catch {
        return [];
      }
    })();
    return modules.includes(moduleName);
  } catch {
    return false;
  }
}

/** Fetch published courses for learning-focused homepage. */
async function getPublishedCourses() {
  try {
    const courses = await prisma.course.findMany({
      where: { status: 'PUBLISHED' },
      select: {
        id: true,
        slug: true,
        title: true,
        subtitle: true,
        description: true,
        thumbnailUrl: true,
        level: true,
        isFree: true,
        price: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 12,
    });
    return JSON.parse(JSON.stringify(courses));
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const headersList = await headers();
  const tenantSlug = headersList.get('x-tenant-slug') || 'attitudes';

  const [heroSlides, testimonials, branding, productCount, courseCount, lmsEnabled] = await Promise.all([
    getHeroSlides(),
    getTestimonials(),
    getTenantBranding(),
    getProductCount(),
    getCourseCount(),
    isModuleEnabled(tenantSlug, 'lms'),
  ]);

  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://attitudes.vip';
  const tenantName = branding.name;

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: tenantName,
    url: siteUrl,
    logo: branding.logoUrl || `${siteUrl}/icon-512.png`,
    description: `${tenantName} - Powered by Koraline`,
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      url: `${siteUrl}/contact`,
      availableLanguage: ['English', 'French'],
    },
  };

  const webSiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: tenantName,
    url: siteUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${siteUrl}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  // ---------------------------------------------------------------------------
  // Dynamic Homepage: Choose the right layout based on tenant content
  // ---------------------------------------------------------------------------
  // 1. Tenant has products → full shop homepage (existing)
  // 2. Tenant has courses but no products → learning-focused homepage
  // 3. Tenant has neither → clean branded welcome page
  // ---------------------------------------------------------------------------

  const hasProducts = productCount > 0;
  const hasCourses = lmsEnabled && courseCount > 0;

  // Case 3: No products AND no courses → clean welcome page
  if (!hasProducts && !hasCourses) {
    return (
      <>
        <JsonLd data={organizationSchema} />
        <JsonLd data={webSiteSchema} />
        <h1 className="sr-only">{tenantName}</h1>
        <HomePageEmpty branding={branding} />
      </>
    );
  }

  // Case 2: Courses but no products → learning-focused homepage
  if (!hasProducts && hasCourses) {
    const courses = await getPublishedCourses();
    return (
      <>
        <JsonLd data={organizationSchema} />
        <JsonLd data={webSiteSchema} />
        <h1 className="sr-only">{tenantName}</h1>
        <HomePageLearning branding={branding} courses={courses} />
      </>
    );
  }

  // Case 1: Has products → full shop homepage
  return (
    <>
      <JsonLd data={organizationSchema} />
      <JsonLd data={webSiteSchema} />
      <h1 className="sr-only">{tenantName}</h1>
      <HomePageClient initialHeroSlides={heroSlides} initialTestimonials={testimonials} />
    </>
  );
}
