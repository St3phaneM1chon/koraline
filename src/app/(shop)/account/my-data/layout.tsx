import type { Metadata } from 'next';

const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'Attitudes VIP';

export const metadata: Metadata = {
  title: `My Data | ${siteName}`,
  description: `View and manage your personal data stored by ${siteName}. Download or delete your data in compliance with privacy regulations.`,
  robots: { index: false, follow: false },
  openGraph: {
    title: `My Data | ${siteName}`,
    description: `View and manage your personal data stored by ${siteName}.`,
  },
};

export default function MyDataLayout({ children }: { children: React.ReactNode }) {
  return children;
}
