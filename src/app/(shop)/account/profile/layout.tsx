import type { Metadata } from 'next';

const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'Attitudes VIP';

export const metadata: Metadata = {
  title: `My Profile | ${siteName}`,
  description: 'Update your personal information, contact details, and account preferences.',
  robots: { index: false, follow: false },
  openGraph: {
    title: `My Profile | ${siteName}`,
    description: 'Update your personal information, contact details, and account preferences.',
  },
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return children;
}
