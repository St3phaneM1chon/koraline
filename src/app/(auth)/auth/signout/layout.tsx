export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign Out | Attitudes VIP',
  description: 'You have been signed out of your Attitudes VIP account.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Sign Out | Attitudes VIP',
    description: 'You have been signed out of your Attitudes VIP account.',
  },
};

export default function SignoutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
