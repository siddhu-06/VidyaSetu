import { getVidyasetuDB, isQuotaExceededError } from '@/lib/db';
import type { SessionTemplateRecord } from '@/types';

export async function cacheTemplates(templates: SessionTemplateRecord[]): Promise<void> {
  try {
    const db = await getVidyasetuDB();
    const transaction = db.transaction('sessionTemplates', 'readwrite');

    await Promise.all(templates.map(async (template) => transaction.store.put(template)));
    await transaction.done;
  } catch (error) {
    if (isQuotaExceededError(error)) {
      throw new Error('Device storage is full. Templates could not be cached offline.');
    }

    throw error;
  }
}

export async function getCachedTemplates(): Promise<SessionTemplateRecord[]> {
  try {
    const db = await getVidyasetuDB();
    return await db.getAll('sessionTemplates');
  } catch (error) {
    throw error;
  }
}

export async function getTemplateById(
  templateId: string,
): Promise<SessionTemplateRecord | undefined> {
  try {
    const db = await getVidyasetuDB();
    return await db.get('sessionTemplates', templateId);
  } catch (error) {
    throw error;
  }
}

