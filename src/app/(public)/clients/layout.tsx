import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Nos clients | BioCycle Peptides',
  description: 'Découvrez les entreprises et chercheurs qui font confiance à BioCycle Peptides pour leurs peptides de recherche de haute pureté.',
  alternates: {
    canonical: 'https://biocyclepeptides.com/clients',
  },
  openGraph: {
    title: 'Nos clients | BioCycle Peptides',
    description: 'Découvrez les entreprises et chercheurs qui font confiance à BioCycle Peptides pour leurs peptides de recherche.',
    url: 'https://biocyclepeptides.com/clients',
    siteName: 'BioCycle Peptides',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nos clients | BioCycle Peptides',
    description: 'Découvrez les entreprises et chercheurs qui font confiance à BioCycle Peptides pour leurs peptides de recherche.',
  },
};

export default function ClientsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
