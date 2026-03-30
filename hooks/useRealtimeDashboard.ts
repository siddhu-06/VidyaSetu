'use client';

import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { getVidyasetuDB } from '@/lib/db';
import { getCachedStudents } from '@/lib/db/students';
import { getPendingSessions } from '@/lib/db/sessions';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { DashboardStats, Mentor, SessionRecord, SkillRating, Student, Subject } from '@/types';

interface StudentRow {
  id: string;
  name: string;
  grade: 3 | 4 | 5 | 6;
  gender: 'M' | 'F' | 'other';
  center_id: string;
  assigned_mentor_id: string | null;
  gap_profile: Student['gap_profile'];
  risk_score: number;
  risk_color: Student['risk_color'];
  last_session_at: string | null;
  engagement_score: number;
  preferred_time_slot: string | null;
  parent_language: Student['parent_language'];
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

interface SmsLogRow {
  id: string;
  student_id: string;
  session_id: string;
  phone: string;
  message_body: string;
  twilio_sid: string;
  reply: string | null;
  sentiment: 1 | -1 | null;
  created_at: string;
}

interface CachedMentorRecord {
  id: string;
  fullName: string;
  phone: string;
  localities: string[];
  sessionsCompleted: number;
  teachingScore: number;
  createdAt: string;
}

export interface RealtimeDashboardSnapshot {
  stats: DashboardStats;
  students: Student[];
  mentors: Mentor[];
  recentSessions: SessionRecord[];
  sessions: SessionRecord[];
}

const defaultStats: DashboardStats = {
  totalStudents: 0,
  activeStudents: 0,
  activeMentors: 0,
  sessionsThisMonth: 0,
  avgRiskScore: 0,
  parentEngagementRate: 0,
  redCount: 0,
  amberCount: 0,
  greenCount: 0,
};

function startOfCurrentMonth(): Date {
  const date = new Date();
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function isCurrentMonth(value: string): boolean {
  return new Date(value).getTime() >= startOfCurrentMonth().getTime();
}

function isActiveStudent(student: Student): boolean {
  if (student.last_session_at) {
    const diffInDays = (Date.now() - new Date(student.last_session_at).getTime()) / (1000 * 60 * 60 * 24);
    return diffInDays <= 45;
  }

  return student.assigned_mentor_id !== null;
}

function stripCachedStudents(students: Awaited<ReturnType<typeof getCachedStudents>>): Student[] {
  return students.map(({ cached_at, ...student }) => {
    void cached_at;
    return student;
  });
}

function mapCachedMentor(record: CachedMentorRecord): Mentor {
  return {
    id: record.id,
    user_id: record.id,
    name: record.fullName,
    phone: record.phone,
    subjects: ['math', 'reading', 'science', 'english', 'comprehension'],
    availability: {
      mon: ['09:00', '17:00'],
      tue: ['09:00', '17:00'],
      wed: ['09:00', '17:00'],
      thu: ['09:00', '17:00'],
      fri: ['09:00', '17:00'],
    },
    center_id: record.localities[0] ?? '',
    gender: 'other',
    session_count: record.sessionsCompleted,
    avg_student_improvement: Math.max(0, Math.min(1, record.teachingScore / 100)),
    active_student_count: 0,
    active: true,
    created_at: record.createdAt,
  };
}

function buildSnapshot(
  students: Student[],
  mentors: Mentor[],
  sessions: SessionRecord[],
  smsLogs: SmsLogRow[],
): RealtimeDashboardSnapshot {
  const sortedSessions = [...sessions].sort(
    (left, right) => new Date(right.session_date).getTime() - new Date(left.session_date).getTime(),
  );
  const sessionsThisMonth = sortedSessions.filter((session) => isCurrentMonth(session.session_date));
  const mentorSessionCounts = sessionsThisMonth.reduce<Record<string, number>>((accumulator, session) => {
    accumulator[session.mentor_id] = (accumulator[session.mentor_id] ?? 0) + 1;
    return accumulator;
  }, {});
  const mentorStudentCounts = students.reduce<Record<string, number>>((accumulator, student) => {
    if (student.assigned_mentor_id) {
      accumulator[student.assigned_mentor_id] = (accumulator[student.assigned_mentor_id] ?? 0) + 1;
    }
    return accumulator;
  }, {});

  const normalizedMentors = mentors.map((mentor) => ({
    ...mentor,
    session_count: mentorSessionCounts[mentor.id] ?? 0,
    active_student_count: mentorStudentCounts[mentor.id] ?? mentor.active_student_count,
  }));

  const parentEngagementRate =
    smsLogs.length > 0
      ? smsLogs.filter((log) => log.reply !== null && log.reply.trim().length > 0).length / smsLogs.length
      : students.length > 0
        ? students.reduce((sum, student) => sum + student.engagement_score, 0) / students.length
        : 0;

  return {
    stats: {
      totalStudents: students.length,
      activeStudents: students.filter(isActiveStudent).length,
      activeMentors: normalizedMentors.filter((mentor) => mentor.active).length,
      sessionsThisMonth: sessionsThisMonth.length,
      avgRiskScore:
        students.length > 0
          ? students.reduce((sum, student) => sum + student.risk_score, 0) / students.length
          : 0,
      parentEngagementRate,
      redCount: students.filter((student) => student.risk_color === 'red').length,
      amberCount: students.filter((student) => student.risk_color === 'amber').length,
      greenCount: students.filter((student) => student.risk_color === 'green').length,
    },
    students,
    mentors: normalizedMentors,
    recentSessions: sortedSessions.slice(0, 10),
    sessions: sortedSessions,
  };
}

async function loadOfflineDashboard(): Promise<RealtimeDashboardSnapshot> {
  const db = await getVidyasetuDB();
  const [cachedStudents, cachedMentors, pendingSessions] = await Promise.all([
    getCachedStudents(),
    db.getAll('mentors'),
    getPendingSessions(),
  ]);

  return buildSnapshot(
    stripCachedStudents(cachedStudents),
    (cachedMentors as CachedMentorRecord[]).map(mapCachedMentor),
    pendingSessions,
    [],
  );
}

async function fetchDashboardSnapshot(): Promise<RealtimeDashboardSnapshot> {
  const supabase = getSupabaseBrowserClient();

  if (!supabase) {
    return loadOfflineDashboard();
  }

  const studentsQuery = supabase.from('students') as unknown as {
    select(query: string): {
      order(
        column: string,
        options?: { ascending?: boolean },
      ): Promise<{ data: StudentRow[] | null; error: { message: string } | null }>;
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
  const sessionsQuery = supabase.from('sessions') as unknown as {
    select(query: string): {
      order(
        column: string,
        options?: { ascending?: boolean },
      ): Promise<{ data: SessionRow[] | null; error: { message: string } | null }>;
    };
  };
  const smsLogQuery = supabase.from('sms_log') as unknown as {
    select(query: string): {
      order(
        column: string,
        options?: { ascending?: boolean },
      ): Promise<{ data: SmsLogRow[] | null; error: { message: string } | null }>;
    };
  };

  try {
    const [studentsResponse, mentorsResponse, sessionsResponse, smsLogResponse] = await Promise.all([
      studentsQuery
        .select(
          'id,name,grade,gender,center_id,assigned_mentor_id,gap_profile,risk_score,risk_color,last_session_at,engagement_score,preferred_time_slot,parent_language,created_at',
        )
        .order('name'),
      mentorsQuery
        .select(
          'id,user_id,name,phone,subjects,availability,center_id,gender,session_count,avg_student_improvement,active_student_count,active,created_at',
        )
        .order('name'),
      sessionsQuery
        .select('id,offline_id,student_id,mentor_id,session_date,subjects_covered,skill_ratings,note,raw_tags,synced,synced_at,created_at')
        .order('session_date', { ascending: false }),
      smsLogQuery
        .select('id,student_id,session_id,phone,message_body,twilio_sid,reply,sentiment,created_at')
        .order('created_at', { ascending: false }),
    ]);

    if (studentsResponse.error) {
      throw new Error(studentsResponse.error.message);
    }

    if (mentorsResponse.error) {
      throw new Error(mentorsResponse.error.message);
    }

    if (sessionsResponse.error) {
      throw new Error(sessionsResponse.error.message);
    }

    if (smsLogResponse.error) {
      throw new Error(smsLogResponse.error.message);
    }

    return buildSnapshot(
      studentsResponse.data ?? [],
      mentorsResponse.data ?? [],
      (sessionsResponse.data ?? []).map((session) => ({
        ...session,
        sync_attempts: 0,
        sync_failed: false,
      })),
      smsLogResponse.data ?? [],
    );
  } catch {
    return loadOfflineDashboard();
  }
}

interface StudentRealtimePayload {
  new: Partial<Student>;
  old: Partial<Student>;
}

export function useRealtimeDashboard() {
  const queryClient = useQueryClient();
  const [snapshot, setSnapshot] = useState<RealtimeDashboardSnapshot | null>(null);
  const dashboardQuery = useQuery({
    queryKey: ['dashboard-realtime'],
    queryFn: fetchDashboardSnapshot,
  });

  useEffect(() => {
    if (dashboardQuery.data) {
      setSnapshot(dashboardQuery.data);
    }
  }, [dashboardQuery.data]);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      return;
    }

    let timeoutId: number | null = null;

    async function refreshSnapshot(): Promise<void> {
      const nextSnapshot = await fetchDashboardSnapshot();
      setSnapshot(nextSnapshot);
      queryClient.setQueryData<RealtimeDashboardSnapshot>(['dashboard-realtime'], nextSnapshot);
    }

    function scheduleRefresh(): void {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }

      timeoutId = window.setTimeout(() => {
        void refreshSnapshot();
      }, 500);
    }

    const channel = supabase
      .channel('vidyasetu-dashboard')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sessions' }, () => {
        scheduleRefresh();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'students' }, (payload: StudentRealtimePayload) => {
        if (payload.new.risk_color !== payload.old.risk_color) {
          scheduleRefresh();
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sms_log' }, () => {
        scheduleRefresh();
      })
      .subscribe();

    return () => {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }

      void supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return {
    stats: snapshot?.stats ?? defaultStats,
    students: snapshot?.students ?? [],
    mentors: snapshot?.mentors ?? [],
    recentSessions: snapshot?.recentSessions ?? [],
    sessions: snapshot?.sessions ?? [],
    isLoading: dashboardQuery.isLoading && !snapshot,
    error: dashboardQuery.error,
  };
}
