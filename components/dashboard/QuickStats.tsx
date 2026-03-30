import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import type { DashboardStats } from '@/types';

interface QuickStatsProps {
  stats: DashboardStats;
}

const statItems = (stats: DashboardStats) => [
  {
    label: 'Active students',
    value: stats.activeStudents,
    detail: 'Children currently tracked by the program',
  },
  {
    label: 'Active mentors',
    value: stats.activeMentors,
    detail: 'Volunteers contributing this cycle',
  },
  {
    label: 'Sessions this week',
    value: stats.sessionsThisWeek,
    detail: 'Fresh session evidence submitted',
  },
  {
    label: 'Average attendance',
    value: `${stats.averageAttendance}%`,
    detail: 'Attendance across active learners',
  },
];

export function QuickStats({ stats }: QuickStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {statItems(stats).map((item) => (
        <Card key={item.label}>
          <CardHeader>
            <CardDescription>{item.label}</CardDescription>
            <CardTitle className="text-3xl">{item.value}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-sm text-slate-500">{item.detail}</CardContent>
        </Card>
      ))}
    </div>
  );
}

