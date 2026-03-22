import type { Metadata } from 'next';

const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'Attitudes VIP';

export const metadata: Metadata = {
  title: `My Returns | ${siteName}`,
  description: `Manage your return requests and track the status of refunds for ${siteName} orders.`,
  robots: { index: false, follow: false },
  openGraph: {
    title: `My Returns | ${siteName}`,
    description: `Manage your return requests and track the status of refunds for ${siteName} orders.`,
  },
};

export default function ReturnsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
