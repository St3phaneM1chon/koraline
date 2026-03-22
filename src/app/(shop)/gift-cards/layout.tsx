import type { Metadata } from 'next';

const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'Attitudes VIP';

export const metadata: Metadata = {
  title: 'Cartes-cadeaux',
  description: `Offrez le cadeau de la recherche. Achetez une carte-cadeau ${siteName} de 25 $ à 1 000 $ — valide pour tout produit sur notre site.`,
  openGraph: {
    title: `Cartes-cadeaux | ${siteName}`,
    description: `Cartes-cadeaux ${siteName} de 25 $ à 1 000 $.`,
    url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://attitudes.vip'}/gift-cards`,
    siteName,
    type: 'website',
  },
};

export default function GiftCardsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
