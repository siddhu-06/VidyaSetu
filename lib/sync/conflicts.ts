import type { QueuedSessionRecord, SessionRecord } from '@/types';

export interface SessionConflict {
  local: QueuedSessionRecord;
  remote: SessionRecord;
  reasons: string[];
}

export function detectSessionConflict(
  local: QueuedSessionRecord,
  remote: SessionRecord,
): SessionConflict | null {
  const reasons: string[] = [];

  if (local.updatedAt !== remote.updatedAt) {
    reasons.push('session_updated');
  }

  if (local.notes.trim() !== remote.notes.trim()) {
    reasons.push('notes_changed');
  }

  if (JSON.stringify(local.skillRatings) !== JSON.stringify(remote.skillRatings)) {
    reasons.push('ratings_changed');
  }

  if (reasons.length === 0) {
    return null;
  }

  return { local, remote, reasons };
}

export function resolveSessionConflict(conflict: SessionConflict): SessionRecord {
  const localUpdatedAt = new Date(conflict.local.updatedAt).getTime();
  const remoteUpdatedAt = new Date(conflict.remote.updatedAt).getTime();
  const preferLocal = localUpdatedAt >= remoteUpdatedAt;

  return {
    ...conflict.remote,
    ...conflict.local,
    id: conflict.remote.id,
    syncStatus: preferLocal ? 'queued' : 'synced',
    syncAttempts: preferLocal ? conflict.local.syncAttempts : conflict.remote.syncAttempts,
    syncError: preferLocal ? conflict.local.syncError : conflict.remote.syncError,
    lastSyncedAt: preferLocal ? conflict.local.lastSyncedAt : conflict.remote.lastSyncedAt,
    learningGaps: Array.from(new Set([...conflict.remote.learningGaps, ...conflict.local.learningGaps])),
    notes: preferLocal ? conflict.local.notes : conflict.remote.notes,
    skillRatings: preferLocal ? conflict.local.skillRatings : conflict.remote.skillRatings,
    updatedAt: preferLocal ? conflict.local.updatedAt : conflict.remote.updatedAt,
  };
}

