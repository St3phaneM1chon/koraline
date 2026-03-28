/**
 * Dynamic metadata layout for /p/[slug] corporate pages.
 * Generates SEO-friendly metadata from the Page model in DB.
 */

import { Metadata } from 'next';
import { getContentPage } from '@/lib/content-pages';

const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'Attitudes VIP';
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://attitudes.vip';

interface Props {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await getContentPage(slug);

  if (!page) {
    return {
      title: `Page - ${siteName}`,
      description: siteName,
    };
  }

  return {
    title: page.metaTitle || `${page.title} - ${siteName}`,
    description: page.metaDescription || page.excerpt || `${page.title} - ${siteName}`,
    alternates: { canonical: `${appUrl}/p/${slug}` },
    openGraph: {
      title: page.metaTitle || page.title,
      description: page.metaDescription || page.excerpt || undefined,
      url: `${appUrl}/p/${slug}`,
      siteName,
      ...(page.heroImageUrl ? { images: [{ url: page.heroImageUrl }] } : {}),
    },
  };
}

export default function PageSlugLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
