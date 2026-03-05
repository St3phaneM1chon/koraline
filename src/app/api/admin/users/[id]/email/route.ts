export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { withAdminGuard } from '@/lib/admin-api-guard';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

/**
 * POST /api/admin/users/[id]/email
 * Admin-initiated transactional email to a specific user.
 * Body: { subject: string, body: string }
 */
export const POST = withAdminGuard(async (request: NextRequest, { params }) => {
  try {
    const id = params!.id as string;

    // Parse and validate request body
    let subject: string;
    let body: string;
    try {
      const data = await request.json();
      subject = (data.subject ?? '').trim();
      body = (data.body ?? '').trim();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    if (!subject) {
      return NextResponse.json({ error: 'subject is required' }, { status: 400 });
    }
    if (!body) {
      return NextResponse.json({ error: 'body is required' }, { status: 400 });
    }

    // Look up the user
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, name: true },
    });

    if (!user || !user.email) {
      return NextResponse.json({ error: 'User not found or has no email' }, { status: 404 });
    }

    // Send the email (dynamic import mirrors the reset-password route pattern)
    try {
      const { sendEmail } = await import('@/lib/email/email-service');
      await sendEmail({
        to: { email: user.email, name: user.name || undefined },
        subject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            ${body.replace(/\n/g, '<br />')}
          </div>
        `,
        emailType: 'transactional',
      });
    } catch (emailErr) {
      logger.error('Failed to send admin email to user', {
        userId: id,
        error: emailErr instanceof Error ? emailErr.message : String(emailErr),
      });
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

    logger.info('Admin sent email to user', { userId: id, email: user.email, subject });
    return NextResponse.json({ success: true, message: 'Email sent successfully' });
  } catch (error) {
    logger.error('Admin email route error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
