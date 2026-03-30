import type { DBSchema } from 'idb';

import type {
  MentorRecord,
  QueuedSessionRecord,
  SessionTemplateRecord,
  StudentRecord,
  SyncStatusSnapshot,
} from '@/types';

export interface SyncMetaRecord {
  key: 'status';
  value: SyncStatusSnapshot;
}

export interface VidyasetuDBSchema extends DBSchema {
  sessionQueue: {
    key: string;
    value: QueuedSessionRecord;
    indexes: {
      'by-status': string;
      'by-student': string;
      'by-updated-at': string;
      'by-next-retry-at': string;
    };
  };
  students: {
    key: string;
    value: StudentRecord;
    indexes: {
      'by-locality': string;
      'by-grade': string;
      'by-updated-at': string;
    };
  };
  mentors: {
    key: string;
    value: MentorRecord;
    indexes: {
      'by-locality': string;
      'by-grade': string;
      'by-updated-at': string;
    };
  };
  sessionTemplates: {
    key: string;
    value: SessionTemplateRecord;
    indexes: {
      'by-duration': number;
      'by-created-at': string;
    };
  };
  syncMeta: {
    key: string;
    value: SyncMetaRecord;
  };
}

export const VIDYASETU_DB_NAME = 'vidyasetu-offline-db';
export const VIDYASETU_DB_VERSION = 1;

