/**
 * Customer Lifetime Value Calculator (J18)
 * Estimates CLV based on order history, deal values, and engagement patterns.
 */

import { prisma } from '@/lib/db';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CLVResult {
  contactId: string;
  name: string;
  email: string;
  totalRevenue: number;
  orderCount: number;
  avgOrderValue: number;
  firstOrderDate: string | null;
  lastOrderDate: string | null;
  lifespanMonths: number;
  monthlyRevenue: number;
  estimatedCLV: number;
  churnProbability: number;
}

export interface CLVDistributionBucket {
  range: string;
  count: number;
  min: number;
  max: number;
}

// ---------------------------------------------------------------------------
// Core calculations
// ---------------------------------------------------------------------------

/**
 * Calculate CLV for a specific contact.
 * CLV = (Avg Monthly Revenue) * (Estimated Remaining Lifespan) * (1 - Churn Probability)
 */
export async function calculateCLV(contactId: string): Promise<CLVResult | null> {
  const user = await prisma.user.findUnique({
    where: { id: contactId },
    select: { id: true, name: true, email: true },
  });
  if (!user) return null;

  const orders = await prisma.order.findMany({
    where: { userId: contactId, status: { not: 'CANCELLED' } },
    select: { total: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });

  const deals = await prisma.crmDeal.findMany({
    where: { contactId, stage: { isWon: true } },
    select: { value: true },
  });

  const totalOrderRevenue = orders.reduce((s, o) => s + Number(o.total), 0);
  const totalDealRevenue = deals.reduce((s, d) => s + Number(d.value), 0);
  const totalRevenue = totalOrderRevenue + totalDealRevenue;
  const orderCount = orders.length;
  const avgOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0;

  const firstOrderDate = orders.length > 0 ? orders[0].createdAt : null;
  const lastOrderDate = orders.length > 0 ? orders[orders.length - 1].createdAt : null;

  const now = new Date();
  const lifespanMs = firstOrderDate ? now.getTime() - firstOrderDate.getTime() : 0;
  const lifespanMonths = Math.max(1, lifespanMs / (30 * 86400000));
  const monthlyRevenue = totalRevenue / lifespanMonths;

  // Churn probability: higher if last order was long ago
  const daysSinceLastOrder = lastOrderDate
    ? (now.getTime() - lastOrderDate.getTime()) / 86400000
    : 365;
  const churnProbability = Math.min(0.95, Math.max(0.05, daysSinceLastOrder / 365));

  // Estimated remaining lifespan: 24 months baseline, adjusted by churn
  const remainingMonths = 24 * (1 - churnProbability);
  const estimatedCLV = Math.round(monthlyRevenue * remainingMonths * 100) / 100;

  return {
    contactId: user.id,
    name: user.name || '',
    email: user.email || '',
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    orderCount,
    avgOrderValue: Math.round(avgOrderValue * 100) / 100,
    firstOrderDate: firstOrderDate?.toISOString() || null,
    lastOrderDate: lastOrderDate?.toISOString() || null,
    lifespanMonths: Math.round(lifespanMonths * 10) / 10,
    monthlyRevenue: Math.round(monthlyRevenue * 100) / 100,
    estimatedCLV,
    churnProbability: Math.round(churnProbability * 100) / 100,
  };
}

/**
 * Calculate average CLV across all customers with at least one order.
 */
export async function calculateAverageCLV(): Promise<{ averageCLV: number; customerCount: number }> {
  const customers = await prisma.user.findMany({
    where: { orders: { some: { status: { not: 'CANCELLED' } } } },
    select: { id: true },
    take: 500,
  });

  let totalCLV = 0;
  for (const c of customers) {
    const result = await calculateCLV(c.id);
    if (result) totalCLV += result.estimatedCLV;
  }

  return {
    averageCLV: customers.length > 0 ? Math.round((totalCLV / customers.length) * 100) / 100 : 0,
    customerCount: customers.length,
  };
}

/**
 * Get CLV distribution across buckets for visualization.
 */
export async function getCLVDistribution(): Promise<CLVDistributionBucket[]> {
  const buckets: CLVDistributionBucket[] = [
    { range: '$0-100', count: 0, min: 0, max: 100 },
    { range: '$100-500', count: 0, min: 100, max: 500 },
    { range: '$500-1K', count: 0, min: 500, max: 1000 },
    { range: '$1K-5K', count: 0, min: 1000, max: 5000 },
    { range: '$5K-10K', count: 0, min: 5000, max: 10000 },
    { range: '$10K+', count: 0, min: 10000, max: Infinity },
  ];

  const customers = await prisma.user.findMany({
    where: { orders: { some: { status: { not: 'CANCELLED' } } } },
    select: { id: true },
    take: 500,
  });

  for (const c of customers) {
    const result = await calculateCLV(c.id);
    if (!result) continue;
    for (const bucket of buckets) {
      if (result.estimatedCLV >= bucket.min && result.estimatedCLV < bucket.max) {
        bucket.count++;
        break;
      }
    }
  }

  return buckets;
}
