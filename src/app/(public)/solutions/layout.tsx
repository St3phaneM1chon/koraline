import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Solutions peptidiques pour la recherche | BioCycle Peptides',
  description: 'Trouvez la solution peptidique adaptee a vos besoins de recherche. Entreprises, chercheurs individuels et partenaires au Canada et internationalement.',
  alternates: {
    canonical: 'https://biocyclepeptides.com/solutions',
  },
  openGraph: {
    title: 'Solutions peptidiques pour la recherche | BioCycle Peptides',
    description: 'Trouvez la solution peptidique adaptee a vos besoins de recherche. Entreprises, chercheurs individuels et partenaires.',
    url: 'https://biocyclepeptides.com/solutions',
    siteName: 'BioCycle Peptides',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Solutions peptidiques pour la recherche | BioCycle Peptides',
    description: 'Trouvez la solution peptidique adaptee a vos besoins de recherche. Entreprises, chercheurs individuels et partenaires.',
  },
};

export default function SolutionsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
