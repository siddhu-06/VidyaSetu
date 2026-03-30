// lib/db/schema.ts
import type { DBSchema } from 'idb';
import type { MentorRecord, QueuedSession, SessionTemplate, Student } from '@/types';

export interface VidyaSetuDB extends DBSchema {
  session_queue: {
    key: string;
    value: QueuedSession;
    indexes: {
      'by-synced': number;
      'by-queued-at': string;
      'by-student-id': string;
    };
  };
  student_cache: {
    key: string;
    value: Student & { cached_at: string };
    indexes: {
      'by-center-id': string;
      'by-risk-color': string;
    };
  };
  template_cache: {
    key: string;
    value: SessionTemplate;
    indexes: {
      'by-subject': string;
      'by-grade': number;
    };
  };
  sync_log: {
    key: string;
    value: {
      id: string;
      offline_id: string;
      event: 'queued' | 'syncing' | 'synced' | 'failed';
      timestamp: string;
      error?: string;
    };
    indexes: {
      'by-offline-id': string;
      'by-event': string;
    };
  };
  mentors: {
    key: string;
    value: MentorRecord;
    indexes: {
      'by-locality': string;
      'by-grade': string;
    };
  };
}

export type VidyaSetuCompatDB = VidyaSetuDB;
