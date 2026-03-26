/**
 * Email: Abandoned Cart Recovery
 * Finds carts with items that have not been converted to orders
 * within the last 24 hours, and returns the list for email campaigns.
 */
import { prisma } from '@/lib/db';

export interface AbandonedCartInfo {
  cartId: string;
  userId: string;
  userEmail: string;
  userName: string | null;
  itemCount: number;
  lastUpdated: Date;
  items: Array<{
    productId: string;
    quantity: number;
    priceAtAdd: number;
  }>;
}

/**
 * Find abandoned carts eligible for recovery emails.
 * A cart is "abandoned" when:
 * - It has a userId (logged-in user)
 * - It was last updated more than `hoursThreshold` hours ago
 * - It has at least one item
 * - The user has NOT placed an order since the cart was last updated
 *
 * @param hoursThreshold - Minimum hours since last update (default 24)
 * @param limit - Maximum carts to return (default 100)
 */
export async function findAbandonedCarts(
  hoursThreshold: number = 24,
  limit: number = 100
): Promise<AbandonedCartInfo[]> {
  const cutoff = new Date();
  cutoff.setHours(cutoff.getHours() - hoursThreshold);

  // Find carts with items, belonging to a logged-in user, not updated recently
  const carts = await prisma.cart.findMany({
    where: {
      userId: { not: null },
      updatedAt: { lt: cutoff },
      items: { some: {} },
    },
    include: {
      items: true,
      // Cart doesn't have a direct user relation; we'll fetch users separately
    },
    take: Math.min(limit, 200),
  });

  if (carts.length === 0) return [];

  // Get the user IDs from carts
  const userIds = carts
    .map((c) => c.userId)
    .filter((id): id is string => id !== null);

  // Fetch user info
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, email: true, name: true },
    take: 200,
  });
  const userMap = new Map(users.map((u) => [u.id, u]));

  // Check which users have placed an order since their cart was last updated
  const recentOrders = await prisma.order.findMany({
    where: {
      userId: { in: userIds },
      createdAt: { gte: cutoff },
    },
    select: { userId: true },
    take: 500,
  });
  const usersWithRecentOrders = new Set(
    recentOrders.map((o) => o.userId).filter(Boolean)
  );

  const results: AbandonedCartInfo[] = [];

  for (const cart of carts) {
    if (!cart.userId) continue;

    // Skip users who have recently ordered
    if (usersWithRecentOrders.has(cart.userId)) continue;

    const user = userMap.get(cart.userId);
    if (!user || !user.email) continue;

    results.push({
      cartId: cart.id,
      userId: cart.userId,
      userEmail: user.email,
      userName: user.name,
      itemCount: cart.items.length,
      lastUpdated: cart.updatedAt,
      items: cart.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        priceAtAdd: Number(item.priceAtAdd),
      })),
    });
  }

  return results;
}
