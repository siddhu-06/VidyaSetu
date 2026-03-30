import type { QueuedSessionRecord } from '@/types';

const DEFAULT_RETRY_BASE_MS = 15_000;
const MAX_RETRY_DELAY_MS = 10 * 60_000;

export function getRetryDelayMs(attempts: number, baseMs = DEFAULT_RETRY_BASE_MS): number {
  const retryDelay = baseMs * 2 ** attempts;
  return Math.min(retryDelay, MAX_RETRY_DELAY_MS);
}

export function nextRetryIso(attempts: number, now = new Date()): string {
  const retryAt = new Date(now.getTime() + getRetryDelayMs(attempts));
  return retryAt.toISOString();
}

export function isEligibleForRetry(record: QueuedSessionRecord, now = new Date()): boolean {
  if (record.syncStatus === 'queued') {
    return true;
  }

  if (record.syncStatus !== 'error') {
    return false;
  }

  if (!record.nextRetryAt) {
    return true;
  }

  return new Date(record.nextRetryAt).getTime() <= now.getTime();
}

export function sortQueue(records: QueuedSessionRecord[]): QueuedSessionRecord[] {
  return [...records].sort((left, right) => {
    const leftPriority = left.syncStatus === 'error' ? 1 : 0;
    const rightPriority = right.syncStatus === 'error' ? 1 : 0;

    if (leftPriority !== rightPriority) {
      return leftPriority - rightPriority;
    }

    return new Date(left.updatedAt).getTime() - new Date(right.updatedAt).getTime();
  });
}

