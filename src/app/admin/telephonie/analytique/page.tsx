import { redirect } from 'next/navigation';

/**
 * Legacy analytics page — redirects to the full analytics hub.
 */
export default function AnalytiquePage() {
  redirect('/admin/telephonie/analytics');
}
