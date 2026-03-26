import Header from '@/components/shop/Header';
import Footer from '@/components/shop/Footer';
import FreeShippingBanner from '@/components/shop/FreeShippingBanner';
import SkipToContent from '@/components/ui/SkipToContent';
import ShopClientProviders from './ShopClientProviders';
import { TenantBrandingProvider } from '@/components/shop/TenantBrandingProvider';
import { getTenantBranding } from '@/lib/tenant-branding';

export default async function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const branding = await getTenantBranding();

  return (
    <TenantBrandingProvider branding={branding}>
      <ShopClientProviders>
        <div className="min-h-screen flex flex-col bg-[var(--k-bg-base,#ffffff)]">
          <SkipToContent />
          <FreeShippingBanner />
          <Header />
          <main id="main-content" className="flex-1 relative z-0" tabIndex={-1}>{children}</main>
          <Footer />
        </div>
      </ShopClientProviders>
    </TenantBrandingProvider>
  );
}
