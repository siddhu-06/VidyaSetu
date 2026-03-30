'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queueSession as persistSession, getQueueMetrics, getQueuedSessions } from '@/lib/db/sessions';
import { detectLearningGaps } from '@/lib/intelligence/gapDetector';
import { requestBackgroundSync, syncPendingSessions } from '@/lib/sync/syncEngine';
import type { QueuedSessionRecord, QueueMetrics, SessionFormValues } from '@/types';

export function useSessionQueue(): {
  queue: QueuedSessionRecord[];
  queueMetrics: QueueMetrics;
  isLoading: boolean;
  addSessionToQueue: (payload: SessionFormValues) => Promise<QueuedSessionRecord>;
  isSaving: boolean;
} {
  const queryClient = useQueryClient();
  const queueQuery = useQuery({
    queryKey: ['session-queue'],
    queryFn: async (): Promise<QueuedSessionRecord[]> => {
      try {
        return await getQueuedSessions();
      } catch (error) {
        throw error;
      }
    },
  });

  const queueMetricsQuery = useQuery({
    queryKey: ['session-queue-metrics'],
    queryFn: async (): Promise<QueueMetrics> => {
      try {
        return await getQueueMetrics();
      } catch (error) {
        throw error;
      }
    },
  });

  const mutation = useMutation({
    mutationFn: async (payload: SessionFormValues): Promise<QueuedSessionRecord> => {
      try {
        const gapDetection = detectLearningGaps(payload.notes);
        const queuedSession = await persistSession(payload, gapDetection.gaps);

        if (typeof navigator !== 'undefined' && navigator.onLine) {
          await requestBackgroundSync();
          void syncPendingSessions();
        }

        return queuedSession;
      } catch (error) {
        throw error;
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['session-queue'] });
      await queryClient.invalidateQueries({ queryKey: ['session-queue-metrics'] });
    },
  });

  return {
    queue: queueQuery.data ?? [],
    queueMetrics: queueMetricsQuery.data ?? {
      queued: 0,
      syncing: 0,
      failed: 0,
    },
    isLoading: queueQuery.isLoading || queueMetricsQuery.isLoading,
    addSessionToQueue: mutation.mutateAsync,
    isSaving: mutation.isPending,
  };
}

