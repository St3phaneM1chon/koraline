import { redirect } from 'next/navigation';

/**
 * /pricing redirect — for attitudes.vip, middleware rewrites to /platform/pricing.
 * This page handles the fallback case where the rewrite doesn't trigger.
 */
export default function PricingRedirect() {
  redirect('/platform/pricing');
}
