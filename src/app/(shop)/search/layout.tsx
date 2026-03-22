import type { Metadata } from 'next';

const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'Attitudes VIP';

export const metadata: Metadata = {
  title: 'Rechercher des peptides',
  description: `Recherchez dans le catalogue ${siteName}. Trouvez des peptides par nom, catégorie ou niveau de pureté avec filtrage avancé.`,
  robots: { index: false, follow: true },
  openGraph: {
    title: `Rechercher des peptides | ${siteName}`,
    description: 'Recherchez des peptides par nom, catégorie ou niveau de pureté.',
    url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://attitudes.vip'}/search`,
    siteName,
    type: 'website',
  },
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
