export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Authentication Error | Attitudes VIP',
  description: 'An error occurred during authentication. Please try signing in again.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Authentication Error | Attitudes VIP',
    description: 'An error occurred during authentication. Please try signing in again.',
  },
};

export default function AuthErrorLayout({ children }: { children: React.ReactNode }) {
  return children;
}
