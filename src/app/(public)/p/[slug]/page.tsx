/**
 * Catch-all public page route: /p/[slug]
 *
 * Loads a Page from the database by slug and renders it using the
 * appropriate template via PageRenderer.
 *
 * Templates: default, hero-content, sections, landing
 * ISR: revalidates every 5 minutes (300s)
 */

export const revalidate = 300;

import { notFound } from 'next/navigation';
import { getContentPage } from '@/lib/content-pages';
import PageRenderer from '@/components/pages/PageRenderer';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function CorporatePage({ params }: Props) {
  const { slug } = await params;
  const page = await getContentPage(slug);

  if (!page) {
    notFound();
  }

  return <PageRenderer page={page} />;
}
