'use client';

import { useEffect, useState } from 'react';

import { getQueueMetrics } from '@/lib/db/sessions';
import { subscribeToSyncStatus, syncPendingSessions } from '@/lib/sync/syncEngine';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import type { SyncStatusSnapshot } from '@/types';

const defaultSyncSnapshot: SyncStatusSnapshot = {
  state: 'idle',
  queueMetrics: {
    queued: 0,
    syncing: 0,
    failed: 0,
  },
  lastSyncedAt: null,
  message: 'Ready to capture sessions offline.',
};

export function useSyncStatus(): SyncStatusSnapshot & { syncNow: () => Promise<number> } {
  const isOnline = useOnlineStatus();
  const [snapshot, setSnapshot] = useState<SyncStatusSnapshot>(defaultSyncSnapshot);

  useEffect(() => {
    let isMounted = true;

    async function loadQueueMetrics(): Promise<void> {
      try {
        const queueMetrics = await getQueueMetrics();

        if (!isMounted) {
          return;
        }

        setSnapshot((currentSnapshot) => ({
          ...currentSnapshot,
          state: isOnline ? currentSnapshot.state : 'offline',
          queueMetrics,
          message: isOnline
            ? currentSnapshot.message
            : 'You are offline. New sessions will be stored safely on this device.',
        }));
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setSnapshot((currentSnapshot) => ({
          ...currentSnapshot,
          state: 'error',
          message: error instanceof Error ? error.message : 'Unable to read the offline queue.',
        }));
      }
    }

    void loadQueueMetrics();

    const unsubscribe = subscribeToSyncStatus((nextSnapshot) => {
      if (isMounted) {
        setSnapshot(nextSnapshot);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [isOnline]);

  async function syncNow(): Promise<number> {
    try {
      return await syncPendingSessions();
    } catch (error) {
      setSnapshot((currentSnapshot) => ({
        ...currentSnapshot,
        state: 'error',
        message: error instanceof Error ? error.message : 'Unable to start sync.',
      }));
      return 0;
    }
  }

  return {
    ...snapshot,
    syncNow,
  };
}

