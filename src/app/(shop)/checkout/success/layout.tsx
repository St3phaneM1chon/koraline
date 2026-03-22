import type { Metadata } from 'next';

const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'Attitudes VIP';

export const metadata: Metadata = {
  title: 'Commande confirmée',
  description: `Votre commande ${siteName} a été confirmée. Merci pour votre achat.`,
  robots: { index: false, follow: false },
  openGraph: {
    title: `Commande confirmée | ${siteName}`,
    description: `Votre commande ${siteName} a été confirmée.`,
    siteName,
    type: 'website',
  },
};

export default function CheckoutSuccessLayout({ children }: { children: React.ReactNode }) {
  return children;
}
