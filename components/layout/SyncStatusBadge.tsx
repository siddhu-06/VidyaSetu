'use client';

import { useEffect } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useSyncStatus } from '@/hooks/useSyncStatus';
import { useAppStore } from '@/store';

function getTone(state: ReturnType<typeof useSyncStatus>['state']): 'neutral' | 'success' | 'warning' | 'danger' | 'info' {
  switch (state) {
    case 'synced':
      return 'success';
    case 'syncing':
      return 'info';
    case 'queued':
    case 'offline':
      return 'warning';
    case 'error':
      return 'danger';
    default:
      return 'neutral';
  }
}

export function SyncStatusBadge() {
  const syncSnapshot = useSyncStatus();
  const setSyncSnapshot = useAppStore((state) => state.setSyncSnapshot);

  useEffect(() => {
    setSyncSnapshot(syncSnapshot);
  }, [setSyncSnapshot, syncSnapshot]);

  return (
    <div className="flex flex-col items-start gap-2 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm">
      <div className="flex items-center gap-3">
        <Badge tone={getTone(syncSnapshot.state)}>{syncSnapshot.state}</Badge>
        <span className="text-sm text-slate-600">{syncSnapshot.message}</span>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
        <span>Queued: {syncSnapshot.queueMetrics.queued}</span>
        <span>Retry: {syncSnapshot.queueMetrics.failed}</span>
        <span>Last sync: {syncSnapshot.lastSyncedAt ? new Date(syncSnapshot.lastSyncedAt).toLocaleTimeString() : 'Not yet'}</span>
      </div>
      <Button size="sm" variant="secondary" onClick={() => void syncSnapshot.syncNow()}>
        Sync now
      </Button>
    </div>
  );
}

