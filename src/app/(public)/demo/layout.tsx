import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Demander une démonstration | BioCycle Peptides',
  description: 'Demandez une démonstration personnalisée des produits et services BioCycle Peptides pour vos besoins en peptides de recherche.',
  alternates: {
    canonical: 'https://biocyclepeptides.com/demo',
  },
  openGraph: {
    title: 'Demander une démonstration | BioCycle Peptides',
    description: 'Demandez une démonstration personnalisée des produits et services BioCycle Peptides pour vos besoins en peptides de recherche.',
    url: 'https://biocyclepeptides.com/demo',
    siteName: 'BioCycle Peptides',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Demander une démonstration | BioCycle Peptides',
    description: 'Demandez une démonstration personnalisée des produits et services BioCycle Peptides pour vos besoins en peptides de recherche.',
  },
};

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
