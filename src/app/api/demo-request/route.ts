/**
 * POST /api/demo-request
 * Receives demo request form submissions from the platform landing page.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { rateLimitMiddleware } from '@/lib/rate-limiter';
import { getClientIpFromRequest } from '@/lib/admin-audit';

const VALID_MODULES = [
  'commerce', 'crm', 'accounting', 'marketing',
  'lms', 'voip', 'loyalty', 'media',
] as const;

const demoRequestSchema = z.object({
  firstName: z.string().min(1).max(100).trim(),
  lastName: z.string().min(1).max(100).trim(),
  email: z.string().email().max(254).transform(v => v.toLowerCase().trim()),
  company: z.string().max(200).optional(),
  phone: z.string().max(30).optional(),
  employees: z.string().max(50).optional(),
  modules: z.array(z.enum(VALID_MODULES)).max(8).optional().default([]),
  message: z.string().max(2000).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIpFromRequest(request);
    const rl = await rateLimitMiddleware(ip, '/api/demo-request');
    if (!rl.success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const raw = await request.json();
    const parsed = demoRequestSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Prénom, nom et courriel sont requis' },
        { status: 400 }
      );
    }

    const { email, company, modules } = parsed.data;

    logger.info('Demo request received', {
      company: company || 'N/A',
      email: email.substring(0, 3) + '***@' + email.split('@')[1],
      modules: modules && modules.length > 0 ? modules.join(', ') : 'none',
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Votre demande de démonstration a été reçue. Notre équipe vous contactera sous 24h.',
    });
  } catch (error) {
    logger.error('Demo request error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: 'Erreur lors de l\'envoi de la demande' },
      { status: 500 }
    );
  }
}
