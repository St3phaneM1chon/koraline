/**
 * API: /api/admin/platform/tenants
 * Super-admin only — manages all Koraline tenants.
 * GET: List all tenants with stats
 * POST: Create a new tenant + auto-create OWNER user
 */

export const dynamic = 'force-dynamic';

import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth-config';
import { logger } from '@/lib/logger';
import { hashSync } from 'bcryptjs';
import { randomBytes } from 'crypto';
import { sendEmail } from '@/lib/email';

// Helper to check super-admin access
async function verifySuperAdmin(): Promise<{ authorized: boolean; error?: NextResponse }> {
  const session = await auth();
  if (!session?.user) {
    return { authorized: false, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  // Super-admin = OWNER role + attitudes tenant
  // For Phase 1, any OWNER can access platform admin
  if (session.user.role !== 'OWNER') {
    return { authorized: false, error: NextResponse.json({ error: 'Forbidden: Owner access required' }, { status: 403 }) };
  }
  return { authorized: true };
}

export async function GET() {
  const check = await verifySuperAdmin();
  if (!check.authorized) return check.error!;

  try {
    const tenants = await prisma.tenant.findMany({
      orderBy: { createdAt: 'asc' },
    });

    // Get user counts per tenant
    const userCounts = await prisma.user.groupBy({
      by: ['tenantId'],
      _count: { id: true },
    });

    const userCountMap = new Map(
      userCounts.map(uc => [uc.tenantId, uc._count.id])
    );

    // Get order counts per tenant
    const orderCounts = await prisma.order.groupBy({
      by: ['tenantId'],
      _count: { id: true },
    });

    const orderCountMap = new Map(
      orderCounts.map(oc => [oc.tenantId, oc._count.id])
    );

    // Get product counts per tenant
    const productCounts = await prisma.product.groupBy({
      by: ['tenantId'],
      _count: { id: true },
    });

    const productCountMap = new Map(
      productCounts.map(pc => [pc.tenantId, pc._count.id])
    );

    const tenantsWithStats = tenants.map(tenant => ({
      ...tenant,
      stats: {
        users: userCountMap.get(tenant.id) || 0,
        orders: orderCountMap.get(tenant.id) || 0,
        products: productCountMap.get(tenant.id) || 0,
      },
    }));

    return NextResponse.json({
      tenants: tenantsWithStats,
      total: tenants.length,
    });
  } catch (error) {
    logger.error('Failed to list tenants', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Generate a random password with uppercase, lowercase, digits, and special chars.
 */
function generateRandomPassword(length = 16): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*';
  const bytes = randomBytes(length);
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset[bytes[i] % charset.length];
  }
  return password;
}

/**
 * Build the welcome email HTML for a new tenant owner.
 */
function buildWelcomeEmailHtml(opts: {
  tenantName: string;
  adminUrl: string;
  ownerEmail: string;
  temporaryPassword: string;
  resetPasswordUrl: string;
}): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;background:#f4f6f8;color:#1a1a1a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:#0066CC;padding:32px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:600;">Bienvenue sur Koraline</h1>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">
              Bonjour,
            </p>
            <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">
              Votre espace <strong>${opts.tenantName}</strong> a été créé avec succès sur la plateforme Koraline.
              Vous pouvez dès maintenant accéder à votre tableau de bord d'administration.
            </p>

            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fb;border-radius:8px;padding:20px;margin:24px 0;">
              <tr><td style="padding:20px;">
                <p style="margin:0 0 12px;font-size:14px;color:#666;">Vos informations de connexion :</p>
                <table cellpadding="4" cellspacing="0" style="font-size:14px;">
                  <tr>
                    <td style="font-weight:600;padding-right:12px;">URL admin :</td>
                    <td><a href="https://${opts.adminUrl}" style="color:#0066CC;">${opts.adminUrl}</a></td>
                  </tr>
                  <tr>
                    <td style="font-weight:600;padding-right:12px;">Email :</td>
                    <td>${opts.ownerEmail}</td>
                  </tr>
                  <tr>
                    <td style="font-weight:600;padding-right:12px;">Mot de passe temporaire :</td>
                    <td style="font-family:monospace;background:#e8e8e8;padding:2px 8px;border-radius:4px;">${opts.temporaryPassword}</td>
                  </tr>
                </table>
              </td></tr>
            </table>

            <p style="margin:0 0 24px;font-size:16px;line-height:1.6;">
              Pour des raisons de sécurité, nous vous recommandons fortement de
              <strong>changer votre mot de passe</strong> dès votre première connexion :
            </p>

            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td align="center">
                <a href="${opts.resetPasswordUrl}" style="display:inline-block;background:#0066CC;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:600;">
                  Définir mon mot de passe
                </a>
              </td></tr>
            </table>

            <p style="margin:24px 0 16px;font-size:16px;line-height:1.6;">
              <strong>Premières étapes :</strong>
            </p>
            <ol style="margin:0 0 24px;padding-left:20px;font-size:15px;line-height:1.8;">
              <li>Connectez-vous à votre tableau de bord</li>
              <li>Changez votre mot de passe temporaire</li>
              <li>Configurez votre boutique (logo, couleurs, informations)</li>
              <li>Ajoutez vos premiers produits ou formations</li>
            </ol>

            <p style="margin:0 0 8px;font-size:14px;color:#888;line-height:1.5;">
              Ce lien de réinitialisation expire dans 7 jours. Si vous n'avez pas demandé
              la création de ce compte, ignorez cet email.
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f8f9fb;padding:20px 40px;text-align:center;border-top:1px solid #e8e8e8;">
            <p style="margin:0;font-size:13px;color:#999;">
              Koraline par Attitudes VIP — Plateforme SaaS tout-en-un
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();
}

export async function POST(request: NextRequest) {
  const check = await verifySuperAdmin();
  if (!check.authorized) return check.error!;

  try {
    const body = await request.json();
    const { slug, name, domainCustom, plan, primaryColor, secondaryColor, locale, currency, ownerEmail, ownerName } = body;

    // Validation
    if (!slug || !name) {
      return NextResponse.json({ error: 'slug and name are required' }, { status: 400 });
    }
    if (!ownerEmail || typeof ownerEmail !== 'string' || !ownerEmail.includes('@')) {
      return NextResponse.json({ error: 'ownerEmail is required and must be a valid email address' }, { status: 400 });
    }

    // Check slug uniqueness
    const existing = await prisma.tenant.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: `Tenant with slug "${slug}" already exists` }, { status: 409 });
    }

    // Check ownerEmail uniqueness
    const existingUser = await prisma.user.findUnique({ where: { email: ownerEmail.toLowerCase().trim() } });
    if (existingUser) {
      return NextResponse.json({ error: `A user with email "${ownerEmail}" already exists` }, { status: 409 });
    }

    // Generate temporary password and reset token
    const temporaryPassword = generateRandomPassword(16);
    const hashedPassword = hashSync(temporaryPassword, 10);
    const resetToken = randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Create tenant + owner user in a transaction
    const tenantLocale = locale || 'fr';

    const [tenant, ownerUser] = await prisma.$transaction(async (tx) => {
      const newTenant = await tx.tenant.create({
        data: {
          slug,
          name,
          domainCustom: domainCustom || null,
          domainVerified: false,
          domainKoraline: `${slug}.koraline.app`,
          plan: plan || 'essential',
          status: 'ACTIVE',
          primaryColor: primaryColor || '#0066CC',
          secondaryColor: secondaryColor || '#003366',
          locale: tenantLocale,
          currency: currency || 'CAD',
          modulesEnabled: JSON.stringify(['commerce', 'catalogue', 'marketing', 'emails', 'comptabilite', 'systeme']),
          featuresFlags: JSON.stringify({}),
        },
      });

      const newUser = await tx.user.create({
        data: {
          email: ownerEmail.toLowerCase().trim(),
          name: ownerName || `${slug} Admin`,
          role: 'OWNER',
          tenantId: newTenant.id,
          password: hashedPassword,
          locale: tenantLocale,
          resetToken,
          resetTokenExpiry,
        },
      });

      return [newTenant, newUser] as const;
    });

    logger.info('New tenant created with owner', {
      tenantId: tenant.id,
      slug: tenant.slug,
      name: tenant.name,
      ownerEmail: ownerUser.email,
      ownerId: ownerUser.id,
    });

    // Send welcome email (non-blocking — don't fail tenant creation if email fails)
    const adminUrl = `${slug}.koraline.app/admin`;
    const baseUrl = process.env.NEXTAUTH_URL || `https://${slug}.koraline.app`;
    const resetPasswordUrl = `${baseUrl}/auth/reset-password?token=${resetToken}`;

    sendEmail({
      to: { email: ownerUser.email, name: ownerUser.name || undefined },
      subject: 'Bienvenue sur Koraline — Votre compte est prêt',
      html: buildWelcomeEmailHtml({
        tenantName: tenant.name,
        adminUrl,
        ownerEmail: ownerUser.email,
        temporaryPassword,
        resetPasswordUrl,
      }),
      emailType: 'transactional',
    }).catch((emailError) => {
      logger.error('Failed to send welcome email for new tenant', {
        tenantId: tenant.id,
        ownerEmail: ownerUser.email,
        error: emailError instanceof Error ? emailError.message : String(emailError),
      });
    });

    // Return tenant + user info (without sensitive fields)
    return NextResponse.json({
      tenant,
      owner: {
        id: ownerUser.id,
        email: ownerUser.email,
        name: ownerUser.name,
        role: ownerUser.role,
        tenantId: ownerUser.tenantId,
      },
      temporaryPassword,
      resetPasswordUrl,
    }, { status: 201 });
  } catch (error) {
    logger.error('Failed to create tenant', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
