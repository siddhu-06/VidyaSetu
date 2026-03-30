'use client';

import { useMemo } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import type { Mentor } from '@/types';

interface VolunteerLeaderboardProps {
  mentors: Mentor[];
}

function getRankBadgeClass(rank: number): string {
  if (rank === 1) {
    return 'bg-yellow-400 text-yellow-950';
  }

  if (rank === 2) {
    return 'bg-slate-300 text-slate-900';
  }

  if (rank === 3) {
    return 'bg-amber-700 text-white';
  }

  return 'bg-zinc-800 text-zinc-100';
}

export function VolunteerLeaderboard({ mentors }: VolunteerLeaderboardProps) {
  const rankedMentors = useMemo(
    () =>
      [...mentors]
        .sort((left, right) => right.session_count - left.session_count)
        .map((mentor, index) => ({
          mentor,
          rank: index + 1,
        })),
    [mentors],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Volunteer leaderboard</CardTitle>
        <CardDescription>
          Ranked by sessions delivered this month, with average learner improvement alongside.
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="text-left text-slate-500">
            <tr>
              <th className="px-2 py-3 font-semibold">Rank</th>
              <th className="px-2 py-3 font-semibold">Mentor Name</th>
              <th className="px-2 py-3 font-semibold">Sessions</th>
              <th className="px-2 py-3 font-semibold">Avg Improvement</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rankedMentors.map(({ mentor, rank }) => (
              <tr key={mentor.id} className="text-slate-700">
                <td className="px-2 py-4">
                  <span
                    className={`inline-flex min-w-10 items-center justify-center rounded-full px-3 py-1 text-xs font-bold ${getRankBadgeClass(rank)}`}
                  >
                    {rank}
                  </span>
                </td>
                <td className="px-2 py-4 font-semibold text-slate-900">{mentor.name}</td>
                <td className="px-2 py-4">{mentor.session_count}</td>
                <td className="px-2 py-4">{Math.round(mentor.avg_student_improvement * 100)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
