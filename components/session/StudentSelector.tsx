'use client';

import { useEffect, useMemo, useState } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { getVidyasetuDB } from '@/lib/db';
import { cacheStudents, getCachedStudents } from '@/lib/db/students';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { SUBJECTS, SUBJECT_LABELS, type Student, type Subject } from '@/types';

interface StudentSelectorProps {
  value: string | null;
  onChange: (id: string) => void;
}

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

interface MentorNameRow {
  id: string;
  name: string;
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

function getGapDotClass(score: number): string {
  if (score >= 3.5) {
    return 'bg-red-600';
  }

  if (score >= 2) {
    return 'bg-amber-500';
  }

  return 'bg-lime-500';
}

async function readCachedMentorNames(): Promise<Record<string, string>> {
  try {
    const db = await getVidyasetuDB();
    const mentors = await db.getAll('mentors');

    return mentors.reduce<Record<string, string>>((accumulator, mentor) => {
      accumulator[mentor.id] = mentor.fullName;
      return accumulator;
    }, {});
  } catch {
    return {};
  }
}

async function fetchStudentsFromSupabase(): Promise<{
  students: Student[];
  mentorNames: Record<string, string>;
}> {
  const supabase = getSupabaseBrowserClient();

  if (!supabase) {
    return { students: [], mentorNames: {} };
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
      ): Promise<{ data: MentorNameRow[] | null; error: { message: string } | null }>;
    };
  };

  const { data: studentRows, error: studentError } = await studentsQuery
    .select(
      'id,name,grade,gender,center_id,assigned_mentor_id,gap_profile,risk_score,risk_color,last_session_at,engagement_score,preferred_time_slot,parent_language,created_at',
    )
    .order('name');

  if (studentError) {
    throw new Error(studentError.message);
  }

  const { data: mentorRows, error: mentorError } = await mentorsQuery.select('id,name').order('name');

  if (mentorError) {
    throw new Error(mentorError.message);
  }

  return {
    students: studentRows ?? [],
    mentorNames: (mentorRows ?? []).reduce<Record<string, string>>((accumulator, mentor) => {
      accumulator[mentor.id] = mentor.name;
      return accumulator;
    }, {}),
  };
}

/*
export function StudentSelector({
  students,
  value,
  onChange,
  isLoading = false,
}: StudentSelectorProps) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-slate-700">Student</span>
      <select
        className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-emerald-500"
        disabled={isLoading}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">{isLoading ? 'Loading students...' : 'Choose a student'}</option>
        {students.map((student) => (
          <option key={student.id} value={student.id}>
            {student.fullName} · Grade {student.grade} · {student.locality}
          </option>
        ))}
      </select>
    </label>
  );
}
*/

export function StudentSelector({ value, onChange }: StudentSelectorProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [mentorNames, setMentorNames] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadStudents(): Promise<void> {
      try {
        setIsLoading(true);
        setErrorMessage(null);

        const [cachedStudents, cachedMentorNames] = await Promise.all([
          getCachedStudents(),
          readCachedMentorNames(),
        ]);

        if (!isMounted) {
          return;
        }

        if (cachedStudents.length > 0) {
          setStudents(cachedStudents.map(({ cached_at, ...student }) => student));
          setMentorNames(cachedMentorNames);
        }

        if (cachedStudents.length === 0 && navigator.onLine) {
          const { students: freshStudents, mentorNames: freshMentorNames } = await fetchStudentsFromSupabase();
          await cacheStudents(freshStudents);

          if (!isMounted) {
            return;
          }

          setStudents(freshStudents);
          setMentorNames(freshMentorNames);
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(error instanceof Error ? error.message : 'Unable to load students.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadStudents();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return students;
    }

    return students.filter((student) => student.name.toLowerCase().includes(query));
  }, [search, students]);

  const selectedStudent = students.find((student) => student.id === value) ?? null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select a student</CardTitle>
        <CardDescription>Search by name and choose the learner for this session.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-700">Search students</span>
          <input
            className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-emerald-500"
            placeholder="Search by student name"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>

        <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
          {isLoading ? (
            <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
              Loading students from offline cache...
            </p>
          ) : null}

          {!isLoading && filteredStudents.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
              No students match that search.
            </p>
          ) : null}

          {filteredStudents.map((student) => {
            const isSelected = student.id === value;

            return (
              <button
                key={student.id}
                type="button"
                className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-slate-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/40'
                }`}
                onClick={() => onChange(student.id)}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-slate-900">{student.name}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      Grade {student.grade} · Center {student.center_id}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {student.assigned_mentor_id
                        ? `Assigned mentor: ${mentorNames[student.assigned_mentor_id] ?? 'Linked mentor'}`
                        : 'Assigned mentor: Unassigned'}
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${getRiskBadgeClass(student.risk_color)}`}>
                    {student.risk_color}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {errorMessage ? (
          <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {errorMessage}
          </p>
        ) : null}

        {selectedStudent ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">{selectedStudent.name}</p>
                <p className="text-xs text-slate-500">Mini radar preview from the current gap profile</p>
              </div>
              <Badge tone="info">Grade {selectedStudent.grade}</Badge>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              {SUBJECTS.map((subject: Subject) => (
                <div key={subject} className="flex items-center gap-2 text-xs text-slate-600">
                  <span className={`h-3 w-3 rounded-full ${getGapDotClass(selectedStudent.gap_profile[subject])}`} />
                  <span>{SUBJECT_LABELS[subject]}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
