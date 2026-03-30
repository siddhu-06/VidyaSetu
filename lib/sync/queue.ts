// lib/sync/queue.ts
// Retry queue helper — exponential backoff calculator and queue state manager.

const MAX_RETRIES = 5;
const BACKOFF_BASE_MS = 1000;

// Calculate exponential backoff delay. Capped at 30 seconds.
export function calculateBackoff(attempts: number): number {
  return Math.min(BACKOFF_BASE_MS * Math.pow(2, attempts), 30_000);
}

export { MAX_RETRIES };
