import type { Metadata } from 'next';

const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'Attitudes VIP';

export const metadata: Metadata = {
  title: 'Abonnements peptides',
  description: 'Configurez des livraisons automatiques de peptides et économisez jusqu\'à 20 % par commande. Pause ou annulation en tout temps.',
  openGraph: {
    title: `Abonnements peptides | ${siteName}`,
    description: 'Livraisons automatiques de peptides avec économies jusqu\'à 20 %. Pause ou annulation en tout temps.',
    url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://attitudes.vip'}/subscriptions`,
    siteName,
    type: 'website',
  },
};

export default function SubscriptionsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
