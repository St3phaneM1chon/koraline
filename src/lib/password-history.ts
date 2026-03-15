/**
 * PASSWORD HISTORY - Prevent password reuse
 *
 * Tracks the last 12 password hashes per user.
 * Before any password change, the new password is checked
 * against stored history to prevent reuse.
 *
 * NYDFS 500.7 compliance: password reuse prevention
 */

import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

const MAX_PASSWORD_HISTORY = 12;

/**
 * Checks whether the plaintext password matches any of the user's
 * last 12 stored password hashes.
 *
 * Uses Promise.all to run bcrypt comparisons concurrently instead of
 * sequentially (~100ms total vs ~1200ms for 12 hashes).
 *
 * @returns true if the password was previously used (i.e. should be rejected)
 */
export async function checkPasswordHistory(
  userId: string,
  newPassword: string
): Promise<boolean> {
  const history = await prisma.passwordHistory.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: MAX_PASSWORD_HISTORY,
    select: { password: true },
  });

  if (history.length === 0) return false;

  const results = await Promise.all(
    history.map((entry) => bcrypt.compare(newPassword, entry.password))
  );

  return results.some((match) => match);
}

/**
 * Stores a hashed password in the user's password history and trims
 * the history to the most recent MAX_PASSWORD_HISTORY entries.
 *
 * Uses a single transaction (create + trim) instead of 3 separate queries.
 *
 * @param userId - The user ID
 * @param hashedPassword - The bcrypt-hashed password (already hashed by the caller)
 */
export async function addToPasswordHistory(
  userId: string,
  hashedPassword: string
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    // Store the new entry
    await tx.passwordHistory.create({
      data: { userId, password: hashedPassword },
    });

    // Trim old entries beyond the limit
    const allEntries = await tx.passwordHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });

    if (allEntries.length > MAX_PASSWORD_HISTORY) {
      const idsToDelete = allEntries
        .slice(MAX_PASSWORD_HISTORY)
        .map((entry) => entry.id);

      await tx.passwordHistory.deleteMany({
        where: { id: { in: idsToDelete } },
      });
    }
  });
}
