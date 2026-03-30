'use client';

import { CSRReportButton } from '@/components/dashboard/CSRReportButton';
import { FoundationPulse } from '@/components/dashboard/FoundationPulse';
import { QuickStats } from '@/components/dashboard/QuickStats';
import { RiskHeatmap } from '@/components/dashboard/RiskHeatmap';
import { VolunteerLeaderboard } from '@/components/dashboard/VolunteerLeaderboard';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { useRealtimeDashboard } from '@/hooks/useRealtimeDashboard';
import { useStudents } from '@/hooks/useStudents';

export default function DashboardPage() {
  const dashboardQuery = useRealtimeDashboard();
  const studentsQuery = useStudents();

  if (dashboardQuery.isLoading || studentsQuery.isLoading || !dashboardQuery.data) {
    return <SkeletonCard />;
  }

  const reportData = {
    ngoName: 'Youngistaan Foundation',
    donorName: 'Synchrony',
    reportingWindow: 'Last 8 weeks',
    generatedAt: new Date().toISOString(),
    stats: dashboardQuery.data.stats,
    heatmap: dashboardQuery.data.heatmap,
    pulse: dashboardQuery.data.pulse,
    leaderboard: dashboardQuery.data.leaderboard,
    stories: (studentsQuery.data ?? []).slice(0, 3).map((student, index) => ({
      title: index === 0 ? 'Attendance stabilized' : index === 1 ? 'Reading confidence grew' : 'Portable continuity restored',
      body:
        index === 0
          ? `${student.fullName} now has a visible attendance trail, helping the NGO intervene before dropout risk rises.`
          : index === 1
            ? `${student.fullName}'s passport shows clearer weekly progress, giving volunteers and donors shared evidence.`
            : `${student.fullName}'s record can travel with the family through migration using a public learning passport.`,
      studentName: student.fullName,
    })),
  };

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-emerald-700">Coordinator dashboard</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">Foundation Pulse</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            See learning risk, volunteer momentum, and CSR-ready evidence in one operational view.
          </p>
        </div>
        <CSRReportButton data={reportData} />
      </div>
      <QuickStats stats={dashboardQuery.data.stats} />
      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <FoundationPulse points={dashboardQuery.data.pulse} />
        <RiskHeatmap cells={dashboardQuery.data.heatmap} />
      </div>
      <VolunteerLeaderboard entries={dashboardQuery.data.leaderboard} />
    </div>
  );
}

