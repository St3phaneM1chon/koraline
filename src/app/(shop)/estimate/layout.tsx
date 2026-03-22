import type { Metadata } from 'next';

const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'Attitudes VIP';

export const metadata: Metadata = {
  title: 'Soumission',
  description: `Consultez votre soumission ${siteName}. Détails des produits, prix et conditions.`,
  robots: { index: false, follow: false },
  openGraph: {
    title: `Soumission | ${siteName}`,
    description: `Consultez votre soumission ${siteName}.`,
    siteName,
    type: 'website',
  },
};

export default function EstimateLayout({ children }: { children: React.ReactNode }) {
  return children;
}
