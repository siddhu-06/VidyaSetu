'use client';

import {
  getFailedCount,
  getPendingCount,
  getPendingSessions,
  incrementSyncAttempt,
  markSessionFailed,
  markSessionSynced,
} from '@/lib/db/sessions';
import { getDB } from '@/lib/db/index';
import { createBrowserClient } from '@/lib/supabase/client';
import { calculateBackoff, MAX_RETRIES } from './queue';
import type { AppError, QueuedSession, SyncStatusSnapshot } from '@/types';

const BATCH_SIZE = 10;
const BACKGROUND_SYNC_TAG = 'session-sync-queue';
const SYNC_EVENT_NAME = 'vidyasetu:sync-status';
const COMPLETE_EVENT_NAME = 'vidyasetu:sync-complete';

export interface SyncResult {
  synced: number;
  failed: number;
  errors: AppError[];
}

export interface BatchResult {
  synced: string[];
  failed: { offline_id: string; error: string }[];
}

interface SessionInsertPayload {
  id?: string;
  student_id: string;
  mentor_id: string;
  session_date: string;
  subjects_covered: string[];
  skill_ratings: Record<string, string>;
  note: string;
  raw_tags: string[];
  synced: boolean;
  synced_at: string | null;
  created_at: string;
  offline_id: string;
  sync_attempts: number;
  sync_failed: boolean;
}

interface SessionsTableClient {
  upsert(
    value: SessionInsertPayload,
    options: { onConflict: string },
  ): {
    select(columns: string): {
      single(): Promise<{
        data: { id: string } | null;
        error: { message: string } | null;
      }>;
    };
  };
}

interface FunctionsClient {
  invoke(
    name: string,
    options: { body: { session_ids: string[] } },
  ): Promise<{
    error: { message: string } | null;
  }>;
}

let isSyncing = false;
let lastSyncAt: string | null = null;

async function buildQueueMetrics(): Promise<SyncStatusSnapshot['queueMetrics']> {
  const [pendingCount, failedCount] = await Promise.all([getPendingCount(), getFailedCount()]);

  return {
    queued: Math.max(pendingCount - failedCount, 0),
    syncing: isSyncing ? Math.min(pendingCount, BATCH_SIZE) : 0,
    failed: failedCount,
  };
}

async function dispatchSyncStatus(
  state: SyncStatusSnapshot['state'],
  message: string,
): Promise<void> {
  if (typeof window === 'undefined') {
    return;
  }

  const queueMetrics = await buildQueueMetrics();
  window.dispatchEvent(
    new CustomEvent<SyncStatusSnapshot>(SYNC_EVENT_NAME, {
      detail: {
        state,
        queueMetrics,
        lastSyncedAt: lastSyncAt,
        message,
      },
    }),
  );
}

async function recordSyncFailure(offlineId: string, error: string): Promise<void> {
  const db = await getDB();
  const existingSession = await db.get('session_queue', offlineId);

  if (!existingSession) {
    return;
  }

  await db.put('session_queue', {
    ...existingSession,
    error_message: error,
    last_attempt_at: new Date().toISOString(),
  });
}

async function appendSyncLog(
  offlineId: string,
  event: 'syncing' | 'failed',
  error?: string,
): Promise<void> {
  const db = await getDB();

  try {
    await db.add('sync_log', {
      id: crypto.randomUUID(),
      offline_id: offlineId,
      event,
      timestamp: new Date().toISOString(),
      ...(error ? { error } : {}),
    });
  } catch {
    // Sync logging should never break the user path.
  }
}

function createSessionsTableClient(): SessionsTableClient {
  const supabase = createBrowserClient();

  return {
    upsert(value, options) {
      return {
        select(columns) {
          return {
            async single() {
              const { data, error } = await supabase
                .from('sessions')
                .upsert(value as never, options)
                .select(columns)
                .single();
              const rawData = data as { id?: string | number } | null;

              return {
                data:
                  rawData && typeof rawData === 'object' && 'id' in rawData
                    ? { id: String(rawData.id) }
                    : null,
                error: error ? { message: error.message } : null,
              };
            },
          };
        },
      };
    },
  };
}

/*
export async function syncPendingSessions(): Promise<number> {
  const supabase = getSupabaseBrowserClient();

  if (!supabase) {
    await updateSnapshot('offline', 'Supabase is not configured on this device.', null);
    return 0;
  }

  await updateSnapshot('syncing', 'Syncing offline session logs…', null);

  try {
    const queuedRecords = sortQueue((await getQueuedSessions()).filter((record) => isEligibleForRetry(record)));
    let syncedCount = 0;

    for (const record of queuedRecords) {
      await updateQueuedSession(record.offlineId, (currentRecord) => ({
        ...currentRecord,
        syncStatus: 'syncing',
        updatedAt: new Date().toISOString(),
      }));

      const { data: existingData, error: existingError } = await supabase
        .from('sessions')
        .select('*')
        .eq('offline_id', record.offlineId)
        .maybeSingle();

      if (existingError) {
        throw existingError;
      }

      if (existingData) {
        const conflict = detectSessionConflict(record, mapRemoteSession(record, existingData));

        if (conflict) {
          await updateQueuedSession(record.offlineId, (currentRecord) => ({
            ...currentRecord,
            syncStatus: 'error',
            syncAttempts: currentRecord.syncAttempts + 1,
            syncError: 'Conflict detected with a session already synced from another device.',
            nextRetryAt: nextRetryIso(currentRecord.syncAttempts + 1),
            updatedAt: new Date().toISOString(),
          }));
          continue;
        }

        await removeQueuedSession(record.offlineId);
        syncedCount += 1;
        continue;
      }

      const { data, error } = await supabase
        .from('sessions')
        .insert(serializeQueuedSession(record))
        .select('id, updated_at')
        .single();

      if (error) {
        await updateQueuedSession(record.offlineId, (currentRecord) => ({
          ...currentRecord,
          syncStatus: 'error',
          syncAttempts: currentRecord.syncAttempts + 1,
          syncError: error.message,
          nextRetryAt: nextRetryIso(currentRecord.syncAttempts + 1),
          updatedAt: new Date().toISOString(),
        }));
        continue;
      }

      if (data) {
        await removeQueuedSession(record.offlineId);
        syncedCount += 1;
      }
    }

    const lastSyncedAt = new Date().toISOString();
    await updateSnapshot('synced', 'Offline sessions are synced.', lastSyncedAt);
    return syncedCount;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to sync offline sessions.';
    await updateSnapshot('error', message, null);
    return 0;
  }
}

export async function requestBackgroundSync(): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    if (!('sync' in registration)) {
      return false;
    }

    const syncRegistration = registration as ServiceWorkerRegistration & {
      sync: {
        register(tag: string): Promise<void>;
      };
    };

    await syncRegistration.sync.register(BACKGROUND_SYNC_TAG);
    return true;
  } catch (error) {
    return false;
  }
}

export function subscribeToSyncStatus(
  callback: (snapshot: SyncStatusSnapshot) => void,
): () => void {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  const handler = (event: Event): void => {
    const customEvent = event as CustomEvent<SyncStatusSnapshot>;
    callback(customEvent.detail);
  };

  window.addEventListener(SYNC_EVENT_NAME, handler);

  return () => {
    window.removeEventListener(SYNC_EVENT_NAME, handler);
  };
}
*/

export async function drainQueue(): Promise<SyncResult> {
  if (isSyncing) {
    return { synced: 0, failed: 0, errors: [] };
  }

  isSyncing = true;

  const result: SyncResult = { synced: 0, failed: 0, errors: [] };

  try {
    await dispatchSyncStatus('syncing', 'Syncing offline sessions...');

    const pending = await getPendingSessions();
    const eligible = pending.filter((session) => session.sync_attempts < MAX_RETRIES && !session.sync_failed);

    for (let index = 0; index < eligible.length; index += BATCH_SIZE) {
      const batch = eligible.slice(index, index + BATCH_SIZE);
      const batchResult = await syncBatch(batch);

      result.synced += batchResult.synced.length;
      result.failed += batchResult.failed.length;

      for (const failedSession of batchResult.failed) {
        result.errors.push({
          code: 'SYNC_FAILED',
          message: failedSession.error,
        });
      }

      if (batchResult.synced.length > 0) {
        await triggerIntelligence(batchResult.synced).catch((error: Error) => {
          console.error(error);
        });
      }
    }

    const overLimit = (await getPendingSessions()).filter((session) => session.sync_attempts >= MAX_RETRIES);

    for (const session of overLimit) {
      await markSessionFailed(session.offline_id, session.error_message ?? 'Max retries exceeded');
    }

    if (result.synced > 0) {
      lastSyncAt = new Date().toISOString();
    }

    const finalState =
      result.failed > 0
        ? 'queued'
        : result.synced > 0
          ? 'synced'
          : 'idle';
    const finalMessage =
      result.failed > 0
        ? 'Some sessions need another sync attempt.'
        : result.synced > 0
          ? 'Offline sessions are synced.'
          : 'No offline sessions are waiting to sync.';

    await dispatchSyncStatus(finalState, finalMessage);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent<SyncResult>(COMPLETE_EVENT_NAME, {
          detail: result,
        }),
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown sync error';
    result.errors.push({
      code: 'SYNC_ENGINE_ERROR',
      message,
    });

    await dispatchSyncStatus('error', message);
  } finally {
    isSyncing = false;
  }

  return result;
}

async function syncBatch(sessions: QueuedSession[]): Promise<BatchResult> {
  const sessionsTable = createSessionsTableClient();
  const synced: string[] = [];
  const failed: { offline_id: string; error: string }[] = [];

  for (const session of sessions) {
    try {
      await incrementSyncAttempt(session.offline_id);
      await appendSyncLog(session.offline_id, 'syncing');

      const { queued_at, last_attempt_at, error_message, ...sessionData } = session;
      const { data, error } = await sessionsTable
        .upsert(
          {
            ...sessionData,
            skill_ratings: sessionData.skill_ratings as Record<string, string>,
            synced: true,
            synced_at: new Date().toISOString(),
          },
          { onConflict: 'offline_id' },
        )
        .select('id')
        .single();

      if (error) {
        throw new Error(error.message);
      }

      if (!data) {
        throw new Error('No data returned from upsert');
      }

      await markSessionSynced(session.offline_id, data.id);
      synced.push(data.id);
    } catch (err) {
      const baseMessage = err instanceof Error ? err.message : 'Unknown sync error';
      const nextAttempt = session.sync_attempts + 1;
      const retryDelay = calculateBackoff(nextAttempt);
      const surfacedMessage =
        nextAttempt >= MAX_RETRIES ? baseMessage : `${baseMessage} Retrying in ${retryDelay}ms.`;

      failed.push({ offline_id: session.offline_id, error: surfacedMessage });

      if (nextAttempt >= MAX_RETRIES) {
        await markSessionFailed(session.offline_id, baseMessage);
      } else {
        await recordSyncFailure(session.offline_id, baseMessage);
        await appendSyncLog(session.offline_id, 'failed', baseMessage);
      }
    }
  }

  return { synced, failed };
}

async function triggerIntelligence(sessionIds: string[]): Promise<void> {
  const supabase = createBrowserClient();
  const functionsClient = supabase.functions as FunctionsClient;
  const { error } = await functionsClient.invoke('gap-detector', {
    body: { session_ids: sessionIds },
  });

  if (error) {
    throw new Error(error.message);
  }
}

export function registerBackgroundSync(): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('SyncManager' in window)) {
    return;
  }

  void navigator.serviceWorker.ready
    .then((registration) => {
      const syncRegistration = registration as ServiceWorkerRegistration & {
        sync: {
          register(tag: string): Promise<void>;
        };
      };

      return syncRegistration.sync.register(BACKGROUND_SYNC_TAG);
    })
    .catch((error: Error) => {
      console.error(error);
    });
}

export async function forceSyncNow(): Promise<SyncResult> {
  return drainQueue();
}

export function getSyncingState(): boolean {
  return isSyncing;
}

export async function syncPendingSessions(): Promise<number> {
  const result = await drainQueue();
  return result.synced;
}

export async function requestBackgroundSync(): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('SyncManager' in window)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const syncRegistration = registration as ServiceWorkerRegistration & {
      sync: {
        register(tag: string): Promise<void>;
      };
    };

    await syncRegistration.sync.register(BACKGROUND_SYNC_TAG);
    return true;
  } catch {
    return false;
  }
}

export function subscribeToSyncStatus(
  callback: (snapshot: SyncStatusSnapshot) => void,
): () => void {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  const handler = (event: Event): void => {
    const customEvent = event as CustomEvent<SyncStatusSnapshot>;
    callback(customEvent.detail);
  };

  window.addEventListener(SYNC_EVENT_NAME, handler);

  return () => {
    window.removeEventListener(SYNC_EVENT_NAME, handler);
  };
}
