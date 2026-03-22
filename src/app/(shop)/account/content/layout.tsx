import type { Metadata } from 'next';

const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'Attitudes VIP';

export const metadata: Metadata = {
  title: 'Ma médiathèque',
  description: `Accédez à votre bibliothèque de contenu personnelle sur ${siteName}. Vidéos, guides et ressources de recherche.`,
  robots: { index: false, follow: false },
  openGraph: {
    title: `Ma médiathèque | ${siteName}`,
    description: `Votre bibliothèque de contenu personnelle sur ${siteName}.`,
    siteName,
    type: 'website',
  },
};

export default function ContentLayout({ children }: { children: React.ReactNode }) {
  return children;
}
