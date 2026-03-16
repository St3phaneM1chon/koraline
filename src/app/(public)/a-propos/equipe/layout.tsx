import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Notre équipe | BioCycle Peptides',
  description: 'Rencontrez l\'équipe multidisciplinaire de BioCycle Peptides : scientifiques, logisticiens et experts dédiés à fournir des peptides de recherche de qualité.',
  alternates: {
    canonical: 'https://biocyclepeptides.com/a-propos/equipe',
  },
  openGraph: {
    title: 'Notre équipe | BioCycle Peptides',
    description: 'Rencontrez l\'équipe multidisciplinaire de BioCycle Peptides : scientifiques, logisticiens et experts dédiés à fournir des peptides de recherche de qualité.',
    url: 'https://biocyclepeptides.com/a-propos/equipe',
    siteName: 'BioCycle Peptides',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Notre équipe | BioCycle Peptides',
    description: 'Rencontrez l\'équipe multidisciplinaire de BioCycle Peptides : scientifiques, logisticiens et experts dédiés à fournir des peptides de recherche de qualité.',
  },
};

export default function EquipeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
