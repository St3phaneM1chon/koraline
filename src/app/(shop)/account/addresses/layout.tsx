import type { Metadata } from 'next';

const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'Attitudes VIP';

export const metadata: Metadata = {
  title: `My Addresses | ${siteName}`,
  description: 'Manage your saved shipping and billing addresses for faster checkout.',
  robots: { index: false, follow: false },
  openGraph: {
    title: `My Addresses | ${siteName}`,
    description: 'Manage your saved shipping and billing addresses for faster checkout.',
  },
};

export default function AddressesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
