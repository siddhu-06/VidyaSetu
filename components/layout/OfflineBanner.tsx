'use client';

import { Badge } from '@/components/ui/Badge';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

export function OfflineBanner() {
  const isOnline = useOnlineStatus();

  if (isOnline) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <div className="flex flex-wrap items-center gap-3">
        <Badge tone="warning">Offline mode</Badge>
        <p>Session logs will stay on this device and sync automatically when the network returns.</p>
      </div>
    </div>
  );
}

