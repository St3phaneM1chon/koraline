import type { Metadata } from 'next';

const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'Attitudes VIP';

export const metadata: Metadata = {
  title: 'Mes consentements',
  description: `Gérez vos consentements et préférences de communication avec ${siteName}.`,
  robots: { index: false, follow: false },
  openGraph: {
    title: `Mes consentements | ${siteName}`,
    description: 'Gérez vos consentements et préférences de communication.',
    siteName,
    type: 'website',
  },
};

export default function ConsentsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
