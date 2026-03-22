import { Metadata } from 'next';
import CalculatorPageClient from './CalculatorPageClient';

const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'Attitudes VIP';

export const metadata: Metadata = {
  title: 'Calculateur de dosage peptidique',
  description: 'Calculez votre dosage peptidique précis avec notre calculateur d\'injection gratuit. Déterminez la concentration, le volume d\'injection et les unités U100.',
  openGraph: {
    title: `Calculateur de dosage peptidique | ${siteName}`,
    description: 'Calculateur d\'injection peptidique gratuit. Concentration, volume et unités U100.',
    url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://attitudes.vip'}/calculator`,
    siteName,
    type: 'website',
  },
};

export default function CalculatorPage() {
  return <CalculatorPageClient />;
}
