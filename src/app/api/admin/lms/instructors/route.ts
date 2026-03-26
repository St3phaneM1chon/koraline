export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAdminGuard } from '@/lib/admin-api-guard';
import { apiSuccess, apiError } from '@/lib/api-response';
import { ErrorCode } from '@/lib/error-codes';
import { prisma } from '@/lib/db';
import { getInstructors } from '@/lib/lms/lms-service';

export const GET = withAdminGuard(async (request: NextRequest, { session }) => {
  const instructors = await getInstructors(session.user.tenantId);
  return apiSuccess(instructors, { request });
});

const instructorSchema = z.object({
  userId: z.string().min(1),
  bio: z.string().max(2000).optional(),
  title: z.string().max(200).optional(),
  avatarUrl: z.string().url().optional(),
  expertise: z.array(z.string()).optional(),
  linkedinUrl: z.string().url().optional(),
  websiteUrl: z.string().url().optional(),
});

export const POST = withAdminGuard(async (request: NextRequest, { session }) => {
  const tenantId = session.user.tenantId;
  const body = await request.json();
  const parsed = instructorSchema.safeParse(body);
  if (!parsed.success) return apiError('Invalid input', ErrorCode.VALIDATION_ERROR, { request, status: 400 });

  // Verify user exists in tenant
  const user = await prisma.user.findFirst({
    where: { id: parsed.data.userId, tenantId },
    select: { id: true },
  });
  if (!user) return apiError('User not found', ErrorCode.NOT_FOUND, { request, status: 404 });

  const instructor = await prisma.instructorProfile.upsert({
    where: { tenantId_userId: { tenantId, userId: parsed.data.userId } },
    create: { tenantId, ...parsed.data, isActive: true },
    update: { ...parsed.data, isActive: true },
  });

  return apiSuccess(instructor, { request, status: 201 });
});

const updateSchema = z.object({
  bio: z.string().max(2000).optional(),
  title: z.string().max(200).optional(),
  avatarUrl: z.string().url().optional(),
  expertise: z.array(z.string()).optional(),
  linkedinUrl: z.string().url().optional(),
  websiteUrl: z.string().url().optional(),
  isActive: z.boolean().optional(),
});

export const PUT = withAdminGuard(async (request: NextRequest, { session }) => {
  const tenantId = session.user.tenantId;
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return apiError('Instructor ID required', ErrorCode.VALIDATION_ERROR, { request, status: 400 });

  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return apiError('Invalid input', ErrorCode.VALIDATION_ERROR, { request, status: 400 });

  const instructor = await prisma.instructorProfile.findFirst({
    where: { id, tenantId },
    select: { id: true },
  });
  if (!instructor) return apiError('Instructor not found', ErrorCode.NOT_FOUND, { request, status: 404 });

  const updated = await prisma.instructorProfile.update({
    where: { id },
    data: parsed.data,
  });

  return apiSuccess(updated, { request });
});

export const DELETE = withAdminGuard(async (request: NextRequest, { session }) => {
  const tenantId = session.user.tenantId;
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return apiError('Instructor ID required', ErrorCode.VALIDATION_ERROR, { request, status: 400 });

  const instructor = await prisma.instructorProfile.findFirst({
    where: { id, tenantId },
    select: { id: true },
  });
  if (!instructor) return apiError('Instructor not found', ErrorCode.NOT_FOUND, { request, status: 404 });

  await prisma.instructorProfile.update({ where: { id }, data: { isActive: false } });
  return apiSuccess({ success: true }, { request });
});
