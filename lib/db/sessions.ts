// lib/db/sessions.ts
import { getDB, getVidyasetuDB, isQuotaExceededError } from './index';
import type {
  QueueMetrics,
  QueuedSession,
  QueuedSessionRecord,
  SessionFormValues,
  SkillDomain,
  SkillRating,
  SkillRatings,
  Subject,
} from '@/types';

const DEFAULT_SKILL_SCORE = 3;

type QueueSessionInput = Omit<
  QueuedSession,
  'sync_attempts' | 'sync_failed' | 'queued_at' | 'last_attempt_at' | 'error_message'
>;

function sortByQueuedAt(left: QueuedSession, right: QueuedSession): number {
  return new Date(left.queued_at).getTime() - new Date(right.queued_at).getTime();
}

function mapSkillDomainToSubject(domain: SkillDomain): Subject | null {
  switch (domain) {
    case 'arithmetic':
      return 'math';
    case 'writing':
      return 'english';
    case 'reading':
    case 'comprehension':
      return domain;
    case 'confidence':
      return null;
    default:
      return null;
  }
}

function mapNumericSkillRating(score: number): SkillRating {
  if (score >= 4) {
    return 'improving';
  }

  if (score <= 0) {
    return 'not_covered';
  }

  return 'steady';
}

function mapSkillRatingToLegacyScore(rating: SkillRating | undefined): 1 | 3 | 4 {
  switch (rating) {
    case 'improving':
      return 4;
    case 'not_covered':
      return 1;
    case 'steady':
    default:
      return DEFAULT_SKILL_SCORE;
  }
}

function mapLegacySkillRatings(skillRatings: SkillRatings): Partial<Record<Subject, SkillRating>> {
  const mappedRatings = Object.entries(skillRatings).reduce<Partial<Record<Subject, SkillRating>>>(
    (accumulator, [domain, score]) => {
      const subject = mapSkillDomainToSubject(domain as SkillDomain);

      if (!subject) {
        return accumulator;
      }

      accumulator[subject] = mapNumericSkillRating(score);
      return accumulator;
    },
    {},
  );

  return mappedRatings;
}

function mapLegacySubjects(skillRatings: SkillRatings): Subject[] {
  const subjects = Object.entries(skillRatings).reduce<Subject[]>((accumulator, [domain]) => {
    const subject = mapSkillDomainToSubject(domain as SkillDomain);

    if (subject && !accumulator.includes(subject)) {
      accumulator.push(subject);
    }

    return accumulator;
  }, []);

  return subjects;
}

function buildQueuedSessionFromLegacy(
  payload: SessionFormValues,
  learningGaps: string[],
): QueuedSession {
  const timestamp = new Date().toISOString();

  return {
    id: undefined,
    student_id: payload.studentId,
    mentor_id: payload.mentorId,
    session_date: payload.sessionDate,
    subjects_covered: mapLegacySubjects(payload.skillRatings),
    skill_ratings: mapLegacySkillRatings(payload.skillRatings),
    note: payload.notes,
    raw_tags: learningGaps,
    synced: false,
    synced_at: null,
    created_at: timestamp,
    offline_id: crypto.randomUUID(),
    sync_attempts: 0,
    sync_failed: false,
    queued_at: timestamp,
    last_attempt_at: null,
    error_message: null,
  };
}

function mapQueuedSessionToLegacyRatings(
  ratings: Partial<Record<Subject, SkillRating>>,
): SkillRatings {
  return {
    reading: mapSkillRatingToLegacyScore(ratings.reading),
    comprehension: mapSkillRatingToLegacyScore(ratings.comprehension),
    writing: mapSkillRatingToLegacyScore(ratings.english),
    arithmetic: mapSkillRatingToLegacyScore(ratings.math),
    confidence: DEFAULT_SKILL_SCORE,
  };
}

function mapQueuedSessionToLegacyRecord(session: QueuedSession): QueuedSessionRecord {
  return {
    id: session.id ?? session.offline_id,
    offlineId: session.offline_id,
    studentId: session.student_id,
    mentorId: session.mentor_id,
    templateId: null,
    sessionDate: session.session_date,
    startedAt: session.created_at,
    durationMinutes: 60,
    mode: 'offline',
    attendance: 'present',
    engagementLevel: DEFAULT_SKILL_SCORE,
    confidenceDelta: 0,
    notes: session.note,
    learningGaps: session.raw_tags,
    skillRatings: mapQueuedSessionToLegacyRatings(session.skill_ratings),
    syncStatus: session.synced ? 'synced' : session.sync_failed ? 'error' : 'queued',
    syncAttempts: session.sync_attempts,
    syncError: session.error_message,
    lastSyncedAt: session.synced_at,
    nextRetryAt: null,
    serverId: session.id ?? null,
    createdAt: session.created_at,
    updatedAt: session.last_attempt_at ?? session.created_at,
  };
}

function mapLegacyRecordToQueuedSession(
  record: QueuedSessionRecord,
  existingRecord: QueuedSession,
): QueuedSession {
  return {
    id: record.serverId ?? existingRecord.id,
    student_id: record.studentId,
    mentor_id: record.mentorId,
    session_date: record.sessionDate,
    subjects_covered: mapLegacySubjects(record.skillRatings),
    skill_ratings: mapLegacySkillRatings(record.skillRatings),
    note: record.notes,
    raw_tags: record.learningGaps,
    synced: record.syncStatus === 'synced',
    synced_at: record.lastSyncedAt,
    created_at: existingRecord.created_at,
    offline_id: record.offlineId,
    sync_attempts: record.syncAttempts,
    sync_failed: record.syncStatus === 'error',
    queued_at: existingRecord.queued_at,
    last_attempt_at: record.updatedAt,
    error_message: record.syncError,
  };
}

async function writeSyncLog(
  offlineId: string,
  event: 'queued' | 'syncing' | 'synced' | 'failed',
  error?: string,
): Promise<void> {
  const db = await getDB();
  await db.put('sync_log', {
    id: crypto.randomUUID(),
    offline_id: offlineId,
    event,
    timestamp: new Date().toISOString(),
    ...(error ? { error } : {}),
  });
}

export async function queueSession(session: QueueSessionInput): Promise<void>;
export async function queueSession(
  payload: SessionFormValues,
  learningGaps: string[],
): Promise<QueuedSessionRecord>;
export async function queueSession(
  sessionOrPayload: QueueSessionInput | SessionFormValues,
  learningGaps: string[] = [],
): Promise<void | QueuedSessionRecord> {
  const queuedSession =
    'student_id' in sessionOrPayload
      ? {
          ...sessionOrPayload,
          sync_attempts: 0,
          sync_failed: false,
          queued_at: new Date().toISOString(),
          last_attempt_at: null,
          error_message: null,
        }
      : buildQueuedSessionFromLegacy(sessionOrPayload, learningGaps);

  try {
    const db = await getDB();
    await db.put('session_queue', queuedSession);
    await writeSyncLog(queuedSession.offline_id, 'queued');

    if ('student_id' in sessionOrPayload) {
      return;
    }

    return mapQueuedSessionToLegacyRecord(queuedSession);
  } catch (error) {
    if (isQuotaExceededError(error)) {
      throw new Error('Device storage is full. Please sync or clear old sessions before continuing.');
    }

    throw error;
  }
}

// Get all sessions where synced === false
export async function getPendingSessions(): Promise<QueuedSession[]> {
  const db = await getDB();
  const sessions = await db.getAll('session_queue');

  return sessions.filter((session) => !session.synced).sort(sortByQueuedAt);
}

// Mark a session as successfully synced, store its Supabase ID
export async function markSessionSynced(offline_id: string, supabase_id: string): Promise<void> {
  const db = await getDB();
  const existingSession = await db.get('session_queue', offline_id);

  if (!existingSession) {
    return;
  }

  const syncedAt = new Date().toISOString();
  await db.put('session_queue', {
    ...existingSession,
    id: supabase_id,
    synced: true,
    synced_at: syncedAt,
    sync_failed: false,
    last_attempt_at: syncedAt,
    error_message: null,
  });
  await writeSyncLog(offline_id, 'synced');
}

// Mark a session as permanently failed after MAX_RETRIES
export async function markSessionFailed(offline_id: string, error: string): Promise<void> {
  const db = await getDB();
  const existingSession = await db.get('session_queue', offline_id);

  if (!existingSession) {
    return;
  }

  const failedAt = new Date().toISOString();
  await db.put('session_queue', {
    ...existingSession,
    sync_failed: true,
    synced: false,
    last_attempt_at: failedAt,
    error_message: error,
  });
  await writeSyncLog(offline_id, 'failed', error);
}

// Increment the sync attempt counter for a session
export async function incrementSyncAttempt(offline_id: string): Promise<void> {
  const db = await getDB();
  const existingSession = await db.get('session_queue', offline_id);

  if (!existingSession) {
    return;
  }

  await db.put('session_queue', {
    ...existingSession,
    sync_attempts: existingSession.sync_attempts + 1,
    last_attempt_at: new Date().toISOString(),
  });
  await writeSyncLog(offline_id, 'syncing');
}

// Get all permanently failed sessions
export async function getFailedSessions(): Promise<QueuedSession[]> {
  const sessions = await getPendingSessions();
  return sessions.filter((session) => session.sync_failed);
}

// Get all sessions for a given student_id (from queue)
export async function getSessionsByStudent(student_id: string): Promise<QueuedSession[]> {
  const db = await getDB();
  const sessions = await db.getAllFromIndex('session_queue', 'by-student-id', student_id);

  return sessions.sort(sortByQueuedAt);
}

// Count pending (unsynced) sessions
export async function getPendingCount(): Promise<number> {
  const sessions = await getPendingSessions();
  return sessions.length;
}

// Count failed sessions
export async function getFailedCount(): Promise<number> {
  const sessions = await getFailedSessions();
  return sessions.length;
}

export async function getQueuedSessions(): Promise<QueuedSessionRecord[]> {
  const sessions = await getPendingSessions();
  return sessions.map(mapQueuedSessionToLegacyRecord);
}

export async function getQueuedSessionByOfflineId(
  offlineId: string,
): Promise<QueuedSessionRecord | undefined> {
  const db = await getDB();
  const queuedSession = await db.get('session_queue', offlineId);

  return queuedSession ? mapQueuedSessionToLegacyRecord(queuedSession) : undefined;
}

export async function updateQueuedSession(
  offlineId: string,
  updater: (record: QueuedSessionRecord) => QueuedSessionRecord,
): Promise<QueuedSessionRecord | undefined> {
  const db = await getVidyasetuDB();
  const existingRecord = await db.get('session_queue', offlineId);

  if (!existingRecord) {
    return undefined;
  }

  const updatedLegacyRecord = updater(mapQueuedSessionToLegacyRecord(existingRecord));
  const updatedRecord = mapLegacyRecordToQueuedSession(updatedLegacyRecord, existingRecord);
  await db.put('session_queue', updatedRecord);

  return updatedLegacyRecord;
}

export async function removeQueuedSession(offlineId: string): Promise<void> {
  const db = await getDB();
  await db.delete('session_queue', offlineId);
}

export async function getQueueMetrics(): Promise<QueueMetrics> {
  const [pendingCount, failedCount] = await Promise.all([getPendingCount(), getFailedCount()]);

  return {
    queued: Math.max(pendingCount - failedCount, 0),
    syncing: 0,
    failed: failedCount,
  };
}
