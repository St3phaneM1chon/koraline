export const dynamic = 'force-dynamic';

/**
 * G29 - Public Portfolio Page
 * Reads Gallery model entries, renders a masonry grid with category filter and lightbox.
 */

import { Metadata } from 'next';
import { prisma } from '@/lib/db';
import PortfolioClient from './PortfolioClient';

export const metadata: Metadata = {
  title: 'Portfolio',
  description: 'Browse our portfolio of completed projects and creative work.',
};

async function getGalleries() {
  try {
    const galleries = await prisma.gallery.findMany({
      where: { isActive: true },
      include: {
        images: {
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return galleries;
  } catch {
    return [];
  }
}

export default async function PortfolioPage() {
  const galleries = await getGalleries();

  // Flatten galleries into portfolio items with category derived from gallery name
  const items = galleries.flatMap((gallery) =>
    gallery.images.map((img) => ({
      id: img.id,
      imageUrl: img.imageUrl,
      title: img.title || null,
      caption: img.caption || null,
      altText: img.altText || null,
      category: gallery.name,
      gallerySlug: gallery.slug,
    })),
  );

  // Extract unique categories
  const categories = Array.from(new Set(galleries.map((g) => g.name)));

  return <PortfolioClient items={items} categories={categories} />;
}
