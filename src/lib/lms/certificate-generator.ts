/**
 * G25 — Certificate Generator
 * Generates an HTML certificate from course completion data + template.
 * Uses the existing CertificateTemplate model for rendering.
 *
 * The generator:
 * 1. Looks up enrollment + course + user data
 * 2. Finds the appropriate CertificateTemplate
 * 3. Renders HTML by replacing {{placeholders}}
 * 4. Creates a Certificate record in DB
 * 5. Returns rendered HTML (browser can print-to-PDF)
 *
 * PRESERVES EXISTING: This file is additive. The existing certificate
 * download route (api/lms/certificates/[id]/download) already handles
 * HTML rendering from templates. This service centralizes generation logic.
 */

import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import { randomUUID } from 'crypto';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CertificateGenerationInput {
  enrollmentId: string;
  tenantId: string;
  userId: string;
}

export interface GeneratedCertificate {
  certificateId: string;
  verificationCode: string;
  html: string;
  studentName: string;
  courseTitle: string;
  issuedAt: Date;
}

// ---------------------------------------------------------------------------
// Default template (used when no CertificateTemplate exists for the course)
// ---------------------------------------------------------------------------

const DEFAULT_TEMPLATE_HTML = `
<div style="
  width: 1056px; height: 748px;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border: 3px solid #6366f1;
  border-radius: 16px;
  padding: 48px 64px;
  font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  text-align: center; position: relative; box-sizing: border-box;
">
  <div style="position: absolute; top: 0; left: 0; right: 0; height: 6px; background: linear-gradient(90deg, #6366f1, #8b5cf6, #a855f7); border-radius: 16px 16px 0 0;"></div>

  <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 4px; color: #6366f1; margin-bottom: 8px;">Certificate of Completion</div>

  <div style="font-size: 14px; color: #64748b; margin-bottom: 24px;">This is to certify that</div>

  <div style="font-size: 36px; font-weight: 700; color: #1e293b; margin-bottom: 16px; border-bottom: 2px solid #6366f1; padding-bottom: 8px;">{{studentName}}</div>

  <div style="font-size: 14px; color: #64748b; margin-bottom: 12px;">has successfully completed the course</div>

  <div style="font-size: 24px; font-weight: 600; color: #334155; margin-bottom: 32px;">{{courseTitle}}</div>

  <div style="font-size: 13px; color: #94a3b8; margin-bottom: 8px;">Issued on {{issuedDate}}</div>

  <div style="display: flex; gap: 48px; margin-top: 32px; align-items: flex-end;">
    <div style="text-align: center;">
      <div style="font-size: 14px; font-weight: 600; color: #334155;">{{signerName}}</div>
      <div style="width: 160px; border-top: 1px solid #cbd5e1; margin-top: 4px; padding-top: 4px; font-size: 11px; color: #94a3b8;">{{signerTitle}}</div>
    </div>
    <div style="text-align: center;">
      <div style="font-size: 11px; color: #94a3b8; font-family: monospace;">{{certificateNumber}}</div>
      <div style="font-size: 10px; color: #cbd5e1; margin-top: 2px;">Verify: /verify/certificate/{{verificationCode}}</div>
    </div>
  </div>
</div>
`;

const DEFAULT_CSS = `
@media print {
  body { margin: 0; }
  @page { size: landscape; margin: 0; }
}
`;

// ---------------------------------------------------------------------------
// Generator
// ---------------------------------------------------------------------------

/**
 * Generate a certificate for a completed enrollment.
 *
 * @throws Error if enrollment not found, not completed, or already has a certificate.
 */
export async function generateCertificate(
  input: CertificateGenerationInput
): Promise<GeneratedCertificate> {
  const { enrollmentId, tenantId, userId } = input;

  // 1. Fetch enrollment with course and user data
  const enrollment = await prisma.enrollment.findFirst({
    where: {
      id: enrollmentId,
      tenantId,
      userId,
    },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          certificateTemplateId: true,
        },
      },
    },
  });

  if (!enrollment) {
    throw new Error('Enrollment not found');
  }

  if (!enrollment.completedAt && enrollment.status !== 'COMPLETED') {
    throw new Error('Course not yet completed');
  }

  // Check if already has certificate
  if (enrollment.certificateId) {
    const existing = await prisma.certificate.findUnique({
      where: { id: enrollment.certificateId },
      select: { id: true, verificationCode: true },
    });
    if (existing) {
      throw new Error(`Certificate already exists: ${existing.id}`);
    }
  }

  // 2. Get user name
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true },
  });

  const studentName = user?.name || user?.email || 'Student';
  const courseTitle = enrollment.course.title;

  // 3. Find template
  let template: {
    id: string;
    htmlTemplate: string;
    cssStyles: string | null;
    logoUrl: string | null;
    signerName: string | null;
    signerTitle: string | null;
  } | null = null;

  if (enrollment.course.certificateTemplateId) {
    template = await prisma.certificateTemplate.findUnique({
      where: { id: enrollment.course.certificateTemplateId },
      select: {
        id: true,
        htmlTemplate: true,
        cssStyles: true,
        logoUrl: true,
        signerName: true,
        signerTitle: true,
      },
    });
  }

  // Fallback: get default template for tenant
  if (!template) {
    template = await prisma.certificateTemplate.findFirst({
      where: { tenantId, isDefault: true },
      select: {
        id: true,
        htmlTemplate: true,
        cssStyles: true,
        logoUrl: true,
        signerName: true,
        signerTitle: true,
      },
    });
  }

  // Use built-in default if no template exists at all
  const htmlTemplate = template?.htmlTemplate || DEFAULT_TEMPLATE_HTML;
  const cssStyles = template?.cssStyles || DEFAULT_CSS;
  const signerName = template?.signerName || '';
  const signerTitle = template?.signerTitle || '';
  const logoUrl = template?.logoUrl || '';
  const templateId = template?.id;

  // 4. Generate verification code and certificate number
  const verificationCode = randomUUID();
  const issuedAt = new Date();

  // 5. Create certificate record
  // We need a templateId — create a default template if none exists
  let resolvedTemplateId = templateId;
  if (!resolvedTemplateId) {
    const defaultTemplate = await prisma.certificateTemplate.create({
      data: {
        tenantId,
        name: 'Default Certificate',
        htmlTemplate: DEFAULT_TEMPLATE_HTML,
        cssStyles: DEFAULT_CSS,
        isDefault: true,
      },
    });
    resolvedTemplateId = defaultTemplate.id;
  }

  const certificate = await prisma.certificate.create({
    data: {
      tenantId,
      templateId: resolvedTemplateId,
      userId,
      courseTitle,
      studentName,
      verificationCode,
      status: 'ISSUED',
      issuedAt,
    },
  });

  // 6. Link certificate to enrollment
  await prisma.enrollment.update({
    where: { id: enrollmentId },
    data: { certificateId: certificate.id },
  });

  // 7. Render HTML
  const renderedBody = htmlTemplate
    .replace(/\{\{studentName\}\}/g, studentName)
    .replace(/\{\{courseTitle\}\}/g, courseTitle)
    .replace(/\{\{issuedDate\}\}/g, issuedAt.toLocaleDateString('fr-CA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }))
    .replace(/\{\{verificationCode\}\}/g, verificationCode)
    .replace(/\{\{certificateNumber\}\}/g, certificate.id.slice(-8).toUpperCase())
    .replace(/\{\{signerName\}\}/g, signerName)
    .replace(/\{\{signerTitle\}\}/g, signerTitle)
    .replace(/\{\{logoUrl\}\}/g, logoUrl);

  const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Certificate - ${courseTitle}</title>
  <style>
    ${cssStyles}
  </style>
</head>
<body style="margin: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #f1f5f9;">
  ${renderedBody}
</body>
</html>`;

  logger.info('[CertificateGenerator] Certificate generated', {
    certificateId: certificate.id,
    enrollmentId,
    courseTitle,
    studentName: studentName.split(' ')[0], // Only log first name for privacy
  });

  return {
    certificateId: certificate.id,
    verificationCode,
    html: fullHtml,
    studentName,
    courseTitle,
    issuedAt,
  };
}
