'use client';

import { useEffect, useState } from 'react';

import { MentorMatchList } from '@/components/mentor/MentorMatchList';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { useMentors } from '@/hooks/useMentors';
import { useStudents } from '@/hooks/useStudents';
import { rankMentorsForStudent } from '@/lib/intelligence/mentorMatcher';

export default function MentorsPage() {
  const { data: students = [], isLoading: studentsLoading } = useStudents();
  const { data: mentors = [], isLoading: mentorsLoading } = useMentors();
  const [selectedStudentId, setSelectedStudentId] = useState('');

  useEffect(() => {
    if (!selectedStudentId && students[0]) {
      setSelectedStudentId(students[0].id);
    }
  }, [selectedStudentId, students]);

  if (studentsLoading || mentorsLoading) {
    return <SkeletonCard />;
  }

  const selectedStudent = students.find((student) => student.id === selectedStudentId) ?? null;
  const matches = selectedStudent ? rankMentorsForStudent(selectedStudent, mentors) : [];

  return (
    <div className="grid gap-6">
      <div>
        <p className="text-sm uppercase tracking-[0.24em] text-emerald-700">Mentor matching</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Five-signal smart match</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Rank mentors by language, locality, grade fit, weekly capacity, and consistency so coordinators can assign faster.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Choose a student</CardTitle>
          <CardDescription>The ranking engine updates instantly for the selected learner.</CardDescription>
        </CardHeader>
        <CardContent>
          <select
            className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-emerald-500"
            value={selectedStudentId}
            onChange={(event) => setSelectedStudentId(event.target.value)}
          >
            <option value="">Choose a student</option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.fullName} · Grade {student.grade} · {student.locality}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>
      {selectedStudent ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Matching for {selectedStudent.fullName} in {selectedStudent.locality} with preferred language{' '}
          {selectedStudent.parentContact.preferredLanguage.toUpperCase()}.
        </div>
      ) : null}
      {mentors.length === 0 ? (
        <EmptyState
          title="No mentors loaded yet"
          description="Sync mentor records or run the seed data to activate smart matching."
        />
      ) : (
        <MentorMatchList matches={matches} />
      )}
    </div>
  );
}

