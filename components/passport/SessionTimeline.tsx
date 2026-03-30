import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatDate } from '@/lib/utils/date';
import type { PassportTimelinePoint } from '@/types';

interface SessionTimelineProps {
  timeline: PassportTimelinePoint[];
}

export function SessionTimeline({ timeline }: SessionTimelineProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Session timeline</CardTitle>
        <CardDescription>A lightweight history of attendance, notes and flagged gaps.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {timeline.map((entry) => (
          <div key={entry.id} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-slate-900">{formatDate(entry.sessionDate)}</p>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{entry.attendance}</p>
            </div>
            <p className="mt-2 text-sm text-slate-700">{entry.notes}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {entry.learningGaps.map((gap) => (
                <span
                  key={`${entry.id}-${gap}`}
                  className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800"
                >
                  {gap}
                </span>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

