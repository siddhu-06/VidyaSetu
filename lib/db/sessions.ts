import { getVidyasetuDB, isQuotaExceededError } from '@/lib/db';
import type { SessionFormValues, QueuedSessionRecord, QueueMetrics } from '@/types';

const queueMetricsReducer = (records: QueuedSessionRecord[]): QueueMetrics => ({
  queued: records.filter((record) => record.syncStatus === 'queued').length,
  syncing: records.filter((record) => record.syncStatus === 'syncing').length,
  failed: records.filter((record) => record.syncStatus === 'error').length,
});

export async function queueSession(
  payload: SessionFormValues,
  learningGaps: string[],
): Promise<QueuedSessionRecord> {
  const timestamp = new Date().toISOString();
  const record: QueuedSessionRecord = {
    id: crypto.randomUUID(),
    offlineId: crypto.randomUUID(),
    studentId: payload.studentId,
    mentorId: payload.mentorId,
    templateId: payload.templateId,
    sessionDate: payload.sessionDate,
    startedAt: timestamp,
    durationMinutes: payload.durationMinutes,
    mode: payload.mode,
    attendance: payload.attendance,
    engagementLevel: payload.engagementLevel,
    confidenceDelta: payload.confidenceDelta,
    notes: payload.notes,
    learningGaps,
    skillRatings: payload.skillRatings,
    syncStatus: 'queued',
    syncAttempts: 0,
    syncError: null,
    lastSyncedAt: null,
    nextRetryAt: null,
    serverId: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  try {
    const db = await getVidyasetuDB();
    await db.put('sessionQueue', record);
    return record;
  } catch (error) {
    if (isQuotaExceededError(error)) {
      throw new Error('Device storage is full. Please sync or clear old sessions before continuing.');
    }

    throw error;
  }
}

export async function getQueuedSessions(): Promise<QueuedSessionRecord[]> {
  try {
    const db = await getVidyasetuDB();
    return await db.getAll('sessionQueue');
  } catch (error) {
    throw error;
  }
}

export async function getQueuedSessionByOfflineId(
  offlineId: string,
): Promise<QueuedSessionRecord | undefined> {
  try {
    const db = await getVidyasetuDB();
    return await db.get('sessionQueue', offlineId);
  } catch (error) {
    throw error;
  }
}

export async function updateQueuedSession(
  offlineId: string,
  updater: (record: QueuedSessionRecord) => QueuedSessionRecord,
): Promise<QueuedSessionRecord | undefined> {
  try {
    const db = await getVidyasetuDB();
    const existingRecord = await db.get('sessionQueue', offlineId);

    if (!existingRecord) {
      return undefined;
    }

    const updatedRecord = updater(existingRecord);
    await db.put('sessionQueue', updatedRecord);

    return updatedRecord;
  } catch (error) {
    throw error;
  }
}

export async function removeQueuedSession(offlineId: string): Promise<void> {
  try {
    const db = await getVidyasetuDB();
    await db.delete('sessionQueue', offlineId);
  } catch (error) {
    throw error;
  }
}

export async function getQueueMetrics(): Promise<QueueMetrics> {
  try {
    const records = await getQueuedSessions();
    return queueMetricsReducer(records);
  } catch (error) {
    throw error;
  }
}

