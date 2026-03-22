import { Metadata } from 'next';
import LearnPageClient from './LearnPageClient';
import { JsonLd } from '@/components/seo/JsonLd';
import { breadcrumbSchema } from '@/lib/structured-data';

const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'Attitudes VIP';

export const metadata: Metadata = {
  title: 'Learning Center',
  description:
    'Your comprehensive resource for peptide research knowledge, guides, and scientific insights. Learn about reconstitution, storage, and peptide science.',
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_APP_URL || 'https://attitudes.vip'}/learn`,
  },
  openGraph: {
    title: `Learning Center - ${siteName}`,
    description:
      'Your comprehensive resource for peptide research knowledge, guides, and scientific insights.',
    url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://attitudes.vip'}/learn`,
    type: 'website',
    images: [
      {
        url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://attitudes.vip'}/api/og?title=Learning%20Center&type=page`,
        width: 1200,
        height: 630,
        alt: `Learning Center - ${siteName}`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `Learning Center - ${siteName}`,
    description:
      'Your comprehensive resource for peptide research knowledge, guides, and scientific insights.',
    images: [`${process.env.NEXT_PUBLIC_APP_URL || 'https://attitudes.vip'}/api/og?title=Learning%20Center&type=page`],
  },
};

export default function LearnPage() {
  const breadcrumbJsonLd = breadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Learning Center', url: '/learn' },
  ]);

  return (
    <>
      <JsonLd data={breadcrumbJsonLd} />
      <LearnPageClient />
    </>
  );
}
