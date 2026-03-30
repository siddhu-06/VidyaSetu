'use client';

import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils/cn';
import type { SkillDomain, SkillRatings, SkillScore } from '@/types';

const labels: Record<SkillDomain, string> = {
  reading: 'Reading',
  comprehension: 'Comprehension',
  writing: 'Writing',
  arithmetic: 'Arithmetic',
  confidence: 'Confidence',
};

const scoreLabels: Record<SkillScore, string> = {
  1: 'Critical support',
  2: 'Emerging',
  3: 'Needs coaching',
  4: 'Steady',
  5: 'Strong',
};

interface SkillRatingPickerProps {
  values: SkillRatings;
  onChange: (domain: SkillDomain, rating: SkillScore) => void;
}

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

