'use client';

import { createContext, useContext, useEffect, type ReactNode } from 'react';
import type { TenantBranding } from '@/lib/tenant-branding';

// Re-export TenantBranding type for consumer convenience
export type { TenantBranding };

const TenantBrandingContext = createContext<TenantBranding | null>(null);

interface TenantBrandingProviderProps {
  branding: TenantBranding;
  children: ReactNode;
}

/**
 * Provides tenant branding to all client components via React context.
 * Also injects CSS custom properties on <html> so Tailwind and custom CSS
 * can reference tenant colors via var(--tenant-primary), var(--tenant-secondary).
 */
export function TenantBrandingProvider({ branding, children }: TenantBrandingProviderProps) {
  // Inject CSS custom properties on mount and when branding changes
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--tenant-primary', branding.primaryColor);
    root.style.setProperty('--tenant-secondary', branding.secondaryColor);
    root.style.setProperty('--tenant-font', branding.font);

    return () => {
      root.style.removeProperty('--tenant-primary');
      root.style.removeProperty('--tenant-secondary');
      root.style.removeProperty('--tenant-font');
    };
  }, [branding.primaryColor, branding.secondaryColor, branding.font]);

  return (
    <TenantBrandingContext.Provider value={branding}>
      {children}
    </TenantBrandingContext.Provider>
  );
}

/**
 * Hook to access tenant branding from any client component.
 * Returns the TenantBranding object or throws if used outside provider.
 */
export function useTenantBranding(): TenantBranding {
  const ctx = useContext(TenantBrandingContext);
  if (!ctx) {
    throw new Error('useTenantBranding must be used within a TenantBrandingProvider');
  }
  return ctx;
}
