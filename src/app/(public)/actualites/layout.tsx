import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Actualités | BioCycle Peptides',
  description: 'Restez informé des dernières nouvelles, lancements de produits et mises à jour de recherche de BioCycle Peptides au Canada.',
  alternates: {
    canonical: 'https://biocyclepeptides.com/actualites',
  },
  openGraph: {
    title: 'Actualités | BioCycle Peptides',
    description: 'Restez informé des dernières nouvelles, lancements de produits et mises à jour de recherche de BioCycle Peptides au Canada.',
    url: 'https://biocyclepeptides.com/actualites',
    siteName: 'BioCycle Peptides',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Actualités | BioCycle Peptides',
    description: 'Restez informé des dernières nouvelles, lancements de produits et mises à jour de recherche de BioCycle Peptides.',
  },
};

export default function ActualitesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
