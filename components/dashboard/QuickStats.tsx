import type { DashboardStats } from '@/types';

interface QuickStatsProps {
  stats: DashboardStats;
}

interface StatCard {
  label: string;
  value: string;
  trend?: string;
}

function toPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function buildStatCards(stats: DashboardStats): StatCard[] {
  return [
    {
      label: 'Total Students',
      value: String(stats.totalStudents),
      trend: stats.totalStudents > 0 ? '^ Reach growing' : undefined,
    },
    {
      label: 'Active Mentors',
      value: String(stats.activeMentors),
      trend: stats.activeMentors > 0 ? '^ Volunteer capacity live' : undefined,
    },
    {
      label: 'Sessions This Month',
      value: String(stats.sessionsThisMonth),
      trend: stats.sessionsThisMonth > 0 ? '^ Fresh session evidence' : undefined,
    },
    {
      label: 'Avg Risk Score',
      value: toPercent(stats.avgRiskScore),
      trend: stats.avgRiskScore <= 0.5 ? 'v Lower is better' : '^ Needs attention',
    },
  ];
}

export function QuickStats({ stats }: QuickStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {buildStatCards(stats).map((card) => (
        <div
          key={card.label}
          className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 text-white"
        >
          <p className="text-sm uppercase tracking-[0.18em] text-zinc-400">{card.label}</p>
          <p className="mt-4 text-4xl font-semibold text-white">{card.value}</p>
          {card.trend ? (
            <p className="mt-3 text-xs font-medium text-lime-300">{card.trend}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}
