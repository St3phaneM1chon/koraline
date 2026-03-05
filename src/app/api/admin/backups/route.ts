import { NextResponse } from 'next/server';
import { withAdminGuard } from '@/lib/admin-api-guard';

// F3 FIX: Backup route disabled in production (was using child_process.exec with hardcoded dev paths)
// Backups are managed via CI/CD and cron jobs, not via the web admin panel in production.

export const GET = withAdminGuard(async () => {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      {
        status: 'disabled',
        message: 'Backup management is not available via web interface in production. Use CI/CD pipelines or server-side cron jobs.',
        generatedAt: new Date().toISOString(),
      },
      { status: 501 }
    );
  }

  // In development, return a stub response
  return NextResponse.json({
    status: 'development',
    message: 'Backup API available in development mode only. Use CLI scripts for backup management.',
    generatedAt: new Date().toISOString(),
  });
}, { requiredPermission: 'admin.backups' });
