import type { Metadata } from 'next';

const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'Attitudes VIP';

export const metadata: Metadata = {
  title: `My Referrals | ${siteName}`,
  description: `Track your referrals, earn rewards, and share ${siteName} with fellow researchers.`,
  robots: { index: false, follow: false },
  openGraph: {
    title: `My Referrals | ${siteName}`,
    description: `Track your referrals, earn rewards, and share ${siteName} with fellow researchers.`,
  },
};

export default function ReferralsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
