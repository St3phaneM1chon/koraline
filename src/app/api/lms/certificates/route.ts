export const dynamic = 'force-dynamic';

/**
 * Student Certificates API
 * GET /api/lms/certificates — Returns the current user's certificates
 *
 * SEC-HARDENING: Wrapped with withUserGuard for centralized auth + rate limiting.
 * Tenant-scoped: only returns certificates belonging to the user's tenant.
 */
import { NextRequest, NextResponse } from 'next/server';
import { withUserGuard } from '@/lib/user-api-guard';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

export const GET = withUserGuard(async (_request: NextRequest, { session }) => {
  const tenantId = session.user.tenantId;
  if (!tenantId) {
    return NextResponse.json({ certificates: [] });
  }

  const userId = session.user.id;
  if (!userId) {
    return NextResponse.json({ error: 'User ID missing' }, { status: 401 });
  }

  try {
    const certificates = await prisma.certificate.findMany({
      where: {
        tenantId,
        userId,
      },
      select: {
        id: true,
        courseTitle: true,
        studentName: true,
        issuedAt: true,
        expiresAt: true,
        verificationCode: true,
        status: true,
        pdfUrl: true,
        qrCodeUrl: true,
      },
      orderBy: { issuedAt: 'desc' },
      take: 100,
    });

    // P11-11 FIX: Batch-fetch thumbnails (was N+1 individual queries)
    const certIds = certificates.map(c => c.id);
    const enrollments = certIds.length > 0
      ? await prisma.enrollment.findMany({
          where: { certificateId: { in: certIds }, tenantId },
          select: { certificateId: true, course: { select: { thumbnailUrl: true } } },
        })
      : [];
    const thumbnailMap = new Map(
      enrollments.map(e => [e.certificateId, e.course?.thumbnailUrl ?? null])
    );

    const enrichedCertificates = certificates.map(cert => ({
      id: cert.id,
      courseTitle: cert.courseTitle,
      studentName: cert.studentName,
      issuedAt: cert.issuedAt,
      expiresAt: cert.expiresAt,
      verificationCode: cert.verificationCode,
      status: cert.status,
      pdfUrl: cert.pdfUrl,
      qrCodeUrl: cert.qrCodeUrl,
      courseThumbnailUrl: thumbnailMap.get(cert.id) ?? null,
    }));

    return NextResponse.json({ certificates: enrichedCertificates });
  } catch (error) {
    logger.error('Failed to fetch user certificates', {
      userId,
      tenantId,
      error: 'Operation failed',
    });
    return NextResponse.json({ error: 'Failed to load certificates' }, { status: 500 });
  }
}, { skipCsrf: true, rateLimit: 30 });
