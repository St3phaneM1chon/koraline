import type { Metadata } from 'next';

const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'Attitudes VIP';

export const metadata: Metadata = {
  title: 'Documentation API',
  description: `Documentation complète de l'API ${siteName}. Endpoints, authentification, exemples de requêtes et guides d'intégration.`,
  openGraph: {
    title: `Documentation API | ${siteName}`,
    description: `Documentation complète de l'API ${siteName}.`,
    url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://attitudes.vip'}/api-docs`,
    siteName,
    type: 'website',
  },
};

export default function ApiDocsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
