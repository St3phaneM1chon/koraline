import type { Metadata } from 'next';
import AccountSidebar from '@/components/account/AccountSidebar';

const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'Attitudes VIP';

export const metadata: Metadata = {
  title: 'Mon compte',
  description: `Gérez votre compte ${siteName}, vos commandes, adresses et préférences.`,
  robots: { index: false, follow: false },
  openGraph: {
    title: `Mon compte | ${siteName}`,
    description: `Gérez votre compte ${siteName}.`,
    siteName,
    type: 'website',
  },
};

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 flex gap-8">
      <AccountSidebar />
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
