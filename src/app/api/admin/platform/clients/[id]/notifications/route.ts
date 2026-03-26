/**
 * API: /api/admin/platform/clients/[id]/notifications
 * Super-admin only — Tenant notifications management.
 * GET: List TenantNotification records.
 * POST: Create notification { title, message, type }.
 */

export const dynamic = 'force-dynamic';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { withAdminGuard } from '@/lib/admin-api-guard';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import { sendEmail } from '@/lib/email';

function isSuperAdmin(session: { user: { role?: string; tenantId?: string } }): boolean {
  return session.user.role === 'OWNER' && session.user.tenantId === process.env.PLATFORM_TENANT_ID;
}

// GET — List notifications
export const GET = withAdminGuard(async (_request: NextRequest, { session, params }) => {
  if (!isSuperAdmin(session)) {
    return NextResponse.json({ error: 'Super-admin access required' }, { status: 403 });
  }

  const tenantId = params?.id;
  if (!tenantId) {
    return NextResponse.json({ error: 'Missing tenant ID' }, { status: 400 });
  }

  try {
    const notifications = await prisma.tenantNotification.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({ notifications });
  } catch (error) {
    logger.error('Failed to list notifications', { tenantId, error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}, { skipCsrf: true });

// POST — Create notification
const createNotificationSchema = z.object({
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(5000),
  type: z.enum(['info', 'warning', 'urgent']).default('info'),
});

export const POST = withAdminGuard(async (request, { session, params }) => {
  if (!isSuperAdmin(session)) {
    return NextResponse.json({ error: 'Super-admin access required' }, { status: 403 });
  }

  const tenantId = params?.id;
  if (!tenantId) {
    return NextResponse.json({ error: 'Missing tenant ID' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const parsed = createNotificationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation error', details: parsed.error.flatten() }, { status: 400 });
    }

    // Verify tenant exists and load owner email
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, name: true, ownerUserId: true },
    });
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const notification = await prisma.tenantNotification.create({
      data: {
        tenantId,
        title: parsed.data.title,
        message: parsed.data.message,
        type: parsed.data.type,
        createdBy: session.user.email || 'super-admin',
      },
    });

    // Also log as event
    await prisma.tenantEvent.create({
      data: {
        tenantId,
        type: 'NOTIFICATION_SENT',
        actor: session.user.email || 'super-admin',
        details: { title: parsed.data.title, type: parsed.data.type },
      },
    });

    // Send email to tenant owner (non-blocking)
    let emailSent = false;
    if (tenant.ownerUserId) {
      const owner = await prisma.user.findUnique({
        where: { id: tenant.ownerUserId },
        select: { email: true, name: true },
      });
      if (owner?.email) {
        const typeLabel = parsed.data.type === 'urgent' ? 'URGENT' : parsed.data.type === 'warning' ? 'Avertissement' : 'Information';
        sendEmail({
          to: { email: owner.email, name: owner.name || undefined },
          subject: `[Koraline] ${parsed.data.title}`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #6366f1 0%, #818cf8 100%); padding: 24px; border-radius: 12px 12px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 20px;">Koraline</h1>
              </div>
              <div style="background: #1a1a2e; padding: 24px; border-radius: 0 0 12px 12px; color: #e2e8f0;">
                <div style="display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-bottom: 16px; ${
                  parsed.data.type === 'urgent'
                    ? 'background: rgba(244,63,94,0.15); color: #fb7185;'
                    : parsed.data.type === 'warning'
                    ? 'background: rgba(245,158,11,0.15); color: #fbbf24;'
                    : 'background: rgba(59,130,246,0.15); color: #60a5fa;'
                }">${typeLabel}</div>
                <h2 style="color: #f1f5f9; margin: 0 0 12px 0; font-size: 18px;">${parsed.data.title}</h2>
                <p style="color: #94a3b8; margin: 0; line-height: 1.6;">${parsed.data.message}</p>
                <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 24px 0;" />
                <p style="color: #64748b; font-size: 12px; margin: 0;">Ce message a ete envoye par Koraline pour ${tenant.name}.</p>
              </div>
            </div>
          `,
          emailType: 'transactional',
        }).then(() => {
          logger.info('Notification email sent', { tenantId, ownerEmail: owner.email });
        }).catch((err) => {
          logger.error('Failed to send notification email', {
            tenantId,
            error: err instanceof Error ? err.message : String(err),
          });
        });
        emailSent = true;
      }
    }

    logger.info('Notification created', { tenantId, notificationId: notification.id });

    return NextResponse.json({ notification, emailSent }, { status: 201 });
  } catch (error) {
    logger.error('Failed to create notification', { tenantId, error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
