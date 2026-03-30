'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';

import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { PrintablePassport } from '@/components/passport/PrintablePassport';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { scoreStudentRisk } from '@/lib/intelligence/riskScorer';
import type { PassportSnapshot, SessionRecord, StudentRecord } from '@/types';

function mapStudentRecord(row: {
  id: string;
  full_name: string;
  preferred_name: string | null;
  age: number;
  grade: string;
  school_name: string | null;
  locality: string;
  migration_status: string;
  baseline_reading_level: number;
  baseline_arithmetic_level: number;
  attendance_rate: number;
  guardian_name: string;
  guardian_phone: string;
  preferred_language: string;
  sms_opt_in: boolean;
  last_session_at: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}): StudentRecord {
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

function mapSessionRecord(row: {
  id: string;
  offline_id: string;
  student_id: string;
  mentor_id: string;
  template_id: string | null;
  session_date: string;
  started_at: string | null;
  duration_minutes: number;
  mode: string;
  attendance: string;
  engagement_level: number;
  confidence_delta: number;
  notes: string;
  learning_gaps: string[];
  skill_ratings: Record<string, number>;
  created_at: string;
  updated_at: string;
}): SessionRecord {
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

export default function PublicPassportPage() {
  const params = useParams<{ id: string }>();

  const passportQuery = useQuery({
    queryKey: ['public-passport', params.id],
    queryFn: async (): Promise<PassportSnapshot | null> => {
      try {
        const supabase = getSupabaseBrowserClient();

        if (!supabase) {
          return null;
        }

        const { data: share, error: shareError } = await supabase
          .from('passport_shares')
          .select('*')
          .or(`public_code.eq.${params.id},student_id.eq.${params.id}`)
          .maybeSingle();

        if (shareError) {
          throw shareError;
        }

        if (!share) {
          return null;
        }

        const [studentResponse, sessionsResponse, riskResponse] = await Promise.all([
          supabase.from('students').select('*').eq('id', share.student_id).maybeSingle(),
          supabase.from('sessions').select('*').eq('student_id', share.student_id).order('session_date', {
            ascending: false,
          }),
          supabase
            .from('risk_snapshots')
            .select('*')
            .eq('student_id', share.student_id)
            .order('calculated_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);

        if (studentResponse.error) {
          throw studentResponse.error;
        }

        if (sessionsResponse.error) {
          throw sessionsResponse.error;
        }

        if (riskResponse.error) {
          throw riskResponse.error;
        }

        if (!studentResponse.data) {
          return null;
        }

        const student = mapStudentRecord(studentResponse.data);
        const sessions = (sessionsResponse.data ?? []).map((session) =>
          mapSessionRecord({
            ...session,
            skill_ratings: session.skill_ratings as Record<string, number>,
          }),
        );
        const averageScore = (key: keyof SessionRecord['skillRatings']) =>
          sessions.length > 0
            ? sessions.reduce((sum, session) => sum + session.skillRatings[key], 0) / sessions.length
            : key === 'arithmetic'
              ? student.baselineArithmeticLevel
              : key === 'confidence'
                ? 3
                : student.baselineReadingLevel;
        const risk = riskResponse.data
          ? {
              studentId: student.id,
              score: riskResponse.data.risk_score,
              level: riskResponse.data.risk_level as PassportSnapshot['risk'] extends infer R
                ? R extends { level: infer L }
                  ? L
                  : never
                : never,
              reasonCodes: riskResponse.data.reason_codes,
              headline: `Latest risk snapshot recorded at ${riskResponse.data.calculated_at}.`,
            }
          : scoreStudentRisk({
              student,
              sessions,
              latestParentResponse: null,
            });

        return {
          student,
          risk,
          radar: [
            { subject: 'reading', baseline: student.baselineReadingLevel, current: averageScore('reading') },
            { subject: 'comprehension', baseline: student.baselineReadingLevel, current: averageScore('comprehension') },
            { subject: 'writing', baseline: student.baselineReadingLevel, current: averageScore('writing') },
            { subject: 'arithmetic', baseline: student.baselineArithmeticLevel, current: averageScore('arithmetic') },
            { subject: 'confidence', baseline: 3, current: averageScore('confidence') }
          ],
          timeline: sessions.map((session) => ({
            id: session.id,
            sessionDate: session.sessionDate,
            notes: session.notes,
            attendance: session.attendance,
            learningGaps: session.learningGaps,
            scoreDelta: session.confidenceDelta,
          })),
          publicCode: share.public_code,
          qrValue:
            typeof window !== 'undefined'
              ? `${window.location.origin}/passport/${share.public_code}`
              : share.public_code,
        };
      } catch (error) {
        return null;
      }
    },
    enabled: Boolean(params.id),
  });

  if (passportQuery.isLoading) {
    return <SkeletonCard />;
  }

  if (!passportQuery.data) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto max-w-4xl">
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
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">{passportQuery.data.student.fullName}</h1>
        </div>
        <PrintablePassport snapshot={passportQuery.data} />
      </div>
    </div>
  );
}

