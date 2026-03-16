import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Conditions générales d\'utilisation | BioCycle Peptides',
  description: 'Consultez les conditions générales régissant l\'utilisation du site web et l\'achat de peptides de recherche BioCycle Peptides.',
  alternates: {
    canonical: 'https://biocyclepeptides.com/mentions-legales/conditions',
  },
  openGraph: {
    title: 'Conditions générales d\'utilisation | BioCycle Peptides',
    description: 'Conditions générales régissant l\'utilisation du site web et l\'achat de peptides de recherche BioCycle Peptides.',
    url: 'https://biocyclepeptides.com/mentions-legales/conditions',
    siteName: 'BioCycle Peptides',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Conditions générales d\'utilisation | BioCycle Peptides',
    description: 'Conditions générales régissant l\'utilisation du site web et l\'achat de peptides de recherche BioCycle Peptides.',
  },
};

export default function ConditionsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
