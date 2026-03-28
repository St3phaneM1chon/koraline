import { Metadata } from 'next';
import ROICalculatorPage from './ROICalculatorClient';
import { PlatformBreadcrumbs } from '@/components/marketing';

export const metadata: Metadata = {
  title: 'Calculateur ROI — Combien pourriez-vous economiser? | Attitudes VIP',
  description:
    'Calculez vos economies en centralisant vos outils avec la Suite Koraline. Entrez vos chiffres actuels et decouvrez votre retour sur investissement.',
  alternates: { canonical: 'https://attitudes.vip/platform/calculateur-roi' },
  openGraph: {
    title: 'Calculateur ROI — Suite Koraline',
    description:
      'Calculez vos economies en centralisant vos outils avec la Suite Koraline.',
    url: 'https://attitudes.vip/platform/calculateur-roi',
    siteName: 'Attitudes VIP',
    type: 'website',
    locale: 'fr_CA',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Calculateur ROI — Suite Koraline',
    description:
      'Calculez vos economies en centralisant vos outils avec la Suite Koraline.',
  },
};

export default function Page() {
  return (
    <>
      <PlatformBreadcrumbs
        items={[
          { label: 'Accueil', href: '/platform' },
          { label: 'Solutions', href: '/platform/pour/ecommerce' },
          { label: 'Calculateur ROI' },
        ]}
      />
      <ROICalculatorPage />
    </>
  );
}
