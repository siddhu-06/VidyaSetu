'use client';

import { SUBJECTS, SUBJECT_LABELS, SKILL_RATING_LABELS, type SkillRating, type Subject } from '@/types';

interface SkillRatingPickerProps {
  value: Partial<Record<Subject, SkillRating>>;
  onChange: (ratings: Partial<Record<Subject, SkillRating>>) => void;
}

/*
export function SkillRatingPicker({ values, onChange }: SkillRatingPickerProps) {
  return (
    <div className="grid gap-4">
      {Object.entries(labels).map(([domain, label]) => {
        const typedDomain = domain as SkillDomain;
        const activeRating = values[typedDomain];

        return (
          <div key={typedDomain} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">{label}</p>
                <p className="text-xs text-slate-500">Rate the learner’s current momentum in this skill.</p>
              </div>
              <Badge tone={activeRating >= 4 ? 'success' : activeRating <= 2 ? 'warning' : 'info'}>
                {scoreLabels[activeRating]}
              </Badge>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map((score) => {
                const typedScore = score as SkillScore;

                return (
                  <button
                    key={score}
                    type="button"
                    className={cn(
                      'rounded-2xl border px-3 py-3 text-sm font-semibold transition',
                      activeRating === typedScore
                        ? 'border-emerald-600 bg-emerald-600 text-white'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-300',
                    )}
                    onClick={() => onChange(typedDomain, typedScore)}
                  >
                    {score}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
*/

const OPTIONS: SkillRating[] = ['improving', 'steady', 'not_covered'];

function getActiveClass(option: SkillRating, active: boolean): string {
  if (!active) {
    return 'border border-slate-200 bg-white text-slate-700 hover:border-slate-300';
  }

  if (option === 'improving') {
    return 'bg-lime-400 text-black';
  }

  if (option === 'steady') {
    return 'bg-blue-500 text-white';
  }

  return 'bg-zinc-700 text-zinc-300';
}

export function SkillRatingPicker({ value, onChange }: SkillRatingPickerProps) {
  return (
    <div className="grid gap-4">
      {SUBJECTS.map((subject) => {
        const activeRating = value[subject] ?? 'not_covered';

        return (
          <div key={subject} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">{SUBJECT_LABELS[subject]}</p>
                <p className="text-xs text-slate-500">Choose the best subject status for today’s session.</p>
              </div>
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                {SKILL_RATING_LABELS[activeRating]}
              </span>
            </div>
            <div className="grid gap-2 md:grid-cols-3">
              {OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`rounded-full px-4 py-3 text-sm font-semibold transition ${getActiveClass(option, activeRating === option)}`}
                  onClick={() =>
                    onChange({
                      ...value,
                      [subject]: option,
                    })
                  }
                >
                  {SKILL_RATING_LABELS[option]}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
