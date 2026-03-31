'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';

import { EmptyState } from '@/components/ui/EmptyState';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { getQueuedSessionByOfflineId } from '@/lib/db/sessions';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { formatDateTime } from '@/lib/utils/date';
import type { QueuedSessionRecord, SkillRating, Subject } from '@/types';

interface SessionRow {
  id: string;
  offline_id: string;
  student_id: string;
  mentor_id: string;
  session_date: string;
  subjects_covered: Subject[];
  skill_ratings: Partial<Record<Subject, SkillRating>>;
  note: string;
  raw_tags: string[];
  synced: boolean;
  synced_at: string | null;
  created_at: string;
}

interface SessionDetail {
  id: string;
  offlineId: string;
  sessionDate: string;
  durationMinutes: number;
  syncStatus: string;
  attendance: string;
  engagementLevel: number;
  confidenceDelta: number;
  notes: string;
  learningGaps: string[];
}

function mapSession(row: SessionRow): SessionDetail {
  return {
    id: row.id,
    offlineId: row.offline_id,
    sessionDate: row.session_date,
    durationMinutes: Math.max(20, row.subjects_covered.length * 20),
    syncStatus: row.synced ? 'synced' : 'pending sync',
    attendance: row.subjects_covered.length > 0 ? 'covered' : 'not recorded',
    engagementLevel: Math.max(1, Object.keys(row.skill_ratings).length),
    confidenceDelta: row.raw_tags.length,
    notes: row.note,
    learningGaps: row.raw_tags,
  };
}

function mapQueuedSession(row: QueuedSessionRecord): SessionDetail {
  return {
    id: row.id,
    offlineId: row.offlineId,
    sessionDate: row.sessionDate,
    durationMinutes: row.durationMinutes,
    syncStatus: row.syncStatus,
    attendance: row.attendance,
    engagementLevel: row.engagementLevel,
    confidenceDelta: row.confidenceDelta,
    notes: row.notes,
    learningGaps: row.learningGaps,
  };
}

export default function SessionDetailPage() {
  const params = useParams<{ id: string }>();

  const sessionQuery = useQuery({
    queryKey: ['session-detail', params.id],
    queryFn: async (): Promise<SessionDetail | null> => {
      try {
        const queuedSession = await getQueuedSessionByOfflineId(params.id);

        if (queuedSession) {
          return mapQueuedSession(queuedSession);
        }

        const supabase = getSupabaseBrowserClient();

        if (!supabase) {
          return null;
        }

        const { data, error } = await supabase
          .from('sessions')
          .select(
            'id,offline_id,student_id,mentor_id,session_date,subjects_covered,skill_ratings,note,raw_tags,synced,synced_at,created_at',
          )
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
