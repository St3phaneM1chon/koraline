import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Études de cas | BioCycle Peptides',
  description: 'Découvrez comment nos clients utilisent les peptides de recherche BioCycle Peptides pour atteindre leurs objectifs scientifiques.',
  alternates: {
    canonical: 'https://biocyclepeptides.com/clients/etudes-de-cas',
  },
  openGraph: {
    title: 'Études de cas | BioCycle Peptides',
    description: 'Découvrez comment nos clients utilisent les peptides de recherche BioCycle Peptides pour atteindre leurs objectifs scientifiques.',
    url: 'https://biocyclepeptides.com/clients/etudes-de-cas',
    siteName: 'BioCycle Peptides',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Études de cas | BioCycle Peptides',
    description: 'Découvrez comment nos clients utilisent les peptides de recherche BioCycle Peptides pour atteindre leurs objectifs scientifiques.',
  },
};

export default function CaseStudiesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
