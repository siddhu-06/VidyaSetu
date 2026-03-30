'use client';

import Link from 'next/link';

import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { useStudents } from '@/hooks/useStudents';

export default function StudentsPage() {
  const { data: students = [], isLoading } = useStudents();

  if (isLoading) {
    return <SkeletonCard />;
  }

  if (students.length === 0) {
    return (
      <EmptyState
        title="No students available yet"
        description="Once students are synced or seeded, their learning passports will appear here."
      />
    );
  }

  return (
    <div className="grid gap-6">
      <div>
        <p className="text-sm uppercase tracking-[0.24em] text-emerald-700">Students</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Learning passport roster</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Every student record stays lightweight, portable and ready for field follow-up.
        </p>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        {students.map((student) => (
          <Card key={student.id}>
            <CardHeader>
              <CardTitle>{student.fullName}</CardTitle>
              <CardDescription>
                Grade {student.grade} · {student.locality} · Attendance {student.attendanceRate}%
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm text-slate-600">
                Guardian {student.parentContact.guardianName} · {student.parentContact.phone}
              </div>
              <div className="flex gap-3">
                <Link className="text-sm font-semibold text-emerald-700" href={`/students/${student.id}`}>
                  Open passport
                </Link>
                <Link className="text-sm font-semibold text-slate-700" href={`/passport/${student.id}`}>
                  Public view
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

