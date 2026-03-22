import { Metadata } from 'next';
import { prisma } from '@/lib/db';
import HomePageClient from './HomePageClient';
import type { TestimonialData } from './HomePageClient';
import { JsonLd } from '@/components/seo/JsonLd';

// Revalidate hero slides every 60 seconds (ISR) for fresh content without blocking render
export const revalidate = 60;

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

export default async function HomePage() {
  const [heroSlides, testimonials] = await Promise.all([
    getHeroSlides(),
    getTestimonials(),
  ]);

  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://attitudes.vip';

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteName,
    url: siteUrl,
    logo: `${siteUrl}/icon-512.png`,
    description: `${siteName} - Suite Koraline SaaS e-commerce platform`,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Montreal',
      addressRegion: 'QC',
      addressCountry: 'CA',
    },
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
    name: siteName,
    url: siteUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${siteUrl}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <>
      <JsonLd data={organizationSchema} />
      <JsonLd data={webSiteSchema} />
      <h1 className="sr-only">{siteName} - Research Peptides</h1>
      <HomePageClient initialHeroSlides={heroSlides} initialTestimonials={testimonials} />
    </>
  );
}
