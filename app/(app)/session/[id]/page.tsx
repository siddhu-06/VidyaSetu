'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';

import { EmptyState } from '@/components/ui/EmptyState';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { getQueuedSessionByOfflineId } from '@/lib/db/sessions';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/types';
import { formatDateTime } from '@/lib/utils/date';
import type { LegacySessionRecord as SessionRecord } from '@/types';

function mapSession(row: Database['public']['Tables']['sessions']['Row']): SessionRecord {
  return {
    id: row.id,
    offlineId: row.offline_id,
    studentId: row.student_id,
    mentorId: row.mentor_id,
    templateId: row.template_id,
    sessionDate: row.session_date,
    startedAt: row.started_at,
    durationMinutes: row.duration_minutes,
    mode: row.mode as SessionRecord['mode'],
    attendance: row.attendance as SessionRecord['attendance'],
    engagementLevel: row.engagement_level as SessionRecord['engagementLevel'],
    confidenceDelta: row.confidence_delta as SessionRecord['confidenceDelta'],
    notes: row.notes,
    learningGaps: row.learning_gaps,
    skillRatings: row.skill_ratings as SessionRecord['skillRatings'],
    syncStatus: 'synced',
    syncAttempts: 0,
    syncError: null,
    lastSyncedAt: row.updated_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export default function SessionDetailPage() {
  const params = useParams<{ id: string }>();

  const sessionQuery = useQuery({
    queryKey: ['session-detail', params.id],
    queryFn: async (): Promise<SessionRecord | null> => {
      try {
        const queuedSession = await getQueuedSessionByOfflineId(params.id);

        if (queuedSession) {
          return queuedSession;
        }

        const supabase = getSupabaseBrowserClient();

        if (!supabase) {
          return null;
        }

        const { data, error } = await supabase
          .from('sessions')
          .select('*')
          .or(`id.eq.${params.id},offline_id.eq.${params.id}`)
          .maybeSingle();

        if (error) {
          throw error;
        }

        return data ? mapSession(data) : null;
      } catch (error) {
        return null;
      }
    },
    enabled: Boolean(params.id),
  });

  if (!sessionQuery.data) {
    return (
      <EmptyState
        title="Session not found"
        description="This session may still be syncing or may have been removed from the offline queue."
      />
    );
  }

  const session = sessionQuery.data;

  return (
    <div className="grid gap-6">
      <div>
        <p className="text-sm uppercase tracking-[0.24em] text-emerald-700">Session detail</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">{formatDateTime(session.sessionDate)}</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Session summary</CardTitle>
          <CardDescription>
            Offline ID {session.offlineId} · {session.durationMinutes} minutes · {session.syncStatus}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Attendance</p>
              <p className="mt-1 font-semibold text-slate-900">{session.attendance}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Engagement</p>
              <p className="mt-1 font-semibold text-slate-900">{session.engagementLevel}/5</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Confidence change</p>
              <p className="mt-1 font-semibold text-slate-900">{session.confidenceDelta}</p>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-semibold text-slate-900">Notes</p>
            <p className="mt-2 text-sm text-slate-600">{session.notes}</p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-900">Detected learning gaps</p>
            <p className="mt-2 text-sm text-amber-800">{session.learningGaps.join(' • ') || 'No gaps flagged'}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
