import { Metadata } from 'next';
import StatusPage from './StatusClient';

const siteName = 'Attitudes VIP';
const appUrl = 'https://attitudes.vip';

export const metadata: Metadata = {
  title: `Statut de la plateforme - ${siteName}`,
  description: `Surveillance en temps reel des services ${siteName}. Verifiez le statut de tous les systemes: application, base de donnees, paiements, emails et plus.`,
  alternates: { canonical: `${appUrl}/status` },
  openGraph: {
    title: `Statut de la plateforme - ${siteName}`,
    description: `Surveillance en temps reel des services ${siteName}. Verifiez le statut de tous les systemes.`,
    url: `${appUrl}/status`,
    siteName,
    type: 'website',
    locale: 'fr_CA',
  },
  twitter: {
    card: 'summary',
    title: `Statut de la plateforme - ${siteName}`,
    description: `Surveillance en temps reel des services ${siteName}.`,
  },
};

export default function Page() {
  return <StatusPage />;
}
