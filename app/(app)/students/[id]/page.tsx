'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';

import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { PrintablePassport } from '@/components/passport/PrintablePassport';
import { getQueuedSessions } from '@/lib/db/sessions';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/types';
import { scoreStudentRisk } from '@/lib/intelligence/riskScorer';
import { useStudent } from '@/hooks/useStudents';
import type { PassportSnapshot } from '@/types';

export default function StudentPassportPage() {
  const params = useParams<{ id: string }>();
  const studentQuery = useStudent(params.id);
  const passportQuery = useQuery({
    queryKey: ['student-passport', params.id, studentQuery.data?.id],
    queryFn: async (): Promise<PassportSnapshot | null> => {
      try {
        if (!studentQuery.data) {
          return null;
        }

        const student = studentQuery.data;
        const supabase = getSupabaseBrowserClient();

        if (!supabase) {
          const queuedSessions = (await getQueuedSessions()).filter(
            (session) => session.studentId === student.id,
          );
          const risk = scoreStudentRisk({
            student,
            sessions: queuedSessions,
            latestParentResponse: null,
          });

          return {
            student,
            risk,
            radar: [
              {
                subject: 'reading',
                baseline: student.baselineReadingLevel,
                current:
                  queuedSessions.reduce((sum, session) => sum + session.skillRatings.reading, 0) /
                    Math.max(queuedSessions.length, 1) || student.baselineReadingLevel,
              },
              {
                subject: 'comprehension',
                baseline: student.baselineReadingLevel,
                current:
                  queuedSessions.reduce((sum, session) => sum + session.skillRatings.comprehension, 0) /
                    Math.max(queuedSessions.length, 1) || student.baselineReadingLevel,
              },
              {
                subject: 'writing',
                baseline: student.baselineReadingLevel,
                current:
                  queuedSessions.reduce((sum, session) => sum + session.skillRatings.writing, 0) /
                    Math.max(queuedSessions.length, 1) || student.baselineReadingLevel,
              },
              {
                subject: 'arithmetic',
                baseline: student.baselineArithmeticLevel,
                current:
                  queuedSessions.reduce((sum, session) => sum + session.skillRatings.arithmetic, 0) /
                    Math.max(queuedSessions.length, 1) || student.baselineArithmeticLevel,
              },
              {
                subject: 'confidence',
                baseline: 3,
                current:
                  queuedSessions.reduce((sum, session) => sum + session.skillRatings.confidence, 0) /
                    Math.max(queuedSessions.length, 1) || 3,
              },
            ],
            timeline: queuedSessions.map((session) => ({
              id: session.id,
              sessionDate: session.sessionDate,
              notes: session.notes,
              attendance: session.attendance,
              learningGaps: session.learningGaps,
              scoreDelta: session.confidenceDelta,
            })),
            publicCode: student.id.slice(0, 8),
            qrValue:
              typeof window !== 'undefined'
                ? `${window.location.origin}/passport/${student.id.slice(0, 8)}`
                : student.id.slice(0, 8),
          };
        }

        const [sessionsResponse, riskResponse, shareResponse, messagesResponse] = await Promise.all([
          supabase.from('sessions').select('*').eq('student_id', studentQuery.data.id).order('session_date', {
            ascending: false,
          }),
          supabase
            .from('risk_snapshots')
            .select('*')
            .eq('student_id', studentQuery.data.id)
            .order('calculated_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase.from('passport_shares').select('*').eq('student_id', studentQuery.data.id).maybeSingle(),
          supabase
            .from('parent_messages')
            .select('*')
            .eq('student_id', studentQuery.data.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);

        if (sessionsResponse.error) {
          throw sessionsResponse.error;
        }

        if (riskResponse.error) {
          throw riskResponse.error;
        }

        if (shareResponse.error) {
          throw shareResponse.error;
        }

        if (messagesResponse.error) {
          throw messagesResponse.error;
        }

        const sessions = sessionsResponse.data ?? [];
        const latestParentResponse = messagesResponse.data?.response_code === 'H'
          ? 'H'
          : messagesResponse.data?.response_code === 'C'
            ? 'C'
            : null;
        const calculatedRisk = riskResponse.data
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
              sessions: sessions.map((session) => ({
                id: session.id,
                offlineId: session.offline_id,
                studentId: session.student_id,
                mentorId: session.mentor_id,
                templateId: session.template_id,
                sessionDate: session.session_date,
                startedAt: session.started_at,
                durationMinutes: session.duration_minutes,
                mode: session.mode as PassportSnapshot['timeline'][number]['attendance'] extends never
                  ? never
                  : 'offline',
                attendance: session.attendance as PassportSnapshot['timeline'][number]['attendance'],
                engagementLevel: session.engagement_level as 1 | 2 | 3 | 4 | 5,
                confidenceDelta: session.confidence_delta as -2 | -1 | 0 | 1 | 2,
                notes: session.notes,
                learningGaps: session.learning_gaps,
                skillRatings: session.skill_ratings as {
                  reading: 1 | 2 | 3 | 4 | 5;
                  comprehension: 1 | 2 | 3 | 4 | 5;
                  writing: 1 | 2 | 3 | 4 | 5;
                  arithmetic: 1 | 2 | 3 | 4 | 5;
                  confidence: 1 | 2 | 3 | 4 | 5;
                },
                syncStatus: 'synced',
                syncAttempts: 0,
                syncError: null,
                lastSyncedAt: session.updated_at,
                createdAt: session.created_at,
                updatedAt: session.updated_at,
              })),
              latestParentResponse,
            });

        const averageScore = (key: 'reading' | 'comprehension' | 'writing' | 'arithmetic' | 'confidence') =>
          sessions.length > 0
            ? sessions.reduce((sum, session) => {
                const ratings = session.skill_ratings as Record<string, number>;
                return sum + (ratings[key] ?? 0);
              }, 0) / sessions.length
            : key === 'arithmetic'
              ? student.baselineArithmeticLevel
              : student.baselineReadingLevel;

        const publicCode = shareResponse.data?.public_code ?? student.id.slice(0, 8);

        return {
          student,
          risk: calculatedRisk,
          radar: [
            {
              subject: 'reading',
              baseline: student.baselineReadingLevel,
              current: averageScore('reading'),
            },
            {
              subject: 'comprehension',
              baseline: student.baselineReadingLevel,
              current: averageScore('comprehension'),
            },
            {
              subject: 'writing',
              baseline: student.baselineReadingLevel,
              current: averageScore('writing'),
            },
            {
              subject: 'arithmetic',
              baseline: student.baselineArithmeticLevel,
              current: averageScore('arithmetic'),
            },
            {
              subject: 'confidence',
              baseline: 3,
              current: averageScore('confidence'),
            }
          ],
          timeline: sessions.map((session) => ({
            id: session.id,
            sessionDate: session.session_date,
            notes: session.notes,
            attendance: session.attendance as PassportSnapshot['timeline'][number]['attendance'],
            learningGaps: session.learning_gaps,
            scoreDelta: session.confidence_delta,
          })),
          publicCode,
          qrValue:
            typeof window !== 'undefined'
              ? `${window.location.origin}/passport/${publicCode}`
              : publicCode,
        };
      } catch (error) {
        return null;
      }
    },
    enabled: Boolean(studentQuery.data),
  });

  if (studentQuery.isLoading || passportQuery.isLoading) {
    return <SkeletonCard />;
  }

  if (!passportQuery.data) {
    return (
      <EmptyState
        title="Passport unavailable"
        description="This student record could not be loaded from cache or Supabase."
      />
    );
  }

  return (
    <div className="grid gap-6">
      <div>
        <p className="text-sm uppercase tracking-[0.24em] text-emerald-700">Learning passport</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">{passportQuery.data.student.fullName}</h1>
      </div>
      <PrintablePassport snapshot={passportQuery.data} />
    </div>
  );
}
