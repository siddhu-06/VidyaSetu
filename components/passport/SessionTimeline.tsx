import { useMemo } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatDate } from '@/lib/utils/date';
import { SUBJECT_LABELS, type Mentor, type SessionRecord } from '@/types';

interface SessionTimelineProps {
  sessions: SessionRecord[];
  mentors: Mentor[];
}

function truncateNote(note: string): string {
  const trimmedNote = note.trim();

  if (trimmedNote.length === 0) {
    return 'No note recorded.';
  }

  if (trimmedNote.length <= 80) {
    return trimmedNote;
  }

  return `${trimmedNote.slice(0, 80)}...`;
}

export function SessionTimeline({ sessions, mentors }: SessionTimelineProps) {
  const orderedSessions = useMemo(
    () =>
      [...sessions]
        .sort((left, right) => new Date(right.session_date).getTime() - new Date(left.session_date).getTime())
        .slice(0, 10),
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
    <Card>
      <CardHeader>
        <CardTitle>Session timeline</CardTitle>
        <CardDescription>The most recent ten tutoring sessions for this student.</CardDescription>
      </CardHeader>
      <CardContent>
        {orderedSessions.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
            No sessions recorded yet
          </p>
        ) : (
          <div className="space-y-4">
            {orderedSessions.map((session, index) => (
              <div key={session.id ?? session.offline_id} className="grid gap-3 md:grid-cols-[auto_1fr]">
                <div className="hidden md:flex md:flex-col md:items-center">
                  <span className="h-3 w-3 rounded-full bg-emerald-500" />
                  {index < orderedSessions.length - 1 ? <span className="mt-2 h-full w-px bg-slate-200" /> : null}
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{formatDate(session.session_date)}</p>
                      <p className="text-xs text-slate-500">
                        {mentorLookup[session.mentor_id] ?? 'Mentor unavailable'}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {session.subjects_covered.map((subject) => (
                        <span
                          key={`${session.offline_id}-${subject}`}
                          className="rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-800"
                        >
                          {SUBJECT_LABELS[subject]}
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-slate-700">{truncateNote(session.note)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
