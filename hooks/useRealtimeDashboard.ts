'use client';

import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { getVidyasetuDB } from '@/lib/db';
import { getQueuedSessions } from '@/lib/db/sessions';
import { getCachedStudentRecords } from '@/lib/db/students';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/types';
import { isSameWeek } from '@/lib/utils/date';
import type {
  DashboardHeatmapCell,
  LegacyDashboardStats as DashboardStats,
  DashboardPulsePoint,
  LeaderboardEntry,
  MentorRecord,
  StudentRecord,
} from '@/types';

export interface RealtimeDashboardSnapshot {
  stats: DashboardStats;
  heatmap: DashboardHeatmapCell[];
  pulse: DashboardPulsePoint[];
  leaderboard: LeaderboardEntry[];
}

function mapStudent(row: Database['public']['Tables']['students']['Row']): StudentRecord {
  return {
    id: row.id,
    fullName: row.full_name,
    preferredName: row.preferred_name,
    age: row.age,
    grade: row.grade,
    schoolName: row.school_name,
    locality: row.locality,
    migrationStatus: row.migration_status as StudentRecord['migrationStatus'],
    baselineReadingLevel: row.baseline_reading_level as StudentRecord['baselineReadingLevel'],
    baselineArithmeticLevel: row.baseline_arithmetic_level as StudentRecord['baselineArithmeticLevel'],
    attendanceRate: row.attendance_rate,
    lastSessionAt: row.last_session_at,
    active: row.active,
    parentContact: {
      guardianName: row.guardian_name,
      phone: row.guardian_phone,
      preferredLanguage: row.preferred_language as StudentRecord['parentContact']['preferredLanguage'],
      smsOptIn: row.sms_opt_in,
    },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapMentor(row: Database['public']['Tables']['mentors']['Row']): MentorRecord {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    languages: row.languages as MentorRecord['languages'],
    focusGrades: row.focus_grades,
    localities: row.localities,
    weeklyCapacity: row.weekly_capacity,
    sessionsCompleted: row.sessions_completed,
    consistencyScore: row.consistency_score,
    empathyScore: row.empathy_score,
    teachingScore: row.teaching_score,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function buildSnapshot(
  students: StudentRecord[],
  mentors: MentorRecord[],
  sessions: Database['public']['Tables']['sessions']['Row'][],
  risks: Database['public']['Tables']['risk_snapshots']['Row'][],
  parentMessages: Database['public']['Tables']['parent_messages']['Row'][],
): RealtimeDashboardSnapshot {
  const now = new Date();
  const activeStudents = students.filter((student) => student.active);
  const recentSessions = sessions.filter((session) => isSameWeek(session.session_date, now));
  const highRiskStudents = risks.filter(
    (risk) => risk.risk_level === 'high' || risk.risk_level === 'critical',
  ).length;
  const averageAttendance =
    activeStudents.length > 0
      ? Math.round(
          activeStudents.reduce((sum, student) => sum + student.attendanceRate, 0) / activeStudents.length,
        )
      : 0;

  const heatmapMap = activeStudents.reduce<Record<string, DashboardHeatmapCell>>((accumulator, student) => {
    const riskCount = risks.filter((risk) => risk.student_id === student.id).length;
    const key = `${student.locality}-${student.grade}`;

    if (!accumulator[key]) {
      accumulator[key] = {
        locality: student.locality,
        grade: student.grade,
        riskCount: 0,
        totalStudents: 0,
        intensity: 0,
      };
    }

    accumulator[key].totalStudents += 1;
    accumulator[key].riskCount += riskCount > 0 ? 1 : 0;
    accumulator[key].intensity = Math.round(
      (accumulator[key].riskCount / accumulator[key].totalStudents) * 100,
    );

    return accumulator;
  }, {});

  const pulse = Array.from({ length: 6 }).map((_, index) => {
    const weekSessions = sessions.filter((session) => {
      const sessionDate = new Date(session.session_date);
      const start = new Date();
      start.setDate(now.getDate() - (5 - index) * 7);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);

      return sessionDate >= start && sessionDate <= end;
    });

    const attendanceRate =
      weekSessions.length > 0
        ? Math.round(
            (weekSessions.filter((session) => session.attendance === 'present').length / weekSessions.length) * 100,
          )
        : 0;
    const readingIndex =
      weekSessions.length > 0
        ? Math.round(
            weekSessions.reduce((sum, session) => {
              const ratings = session.skill_ratings as Record<string, number>;
              return sum + (ratings.reading ?? 0);
            }, 0) / weekSessions.length,
          ) * 20
        : 0;
    const arithmeticIndex =
      weekSessions.length > 0
        ? Math.round(
            weekSessions.reduce((sum, session) => {
              const ratings = session.skill_ratings as Record<string, number>;
              return sum + (ratings.arithmetic ?? 0);
            }, 0) / weekSessions.length,
          ) * 20
        : 0;

    return {
      label: `Week ${index + 1}`,
      wellbeingIndex: Math.round((attendanceRate + readingIndex + arithmeticIndex) / 3),
      readingIndex,
      arithmeticIndex,
      attendanceRate,
    };
  });

  const leaderboard = mentors
    .map((mentor) => {
      const mentorSessions = sessions.filter((session) => session.mentor_id === mentor.id);
      const averageStudentGrowth =
        mentorSessions.length > 0
          ? Math.round(
              mentorSessions.reduce((sum, session) => sum + session.confidence_delta + session.engagement_level, 0) /
                mentorSessions.length /
                2.5 *
                20,
            )
          : 0;

      return {
        mentorId: mentor.id,
        mentorName: mentor.fullName,
        rank: 0,
        sessionsCompleted: mentorSessions.length,
        consistencyScore: mentor.consistencyScore,
        averageStudentGrowth,
        badgeLabel: averageStudentGrowth >= 70 ? 'Growth Champion' : 'Steady Guide',
      };
    })
    .sort((left, right) => {
      const leftScore = left.sessionsCompleted + left.consistencyScore + left.averageStudentGrowth;
      const rightScore = right.sessionsCompleted + right.consistencyScore + right.averageStudentGrowth;
      return rightScore - leftScore;
    })
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));

  return {
    stats: {
      activeStudents: activeStudents.length,
      activeMentors: mentors.length,
      sessionsThisWeek: recentSessions.length,
      highRiskStudents,
      parentResponses: parentMessages.filter((message) => message.response_code !== null).length,
      averageAttendance,
    },
    heatmap: Object.values(heatmapMap),
    pulse,
    leaderboard,
  };
}

async function loadCachedDashboard(): Promise<RealtimeDashboardSnapshot> {
  const db = await getVidyasetuDB();
  const [students, mentors, queuedSessions] = await Promise.all([
    getCachedStudentRecords(),
    db.getAll('mentors'),
    getQueuedSessions(),
  ]);

  const sessionRows = queuedSessions.map((session) => ({
    id: session.id,
    offline_id: session.offlineId,
    student_id: session.studentId,
    mentor_id: session.mentorId,
    template_id: session.templateId,
    session_date: session.sessionDate,
    started_at: session.startedAt,
    duration_minutes: session.durationMinutes,
    mode: session.mode,
    attendance: session.attendance,
    engagement_level: session.engagementLevel,
    confidence_delta: session.confidenceDelta,
    notes: session.notes,
    learning_gaps: session.learningGaps,
    skill_ratings: session.skillRatings,
    sync_source: 'device',
    created_at: session.createdAt,
    updated_at: session.updatedAt,
  }));

  return buildSnapshot(students, mentors, sessionRows, [], []);
}

async function fetchRealtimeDashboard(): Promise<RealtimeDashboardSnapshot> {
  const supabase = getSupabaseBrowserClient();

  if (!supabase) {
    return loadCachedDashboard();
  }

  try {
    const [studentsResponse, mentorsResponse, sessionsResponse, risksResponse, parentMessagesResponse] =
      await Promise.all([
        supabase.from('students').select('*').eq('active', true),
        supabase.from('mentors').select('*'),
        supabase.from('sessions').select('*'),
        supabase.from('risk_snapshots').select('*'),
        supabase.from('parent_messages').select('*'),
      ]);

    if (studentsResponse.error) {
      throw studentsResponse.error;
    }

    if (mentorsResponse.error) {
      throw mentorsResponse.error;
    }

    if (sessionsResponse.error) {
      throw sessionsResponse.error;
    }

    if (risksResponse.error) {
      throw risksResponse.error;
    }

    if (parentMessagesResponse.error) {
      throw parentMessagesResponse.error;
    }

    return buildSnapshot(
      (studentsResponse.data ?? []).map(mapStudent),
      (mentorsResponse.data ?? []).map(mapMentor),
      sessionsResponse.data ?? [],
      risksResponse.data ?? [],
      parentMessagesResponse.data ?? [],
    );
  } catch (error) {
    return loadCachedDashboard();
  }
}

export function useRealtimeDashboard() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      return;
    }

    const channel = supabase
      .channel('vidyasetu-dashboard')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sessions' },
        () => {
          void queryClient.invalidateQueries({ queryKey: ['dashboard-realtime'] });
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'risk_snapshots' },
        () => {
          void queryClient.invalidateQueries({ queryKey: ['dashboard-realtime'] });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ['dashboard-realtime'],
    queryFn: fetchRealtimeDashboard,
  });
}
