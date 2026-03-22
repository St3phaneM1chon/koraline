import type { Metadata } from 'next';

const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'Attitudes VIP';

export const metadata: Metadata = {
  title: `My Orders | ${siteName}`,
  description: `View your order history, track shipments, and manage returns for your ${siteName} purchases.`,
  robots: { index: false, follow: false },
  openGraph: {
    title: `My Orders | ${siteName}`,
    description: `View your order history, track shipments, and manage returns for your ${siteName} purchases.`,
  },
};

export default function OrdersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
