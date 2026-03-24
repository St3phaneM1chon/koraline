import type { Metadata } from 'next';

const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'Attitudes VIP';
const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://attitudes.vip';

export const metadata: Metadata = {
  title: `Inscription - ${siteName}`,
  description: `Creez votre compte ${siteName}. Choisissez votre plan et commencez a gerer votre entreprise avec notre plateforme SaaS complete.`,
  alternates: {
    canonical: `${siteUrl}/signup`,
  },
  openGraph: {
    title: `Inscription - ${siteName}`,
    description: `Creez votre compte ${siteName}. Choisissez votre plan et demarrez rapidement.`,
    url: `${siteUrl}/signup`,
    siteName,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `Inscription - ${siteName}`,
    description: `Creez votre compte ${siteName}. Choisissez votre plan et demarrez rapidement.`,
  },
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
