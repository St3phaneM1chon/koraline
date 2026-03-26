/**
 * CRM: Activity Timeline
 * Returns a unified activity timeline for a lead, deal, or contact.
 * Uses CrmActivity model with title (not subject) and performedBy relation.
 */
import { prisma } from '@/lib/db';

export interface TimelineEntry {
  id: string;
  type: string;
  title: string;
  description: string | null;
  performedByName: string | null;
  createdAt: Date;
}

interface TimelineFilters {
  leadId?: string;
  dealId?: string;
  contactId?: string;
}

/**
 * Fetch the activity timeline for a given entity.
 * At least one of leadId, dealId, or contactId must be provided.
 *
 * @param filters - Object with leadId, dealId, and/or contactId
 * @param limit - Max number of activities to return (default 50)
 */
export async function getActivityTimeline(
  filters: TimelineFilters,
  limit: number = 50
): Promise<TimelineEntry[]> {
  if (!filters.leadId && !filters.dealId && !filters.contactId) {
    throw new Error('At least one of leadId, dealId, or contactId is required');
  }

  const orConditions: Record<string, string>[] = [];
  if (filters.leadId) orConditions.push({ leadId: filters.leadId });
  if (filters.dealId) orConditions.push({ dealId: filters.dealId });
  if (filters.contactId) orConditions.push({ contactId: filters.contactId });

  const activities = await prisma.crmActivity.findMany({
    where: { OR: orConditions },
    select: {
      id: true,
      type: true,
      title: true,
      description: true,
      createdAt: true,
      performedBy: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: Math.min(limit, 200),
  });

  return activities.map((a) => ({
    id: a.id,
    type: a.type,
    title: a.title,
    description: a.description,
    performedByName: a.performedBy?.name || null,
    createdAt: a.createdAt,
  }));
}
