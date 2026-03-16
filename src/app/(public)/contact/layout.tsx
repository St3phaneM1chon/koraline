import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contactez-nous | BioCycle Peptides',
  description: 'Communiquez avec BioCycle Peptides, fournisseur canadien de peptides de recherche basé à Montréal. Support bilingue disponible.',
  alternates: {
    canonical: 'https://biocyclepeptides.com/contact',
  },
  openGraph: {
    title: 'Contactez-nous | BioCycle Peptides',
    description: 'Communiquez avec BioCycle Peptides, fournisseur canadien de peptides de recherche basé à Montréal. Support bilingue disponible.',
    url: 'https://biocyclepeptides.com/contact',
    siteName: 'BioCycle Peptides',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contactez-nous | BioCycle Peptides',
    description: 'Communiquez avec BioCycle Peptides, fournisseur canadien de peptides de recherche basé à Montréal. Support bilingue disponible.',
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
