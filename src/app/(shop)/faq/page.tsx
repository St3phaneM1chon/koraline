// BUG-060 FIX: Reduce ISR cache to 5 min for fresher data
export const revalidate = 300;

import { Metadata } from 'next';
import FaqPageClient from './FaqPageClient';
import { JsonLd } from '@/components/seo/JsonLd';
import { faqSchema, breadcrumbSchema } from '@/lib/structured-data';
import { prisma } from '@/lib/db';

const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'Attitudes VIP';

export const metadata: Metadata = {
  title: 'Foire aux questions',
  description:
    `Trouvez les réponses à vos questions sur la Suite Koraline, les fonctionnalités, la tarification, la formation en ligne et le support technique chez ${siteName}.`,
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_APP_URL || 'https://attitudes.vip'}/faq`,
  },
  openGraph: {
    title: `FAQ - ${siteName}`,
    description:
      'Réponses à vos questions sur la Suite Koraline : gestion commerciale, comptabilité, CRM, formation en ligne et plus.',
    url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://attitudes.vip'}/faq`,
    type: 'website',
    images: [
      {
        url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://attitudes.vip'}/api/og?title=FAQ&type=page`,
        width: 1200,
        height: 630,
        alt: `FAQ - ${siteName}`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `FAQ - ${siteName}`,
    description:
      'Réponses à vos questions sur la Suite Koraline : gestion commerciale, comptabilité, CRM, formation en ligne et plus.',
    images: [`${process.env.NEXT_PUBLIC_APP_URL || 'https://attitudes.vip'}/api/og?title=FAQ&type=page`],
  },
};

async function getFaqs() {
  try {
    const faqs = await prisma.faq.findMany({
      where: { isPublished: true },
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
      select: { id: true, question: true, answer: true, category: true, sortOrder: true },
    });
    return faqs;
  } catch (error) {
    console.warn('ISR build fallback: DB unavailable for getFaqs:', error);
    return [];
  }
}

export default async function FaqPage() {
  const faqs = await getFaqs();

  // Group by category for the client component
  const byCategory: Record<string, { question: string; answer: string }[]> = {};
  for (const faq of faqs) {
    if (!byCategory[faq.category]) byCategory[faq.category] = [];
    byCategory[faq.category].push({ question: faq.question, answer: faq.answer });
  }

  const faqJsonLd = faqs.length > 0
    ? faqSchema(faqs.map((f) => ({ question: f.question, answer: f.answer })))
    : null;

  const breadcrumbJsonLd = breadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'FAQ', url: '/faq' },
  ]);

  return (
    <>
      {faqJsonLd && <JsonLd data={faqJsonLd} />}
      <JsonLd data={breadcrumbJsonLd} />
      <FaqPageClient initialByCategory={byCategory} />
    </>
  );
}
