'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

import { PassportQR } from '@/components/passport/PassportQR';
import { PrintablePassport } from '@/components/passport/PrintablePassport';
import { RadarChart } from '@/components/passport/RadarChart';
import { SessionTimeline } from '@/components/passport/SessionTimeline';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { getVidyasetuDB } from '@/lib/db';
import { getSessionsByStudent } from '@/lib/db/sessions';
import { cacheStudents, getCachedStudent } from '@/lib/db/students';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { type GapProfile, type Mentor, type SessionRecord, type SkillRating, type Student, type Subject } from '@/types';

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

interface MentorRow {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  subjects: Subject[];
  availability: Record<string, [string, string]>;
  center_id: string;
  gender: string;
  session_count: number;
  avg_student_improvement: number;
  active_student_count: number;
  active: boolean;
  created_at: string;
}

interface GapHistoryRow {
  week_start: string;
  gap_profile: GapProfile;
}

interface CenterRow {
  id: string;
  name: string;
}

interface MentorCacheRow {
  id: string;
  fullName: string;
  phone: string;
  localities: string[];
  sessionsCompleted: number;
  teachingScore: number;
  createdAt: string;
}

interface StudentPassportData {
  student: Student;
  sessions: SessionRecord[];
  mentors: Mentor[];
  historical?: GapProfile;
  centerLabel: string;
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

function mapMentorRow(row: MentorRow): Mentor {
  return {
    ...row,
  };
}

function mapCachedMentorRow(row: MentorCacheRow): Mentor {
  return {
    id: row.id,
    user_id: row.id,
    name: row.fullName,
    phone: row.phone,
    subjects: ['math', 'reading', 'science', 'english', 'comprehension'],
    availability: {
      mon: ['09:00', '17:00'],
      tue: ['09:00', '17:00'],
      wed: ['09:00', '17:00'],
      thu: ['09:00', '17:00'],
      fri: ['09:00', '17:00'],
    },
    center_id: row.localities[0] ?? '',
    gender: 'other',
    session_count: row.sessionsCompleted,
    avg_student_improvement: Math.max(0, Math.min(1, row.teachingScore / 100)),
    active_student_count: 0,
    active: true,
    created_at: row.createdAt,
  };
}

function getRiskBadgeClass(riskColor: Student['risk_color']): string {
  if (riskColor === 'red') {
    return 'bg-red-700 text-white';
  }

  if (riskColor === 'amber') {
    return 'bg-amber-600 text-white';
  }

  return 'bg-green-700 text-white';
}

async function readCachedMentors(): Promise<Mentor[]> {
  try {
    const db = await getVidyasetuDB();
    const cachedMentors = await db.getAll('mentors');
    return (cachedMentors as MentorCacheRow[]).map(mapCachedMentorRow);
  } catch {
    return [];
  }
}

async function readLivePassportData(studentId: string): Promise<StudentPassportData | null> {
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
  const mentorsQuery = supabase.from('mentors') as unknown as {
    select(query: string): {
      order(
        column: string,
        options?: { ascending?: boolean },
      ): Promise<{ data: MentorRow[] | null; error: { message: string } | null }>;
    };
  };
  const historyQuery = supabase.from('gap_history') as unknown as {
    select(query: string): {
      eq(column: string, value: string): {
        order(
          column: string,
          options?: { ascending?: boolean },
        ): {
          limit(value: number): Promise<{ data: GapHistoryRow[] | null; error: { message: string } | null }>;
        };
      };
    };
  };
  const centersQuery = supabase.from('centers') as unknown as {
    select(query: string): {
      eq(column: string, value: string): {
        maybeSingle(): Promise<{ data: CenterRow | null; error: { message: string } | null }>;
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

  const student = mapStudentRow(studentRow);
  await cacheStudents([student]);

  const [sessionsResponse, mentorsResponse, historyResponse, centerResponse] = await Promise.all([
    sessionsQuery
      .select('id,offline_id,student_id,mentor_id,session_date,subjects_covered,skill_ratings,note,raw_tags,synced,synced_at,created_at')
      .eq('student_id', studentId)
      .order('session_date', { ascending: false }),
    mentorsQuery
      .select(
        'id,user_id,name,phone,subjects,availability,center_id,gender,session_count,avg_student_improvement,active_student_count,active,created_at',
      )
      .order('name'),
    historyQuery
      .select('week_start,gap_profile')
      .eq('student_id', studentId)
      .order('week_start', { ascending: false })
      .limit(8),
    centersQuery.select('id,name').eq('id', student.center_id).maybeSingle(),
  ]);

  if (sessionsResponse.error) {
    throw new Error(sessionsResponse.error.message);
  }

  if (mentorsResponse.error) {
    throw new Error(mentorsResponse.error.message);
  }

  if (historyResponse.error) {
    throw new Error(historyResponse.error.message);
  }

  if (centerResponse.error) {
    throw new Error(centerResponse.error.message);
  }

  const historyRows = historyResponse.data ?? [];
  const historical = historyRows.length > 0 ? historyRows[historyRows.length - 1]?.gap_profile : undefined;

  return {
    student,
    sessions: (sessionsResponse.data ?? []).map(mapSessionRow).slice(0, 10),
    mentors: (mentorsResponse.data ?? []).map(mapMentorRow),
    historical,
    centerLabel: centerResponse.data?.name ?? student.center_id,
  };
}

async function readOfflinePassportData(studentId: string): Promise<StudentPassportData | null> {
  const cachedStudent = await getCachedStudent(studentId);

  if (!cachedStudent) {
    return null;
  }

  const { cached_at, ...student } = cachedStudent;
  void cached_at;

  const [sessions, mentors] = await Promise.all([getSessionsByStudent(studentId), readCachedMentors()]);

  return {
    student,
    sessions: [...sessions]
      .sort((left, right) => new Date(right.session_date).getTime() - new Date(left.session_date).getTime())
      .slice(0, 10),
    mentors,
    centerLabel: student.center_id,
  };
}

function StudentPassportContent() {
  const params = useParams<{ id: string }>();
  const [passportData, setPassportData] = useState<StudentPassportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadPassport(): Promise<void> {
      try {
        setIsLoading(true);
        setError(null);

        const liveData = navigator.onLine ? await readLivePassportData(params.id) : null;
        const fallbackData = liveData ?? (await readOfflinePassportData(params.id));

        if (!fallbackData) {
          throw new Error('This student passport could not be loaded from Supabase or local cache.');
        }

        if (isMounted) {
          setPassportData(fallbackData);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError : new Error('Unable to load passport data.'));
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

  if (error) {
    throw error;
  }

  if (isLoading) {
    return <SkeletonCard />;
  }

  if (!passportData) {
    return (
      <EmptyState
        title="Passport unavailable"
        description="This student record could not be loaded from cache or Supabase."
      />
    );
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-emerald-700">Learning passport</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">{passportData.student.name}</h1>
          <p className="mt-2 text-sm text-slate-600">
            Grade {passportData.student.grade} | {passportData.centerLabel}
          </p>
        </div>
        <span
          className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] ${getRiskBadgeClass(passportData.student.risk_color)}`}
        >
          {passportData.student.risk_color} risk
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <RadarChart current={passportData.student.gap_profile} historical={passportData.historical} />
        <PassportQR student={passportData.student} />
      </div>

      <SessionTimeline sessions={passportData.sessions} mentors={passportData.mentors} />

      <PrintablePassport
        student={passportData.student}
        sessions={passportData.sessions}
        mentors={passportData.mentors}
        historical={passportData.historical}
        centerLabel={passportData.centerLabel}
      />
    </div>
  );
}

export default function StudentPassportPage() {
  return (
    <ErrorBoundary>
      <StudentPassportContent />
    </ErrorBoundary>
  );
}
