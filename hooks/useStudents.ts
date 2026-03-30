'use client';

import { useQuery } from '@tanstack/react-query';

import { cacheStudents, getCachedStudentById, getCachedStudentRecords } from '@/lib/db/students';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/types';
import type { StudentRecord } from '@/types';

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

async function fetchStudents(): Promise<StudentRecord[]> {
  const supabase = getSupabaseBrowserClient();

  if (!supabase) {
    return getCachedStudentRecords();
  }

  try {
    const { data, error } = await supabase.from('students').select('*').order('full_name');

    if (error) {
      throw error;
    }

    const students = (data ?? []).map(mapStudent);
    await cacheStudents(students);

    return students;
  } catch (error) {
    const cachedStudents = await getCachedStudentRecords();

    if (cachedStudents.length > 0) {
      return cachedStudents;
    }

    throw error;
  }
}

export function useStudents() {
  return useQuery({
    queryKey: ['students'],
    queryFn: fetchStudents,
  });
}

export function useStudent(studentId: string) {
  return useQuery({
    queryKey: ['students', studentId],
    queryFn: async (): Promise<StudentRecord | undefined> => {
      try {
        const supabase = getSupabaseBrowserClient();

        if (!supabase) {
          return getCachedStudentById(studentId);
        }

        const { data, error } = await supabase
          .from('students')
          .select('*')
          .eq('id', studentId)
          .maybeSingle();

        if (error) {
          throw error;
        }

        if (!data) {
          return getCachedStudentById(studentId);
        }

        const student = mapStudent(data);
        await cacheStudents([student]);

        return student;
      } catch (error) {
        return getCachedStudentById(studentId);
      }
    },
    enabled: studentId.length > 0,
  });
}
