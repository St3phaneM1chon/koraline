import type { Metadata } from 'next';

const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'Attitudes VIP';

export const metadata: Metadata = {
  title: 'Politique d\'expédition',
  description: `Politique d'expédition ${siteName} : livraison pancanadienne et internationale, emballage réfrigéré, délais de traitement et suivi de commande.`,
  openGraph: {
    title: `Politique d'expédition | ${siteName}`,
    description: 'Livraison pancanadienne et internationale, emballage réfrigéré et suivi de commande.',
    url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://attitudes.vip'}/shipping-policy`,
    siteName,
    type: 'website',
  },
};

export default function ShippingPolicyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
