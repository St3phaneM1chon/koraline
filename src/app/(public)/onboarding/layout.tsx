import type { Metadata } from 'next';

const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'Attitudes VIP';
const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://attitudes.vip';

export const metadata: Metadata = {
  title: `Configuration initiale - ${siteName}`,
  description: `Configurez votre espace ${siteName} en quelques etapes. Personnalisez votre boutique, ajoutez vos produits et commencez a vendre.`,
  alternates: {
    canonical: `${siteUrl}/onboarding`,
  },
  openGraph: {
    title: `Configuration initiale - ${siteName}`,
    description: `Configurez votre espace ${siteName} en quelques etapes simples.`,
    url: `${siteUrl}/onboarding`,
    siteName,
    type: 'website',
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
