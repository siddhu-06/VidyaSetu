'use client';

import { useParams } from 'next/navigation';

import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { useMentor } from '@/hooks/useMentors';
import { useRealtimeDashboard } from '@/hooks/useRealtimeDashboard';

export default function MentorProfilePage() {
  const params = useParams<{ id: string }>();
  const mentorQuery = useMentor(params.id);
  const dashboardQuery = useRealtimeDashboard();

  if (mentorQuery.isLoading || dashboardQuery.isLoading) {
    return <SkeletonCard />;
  }

  if (!mentorQuery.data) {
    return (
      <EmptyState
        title="Mentor not found"
        description="This mentor may not be cached yet or may be missing from Supabase."
      />
    );
  }

  const leaderboardEntry = dashboardQuery.data?.leaderboard.find(
    (entry) => entry.mentorId === mentorQuery.data?.id,
  );

  return (
    <div className="grid gap-6">
      <div>
        <p className="text-sm uppercase tracking-[0.24em] text-emerald-700">Mentor profile</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">{mentorQuery.data.fullName}</h1>
        <p className="mt-2 text-sm text-slate-600">
          {mentorQuery.data.languages.join(', ').toUpperCase()} · Focus grades {mentorQuery.data.focusGrades.join(', ')}
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Leaderboard rank</CardDescription>
            <CardTitle>{leaderboardEntry?.rank ?? '-'}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Sessions completed</CardDescription>
            <CardTitle>{mentorQuery.data.sessionsCompleted}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Consistency score</CardDescription>
            <CardTitle>{mentorQuery.data.consistencyScore}%</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Weekly capacity</CardDescription>
            <CardTitle>{mentorQuery.data.weeklyCapacity}</CardTitle>
          </CardHeader>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Operational footprint</CardTitle>
          <CardDescription>Use this profile to understand where the mentor is strongest.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Localities served</p>
            <p className="mt-1 font-semibold text-slate-900">{mentorQuery.data.localities.join(', ')}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Teaching + empathy</p>
            <p className="mt-1 font-semibold text-slate-900">
              {mentorQuery.data.teachingScore}% teaching · {mentorQuery.data.empathyScore}% empathy
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

