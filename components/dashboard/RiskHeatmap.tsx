'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import type { RiskColor, Student } from '@/types';

interface RiskHeatmapProps {
  students: Student[];
}

type RiskFilter = 'all' | RiskColor;

function getCardTone(riskColor: RiskColor): string {
  if (riskColor === 'red') {
    return 'border-red-700 bg-red-950';
  }

  if (riskColor === 'amber') {
    return 'border-amber-700 bg-amber-950';
  }

  return 'border-green-700 bg-green-950';
}

function getDaysSinceLastSession(value: string | null): string {
  if (!value) {
    return 'No session yet';
  }

  const diffInMs = Date.now() - new Date(value).getTime();
  const diffInDays = Math.max(0, Math.floor(diffInMs / (1000 * 60 * 60 * 24)));
  return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
}

const riskOrder: Record<RiskColor, number> = {
  red: 0,
  amber: 1,
  green: 2,
};

export function RiskHeatmap({ students }: RiskHeatmapProps) {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<RiskFilter>('all');

  const filteredStudents = useMemo(() => {
    return [...students]
      .filter((student) => activeFilter === 'all' || student.risk_color === activeFilter)
      .sort((left, right) => {
        const riskDifference = riskOrder[left.risk_color] - riskOrder[right.risk_color];

        if (riskDifference !== 0) {
          return riskDifference;
        }

        return right.risk_score - left.risk_score;
      });
  }, [activeFilter, students]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Risk heatmap</CardTitle>
        <CardDescription>
          Students sorted from highest intervention need to safest learning status.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'All', value: 'all' as const },
            { label: 'Red Only', value: 'red' as const },
            { label: 'Amber', value: 'amber' as const },
            { label: 'Green', value: 'green' as const },
          ].map((filter) => (
            <Button
              key={filter.value}
              type="button"
              size="sm"
              variant={activeFilter === filter.value ? 'primary' : 'secondary'}
              onClick={() => setActiveFilter(filter.value)}
            >
              {filter.label}
            </Button>
          ))}
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filteredStudents.map((student) => (
            <button
              key={student.id}
              type="button"
              className={`rounded-2xl border p-4 text-left text-white transition hover:-translate-y-0.5 ${getCardTone(student.risk_color)}`}
              onClick={() => router.push(`/students/${student.id}`)}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-base font-semibold">{student.name}</p>
                  <p className="mt-1 text-sm text-white/75">Grade {student.grade}</p>
                </div>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]">
                  {Math.round(student.risk_score * 100)}%
                </span>
              </div>
              <p className="mt-4 text-sm text-white/80">
                Last session: {getDaysSinceLastSession(student.last_session_at)}
              </p>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
