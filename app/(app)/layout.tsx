import type { ReactNode } from 'react';

import { AppNav } from '@/components/layout/AppNav';
import { OfflineBanner } from '@/components/layout/OfflineBanner';
import { SyncStatusBadge } from '@/components/layout/SyncStatusBadge';

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.16),_transparent_28%),linear-gradient(180deg,_#f8fafc,_#eef2ff)]">
      <div className="mx-auto grid min-h-screen max-w-7xl gap-6 px-4 py-4 lg:grid-cols-[280px_1fr]">
        <aside className="lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)]">
          <AppNav />
        </aside>
        <main className="grid gap-4">
          <OfflineBanner />
          <div className="flex justify-end">
            <SyncStatusBadge />
          </div>
          <section>{children}</section>
        </main>
      </div>
    </div>
  );
}

