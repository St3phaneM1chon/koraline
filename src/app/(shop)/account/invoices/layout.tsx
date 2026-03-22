import type { Metadata } from 'next';

const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'Attitudes VIP';

export const metadata: Metadata = {
  title: `My Invoices | ${siteName}`,
  description: `Access and download your invoices and billing documents from ${siteName}.`,
  robots: { index: false, follow: false },
  openGraph: {
    title: `My Invoices | ${siteName}`,
    description: `Access and download your invoices and billing documents from ${siteName}.`,
  },
};

export default function InvoicesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
