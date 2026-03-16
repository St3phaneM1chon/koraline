import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Nos valeurs | BioCycle Peptides',
  description: 'Rigueur scientifique, intégrité, innovation et responsabilité : les 6 valeurs fondamentales qui guident BioCycle Peptides dans la recherche peptidique.',
  alternates: {
    canonical: 'https://biocyclepeptides.com/a-propos/valeurs',
  },
  openGraph: {
    title: 'Nos valeurs | BioCycle Peptides',
    description: 'Rigueur scientifique, intégrité, innovation et responsabilité : les 6 valeurs fondamentales qui guident BioCycle Peptides dans la recherche peptidique.',
    url: 'https://biocyclepeptides.com/a-propos/valeurs',
    siteName: 'BioCycle Peptides',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nos valeurs | BioCycle Peptides',
    description: 'Rigueur scientifique, intégrité, innovation et responsabilité : les 6 valeurs fondamentales qui guident BioCycle Peptides dans la recherche peptidique.',
  },
};

export default function ValeursLayout({ children }: { children: React.ReactNode }) {
  return children;
}
