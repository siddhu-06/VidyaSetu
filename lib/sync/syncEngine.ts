'use client';

import { getQueueMetrics, getQueuedSessions, removeQueuedSession, updateQueuedSession } from '@/lib/db/sessions';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/types';
import { detectSessionConflict } from '@/lib/sync/conflicts';
import { isEligibleForRetry, nextRetryIso, sortQueue } from '@/lib/sync/queue';
import type { QueuedSessionRecord, SyncStatusSnapshot } from '@/types';

const SYNC_EVENT_NAME = 'vidyasetu:sync-status';
const BACKGROUND_SYNC_TAG = 'vidyasetu-sync-sessions';

function dispatchSyncStatus(snapshot: SyncStatusSnapshot): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new CustomEvent<SyncStatusSnapshot>(SYNC_EVENT_NAME, { detail: snapshot }));
}

async function updateSnapshot(
  state: SyncStatusSnapshot['state'],
  message: string,
  lastSyncedAt: string | null,
): Promise<void> {
  const queueMetrics = await getQueueMetrics();

  dispatchSyncStatus({
    state,
    queueMetrics,
    lastSyncedAt,
    message,
  });
}

function serializeQueuedSession(
  record: QueuedSessionRecord,
): Database['public']['Tables']['sessions']['Insert'] {
  return {
    offline_id: record.offlineId,
    student_id: record.studentId,
    mentor_id: record.mentorId,
    template_id: record.templateId,
    session_date: record.sessionDate,
    started_at: record.startedAt,
    duration_minutes: record.durationMinutes,
    mode: record.mode,
    attendance: record.attendance,
    engagement_level: record.engagementLevel,
    confidence_delta: record.confidenceDelta,
    notes: record.notes,
    learning_gaps: record.learningGaps,
    skill_ratings: record.skillRatings,
    sync_source: 'device',
  };
}

function mapRemoteSession(
  record: QueuedSessionRecord,
  row: Database['public']['Tables']['sessions']['Row'],
): QueuedSessionRecord {
  return {
    id: row.id,
    offlineId: row.offline_id,
    studentId: row.student_id,
    mentorId: row.mentor_id,
    templateId: row.template_id,
    sessionDate: row.session_date,
    startedAt: row.started_at,
    durationMinutes: row.duration_minutes,
    mode: row.mode as QueuedSessionRecord['mode'],
    attendance: row.attendance as QueuedSessionRecord['attendance'],
    engagementLevel: row.engagement_level as QueuedSessionRecord['engagementLevel'],
    confidenceDelta: row.confidence_delta as QueuedSessionRecord['confidenceDelta'],
    notes: row.notes,
    learningGaps: row.learning_gaps,
    skillRatings: row.skill_ratings as QueuedSessionRecord['skillRatings'],
    syncStatus: 'synced',
    syncAttempts: record.syncAttempts,
    syncError: null,
    lastSyncedAt: row.updated_at,
    nextRetryAt: null,
    serverId: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

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
