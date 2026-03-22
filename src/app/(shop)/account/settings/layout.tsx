import type { Metadata } from 'next';

const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'Attitudes VIP';

export const metadata: Metadata = {
  title: `Account Settings | ${siteName}`,
  description: 'Manage your account security settings, password, two-factor authentication, and privacy preferences.',
  robots: { index: false, follow: false },
  openGraph: {
    title: `Account Settings | ${siteName}`,
    description: 'Manage your account security settings, password, two-factor authentication, and privacy preferences.',
  },
};

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
