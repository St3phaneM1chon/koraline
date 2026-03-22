import type { Metadata } from 'next';

const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'Attitudes VIP';

export const metadata: Metadata = {
  title: 'Webinaires',
  description: `Participez aux webinaires ${siteName} pour apprendre sur la recherche peptidique, les protocoles et les meilleures pratiques.`,
  openGraph: {
    title: `Webinaires | ${siteName}`,
    description: 'Webinaires sur la recherche peptidique, les protocoles et les meilleures pratiques.',
    url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://attitudes.vip'}/webinars`,
    siteName,
    type: 'website',
  },
};

export default function WebinarsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
