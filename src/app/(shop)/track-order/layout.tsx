import type { Metadata } from 'next';

const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'Attitudes VIP';

export const metadata: Metadata = {
  title: 'Suivre une commande',
  description: `Suivez le statut de votre commande ${siteName} et les détails d'expédition.`,
  robots: { index: false, follow: false },
  openGraph: {
    title: `Suivre une commande | ${siteName}`,
    description: 'Suivez le statut de votre commande et les détails d\'expédition.',
    siteName,
    type: 'website',
  },
};

export default function TrackOrderLayout({ children }: { children: React.ReactNode }) {
  return children;
}
