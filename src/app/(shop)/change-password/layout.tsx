import { Metadata } from 'next';

const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'Attitudes VIP';

export const metadata: Metadata = {
  title: 'Changer le mot de passe',
  description: `Modifiez votre mot de passe ${siteName} de façon sécurisée.`,
  robots: 'noindex, nofollow',
  openGraph: {
    title: `Changer le mot de passe | ${siteName}`,
    description: 'Modifiez votre mot de passe de façon sécurisée.',
    siteName,
    type: 'website',
  },
};

export default function ChangePasswordLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
