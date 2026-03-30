'use client';

import { useMemo } from 'react';

import { PassportQR } from '@/components/passport/PassportQR';
import { RadarChart } from '@/components/passport/RadarChart';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { formatDate } from '@/lib/utils/date';
import {
  SKILL_RATING_LABELS,
  SUBJECT_LABELS,
  type GapProfile,
  type Mentor,
  type SessionRecord,
  type Student,
} from '@/types';

interface PrintablePassportProps {
  student: Student;
  sessions: SessionRecord[];
  mentors: Mentor[];
  historical?: GapProfile;
  centerLabel?: string;
}

function buildRatingSummary(session: SessionRecord): string {
  const ratedSubjects = Object.entries(session.skill_ratings).filter(([, rating]) => rating);

  if (ratedSubjects.length === 0) {
    return 'No ratings recorded';
  }

  return ratedSubjects
    .map(([subject, rating]) => {
      const typedSubject = subject as keyof typeof SUBJECT_LABELS;
      return `${SUBJECT_LABELS[typedSubject]}: ${SKILL_RATING_LABELS[rating ?? 'not_covered']}`;
    })
    .join(', ');
}

export function PrintablePassport({
  student,
  sessions,
  mentors,
  historical,
  centerLabel,
}: PrintablePassportProps) {
  const recentSessions = useMemo(
    () =>
      [...sessions]
        .sort((left, right) => new Date(right.session_date).getTime() - new Date(left.session_date).getTime())
        .slice(0, 5),
    [sessions],
  );

  const mentorLookup = useMemo(
    () =>
      mentors.reduce<Record<string, string>>((accumulator, mentor) => {
        accumulator[mentor.id] = mentor.name;
        return accumulator;
      }, {}),
    [mentors],
  );

  return (
    <div className="grid gap-4">
      <style jsx global>{`
        @page {
          size: 148mm 210mm;
          margin: 10mm;
        }
      `}</style>

      <div className="flex justify-end print:hidden">
        <Button type="button" variant="secondary" onClick={() => window.print()}>
          Print Passport
        </Button>
      </div>

      <Card className="print:border-slate-300 print:shadow-none">
        <CardContent className="grid gap-6 px-6 py-6 print:px-0 print:py-0">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-emerald-700">VidyaSetu</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">Learning Passport</h2>
              <p className="mt-1 text-sm text-slate-600">Portable record for NGO tutoring continuity.</p>
            </div>
            <div className="grid gap-1 text-sm text-slate-700">
              <p>
                <span className="font-semibold">Student:</span> {student.name}
              </p>
              <p>
                <span className="font-semibold">Grade:</span> {student.grade}
              </p>
              <p>
                <span className="font-semibold">Center:</span> {centerLabel ?? student.center_id}
              </p>
              <p>
                <span className="font-semibold">Generated:</span> {formatDate(new Date())}
              </p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.45fr_0.9fr]">
            <RadarChart current={student.gap_profile} historical={historical} />
            <PassportQR student={student} size={120} />
          </div>

          <div className="grid gap-3">
            <h3 className="text-lg font-semibold text-slate-900">Last five sessions</h3>
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-left text-slate-600">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Date</th>
                    <th className="px-4 py-3 font-semibold">Subjects</th>
                    <th className="px-4 py-3 font-semibold">Rating summary</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                  {recentSessions.length === 0 ? (
                    <tr>
                      <td className="px-4 py-4 text-slate-500" colSpan={3}>
                        No sessions recorded yet.
                      </td>
                    </tr>
                  ) : (
                    recentSessions.map((session) => (
                      <tr key={session.id ?? session.offline_id}>
                        <td className="px-4 py-4 align-top">{formatDate(session.session_date)}</td>
                        <td className="px-4 py-4 align-top">
                          <div className="flex flex-wrap gap-2">
                            {session.subjects_covered.map((subject) => (
                              <span
                                key={`${session.offline_id}-${subject}`}
                                className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-800"
                              >
                                {SUBJECT_LABELS[subject]}
                              </span>
                            ))}
                          </div>
                          <p className="mt-2 text-xs text-slate-500">
                            {mentorLookup[session.mentor_id] ?? 'Mentor unavailable'}
                          </p>
                        </td>
                        <td className="px-4 py-4 align-top">{buildRatingSummary(session)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <p className="border-t border-slate-200 pt-4 text-xs text-slate-500">
            Generated on {formatDate(new Date())} for offline continuity and parent-facing handoff.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
