import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Politique de confidentialité | BioCycle Peptides',
  description: 'Découvrez comment BioCycle Peptides collecte, utilise et protège vos renseignements personnels. Conforme RGPD, PIPEDA et Loi 25.',
  alternates: {
    canonical: 'https://biocyclepeptides.com/mentions-legales/confidentialite',
  },
  openGraph: {
    title: 'Politique de confidentialité | BioCycle Peptides',
    description: 'Découvrez comment BioCycle Peptides collecte, utilise et protège vos renseignements personnels. Conforme RGPD, PIPEDA et Loi 25.',
    url: 'https://biocyclepeptides.com/mentions-legales/confidentialite',
    siteName: 'BioCycle Peptides',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Politique de confidentialité | BioCycle Peptides',
    description: 'Découvrez comment BioCycle Peptides collecte, utilise et protège vos renseignements personnels.',
  },
};

export default function ConfidentialiteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
