// lib/db/index.ts
import { openDB, type IDBPDatabase } from 'idb';

import type { VidyaSetuCompatDB, VidyaSetuDB } from './schema';

const DB_NAME = 'vidyasetu';
// Bumped to migrate existing local installs from the earlier hackathon schema.
const DB_VERSION = 2;

let dbInstance: IDBPDatabase<VidyaSetuCompatDB> | null = null;
let dbPromise: Promise<IDBPDatabase<VidyaSetuCompatDB>> | null = null;

function createDatabase(): Promise<IDBPDatabase<VidyaSetuCompatDB>> {
  return openDB<VidyaSetuCompatDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('session_queue')) {
        const sessionStore = db.createObjectStore('session_queue', {
          keyPath: 'offline_id',
        });
        sessionStore.createIndex('by-synced', 'synced');
        sessionStore.createIndex('by-queued-at', 'queued_at');
        sessionStore.createIndex('by-student-id', 'student_id');
      }

      if (!db.objectStoreNames.contains('student_cache')) {
        const studentStore = db.createObjectStore('student_cache', {
          keyPath: 'id',
        });
        studentStore.createIndex('by-center-id', 'center_id');
        studentStore.createIndex('by-risk-color', 'risk_color');
      }

      if (!db.objectStoreNames.contains('template_cache')) {
        const templateStore = db.createObjectStore('template_cache', {
          keyPath: 'id',
        });
        templateStore.createIndex('by-subject', 'subject');
        templateStore.createIndex('by-grade', 'grade');
      }

      if (!db.objectStoreNames.contains('sync_log')) {
        const syncLogStore = db.createObjectStore('sync_log', {
          keyPath: 'id',
        });
        syncLogStore.createIndex('by-offline-id', 'offline_id');
        syncLogStore.createIndex('by-event', 'event');
      }

      if (!db.objectStoreNames.contains('mentors')) {
        const mentorStore = db.createObjectStore('mentors', {
          keyPath: 'id',
        });
        mentorStore.createIndex('by-locality', 'localities', { multiEntry: true });
        mentorStore.createIndex('by-grade', 'focusGrades', { multiEntry: true });
      }
    },
    blocked() {
      console.warn('[VidyaSetuDB] Database upgrade blocked by an older version');
    },
    blocking() {
      dbInstance?.close();
      dbInstance = null;
      dbPromise = null;
    },
    terminated() {
      dbInstance = null;
      dbPromise = null;
    },
  });
}

export async function getDB(): Promise<IDBPDatabase<VidyaSetuDB>> {
  if (dbInstance) {
    return dbInstance;
  }

  if (!dbPromise) {
    dbPromise = createDatabase();
  }

  try {
    dbInstance = await dbPromise;
    return dbInstance;
  } catch (error) {
    dbInstance = null;
    dbPromise = null;
    throw error;
  }
}

export async function getVidyasetuDB(): Promise<IDBPDatabase<VidyaSetuCompatDB>> {
  if (dbInstance) {
    return dbInstance;
  }

  if (!dbPromise) {
    dbPromise = createDatabase();
  }

  try {
    dbInstance = await dbPromise;
    return dbInstance;
  } catch (error) {
    dbInstance = null;
    dbPromise = null;
    throw error;
  }
}

// Graceful quota check
export async function checkStorageQuota(): Promise<{
  used: number;
  quota: number;
  percentUsed: number;
  isNearLimit: boolean;
}> {
  if (typeof navigator === 'undefined' || !navigator.storage?.estimate) {
    return { used: 0, quota: Number.POSITIVE_INFINITY, percentUsed: 0, isNearLimit: false };
  }

  const { usage = 0, quota = Number.POSITIVE_INFINITY } = await navigator.storage.estimate();
  const percentUsed = Number.isFinite(quota) && quota > 0 ? (usage / quota) * 100 : 0;

  return {
    used: usage,
    quota,
    percentUsed,
    isNearLimit: percentUsed > 80,
  };
}

export function isQuotaExceededError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'QuotaExceededError';
}
