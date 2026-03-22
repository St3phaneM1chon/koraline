import type { Metadata } from 'next';

const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'Attitudes VIP';

export const metadata: Metadata = {
  title: 'Paiement',
  description: `Complétez votre commande ${siteName} de façon sécurisée.`,
  robots: { index: false, follow: false },
  openGraph: {
    title: `Paiement | ${siteName}`,
    description: `Complétez votre commande ${siteName} de façon sécurisée.`,
    siteName,
    type: 'website',
  },
};

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
