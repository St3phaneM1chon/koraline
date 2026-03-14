export const dynamic = 'force-dynamic';

/**
 * CRM Deal → Accounting Bridge Endpoint (Bridge #50)
 * GET /api/admin/crm/deals/[id]/accounting
 * Returns accounting data related to a deal's contact's orders.
 */

import { NextRequest } from 'next/server';
import { withAdminGuard } from '@/lib/admin-api-guard';
import { prisma } from '@/lib/db';
import { apiSuccess, apiError } from '@/lib/api-response';

export const GET = withAdminGuard(async (
  request: NextRequest,
  { params }: { session: unknown; params: Promise<{ id: string }> }
) => {
  const { id } = await params;

  const deal = await prisma.crmDeal.findUnique({
    where: { id },
    select: { id: true, contactId: true, title: true },
  });

  if (!deal) {
    return apiError('Deal not found', 'RESOURCE_NOT_FOUND', { status: 404, request });
  }

  if (!deal.contactId) {
    return apiSuccess({
      dealId: deal.id,
      dealName: deal.title,
      totalInvoiced: 0,
      totalPaid: 0,
      outstandingBalance: 0,
      recentEntries: [],
      message: 'No contact associated with this deal',
    }, { request });
  }

  // Use aggregate queries instead of loading all orders into memory
  // Get order IDs for this contact to filter journal entries (no relation on JournalEntry model)
  const contactOrderIds = await prisma.order.findMany({
    where: { userId: deal.contactId },
    select: { id: true },
  });
  const orderIdList = contactOrderIds.map(o => o.id);

  const [totalAgg, paidAgg, orderCount, entries] = await Promise.all([
    prisma.order.aggregate({
      where: { userId: deal.contactId },
      _sum: { total: true },
    }),
    prisma.order.aggregate({
      where: { userId: deal.contactId, status: { in: ['DELIVERED', 'COMPLETED'] } },
      _sum: { total: true },
    }),
    prisma.order.count({ where: { userId: deal.contactId } }),
    prisma.journalEntry.findMany({
      where: { orderId: { in: orderIdList } },
      take: 20,
      orderBy: { date: 'desc' },
      select: { id: true, entryNumber: true, description: true, date: true, type: true },
    }),
  ]);

  const totalInvoiced = Number(totalAgg._sum.total) || 0;
  const totalPaid = Number(paidAgg._sum.total) || 0;

  if (orderCount === 0) {
    return apiSuccess({
      dealId: deal.id,
      dealName: deal.title,
      totalInvoiced: 0,
      totalPaid: 0,
      outstandingBalance: 0,
      recentEntries: [],
      message: 'No orders found for this contact',
    }, { request });
  }

  return apiSuccess({
    dealId: deal.id,
    dealName: deal.title,
    contactId: deal.contactId,
    totalInvoiced,
    totalPaid,
    outstandingBalance: totalInvoiced - totalPaid,
    recentEntries: entries,
    orderCount,
  }, { request });
}, { requiredPermission: 'crm.contacts.view' });
