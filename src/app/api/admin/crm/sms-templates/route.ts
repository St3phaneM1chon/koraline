export const dynamic = 'force-dynamic';

/**
 * CRM SMS Templates API
 * GET  /api/admin/crm/sms-templates - List active SMS templates
 * POST /api/admin/crm/sms-templates - Create a new SMS template
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAdminGuard } from '@/lib/admin-api-guard';
import { prisma } from '@/lib/db';
import { apiSuccess, apiError } from '@/lib/api-response';
import { ErrorCode } from '@/lib/error-codes';
import { stripHtml, stripControlChars } from '@/lib/sanitize';

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const createTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200).trim(),
  body: z.string().min(1, 'Body is required').max(1600).trim(),
  variables: z.array(z.string().max(100)).max(50).default([]),
});

// ---------------------------------------------------------------------------
// GET: List active SMS templates
// ---------------------------------------------------------------------------

export const GET = withAdminGuard(async (request: NextRequest) => {
  const templates = await prisma.smsTemplate.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
  });

  return apiSuccess(templates, { request });
}, { requiredPermission: 'crm.settings' });

// ---------------------------------------------------------------------------
// POST: Create a template
// ---------------------------------------------------------------------------

export const POST = withAdminGuard(async (request: NextRequest) => {
  const body = await request.json();
  const parsed = createTemplateSchema.safeParse(body);

  if (!parsed.success) {
    return apiError('Invalid input', ErrorCode.VALIDATION_ERROR, {
      status: 400,
      details: parsed.error.flatten(),
      request,
    });
  }

  const { name, body: templateBody, variables } = parsed.data;

  // XSS FIX: Sanitize template fields before storage
  const safeName = stripControlChars(stripHtml(name)).trim();
  const safeBody = stripControlChars(stripHtml(templateBody)).trim();

  const template = await prisma.smsTemplate.create({
    data: {
      name: safeName,
      body: safeBody,
      variables,
    },
  });

  return apiSuccess(template, { status: 201, request });
}, { requiredPermission: 'crm.settings' });
