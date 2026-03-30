'use client';

import { useQuery } from '@tanstack/react-query';

import { getVidyasetuDB } from '@/lib/db';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/types';
import type { MentorRecord } from '@/types';

function mapMentor(row: Database['public']['Tables']['mentors']['Row']): MentorRecord {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    languages: row.languages as MentorRecord['languages'],
    focusGrades: row.focus_grades,
    localities: row.localities,
    weeklyCapacity: row.weekly_capacity,
    sessionsCompleted: row.sessions_completed,
    consistencyScore: row.consistency_score,
    empathyScore: row.empathy_score,
    teachingScore: row.teaching_score,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function cacheMentors(mentors: MentorRecord[]): Promise<void> {
  const db = await getVidyasetuDB();
  const transaction = db.transaction('mentors', 'readwrite');
  await Promise.all(mentors.map(async (mentor) => transaction.store.put(mentor)));
  await transaction.done;
}

async function getCachedMentors(): Promise<MentorRecord[]> {
  const db = await getVidyasetuDB();
  return db.getAll('mentors');
}

async function getCachedMentorById(mentorId: string): Promise<MentorRecord | undefined> {
  const db = await getVidyasetuDB();
  return db.get('mentors', mentorId);
}

async function fetchMentors(): Promise<MentorRecord[]> {
  const supabase = getSupabaseBrowserClient();

  if (!supabase) {
    return getCachedMentors();
  }

  try {
    const { data, error } = await supabase.from('mentors').select('*').order('full_name');

    if (error) {
      throw error;
    }

    const mentors = (data ?? []).map(mapMentor);
    await cacheMentors(mentors);

    return mentors;
  } catch (error) {
    const cachedMentors = await getCachedMentors();

    if (cachedMentors.length > 0) {
      return cachedMentors;
    }

    throw error;
  }
}

export function useMentors() {
  return useQuery({
    queryKey: ['mentors'],
    queryFn: fetchMentors,
  });
}

export function useMentor(mentorId: string) {
  return useQuery({
    queryKey: ['mentors', mentorId],
    queryFn: async (): Promise<MentorRecord | undefined> => {
      try {
        const supabase = getSupabaseBrowserClient();

        if (!supabase) {
          return getCachedMentorById(mentorId);
        }

        const { data, error } = await supabase
          .from('mentors')
          .select('*')
          .eq('id', mentorId)
          .maybeSingle();

        if (error) {
          throw error;
        }

        if (!data) {
          return getCachedMentorById(mentorId);
        }

        const mentor = mapMentor(data);
        await cacheMentors([mentor]);

        return mentor;
      } catch (error) {
        return getCachedMentorById(mentorId);
      }
    },
    enabled: mentorId.length > 0,
  });
}

