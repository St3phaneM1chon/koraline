import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Politique de cookies | BioCycle Peptides',
  description: 'Comprenez comment BioCycle Peptides utilise les cookies et technologies de suivi sur notre site. Gérez vos préférences facilement.',
  alternates: {
    canonical: 'https://biocyclepeptides.com/mentions-legales/cookies',
  },
  openGraph: {
    title: 'Politique de cookies | BioCycle Peptides',
    description: 'Comprenez comment BioCycle Peptides utilise les cookies et technologies de suivi sur notre site. Gérez vos préférences facilement.',
    url: 'https://biocyclepeptides.com/mentions-legales/cookies',
    siteName: 'BioCycle Peptides',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Politique de cookies | BioCycle Peptides',
    description: 'Comprenez comment BioCycle Peptides utilise les cookies et technologies de suivi sur notre site.',
  },
};

export default function CookiesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
