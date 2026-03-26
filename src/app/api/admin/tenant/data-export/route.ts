export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { withAdminGuard } from '@/lib/admin-api-guard';
import { prisma } from '@/lib/db';

/**
 * Tenant Data Export (Feature 19)
 * Exports all data for a specific tenant across all models.
 * Each query filters by tenantId to ensure data isolation.
 */
async function handler(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const tenantId = url.searchParams.get('tenantId');
    const section = url.searchParams.get('section') || 'summary';

    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId query parameter is required' },
        { status: 400 }
      );
    }

    // Verify tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, slug: true, name: true, plan: true },
    });

    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    if (section === 'summary') {
      // Return counts for each model
      const [
        users,
        orders,
        products,
        categories,
        journalEntries,
        chartOfAccounts,
        crmDeals,
        crmLeads,
        crmActivities,
        courses,
        enrollments,
      ] = await Promise.all([
        prisma.user.count({ where: { tenantId } }),
        prisma.order.count({ where: { tenantId } }),
        prisma.product.count({ where: { tenantId } }),
        prisma.category.count({ where: { tenantId } }),
        prisma.journalEntry.count({ where: { tenantId } }),
        prisma.chartOfAccount.count({ where: { tenantId } }),
        prisma.crmDeal.count({ where: { tenantId } }),
        prisma.crmLead.count({ where: { tenantId } }),
        prisma.crmActivity.count({ where: { tenantId } }),
        prisma.course.count({ where: { tenantId } }),
        prisma.enrollment.count({ where: { tenantId } }),
      ]);

      return NextResponse.json({
        data: {
          tenant,
          counts: {
            users,
            orders,
            products,
            categories,
            journalEntries,
            chartOfAccounts,
            crmDeals,
            crmLeads,
            crmActivities,
            courses,
            enrollments,
          },
          exportSections: [
            'users',
            'orders',
            'products',
            'accounting',
            'crm',
            'lms',
          ],
        },
      });
    }

    // Export specific section
    const limit = 200;

    switch (section) {
      case 'users': {
        const data = await prisma.user.findMany({
          where: { tenantId },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true,
            loyaltyTier: true,
            loyaltyPoints: true,
          },
          take: limit,
        });
        return NextResponse.json({ data: { tenant, section, records: data } });
      }

      case 'orders': {
        const data = await prisma.order.findMany({
          where: { tenantId },
          select: {
            id: true,
            orderNumber: true,
            userId: true,
            total: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
        });
        return NextResponse.json({ data: { tenant, section, records: data } });
      }

      case 'products': {
        const data = await prisma.product.findMany({
          where: { tenantId },
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            compareAtPrice: true,
            stockQuantity: true,
            isActive: true,
            isFeatured: true,
          },
          take: limit,
        });
        return NextResponse.json({ data: { tenant, section, records: data } });
      }

      case 'accounting': {
        const entries = await prisma.journalEntry.findMany({
          where: { tenantId },
          select: {
            id: true,
            entryNumber: true,
            date: true,
            description: true,
            status: true,
          },
          orderBy: { date: 'desc' },
          take: limit,
        });
        const accounts = await prisma.chartOfAccount.findMany({
          where: { tenantId },
          select: { id: true, code: true, name: true, type: true },
          take: limit,
        });
        return NextResponse.json({
          data: { tenant, section, journalEntries: entries, chartOfAccounts: accounts },
        });
      }

      case 'crm': {
        const deals = await prisma.crmDeal.findMany({
          where: { tenantId },
          select: {
            id: true,
            title: true,
            value: true,
            assignedToId: true,
            stageId: true,
            actualCloseDate: true,
            createdAt: true,
          },
          take: limit,
        });
        const leads = await prisma.crmLead.findMany({
          where: { tenantId },
          select: {
            id: true,
            contactName: true,
            email: true,
            status: true,
            score: true,
          },
          take: limit,
        });
        return NextResponse.json({
          data: { tenant, section, deals, leads },
        });
      }

      case 'lms': {
        const courses = await prisma.course.findMany({
          where: { tenantId },
          select: {
            id: true,
            title: true,
            slug: true,
            status: true,
            estimatedHours: true,
          },
          take: limit,
        });
        const enrollments = await prisma.enrollment.findMany({
          where: { tenantId },
          select: {
            id: true,
            courseId: true,
            userId: true,
            status: true,
            completedAt: true,
          },
          take: limit,
        });
        return NextResponse.json({
          data: { tenant, section, courses, enrollments },
        });
      }

      default:
        return NextResponse.json(
          { error: `Unknown section: ${section}` },
          { status: 400 }
        );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const GET = withAdminGuard(handler);
