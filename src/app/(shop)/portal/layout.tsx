import type { Metadata } from 'next';

const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'Attitudes VIP';

export const metadata: Metadata = {
  title: 'Portail libre-service',
  description: `Portail libre-service ${siteName}. Gérez vos billets de support, consultez la base de connaissances et suivez vos commandes.`,
  robots: { index: false, follow: false },
  openGraph: {
    title: `Portail libre-service | ${siteName}`,
    description: `Portail libre-service ${siteName}.`,
    siteName,
    type: 'website',
  },
};

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return children;
}
