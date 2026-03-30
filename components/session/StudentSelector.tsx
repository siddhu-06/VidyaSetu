'use client';

import type { StudentRecord } from '@/types';

interface StudentSelectorProps {
  students: StudentRecord[];
  value: string;
  onChange: (studentId: string) => void;
  isLoading?: boolean;
}

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

