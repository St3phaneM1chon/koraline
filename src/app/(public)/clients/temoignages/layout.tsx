import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Témoignages clients | BioCycle Peptides',
  description: 'Lisez les témoignages de chercheurs et laboratoires sur leur expérience avec les peptides de recherche BioCycle Peptides.',
  alternates: {
    canonical: 'https://biocyclepeptides.com/clients/temoignages',
  },
  openGraph: {
    title: 'Témoignages clients | BioCycle Peptides',
    description: 'Lisez les témoignages de chercheurs et laboratoires sur leur expérience avec les peptides de recherche BioCycle Peptides.',
    url: 'https://biocyclepeptides.com/clients/temoignages',
    siteName: 'BioCycle Peptides',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Témoignages clients | BioCycle Peptides',
    description: 'Lisez les témoignages de chercheurs et laboratoires sur leur expérience avec les peptides de recherche BioCycle Peptides.',
  },
};

export default function TestimonialsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
