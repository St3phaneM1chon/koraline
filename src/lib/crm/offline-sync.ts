/**
 * Offline Sync Service (N3 - Offline Access / Sync)
 * Server-side sync protocol for PWA offline support.
 * Queues mutations when offline, syncs when back online, resolves conflicts.
 * The actual service worker caching runs in public/sw.js; this provides
 * the API layer for queue management, conflict resolution, and sync status.
 */

import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type OfflineActionType = 'CREATE' | 'UPDATE' | 'DELETE';

export type ConflictStrategy = 'LOCAL_WINS' | 'SERVER_WINS' | 'MERGE';

export interface OfflineAction {
  id: string;
  type: OfflineActionType;
  entity: string;
  entityId?: string;
  data: Record<string, unknown>;
  timestamp: string;
  userId: string;
  retryCount: number;
  error?: string;
}

export interface OfflineSyncConfig {
  entities: CacheableEntity[];
  syncIntervalMs: number;
  maxCacheSizePerEntity: number;
  maxQueueSize: number;
  conflictStrategy: ConflictStrategy;
  retryLimit: number;
  retryDelayMs: number;
}

export interface CacheableEntity {
  name: string;
  model: string;
  maxRecords: number;
  syncFields: string[];
  orderBy: string;
  direction: 'asc' | 'desc';
}

export interface OfflineQueueStatus {
  pendingCount: number;
  failedCount: number;
  lastSyncAt: string | null;
  lastSyncSuccess: boolean;
  errors: { actionId: string; entity: string; error: string }[];
  queueSizeBytes: number;
}

export interface SyncResult {
  synced: number;
  failed: number;
  conflicts: number;
  errors: { actionId: string; error: string }[];
  duration: number;
}

export interface ConflictResult {
  resolved: boolean;
  strategy: ConflictStrategy;
  mergedData: unknown;
  fieldsOverwritten: string[];
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const CACHEABLE_ENTITIES: CacheableEntity[] = [
  {
    name: 'leads',
    model: 'crmLead',
    maxRecords: 1000,
    syncFields: ['id', 'contactName', 'email', 'phone', 'companyName', 'status', 'score', 'updatedAt'],
    orderBy: 'updatedAt',
    direction: 'desc',
  },
  {
    name: 'contacts',
    model: 'user',
    maxRecords: 1000,
    syncFields: ['id', 'name', 'email', 'phone', 'role', 'updatedAt'],
    orderBy: 'updatedAt',
    direction: 'desc',
  },
  {
    name: 'deals',
    model: 'crmDeal',
    maxRecords: 1000,
    syncFields: ['id', 'title', 'value', 'currency', 'stageId', 'assignedToId', 'expectedCloseDate', 'updatedAt'],
    orderBy: 'updatedAt',
    direction: 'desc',
  },
  {
    name: 'tasks',
    model: 'crmTask',
    maxRecords: 1000,
    syncFields: ['id', 'title', 'description', 'status', 'priority', 'dueDate', 'assignedToId', 'updatedAt'],
    orderBy: 'updatedAt',
    direction: 'desc',
  },
  {
    name: 'activities',
    model: 'crmActivity',
    maxRecords: 1000,
    syncFields: ['id', 'type', 'title', 'description', 'createdAt', 'performedById', 'leadId', 'dealId'],
    orderBy: 'createdAt',
    direction: 'desc',
  },
];

/**
 * Return the sync configuration for the PWA client.
 * The client uses this to know which entities to cache and how often to sync.
 */
export function getOfflineSyncConfig(): OfflineSyncConfig {
  return {
    entities: CACHEABLE_ENTITIES,
    syncIntervalMs: 30_000, // 30 seconds
    maxCacheSizePerEntity: 1000,
    maxQueueSize: 500,
    conflictStrategy: 'SERVER_WINS',
    retryLimit: 3,
    retryDelayMs: 5_000,
  };
}

/**
 * Return the list of entities that the client should cache for offline use.
 */
export function getCacheableEntities(): CacheableEntity[] {
  return [...CACHEABLE_ENTITIES];
}

// ---------------------------------------------------------------------------
// Queue Management
// ---------------------------------------------------------------------------

/**
 * Queue an offline action for later sync.
 * Actions are stored in CrmActivity with type='OFFLINE_SYNC' for durability.
 */
export async function queueOfflineAction(
  action: {
    type: OfflineActionType;
    entity: string;
    entityId?: string;
    data: Record<string, unknown>;
  },
  userId: string,
): Promise<{ queued: boolean; actionId: string }> {
  const actionId = `offline-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const queueEntry: OfflineAction = {
    id: actionId,
    type: action.type,
    entity: action.entity,
    entityId: action.entityId,
    data: action.data,
    timestamp: new Date().toISOString(),
    userId,
    retryCount: 0,
  };

  // Store in CrmActivity as metadata for persistence
  await prisma.crmActivity.create({
    data: {
      type: 'NOTE',
      title: `Offline ${action.type} on ${action.entity}`,
      description: `Queued offline action for ${action.entity}${action.entityId ? ` (${action.entityId})` : ''}`,
      performedById: userId,
      metadata: queueEntry as unknown as Prisma.InputJsonValue,
    },
  });

  logger.info('[OfflineSync] Action queued', { actionId, type: action.type, entity: action.entity });

  return { queued: true, actionId };
}

/**
 * Process all pending offline actions, syncing them to the database.
 * Returns summary of synced, failed, and conflicted actions.
 */
export async function processOfflineQueue(userId?: string): Promise<SyncResult> {
  const startTime = Date.now();

  const where: Prisma.CrmActivityWhereInput = {
    type: 'NOTE',
    title: { startsWith: 'Offline ' },
    ...(userId ? { performedById: userId } : {}),
  };

  const pendingActions = await prisma.crmActivity.findMany({
    where,
    orderBy: { createdAt: 'asc' },
    take: 100,
  });

  let synced = 0;
  let failed = 0;
  let conflicts = 0;
  const errors: { actionId: string; error: string }[] = [];

  for (const activity of pendingActions) {
    const action = activity.metadata as unknown as OfflineAction | null;
    if (!action) {
      await prisma.crmActivity.delete({ where: { id: activity.id } });
      continue;
    }

    try {
      const result = await executeSyncAction(action);

      if (result.conflict) {
        conflicts++;
        const resolved = resolveConflict(action.data, result.serverData, 'SERVER_WINS');
        if (resolved.resolved) {
          await executeMergedAction(action, resolved.mergedData as Record<string, unknown>);
          synced++;
        } else {
          failed++;
          errors.push({ actionId: action.id, error: 'Conflict could not be resolved' });
        }
      } else {
        synced++;
      }

      // Remove from queue on success
      await prisma.crmActivity.delete({ where: { id: activity.id } });
    } catch (err) {
      failed++;
      const errorMsg = err instanceof Error ? err.message : 'Unknown sync error';
      errors.push({ actionId: action.id, error: errorMsg });

      // Update retry count
      const updatedAction = { ...action, retryCount: action.retryCount + 1, error: errorMsg };
      if (updatedAction.retryCount >= 3) {
        // Mark as permanently failed
        await prisma.crmActivity.update({
          where: { id: activity.id },
          data: {
            title: `FAILED: ${activity.title}`,
            metadata: updatedAction as unknown as Prisma.InputJsonValue,
          },
        });
      } else {
        await prisma.crmActivity.update({
          where: { id: activity.id },
          data: { metadata: updatedAction as unknown as Prisma.InputJsonValue },
        });
      }
    }
  }

  const duration = Date.now() - startTime;

  logger.info('[OfflineSync] Queue processed', { synced, failed, conflicts, duration });

  return { synced, failed, conflicts, errors, duration };
}

/**
 * Get the current status of the offline queue.
 */
export async function getOfflineQueueStatus(userId?: string): Promise<OfflineQueueStatus> {
  const where: Prisma.CrmActivityWhereInput = {
    type: 'NOTE',
    title: { startsWith: 'Offline ' },
    ...(userId ? { performedById: userId } : {}),
  };

  const allActions = await prisma.crmActivity.findMany({
    where,
    select: { metadata: true, title: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });

  let pendingCount = 0;
  let failedCount = 0;
  const syncErrors: { actionId: string; entity: string; error: string }[] = [];

  for (const activity of allActions) {
    const action = activity.metadata as unknown as OfflineAction | null;
    if (!action) continue;

    if (activity.title?.startsWith('FAILED:')) {
      failedCount++;
      syncErrors.push({
        actionId: action.id,
        entity: action.entity,
        error: action.error || 'Unknown error',
      });
    } else {
      pendingCount++;
    }
  }

  // Find last successful sync from activity log
  const lastSync = await prisma.crmActivity.findFirst({
    where: {
      type: 'NOTE',
      title: 'Offline sync completed',
      ...(userId ? { performedById: userId } : {}),
    },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true, metadata: true },
  });

  const lastSyncMeta = lastSync?.metadata as Record<string, unknown> | null;

  return {
    pendingCount,
    failedCount,
    lastSyncAt: lastSync?.createdAt?.toISOString() || null,
    lastSyncSuccess: lastSyncMeta?.success === true,
    errors: syncErrors,
    queueSizeBytes: JSON.stringify(allActions).length,
  };
}

// ---------------------------------------------------------------------------
// Conflict Resolution
// ---------------------------------------------------------------------------

/**
 * Resolve a data conflict between local and server versions.
 */
export function resolveConflict(
  localData: unknown,
  serverData: unknown,
  strategy: ConflictStrategy,
): ConflictResult {
  const local = (localData || {}) as Record<string, unknown>;
  const server = (serverData || {}) as Record<string, unknown>;

  const fieldsOverwritten: string[] = [];

  if (strategy === 'LOCAL_WINS') {
    return {
      resolved: true,
      strategy,
      mergedData: local,
      fieldsOverwritten: Object.keys(local),
    };
  }

  if (strategy === 'SERVER_WINS') {
    return {
      resolved: true,
      strategy,
      mergedData: server,
      fieldsOverwritten: Object.keys(server),
    };
  }

  // MERGE strategy: prefer newer values field by field
  const merged: Record<string, unknown> = { ...server };
  const localUpdatedAt = local.updatedAt ? new Date(local.updatedAt as string).getTime() : 0;
  const serverUpdatedAt = server.updatedAt ? new Date(server.updatedAt as string).getTime() : 0;

  for (const key of Object.keys(local)) {
    if (key === 'id' || key === 'createdAt') continue;

    if (local[key] !== server[key]) {
      // For merge: use local value if local is newer, otherwise keep server
      if (localUpdatedAt > serverUpdatedAt) {
        merged[key] = local[key];
        fieldsOverwritten.push(key);
      }
    }
  }

  return {
    resolved: true,
    strategy,
    mergedData: merged,
    fieldsOverwritten,
  };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

interface SyncActionResult {
  conflict: boolean;
  serverData?: unknown;
}

async function executeSyncAction(action: OfflineAction): Promise<SyncActionResult> {
  const { type, entity, entityId, data } = action;

  // Validate entity is cacheable
  const entityConfig = CACHEABLE_ENTITIES.find((e) => e.name === entity);
  if (!entityConfig) {
    throw new Error(`Entity "${entity}" is not configured for offline sync`);
  }

  if (type === 'CREATE') {
    // For creates, just insert; no conflict possible
    await createEntity(entityConfig.model, data);
    return { conflict: false };
  }

  if (type === 'UPDATE' && entityId) {
    // Check for conflicts: compare updatedAt timestamps
    const serverRecord = await getEntityById(entityConfig.model, entityId);
    if (!serverRecord) {
      throw new Error(`Record ${entityId} not found on server`);
    }

    const serverUpdatedAt = (serverRecord as Record<string, unknown>).updatedAt;
    const localUpdatedAt = data.updatedAt;

    if (serverUpdatedAt && localUpdatedAt) {
      const serverTime = new Date(serverUpdatedAt as string).getTime();
      const localTime = new Date(localUpdatedAt as string).getTime();

      if (serverTime > localTime) {
        return { conflict: true, serverData: serverRecord };
      }
    }

    await updateEntity(entityConfig.model, entityId, data);
    return { conflict: false };
  }

  if (type === 'DELETE' && entityId) {
    await deleteEntity(entityConfig.model, entityId);
    return { conflict: false };
  }

  throw new Error(`Invalid action: ${type} on ${entity}`);
}

async function executeMergedAction(
  action: OfflineAction,
  mergedData: Record<string, unknown>,
): Promise<void> {
  if (!action.entityId) return;
  const entityConfig = CACHEABLE_ENTITIES.find((e) => e.name === action.entity);
  if (!entityConfig) return;

  await updateEntity(entityConfig.model, action.entityId, mergedData);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getEntityById(model: string, id: string): Promise<Record<string, unknown> | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const prismaModel = (prisma as any)[model];
  if (!prismaModel) return null;
  return prismaModel.findUnique({ where: { id } });
}

async function createEntity(model: string, data: Record<string, unknown>): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const prismaModel = (prisma as any)[model];
  if (!prismaModel) throw new Error(`Model ${model} not found`);
  const { id: _id, createdAt: _c, updatedAt: _u, ...cleanData } = data;
  await prismaModel.create({ data: cleanData });
}

async function updateEntity(model: string, id: string, data: Record<string, unknown>): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const prismaModel = (prisma as any)[model];
  if (!prismaModel) throw new Error(`Model ${model} not found`);
  const { id: _id, createdAt: _c, ...cleanData } = data;
  await prismaModel.update({ where: { id }, data: cleanData });
}

async function deleteEntity(model: string, id: string): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const prismaModel = (prisma as any)[model];
  if (!prismaModel) throw new Error(`Model ${model} not found`);
  await prismaModel.delete({ where: { id } });
}
