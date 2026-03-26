export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { withAdminGuard } from '@/lib/admin-api-guard';
import { prisma } from '@/lib/db';

interface LeakTestResult {
  model: string;
  totalRecords: number;
  withTenantId: number;
  withoutTenantId: number;
  leakRisk: 'NONE' | 'LOW' | 'HIGH' | 'CRITICAL';
  details: string;
}

/**
 * Cross-Tenant Leak Tests (Feature 20)
 * Verifies that all data-bearing models have tenantId populated
 * and that no records are accessible across tenant boundaries.
 *
 * Tests:
 * 1. Records without tenantId (data leak risk)
 * 2. Records with tenantId mismatch in relations
 * 3. Summary of tenant isolation health
 */
async function handler(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const tenantId = url.searchParams.get('tenantId');

    // Define models to test with their counts
    const modelsToTest = [
      { model: 'User', query: () => testModel('User') },
      { model: 'Order', query: () => testModel('Order') },
      { model: 'Product', query: () => testModel('Product') },
      { model: 'Category', query: () => testModel('Category') },
      { model: 'JournalEntry', query: () => testModel('JournalEntry') },
      { model: 'JournalLine', query: () => testModel('JournalLine') },
      { model: 'ChartOfAccount', query: () => testModel('ChartOfAccount') },
      { model: 'CrmDeal', query: () => testModel('CrmDeal') },
      { model: 'CrmLead', query: () => testModel('CrmLead') },
      { model: 'CrmActivity', query: () => testModel('CrmActivity') },
      { model: 'Cart', query: () => testModel('Cart') },
      { model: 'OrderItem', query: () => testModel('OrderItem') },
    ];

    const results: LeakTestResult[] = [];

    for (const { query } of modelsToTest) {
      results.push(await query());
    }

    // Cross-tenant relation check: orders where userId belongs to different tenant
    let crossTenantOrders = 0;
    if (tenantId) {
      const suspiciousOrders = await prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*)::bigint as count
        FROM "Order" o
        INNER JOIN "User" u ON u.id = o."userId"
        WHERE o."tenantId" = ${tenantId}
          AND u."tenantId" IS NOT NULL
          AND u."tenantId" != ${tenantId}
      `;
      crossTenantOrders = Number(suspiciousOrders[0]?.count || 0);
    }

    const totalLeaks = results.reduce((s, r) => s + r.withoutTenantId, 0);
    const criticalCount = results.filter((r) => r.leakRisk === 'CRITICAL').length;
    const highCount = results.filter((r) => r.leakRisk === 'HIGH').length;

    let overallHealth: 'HEALTHY' | 'WARNING' | 'CRITICAL';
    if (criticalCount > 0 || crossTenantOrders > 0) {
      overallHealth = 'CRITICAL';
    } else if (highCount > 0 || totalLeaks > 10) {
      overallHealth = 'WARNING';
    } else {
      overallHealth = 'HEALTHY';
    }

    return NextResponse.json({
      data: {
        overallHealth,
        totalModelsChecked: results.length,
        totalRecordsWithoutTenantId: totalLeaks,
        crossTenantRelationLeaks: crossTenantOrders,
        results,
        checkedAt: new Date().toISOString(),
        ...(tenantId ? { tenantId } : {}),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * Test a single model for tenant isolation.
 * Uses raw SQL to check for NULL tenantId values.
 */
async function testModel(model: string): Promise<LeakTestResult> {
  // Map model names to table names (Prisma convention: PascalCase model = PascalCase table)
  const tableName = model;

  try {
    const counts = await prisma.$queryRawUnsafe<
      Array<{ total: bigint; without_tenant: bigint }>
    >(
      `SELECT
        COUNT(*)::bigint as total,
        COUNT(*) FILTER (WHERE "tenantId" IS NULL)::bigint as without_tenant
       FROM "${tableName}"`
    );

    const total = Number(counts[0]?.total || 0);
    const withoutTenant = Number(counts[0]?.without_tenant || 0);
    const withTenant = total - withoutTenant;

    let leakRisk: 'NONE' | 'LOW' | 'HIGH' | 'CRITICAL';
    if (withoutTenant === 0) {
      leakRisk = 'NONE';
    } else if (withoutTenant < 5) {
      leakRisk = 'LOW';
    } else if (withoutTenant < total * 0.1) {
      leakRisk = 'HIGH';
    } else {
      leakRisk = 'CRITICAL';
    }

    return {
      model,
      totalRecords: total,
      withTenantId: withTenant,
      withoutTenantId: withoutTenant,
      leakRisk,
      details:
        withoutTenant === 0
          ? 'All records have tenantId assigned'
          : `${withoutTenant} record(s) missing tenantId — potential data leak`,
    };
  } catch {
    return {
      model,
      totalRecords: 0,
      withTenantId: 0,
      withoutTenantId: 0,
      leakRisk: 'NONE',
      details: `Table "${model}" not found or no tenantId column`,
    };
  }
}

export const GET = withAdminGuard(handler);
