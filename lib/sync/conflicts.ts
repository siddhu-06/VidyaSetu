// lib/sync/conflicts.ts
import type { QueuedSession, SessionRecord } from '@/types';

// Timestamp-wins conflict resolution.
// If offline_id already exists in Supabase:
//   - Compare created_at timestamps
//   - Keep the later one
//   - Log conflict resolution to sync_log
export function resolveConflict(
  local: QueuedSession,
  remote: Partial<SessionRecord>,
): SessionRecord {
  const localTime = new Date(local.created_at).getTime();
  const remoteTime = remote.created_at ? new Date(remote.created_at).getTime() : 0;

  if (localTime >= remoteTime) {
    const { queued_at, last_attempt_at, error_message, ...sessionRecord } = local;
    return sessionRecord;
  }

  return {
    ...local,
    ...remote,
  };
}
