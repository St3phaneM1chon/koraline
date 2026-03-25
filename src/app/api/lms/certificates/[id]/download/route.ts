export const dynamic = 'force-dynamic';

/**
 * Certificate Download API
 * GET /api/lms/certificates/[id]/download — Download certificate as HTML (PDF generation deferred)
 *
 * P11-19 FIX: Student certificates page referenced this route but it didn't exist.
 * For now returns an HTML certificate that the browser can print to PDF.
 * Future: use puppeteer/playwright to generate actual PDF server-side.
 */
import { NextRequest, NextResponse } from 'next/server';
import { withUserGuard } from '@/lib/user-api-guard';
import { prisma } from '@/lib/db';

export const GET = withUserGuard(async (_request: NextRequest, { session, params }) => {
  const tenantId = session.user.tenantId;
  if (!tenantId) return NextResponse.json({ error: 'No tenant' }, { status: 403 });

  const resolvedParams = await params;
  const id = resolvedParams?.id;
  const userId = session.user.id!;

  const certificate = await prisma.certificate.findFirst({
    where: { id, tenantId, userId },
    include: {
      template: {
        select: { htmlTemplate: true, cssStyles: true, logoUrl: true, signerName: true, signerTitle: true },
      },
    },
  });

  if (!certificate) {
    return NextResponse.json({ error: 'Certificate not found' }, { status: 404 });
  }

  // If a pre-generated PDF URL exists, redirect to it
  if (certificate.pdfUrl) {
    return NextResponse.redirect(certificate.pdfUrl);
  }

  // Generate HTML certificate from template
  const template = certificate.template;
  if (!template?.htmlTemplate) {
    return NextResponse.json({ error: 'No template configured' }, { status: 404 });
  }

  const html = template.htmlTemplate
    .replace(/\{\{studentName\}\}/g, certificate.studentName)
    .replace(/\{\{courseTitle\}\}/g, certificate.courseTitle)
    .replace(/\{\{issuedDate\}\}/g, certificate.issuedAt.toLocaleDateString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric' }))
    .replace(/\{\{verificationCode\}\}/g, certificate.verificationCode)
    .replace(/\{\{certificateNumber\}\}/g, certificate.id.slice(-8).toUpperCase())
    .replace(/\{\{signerName\}\}/g, template.signerName ?? '')
    .replace(/\{\{signerTitle\}\}/g, template.signerTitle ?? '')
    .replace(/\{\{logoUrl\}\}/g, template.logoUrl ?? '');

  const fullHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Certificat - ${certificate.courseTitle}</title>
  <style>
    @media print { body { margin: 0; } @page { size: landscape; margin: 0; } }
    ${template.cssStyles ?? ''}
  </style>
</head>
<body>
  ${html}
</body>
</html>`;

  return new NextResponse(fullHtml, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `inline; filename="certificat-${certificate.id.slice(-8)}.html"`,
    },
  });
}, { skipCsrf: true });
