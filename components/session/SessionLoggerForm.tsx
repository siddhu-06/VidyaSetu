'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { NoteField } from '@/components/session/NoteField';
import { SkillRatingPicker } from '@/components/session/SkillRatingPicker';
import { StudentSelector } from '@/components/session/StudentSelector';
import { checkStorageQuota, getVidyasetuDB } from '@/lib/db';
import { getCachedStudent } from '@/lib/db/students';
import { queueSession } from '@/lib/db/sessions';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { drainQueue } from '@/lib/sync/syncEngine';
import { sessionFormSchema, type SessionFormValues } from '@/lib/utils/validation';
import {
  SUBJECTS,
  SUBJECT_LABELS,
  SKILL_RATING_LABELS,
  type QueuedSession,
  type SkillRating,
  type Student,
  type Subject,
} from '@/types';

type WizardStep = 1 | 2 | 3 | 4;
type ErrorKey = 'student_id' | 'skill_ratings' | 'note' | 'session_date' | 'mentor';
type FieldErrors = Partial<Record<ErrorKey, string>>;

interface ToastState {
  tone: 'success' | 'warning' | 'error';
  message: string;
}

interface MentorIdentity {
  id: string;
  name: string;
}

interface MentorCacheRow {
  id: string;
  fullName: string;
}

interface MentorRow {
  id: string;
  name: string;
  user_id: string | null;
  active: boolean;
}

const defaultSkillRatings: SessionFormValues['skill_ratings'] = {
  math: 'not_covered',
  reading: 'not_covered',
  science: 'not_covered',
  english: 'not_covered',
  comprehension: 'not_covered',
};

const defaultFormValues: SessionFormValues = {
  student_id: '',
  skill_ratings: defaultSkillRatings,
  note: '',
  session_date: new Date().toISOString().slice(0, 10),
};

function getStepLabel(step: WizardStep): string {
  return `Step ${step}/4`;
}

async function readCachedMentorIdentity(): Promise<MentorIdentity | null> {
  try {
    const db = await getVidyasetuDB();
    const cachedMentors = await db.getAll('mentors');
    const firstMentor = (cachedMentors as MentorCacheRow[])[0];

    return firstMentor
      ? {
          id: firstMentor.id,
          name: firstMentor.fullName,
        }
      : null;
  } catch {
    return null;
  }
}

async function readSupabaseMentorIdentity(): Promise<MentorIdentity | null> {
  const supabase = getSupabaseBrowserClient();

  if (!supabase) {
    return null;
  }

  const mentorsQuery = supabase.from('mentors') as unknown as {
    select(query: string): {
      order(
        column: string,
        options?: { ascending?: boolean },
      ): Promise<{ data: MentorRow[] | null; error: { message: string } | null }>;
    };
  };

  const [{ data: authData, error: authError }, { data: mentorRows, error: mentorError }] =
    await Promise.all([
      supabase.auth.getSession(),
      mentorsQuery.select('id,name,user_id,active').order('name'),
    ]);

  if (authError) {
    throw new Error(authError.message);
  }

  if (mentorError) {
    throw new Error(mentorError.message);
  }

  const activeMentors = (mentorRows ?? []).filter((mentor) => mentor.active);

  if (activeMentors.length === 0) {
    return null;
  }

  const currentUserId = authData.session?.user.id ?? null;
  const matchedMentor = currentUserId
    ? activeMentors.find((mentor) => mentor.user_id === currentUserId)
    : null;
  const resolvedMentor = matchedMentor ?? activeMentors[0];

  return {
    id: resolvedMentor.id,
    name: resolvedMentor.name,
  };
}

export function SessionLoggerForm() {
  const router = useRouter();
  const [step, setStep] = useState<WizardStep>(1);
  const [formValues, setFormValues] = useState<SessionFormValues>({
    ...defaultFormValues,
    skill_ratings: { ...defaultSkillRatings },
  });
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [mentorIdentity, setMentorIdentity] = useState<MentorIdentity | null>(null);
  const [isLoadingMentor, setIsLoadingMentor] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadMentorIdentity(): Promise<void> {
      try {
        setIsLoadingMentor(true);

        const cachedMentor = await readCachedMentorIdentity();

        if (cachedMentor && isMounted) {
          setMentorIdentity(cachedMentor);
        }

        if (navigator.onLine) {
          const liveMentor = await readSupabaseMentorIdentity();

          if (liveMentor && isMounted) {
            setMentorIdentity(liveMentor);
          }
        }
      } catch (error) {
        if (isMounted) {
          setFieldErrors((currentErrors) => ({
            ...currentErrors,
            mentor: error instanceof Error ? error.message : 'Unable to resolve a mentor profile.',
          }));
        }
      } finally {
        if (isMounted) {
          setIsLoadingMentor(false);
        }
      }
    }

    void loadMentorIdentity();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadSelectedStudent(): Promise<void> {
      if (!formValues.student_id) {
        setSelectedStudent(null);
        return;
      }

      const cachedStudent = await getCachedStudent(formValues.student_id);

      if (!cachedStudent || !isMounted) {
        return;
      }

      const { cached_at, ...student } = cachedStudent;
      void cached_at;
      setSelectedStudent(student);
    }

    void loadSelectedStudent();

    return () => {
      isMounted = false;
    };
  }, [formValues.student_id]);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setToast(null);
    }, 4000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [toast]);

  const coveredSubjects = useMemo(
    () =>
      SUBJECTS.filter((subject) => (formValues.skill_ratings[subject] ?? 'not_covered') !== 'not_covered'),
    [formValues.skill_ratings],
  );

  function getStepErrors(targetStep: WizardStep): FieldErrors {
    const parsedForm = sessionFormSchema.safeParse(formValues);

    if (parsedForm.success) {
      return {};
    }

    const relevantFields: ErrorKey[] =
      targetStep === 1
        ? ['student_id']
        : targetStep === 2
          ? ['skill_ratings']
          : targetStep === 3
            ? ['note', 'session_date']
            : ['student_id', 'skill_ratings', 'note', 'session_date'];

    return parsedForm.error.issues.reduce<FieldErrors>((accumulator, issue) => {
      const fieldName = issue.path[0];

      if (typeof fieldName === 'string' && relevantFields.includes(fieldName as ErrorKey)) {
        accumulator[fieldName as ErrorKey] = issue.message;
      }

      return accumulator;
    }, {});
  }

  function clearError(key: ErrorKey): void {
    setFieldErrors((currentErrors) => {
      const nextErrors = { ...currentErrors };
      delete nextErrors[key];
      return nextErrors;
    });
  }

  function handleStudentChange(studentId: string): void {
    setFormValues((currentValues) => ({
      ...currentValues,
      student_id: studentId,
    }));
    clearError('student_id');
  }

  function handleSkillRatingsChange(ratings: Partial<Record<Subject, SkillRating>>): void {
    setFormValues((currentValues) => ({
      ...currentValues,
      skill_ratings: {
        ...currentValues.skill_ratings,
        ...ratings,
      },
    }));
    clearError('skill_ratings');
  }

  function handleNoteChange(note: string): void {
    setFormValues((currentValues) => ({
      ...currentValues,
      note,
    }));
    clearError('note');
  }

  function handleSessionDateChange(sessionDate: string): void {
    setFormValues((currentValues) => ({
      ...currentValues,
      session_date: sessionDate,
    }));
    clearError('session_date');
  }

  function handleNextStep(): void {
    const nextErrors = getStepErrors(step);

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors((currentErrors) => ({
        ...currentErrors,
        ...nextErrors,
      }));
      return;
    }

    setStep((currentStep) => (currentStep < 4 ? ((currentStep + 1) as WizardStep) : currentStep));
  }

  function handlePreviousStep(): void {
    setStep((currentStep) => (currentStep > 1 ? ((currentStep - 1) as WizardStep) : currentStep));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setFieldErrors({});
    setToast(null);

    const parsedForm = sessionFormSchema.safeParse(formValues);

    if (!parsedForm.success) {
      setFieldErrors(getStepErrors(4));
      setToast({
        tone: 'error',
        message: 'Please fix the highlighted fields before saving the session.',
      });
      return;
    }

    if (!mentorIdentity) {
      setFieldErrors({
        mentor: 'No mentor profile is available on this device yet.',
      });
      setToast({
        tone: 'error',
        message: 'A mentor profile is required before you can save a session.',
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const quota = await checkStorageQuota();

      if (quota.percentUsed > 90) {
        setToast({
          tone: 'error',
          message: 'Device storage is above 90%. Please sync or clear space before logging another session.',
        });
        return;
      }

      const createdAt = new Date().toISOString();
      const queuedSession: Omit<
        QueuedSession,
        'sync_attempts' | 'sync_failed' | 'queued_at' | 'last_attempt_at' | 'error_message'
      > = {
        student_id: parsedForm.data.student_id,
        mentor_id: mentorIdentity.id,
        session_date: parsedForm.data.session_date,
        subjects_covered: coveredSubjects,
        skill_ratings: parsedForm.data.skill_ratings,
        note: parsedForm.data.note.trim(),
        raw_tags: [],
        synced: false,
        synced_at: null,
        created_at: createdAt,
        offline_id: crypto.randomUUID(),
      };

      await queueSession(queuedSession);

      let syncedImmediately = false;

      if (navigator.onLine) {
        const syncResult = await drainQueue();
        syncedImmediately = syncResult.synced > 0;
      }

      setToast({
        tone: syncedImmediately ? 'success' : 'warning',
        message: syncedImmediately ? 'Session saved ?' : 'Session saved ? and queued for sync',
      });

      setFormValues({
        ...defaultFormValues,
        skill_ratings: { ...defaultSkillRatings },
        session_date: new Date().toISOString().slice(0, 10),
      });
      setSelectedStudent(null);
      setStep(1);
      router.replace('/session');
    } catch (error) {
      setToast({
        tone: 'error',
        message: error instanceof Error ? error.message : 'Unable to save the session right now.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="relative">
      {toast ? (
        <div
          aria-live="polite"
          className={`fixed right-4 top-4 z-50 rounded-2xl border px-4 py-3 text-sm shadow-lg ${
            toast.tone === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
              : toast.tone === 'warning'
                ? 'border-amber-200 bg-amber-50 text-amber-900'
                : 'border-rose-200 bg-rose-50 text-rose-900'
          }`}
        >
          {toast.message}
        </div>
      ) : null}

      <Card className="overflow-hidden">
        <CardHeader className="bg-slate-900 text-white">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-emerald-300">{getStepLabel(step)}</p>
              <CardTitle className="mt-2 text-white">60-second offline session logger</CardTitle>
              <CardDescription className="text-slate-300">
                Capture one tutoring session, store it safely offline, and sync when the device reconnects.
              </CardDescription>
            </div>
            <div className="grid w-full max-w-xs grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((item) => (
                <span
                  key={item}
                  className={`h-2 rounded-full ${item <= step ? 'bg-emerald-400' : 'bg-white/20'}`}
                />
              ))}
            </div>
          </div>
        </CardHeader>
        <form onSubmit={(event) => void handleSubmit(event)}>
          <CardContent className="grid gap-6">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              {isLoadingMentor
                ? 'Resolving mentor profile for this device...'
                : mentorIdentity
                  ? `Saving this session as ${mentorIdentity.name}.`
                  : 'No mentor profile is available yet on this device.'}
            </div>

            {fieldErrors.mentor ? <p className="text-sm text-rose-700">{fieldErrors.mentor}</p> : null}

            {step === 1 ? (
              <div className="grid gap-3">
                <StudentSelector value={formValues.student_id || null} onChange={handleStudentChange} />
                {fieldErrors.student_id ? <p className="text-sm text-rose-700">{fieldErrors.student_id}</p> : null}
              </div>
            ) : null}

            {step === 2 ? (
              <div className="grid gap-3">
                <SkillRatingPicker value={formValues.skill_ratings} onChange={handleSkillRatingsChange} />
                {fieldErrors.skill_ratings ? (
                  <p className="text-sm text-rose-700">{fieldErrors.skill_ratings}</p>
                ) : null}
              </div>
            ) : null}

            {step === 3 ? (
              <div className="grid gap-4">
                <NoteField value={formValues.note} onChange={handleNoteChange} />
                {fieldErrors.note ? <p className="text-sm text-rose-700">{fieldErrors.note}</p> : null}
                <label className="grid gap-2">
                  <span className="text-sm font-medium text-slate-700">Session date</span>
                  <input
                    className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-emerald-500"
                    type="date"
                    value={formValues.session_date}
                    onChange={(event) => handleSessionDateChange(event.target.value)}
                  />
                </label>
                {fieldErrors.session_date ? (
                  <p className="text-sm text-rose-700">{fieldErrors.session_date}</p>
                ) : null}
              </div>
            ) : null}

            {step === 4 ? (
              <div className="grid gap-4">
                <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
                    Confirm session
                  </p>
                  <div className="mt-4 grid gap-3 text-sm text-emerald-950">
                    <p>
                      <span className="font-semibold">Student:</span>{' '}
                      {selectedStudent ? selectedStudent.name : formValues.student_id || 'Not selected'}
                    </p>
                    <p>
                      <span className="font-semibold">Mentor:</span> {mentorIdentity?.name ?? 'Unavailable'}
                    </p>
                    <p>
                      <span className="font-semibold">Date:</span> {formValues.session_date}
                    </p>
                    <p>
                      <span className="font-semibold">Subjects covered:</span>{' '}
                      {coveredSubjects.length > 0
                        ? coveredSubjects
                            .map(
                              (subject) =>
                                `${SUBJECT_LABELS[subject]} (${SKILL_RATING_LABELS[formValues.skill_ratings[subject] ?? 'not_covered']})`,
                            )
                            .join(', ')
                        : 'No subjects rated yet'}
                    </p>
                    <p>
                      <span className="font-semibold">Note:</span>{' '}
                      {formValues.note.trim() || 'No note added for this session.'}
                    </p>
                  </div>
                </div>

                {(fieldErrors.student_id ||
                  fieldErrors.skill_ratings ||
                  fieldErrors.note ||
                  fieldErrors.session_date) ? (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
                    {[fieldErrors.student_id, fieldErrors.skill_ratings, fieldErrors.note, fieldErrors.session_date]
                      .filter(Boolean)
                      .join(' ')}
                  </div>
                ) : null}
              </div>
            ) : null}
          </CardContent>
          <CardFooter className="justify-between border-t border-slate-100 pt-6">
            <Button type="button" variant="secondary" onClick={handlePreviousStep} disabled={step === 1}>
              Back
            </Button>
            {step < 4 ? (
              <Button type="button" onClick={handleNextStep}>
                Next
              </Button>
            ) : (
              <Button type="submit" isLoading={isSubmitting}>
                Save session
              </Button>
            )}
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
