// lib/db/templates.ts
import { getDB, isQuotaExceededError } from './index';
import type { SessionTemplate, SessionTemplateRecord, SkillDomain, Subject } from '@/types';

function mapFocusSkillToSubject(skill: SkillDomain): Subject {
  switch (skill) {
    case 'arithmetic':
      return 'math';
    case 'writing':
      return 'english';
    case 'reading':
      return 'reading';
    case 'confidence':
      return 'comprehension';
    case 'comprehension':
      return 'comprehension';
  }
}

function mapSubjectToFocusSkill(subject: Subject): SkillDomain {
  switch (subject) {
    case 'math':
      return 'arithmetic';
    case 'english':
      return 'writing';
    case 'science':
      return 'confidence';
    case 'reading':
      return 'reading';
    case 'comprehension':
      return 'comprehension';
  }
}

function mapLegacyTemplateToCanonical(template: SessionTemplateRecord): SessionTemplate {
  const primarySkill = template.focusSkills[0] ?? 'reading';

  return {
    id: template.id,
    title: template.title,
    grade: 3,
    subject: mapFocusSkillToSubject(primarySkill),
    gap_tag: primarySkill,
    warm_up: template.noteHint,
    core_concept: template.title,
    closing_activity: 'Review, recap, and assign a short follow-up activity.',
    duration_minutes: template.durationMinutes,
    offline_cached: true,
  };
}

function mapCanonicalTemplateToLegacy(template: SessionTemplate): SessionTemplateRecord {
  return {
    id: template.id,
    title: template.title,
    focusSkills: [mapSubjectToFocusSkill(template.subject)],
    noteHint: template.warm_up,
    durationMinutes: template.duration_minutes,
    createdAt: new Date().toISOString(),
  };
}

function toCanonicalTemplate(template: SessionTemplate | SessionTemplateRecord): SessionTemplate {
  return 'duration_minutes' in template ? template : mapLegacyTemplateToCanonical(template);
}

// Cache session templates for offline use
export async function cacheTemplates(templates: SessionTemplate[]): Promise<void>;
export async function cacheTemplates(templates: SessionTemplateRecord[]): Promise<void>;
export async function cacheTemplates(
  templates: Array<SessionTemplate | SessionTemplateRecord>,
): Promise<void> {
  try {
    const db = await getDB();
    const transaction = db.transaction('template_cache', 'readwrite');

    await Promise.all(templates.map(async (template) => transaction.store.put(toCanonicalTemplate(template))));
    await transaction.done;
  } catch (error) {
    if (isQuotaExceededError(error)) {
      throw new Error('Device storage is full. Templates could not be cached offline.');
    }

    throw error;
  }
}

// Get all cached templates
export async function getCachedTemplates(): Promise<SessionTemplate[]> {
  const db = await getDB();
  return db.getAll('template_cache');
}

// Get templates filtered by subject
export async function getTemplatesBySubject(subject: string): Promise<SessionTemplate[]> {
  const db = await getDB();
  return db.getAllFromIndex('template_cache', 'by-subject', subject as Subject);
}

// Get templates filtered by grade
export async function getTemplatesByGrade(grade: number): Promise<SessionTemplate[]> {
  const db = await getDB();
  return db.getAllFromIndex('template_cache', 'by-grade', grade);
}

export async function getCachedTemplateRecords(): Promise<SessionTemplateRecord[]> {
  const templates = await getCachedTemplates();
  return templates.map(mapCanonicalTemplateToLegacy);
}

export async function getTemplateById(
  templateId: string,
): Promise<SessionTemplateRecord | undefined> {
  const db = await getDB();
  const template = await db.get('template_cache', templateId);

  return template ? mapCanonicalTemplateToLegacy(template) : undefined;
}
