import type { Metadata } from 'next';

const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'Attitudes VIP';

export const metadata: Metadata = {
  title: `Notification Settings | ${siteName}`,
  description: 'Manage your email and notification preferences for orders, promotions, and research updates.',
  robots: { index: false, follow: false },
  openGraph: {
    title: `Notification Settings | ${siteName}`,
    description: 'Manage your email and notification preferences for orders, promotions, and research updates.',
  },
};

export default function NotificationsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
