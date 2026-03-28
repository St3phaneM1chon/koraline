import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Authentication | Attitudes VIP',
  description: 'Sign in or create your Attitudes VIP account.',
  robots: { index: false, follow: false },
};

export default function AuthGroupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
