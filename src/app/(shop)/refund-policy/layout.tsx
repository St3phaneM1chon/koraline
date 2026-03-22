import type { Metadata } from 'next';

const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'Attitudes VIP';

export const metadata: Metadata = {
  title: 'Politique de remboursement',
  description: `Politique de remboursement et de retour ${siteName}. Fenêtre de retour de 30 jours, garantie qualité et procédure de remboursement.`,
  openGraph: {
    title: `Politique de remboursement | ${siteName}`,
    description: 'Fenêtre de retour de 30 jours, garantie qualité et procédure de remboursement.',
    url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://attitudes.vip'}/refund-policy`,
    siteName,
    type: 'website',
  },
};

export default function RefundPolicyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
