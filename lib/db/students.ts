import { getVidyasetuDB, isQuotaExceededError } from '@/lib/db';
import type { StudentRecord } from '@/types';

export async function cacheStudents(students: StudentRecord[]): Promise<void> {
  try {
    const db = await getVidyasetuDB();
    const transaction = db.transaction('students', 'readwrite');

    await Promise.all(students.map(async (student) => transaction.store.put(student)));
    await transaction.done;
  } catch (error) {
    if (isQuotaExceededError(error)) {
      throw new Error('Device storage is full. Student data could not be cached offline.');
    }

    throw error;
  }
}

export async function getCachedStudents(): Promise<StudentRecord[]> {
  try {
    const db = await getVidyasetuDB();
    return await db.getAll('students');
  } catch (error) {
    throw error;
  }
}

export async function getCachedStudentById(studentId: string): Promise<StudentRecord | undefined> {
  try {
    const db = await getVidyasetuDB();
    return await db.get('students', studentId);
  } catch (error) {
    throw error;
  }
}

