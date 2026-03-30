'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

import { PassportQR } from '@/components/passport/PassportQR';
import { RadarChart } from '@/components/passport/RadarChart';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { getSessionsByStudent } from '@/lib/db/sessions';
import { getCachedStudent } from '@/lib/db/students';
import { formatDate } from '@/lib/utils/date';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { SUBJECT_LABELS, type GapProfile, type SessionRecord, type SkillRating, type Student, type Subject } from '@/types';

interface StudentRow {
  id: string;
  name: string;
  grade: 3 | 4 | 5 | 6;
  gender: 'M' | 'F' | 'other';
  center_id: string;
  assigned_mentor_id: string | null;
  gap_profile: GapProfile;
  risk_score: number;
  risk_color: Student['risk_color'];
  last_session_at: string | null;
  engagement_score: number;
  preferred_time_slot: string | null;
  parent_language: Student['parent_language'];
  created_at: string;
}

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

interface PublicPassportData {
  student: Student;
  sessions: SessionRecord[];
}

function mapStudentRow(row: StudentRow): Student {
  return {
    ...row,
  };
}

function mapSessionRow(row: SessionRow): SessionRecord {
  return {
    ...row,
    id: row.id,
    sync_attempts: 0,
    sync_failed: false,
  };
}

function previewNote(note: string): string {
  const trimmedNote = note.trim();

  if (!trimmedNote) {
    return 'No note recorded.';
  }

  return trimmedNote.length > 100 ? `${trimmedNote.slice(0, 100)}...` : trimmedNote;
}

async function loadLivePublicPassport(studentId: string): Promise<PublicPassportData | null> {
  const supabase = getSupabaseBrowserClient();

  if (!supabase) {
    return null;
  }

  const studentQuery = supabase.from('students') as unknown as {
    select(query: string): {
      eq(column: string, value: string): {
        maybeSingle(): Promise<{ data: StudentRow | null; error: { message: string } | null }>;
      };
    };
  };
  const sessionsQuery = supabase.from('sessions') as unknown as {
    select(query: string): {
      eq(column: string, value: string): {
        order(
          column: string,
          options?: { ascending?: boolean },
        ): Promise<{ data: SessionRow[] | null; error: { message: string } | null }>;
      };
    };
  };

  const { data: studentRow, error: studentError } = await studentQuery
    .select(
      'id,name,grade,gender,center_id,assigned_mentor_id,gap_profile,risk_score,risk_color,last_session_at,engagement_score,preferred_time_slot,parent_language,created_at',
    )
    .eq('id', studentId)
    .maybeSingle();

  if (studentError) {
    throw new Error(studentError.message);
  }

  if (!studentRow) {
    return null;
  }

  const { data: sessionRows, error: sessionError } = await sessionsQuery
    .select('id,offline_id,student_id,mentor_id,session_date,subjects_covered,skill_ratings,note,raw_tags,synced,synced_at,created_at')
    .eq('student_id', studentId)
    .order('session_date', { ascending: false });

  if (sessionError) {
    throw new Error(sessionError.message);
  }

  return {
    student: mapStudentRow(studentRow),
    sessions: (sessionRows ?? []).map(mapSessionRow).slice(0, 3),
  };
}

async function loadOfflinePublicPassport(studentId: string): Promise<PublicPassportData | null> {
  const cachedStudent = await getCachedStudent(studentId);

  if (!cachedStudent) {
    return null;
  }

  const { cached_at, ...student } = cachedStudent;
  void cached_at;

  const queuedSessions = await getSessionsByStudent(studentId);

  return {
    student,
    sessions: [...queuedSessions]
      .sort((left, right) => new Date(right.session_date).getTime() - new Date(left.session_date).getTime())
      .slice(0, 3),
  };
}

export default function PublicPassportPage() {
  const params = useParams<{ id: string }>();
  const [passportData, setPassportData] = useState<PublicPassportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadPassport(): Promise<void> {
      try {
        setIsLoading(true);

        const liveData = navigator.onLine ? await loadLivePublicPassport(params.id) : null;
        const fallbackData = liveData ?? (await loadOfflinePublicPassport(params.id));

        if (isMounted) {
          setPassportData(fallbackData);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadPassport();

    return () => {
      isMounted = false;
    };
  }, [params.id]);

  if (isLoading) {
    return <SkeletonCard />;
  }

  if (!passportData) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto max-w-5xl">
          <EmptyState
            title="Passport link unavailable"
            description="This QR link may have expired or the student record is not public."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto grid max-w-5xl gap-6">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-emerald-700">Public learning passport</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">{passportData.student.name}</h1>
          <p className="mt-2 text-sm text-slate-600">Grade {passportData.student.grade}</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <RadarChart current={passportData.student.gap_profile} />
          <PassportQR student={passportData.student} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent sessions</CardTitle>
            <CardDescription>The last three learning touchpoints available on this passport.</CardDescription>
          </CardHeader>
          <CardContent>
            {passportData.sessions.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                No sessions recorded yet
              </p>
            ) : (
              <div className="space-y-4">
                {passportData.sessions.map((session) => (
                  <div key={session.id ?? session.offline_id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-900">{formatDate(session.session_date)}</p>
                      <div className="flex flex-wrap gap-2">
                        {session.subjects_covered.map((subject) => (
                          <span
                            key={`${session.offline_id}-${subject}`}
                            className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800"
                          >
                            {SUBJECT_LABELS[subject]}
                          </span>
                        ))}
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-slate-700">{previewNote(session.note)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
