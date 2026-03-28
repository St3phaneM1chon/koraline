export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { withAdminGuard } from '@/lib/admin-api-guard';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import crypto from 'crypto';
import { tenantPasswordResetEmail } from '@/lib/email/templates/tenant-emails';

/**
 * POST /api/admin/users/[id]/reset-password
 * Admin-initiated password reset: generates a reset token and sends an email.
 */
export const POST = withAdminGuard(async (_request: NextRequest, { params, session }) => {
  try {
    const id = params!.id;

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, name: true, role: true },
    });

    // SECURITY: Prevent EMPLOYEE from resetting OWNER passwords (privilege escalation)
    if (user && user.role === 'OWNER' && session.user.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Only an OWNER can reset another OWNER\'s password' },
        { status: 403 }
      );
    }

    if (!user || !user.email) {
      return NextResponse.json({ error: 'User not found or has no email' }, { status: 404 });
    }

    // Generate secure reset token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    // Store token (use VerificationToken model)
    await prisma.verificationToken.create({
      data: {
        identifier: user.email,
        token,
        expires: expiresAt,
      },
    });

    // Send reset email
    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://attitudes.vip';
    const resetUrl = `${baseUrl}/auth/reset-password?token=${token}&email=${encodeURIComponent(user.email)}`;

    try {
      const { sendEmail } = await import('@/lib/email/email-service');
      const resetEmail = tenantPasswordResetEmail({
        ownerName: user.name || 'Utilisateur',
        resetUrl,
        expiresInHours: 24,
        adminInitiated: true,
      });
      await sendEmail({
        to: { email: user.email, name: user.name || undefined },
        subject: resetEmail.subject,
        html: resetEmail.html,
        emailType: 'transactional',
      });
    } catch (emailErr) {
      logger.error('Failed to send reset email', {
        userId: id,
        error: emailErr instanceof Error ? emailErr.message : String(emailErr),
      });
      return NextResponse.json({ error: 'Failed to send reset email' }, { status: 500 });
    }

    logger.info('Admin-initiated password reset', { userId: id, email: user.email });
    return NextResponse.json({ success: true, message: 'Password reset email sent' });
  } catch (error) {
    logger.error('Password reset error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}, { requiredPermission: 'users.edit' });
