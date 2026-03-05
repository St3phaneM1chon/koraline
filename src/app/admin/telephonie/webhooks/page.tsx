export const dynamic = 'force-dynamic';

/**
 * Webhook Management Page - Configure webhooks for external systems.
 * Reads webhook configs from SiteSetting (key: 'voip:webhook_configs', module: 'voip').
 */

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth-config';
import { prisma } from '@/lib/db';
import { UserRole } from '@/types';
import WebhooksClient from './WebhooksClient';

export default async function WebhooksPage() {
  const session = await auth();
  if (!session?.user || (session.user.role !== UserRole.EMPLOYEE && session.user.role !== UserRole.OWNER)) {
    redirect('/auth/signin');
  }

  // Fetch webhook configs from SiteSetting
  const setting = await prisma.siteSetting.findUnique({
    where: { key: 'voip:webhook_configs' },
  });

  let webhookConfigs: Array<{
    id: string;
    url: string;
    events: string[];
    secret: string;
    active: boolean;
    lastDeliveryStatus: string | null;
    lastDeliveryAt: string | null;
    deliveryLog: Array<{
      id: string;
      event: string;
      status: string;
      statusCode: number | null;
      timestamp: string;
    }>;
  }> = [];

  if (setting?.value) {
    try {
      webhookConfigs = JSON.parse(setting.value);
    } catch {
      webhookConfigs = [];
    }
  }

  return <WebhooksClient initialWebhooks={JSON.parse(JSON.stringify(webhookConfigs))} />;
}
