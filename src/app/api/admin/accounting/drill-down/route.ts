export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { withAdminGuard } from '@/lib/admin-api-guard';
import { prisma } from '@/lib/db';

/**
 * Accounting: GL Drill-Down
 * Returns all journal lines for a specific ChartOfAccount,
 * with the associated journal entry details.
 */
async function handler(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const accountId = url.searchParams.get('accountId');
    if (!accountId) {
      return NextResponse.json(
        { error: 'accountId query parameter is required' },
        { status: 400 }
      );
    }

    const limit = Math.min(
      Math.max(parseInt(url.searchParams.get('limit') || '50', 10), 1),
      200
    );
    const offset = Math.max(
      parseInt(url.searchParams.get('offset') || '0', 10),
      0
    );

    const account = await prisma.chartOfAccount.findUnique({
      where: { id: accountId },
      select: { id: true, code: true, name: true, type: true },
    });

    if (!account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    const [lines, totalCount] = await Promise.all([
      prisma.journalLine.findMany({
        where: { accountId },
        include: {
          entry: {
            select: {
              entryNumber: true,
              date: true,
              description: true,
              status: true,
            },
          },
        },
        orderBy: { entry: { date: 'desc' } },
        take: limit,
        skip: offset,
      }),
      prisma.journalLine.count({ where: { accountId } }),
    ]);

    // Compute running balance
    const linesWithBalance = lines.map((line) => ({
      id: line.id,
      entryId: line.entryId,
      entryNumber: line.entry.entryNumber,
      date: line.entry.date,
      entryDescription: line.entry.description,
      entryStatus: line.entry.status,
      lineDescription: line.description,
      debit: line.debit,
      credit: line.credit,
      costCenter: line.costCenter,
      projectCode: line.projectCode,
    }));

    return NextResponse.json({
      data: {
        account,
        lines: linesWithBalance,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount,
        },
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const GET = withAdminGuard(handler);
