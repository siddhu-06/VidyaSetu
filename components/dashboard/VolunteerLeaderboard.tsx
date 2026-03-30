import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import type { LeaderboardEntry } from '@/types';

interface VolunteerLeaderboardProps {
  entries: LeaderboardEntry[];
}

export function VolunteerLeaderboard({ entries }: VolunteerLeaderboardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Volunteer leaderboard</CardTitle>
        <CardDescription>Reward consistency, not just raw volume, so the right habits compound.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {entries.map((entry) => (
          <div
            key={entry.mentorId}
            className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 md:grid-cols-[auto_1fr_auto]"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-lg font-semibold text-white">
              {entry.rank}
            </div>
            <div>
              <p className="font-semibold text-slate-900">{entry.mentorName}</p>
              <p className="text-sm text-slate-500">
                {entry.sessionsCompleted} sessions · {entry.consistencyScore}% consistency · {entry.averageStudentGrowth}% growth
              </p>
            </div>
            <div className="flex items-center">
              <Badge tone={entry.rank <= 3 ? 'success' : 'info'}>{entry.badgeLabel}</Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

