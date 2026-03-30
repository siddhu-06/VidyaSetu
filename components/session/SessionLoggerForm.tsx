'use client';

import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { NoteField } from '@/components/session/NoteField';
import { SkillRatingPicker } from '@/components/session/SkillRatingPicker';
import { StudentSelector } from '@/components/session/StudentSelector';
import { cacheTemplates, getCachedTemplateRecords } from '@/lib/db/templates';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { sessionFormSchema } from '@/lib/utils/validation';
import { useMentors } from '@/hooks/useMentors';
import { useSessionQueue } from '@/hooks/useSessionQueue';
import { useStudents } from '@/hooks/useStudents';
import type { SessionFormValues, SessionTemplateRecord, SkillDomain } from '@/types';

type FieldErrors = Partial<Record<string, string>>;

const defaultFormValues: SessionFormValues = {
  studentId: '',
  mentorId: '',
  templateId: null,
  sessionDate: new Date().toISOString().slice(0, 10),
  durationMinutes: 60,
  mode: 'offline',
  attendance: 'present',
  engagementLevel: 3,
  confidenceDelta: 0,
  notes: '',
  skillRatings: {
    reading: 3,
    comprehension: 3,
    writing: 3,
    arithmetic: 3,
    confidence: 3,
  },
};

export function SessionLoggerForm() {
  const { data: students = [], isLoading: isLoadingStudents } = useStudents();
  const { data: mentors = [] } = useMentors();
  const { addSessionToQueue, isSaving, queueMetrics } = useSessionQueue();
  const [templates, setTemplates] = useState<SessionTemplateRecord[]>([]);
  const [formValues, setFormValues] = useState<SessionFormValues>(defaultFormValues);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error' | 'info'; message: string } | null>(null);

  useEffect(() => {
    if (!formValues.mentorId && mentors[0]) {
      setFormValues((currentFormValues) => ({
        ...currentFormValues,
        mentorId: mentors[0].id,
      }));
    }
  }, [mentors, formValues.mentorId]);

  useEffect(() => {
    let isMounted = true;

    async function loadTemplates(): Promise<void> {
      try {
        const supabase = getSupabaseBrowserClient();

        if (!supabase) {
          const cachedTemplates = await getCachedTemplateRecords();

          if (isMounted) {
            setTemplates(cachedTemplates);
          }

          return;
        }

        const { data, error } = await supabase.from('session_templates').select('*').order('title');

        if (error) {
          throw error;
        }

        const nextTemplates = (data ?? []).map((template) => ({
          id: template.id,
          title: template.title,
          focusSkills: template.focus_skills as SessionTemplateRecord['focusSkills'],
          noteHint: template.note_hint,
          durationMinutes: template.duration_minutes,
          createdAt: template.created_at,
        }));

        await cacheTemplates(nextTemplates);

        if (isMounted) {
          setTemplates(nextTemplates);
        }
      } catch (error) {
        const cachedTemplates = await getCachedTemplateRecords();

        if (isMounted) {
          setTemplates(cachedTemplates);
        }
      }
    }

    void loadTemplates();

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedTemplate = templates.find((template) => template.id === formValues.templateId) ?? null;

  function updateSkillRating(domain: SkillDomain, rating: 1 | 2 | 3 | 4 | 5): void {
    setFormValues((currentFormValues) => ({
      ...currentFormValues,
      skillRatings: {
        ...currentFormValues.skillRatings,
        [domain]: rating,
      },
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setFieldErrors({});
    setFeedback(null);

    const parsedValues = sessionFormSchema.safeParse(formValues);

    if (!parsedValues.success) {
      const nextErrors = parsedValues.error.issues.reduce<FieldErrors>((accumulator, issue) => {
        const path = issue.path.join('.');
        accumulator[path] = issue.message;
        return accumulator;
      }, {});

      setFieldErrors(nextErrors);
      setFeedback({
        tone: 'error',
        message: 'Please fix the highlighted fields before saving the session.',
      });
      return;
    }

    try {
      await addSessionToQueue(parsedValues.data);
      setFeedback({
        tone: 'success',
        message: `Session stored offline. ${queueMetrics.queued + 1} log(s) are currently waiting to sync.`,
      });
      setFormValues((currentFormValues) => ({
        ...defaultFormValues,
        mentorId: currentFormValues.mentorId,
        sessionDate: new Date().toISOString().slice(0, 10),
      }));
    } catch (error) {
      setFeedback({
        tone: 'error',
        message: error instanceof Error ? error.message : 'Unable to save the session right now.',
      });
    }
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-slate-900 text-white">
        <CardTitle>60-second offline session logger</CardTitle>
        <CardDescription className="text-slate-300">
          Capture what happened, what the child needs next, and keep moving even without internet.
        </CardDescription>
      </CardHeader>
      <form onSubmit={(event) => void handleSubmit(event)}>
        <CardContent className="grid gap-6">
          <div className="grid gap-4 md:grid-cols-2">
            <StudentSelector
              students={students}
              value={formValues.studentId}
              onChange={(studentId) => setFormValues((currentFormValues) => ({ ...currentFormValues, studentId }))}
              isLoading={isLoadingStudents}
            />
            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-700">Mentor</span>
              <select
                className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-emerald-500"
                value={formValues.mentorId}
                onChange={(event) =>
                  setFormValues((currentFormValues) => ({
                    ...currentFormValues,
                    mentorId: event.target.value,
                  }))
                }
              >
                <option value="">Choose a mentor</option>
                {mentors.map((mentor) => (
                  <option key={mentor.id} value={mentor.id}>
                    {mentor.fullName}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-700">Date</span>
              <input
                className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-emerald-500"
                type="date"
                value={formValues.sessionDate}
                onChange={(event) =>
                  setFormValues((currentFormValues) => ({
                    ...currentFormValues,
                    sessionDate: event.target.value,
                  }))
                }
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-700">Duration</span>
              <input
                className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-emerald-500"
                type="number"
                min={15}
                max={180}
                step={15}
                value={formValues.durationMinutes}
                onChange={(event) =>
                  setFormValues((currentFormValues) => ({
                    ...currentFormValues,
                    durationMinutes: Number(event.target.value),
                  }))
                }
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-700">Attendance</span>
              <select
                className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-emerald-500"
                value={formValues.attendance}
                onChange={(event) =>
                  setFormValues((currentFormValues) => ({
                    ...currentFormValues,
                    attendance: event.target.value as SessionFormValues['attendance'],
                  }))
                }
              >
                <option value="present">Present</option>
                <option value="late">Late</option>
                <option value="absent">Absent</option>
              </select>
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-700">Mode</span>
              <select
                className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-emerald-500"
                value={formValues.mode}
                onChange={(event) =>
                  setFormValues((currentFormValues) => ({
                    ...currentFormValues,
                    mode: event.target.value as SessionFormValues['mode'],
                  }))
                }
              >
                <option value="offline">Offline</option>
                <option value="home-visit">Home visit</option>
                <option value="phone">Phone</option>
                <option value="online">Online</option>
              </select>
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-700">Session template</span>
              <select
                className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-emerald-500"
                value={formValues.templateId ?? ''}
                onChange={(event) =>
                  setFormValues((currentFormValues) => ({
                    ...currentFormValues,
                    templateId: event.target.value || null,
                  }))
                }
              >
                <option value="">No template</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-700">Engagement level</span>
              <input
                className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-emerald-500"
                type="range"
                min={1}
                max={5}
                value={formValues.engagementLevel}
                onChange={(event) =>
                  setFormValues((currentFormValues) => ({
                    ...currentFormValues,
                    engagementLevel: Number(event.target.value) as SessionFormValues['engagementLevel'],
                  }))
                }
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-700">Confidence change</span>
              <select
                className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-emerald-500"
                value={formValues.confidenceDelta}
                onChange={(event) =>
                  setFormValues((currentFormValues) => ({
                    ...currentFormValues,
                    confidenceDelta: Number(event.target.value) as SessionFormValues['confidenceDelta'],
                  }))
                }
              >
                <option value={-2}>Dropped sharply</option>
                <option value={-1}>Dropped slightly</option>
                <option value={0}>No change</option>
                <option value={1}>Improved</option>
                <option value={2}>Improved strongly</option>
              </select>
            </label>
          </div>

          {selectedTemplate ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              <p className="font-semibold">{selectedTemplate.title}</p>
              <p className="mt-1">
                Focus skills: {selectedTemplate.focusSkills.join(', ')} · Suggested duration {selectedTemplate.durationMinutes} minutes
              </p>
            </div>
          ) : null}

          <SkillRatingPicker values={formValues.skillRatings} onChange={updateSkillRating} />

          <NoteField
            value={formValues.notes}
            onChange={(notes) => setFormValues((currentFormValues) => ({ ...currentFormValues, notes }))}
            placeholder={selectedTemplate?.noteHint}
          />

          {Object.keys(fieldErrors).length > 0 ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              {Object.values(fieldErrors).join(' ')}
            </div>
          ) : null}

          {feedback ? (
            <div
              className={
                feedback.tone === 'success'
                  ? 'rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900'
                  : 'rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800'
              }
            >
              {feedback.message}
            </div>
          ) : null}
        </CardContent>
        <CardFooter className="justify-between border-t border-slate-100 pt-6">
          <p className="text-sm text-slate-500">
            Pending sync queue: {queueMetrics.queued} session(s)
          </p>
          <Button type="submit" isLoading={isSaving}>
            Save offline
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
