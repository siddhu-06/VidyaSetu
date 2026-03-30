'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { AppI18nProvider } from '@/i18n/config';
import { syncPendingSessions } from '@/lib/sync/syncEngine';

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      return;
    }

    navigator.serviceWorker.register('/sw.js').catch(() => undefined);

    const handleMessage = (event: MessageEvent<{ type?: string }>): void => {
      if (event.data?.type === 'VIDYASETU_SYNC_REQUEST') {
        void syncPendingSessions();
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AppI18nProvider>
        <ErrorBoundary>{children}</ErrorBoundary>
      </AppI18nProvider>
    </QueryClientProvider>
  );
}
