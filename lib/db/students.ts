// lib/db/students.ts
import { getDB, isQuotaExceededError } from './index';
import type { RiskColor, Student, StudentRecord } from '@/types';

type CachedStudent = Student & { cached_at: string };

function normalizeGrade(grade: number | string): 3 | 4 | 5 | 6 {
  const numericGrade =
    typeof grade === 'number' ? grade : Number.parseInt(grade.match(/\d+/)?.[0] ?? '3', 10);

  if (numericGrade <= 3) {
    return 3;
  }

  if (numericGrade === 4) {
    return 4;
  }

  if (numericGrade === 5) {
    return 5;
  }

  return 6;
}

function normalizeAttendance(attendanceRate: number): number {
  if (attendanceRate <= 1) {
    return Math.max(0, Math.min(attendanceRate, 1));
  }

  return Math.max(0, Math.min(attendanceRate / 100, 1));
}

function deriveRiskColor(riskScore: number): RiskColor {
  if (riskScore >= 0.7) {
    return 'red';
  }

  if (riskScore >= 0.4) {
    return 'amber';
  }

  return 'green';
}

function mapLegacyStudentToCanonical(student: StudentRecord): Student {
  const normalizedAttendance = normalizeAttendance(student.attendanceRate);
  const riskScore = Number((1 - normalizedAttendance).toFixed(2));

  return {
    id: student.id,
    name: student.fullName,
    grade: normalizeGrade(student.grade),
    gender: 'other',
    center_id: student.locality || 'legacy-center',
    assigned_mentor_id: null,
    gap_profile: {
      math: 0,
      reading: 0,
      science: 0,
      english: 0,
      comprehension: 0,
    },
    risk_score: riskScore,
    risk_color: deriveRiskColor(riskScore),
    last_session_at: student.lastSessionAt,
    engagement_score: student.parentContact.smsOptIn ? 0.5 : 0,
    preferred_time_slot: null,
    parent_language: student.parentContact.preferredLanguage,
    created_at: student.createdAt,
  };
}

function mapCanonicalStudentToLegacy(student: CachedStudent): StudentRecord {
  const attendanceRate = Math.round((1 - student.risk_score) * 100);

  return {
    id: student.id,
    fullName: student.name,
    preferredName: null,
    age: student.grade + 5,
    grade: String(student.grade),
    schoolName: null,
    locality: student.center_id,
    migrationStatus: 'stable',
    baselineReadingLevel: 3,
    baselineArithmeticLevel: 3,
    attendanceRate,
    lastSessionAt: student.last_session_at,
    active: true,
    parentContact: {
      guardianName: 'Parent',
      phone: '',
      preferredLanguage: student.parent_language,
      smsOptIn: true,
    },
    createdAt: student.created_at,
    updatedAt: student.cached_at,
  };
}

function toCachedStudent(student: Student | StudentRecord): CachedStudent {
  const canonicalStudent = 'center_id' in student ? student : mapLegacyStudentToCanonical(student);

  return {
    ...canonicalStudent,
    cached_at: new Date().toISOString(),
  };
}

// Write students to cache (from Supabase fetch)
export async function cacheStudents(students: Student[]): Promise<void>;
export async function cacheStudents(students: StudentRecord[]): Promise<void>;
export async function cacheStudents(students: Array<Student | StudentRecord>): Promise<void> {
  try {
    const db = await getDB();
    const transaction = db.transaction('student_cache', 'readwrite');

    await Promise.all(students.map(async (student) => transaction.store.put(toCachedStudent(student))));
    await transaction.done;
  } catch (error) {
    if (isQuotaExceededError(error)) {
      throw new Error('Device storage is full. Student data could not be cached offline.');
    }

    throw error;
  }
}

// Read all cached students
export async function getCachedStudents(): Promise<CachedStudent[]> {
  const db = await getDB();
  return db.getAll('student_cache');
}

// Read a single cached student
export async function getCachedStudent(id: string): Promise<CachedStudent | undefined> {
  const db = await getDB();
  return db.get('student_cache', id);
}

// Update a student's gap_profile and risk data in cache
export async function updateCachedStudentRisk(
  id: string,
  updates: Partial<Pick<Student, 'gap_profile' | 'risk_score' | 'risk_color' | 'last_session_at'>>,
): Promise<void> {
  const db = await getDB();
  const existingStudent = await db.get('student_cache', id);

  if (!existingStudent) {
    return;
  }

  await db.put('student_cache', {
    ...existingStudent,
    ...updates,
    cached_at: new Date().toISOString(),
  });
}

// Clear the entire student cache (called before re-fetch)
export async function clearStudentCache(): Promise<void> {
  const db = await getDB();
  await db.clear('student_cache');
}

export async function getCachedStudentRecords(): Promise<StudentRecord[]> {
  const students = await getCachedStudents();
  return students.map(mapCanonicalStudentToLegacy);
}

export async function getCachedStudentById(studentId: string): Promise<StudentRecord | undefined> {
  const student = await getCachedStudent(studentId);
  return student ? mapCanonicalStudentToLegacy(student) : undefined;
}
