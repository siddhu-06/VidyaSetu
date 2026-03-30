import { openDB, type IDBPDatabase } from 'idb';

import {
  VIDYASETU_DB_NAME,
  VIDYASETU_DB_VERSION,
  type VidyasetuDBSchema,
} from '@/lib/db/schema';

let dbPromise: Promise<IDBPDatabase<VidyasetuDBSchema>> | null = null;

function createDatabase(): Promise<IDBPDatabase<VidyasetuDBSchema>> {
  return openDB<VidyasetuDBSchema>(VIDYASETU_DB_NAME, VIDYASETU_DB_VERSION, {
    upgrade(database) {
      if (!database.objectStoreNames.contains('sessionQueue')) {
        const sessionStore = database.createObjectStore('sessionQueue', {
          keyPath: 'offlineId',
        });
        sessionStore.createIndex('by-status', 'syncStatus');
        sessionStore.createIndex('by-student', 'studentId');
        sessionStore.createIndex('by-updated-at', 'updatedAt');
        sessionStore.createIndex('by-next-retry-at', 'nextRetryAt');
      }

      if (!database.objectStoreNames.contains('students')) {
        const studentStore = database.createObjectStore('students', {
          keyPath: 'id',
        });
        studentStore.createIndex('by-locality', 'locality');
        studentStore.createIndex('by-grade', 'grade');
        studentStore.createIndex('by-updated-at', 'updatedAt');
      }

      if (!database.objectStoreNames.contains('mentors')) {
        const mentorStore = database.createObjectStore('mentors', {
          keyPath: 'id',
        });
        mentorStore.createIndex('by-locality', 'localities', { multiEntry: true });
        mentorStore.createIndex('by-grade', 'focusGrades', { multiEntry: true });
        mentorStore.createIndex('by-updated-at', 'updatedAt');
      }

      if (!database.objectStoreNames.contains('sessionTemplates')) {
        const templateStore = database.createObjectStore('sessionTemplates', {
          keyPath: 'id',
        });
        templateStore.createIndex('by-duration', 'durationMinutes');
        templateStore.createIndex('by-created-at', 'createdAt');
      }

      if (!database.objectStoreNames.contains('syncMeta')) {
        database.createObjectStore('syncMeta', { keyPath: 'key' });
      }
    },
  });
}

export async function getVidyasetuDB(): Promise<IDBPDatabase<VidyasetuDBSchema>> {
  try {
    if (!dbPromise) {
      dbPromise = createDatabase();
    }

    return await dbPromise;
  } catch (error) {
    dbPromise = null;
    throw error;
  }
}

export function isQuotaExceededError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'QuotaExceededError';
}

