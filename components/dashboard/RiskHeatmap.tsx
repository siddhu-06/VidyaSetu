import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import type { DashboardHeatmapCell } from '@/types';

interface RiskHeatmapProps {
  cells: DashboardHeatmapCell[];
}

function getIntensityClass(intensity: number): string {
  if (intensity >= 75) {
    return 'bg-rose-500 text-white';
  }

  if (intensity >= 50) {
    return 'bg-amber-400 text-slate-900';
  }

  if (intensity >= 25) {
    return 'bg-emerald-300 text-slate-900';
  }

  return 'bg-slate-100 text-slate-700';
}

export function RiskHeatmap({ cells }: RiskHeatmapProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Risk heatmap</CardTitle>
        <CardDescription>Which locality-grade clusters need coordinator intervention first.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {cells.map((cell) => (
          <div
            key={`${cell.locality}-${cell.grade}`}
            className={`rounded-2xl p-4 ${getIntensityClass(cell.intensity)}`}
          >
            <p className="text-sm font-semibold">
              {cell.locality} · Grade {cell.grade}
            </p>
            <p className="mt-2 text-3xl font-semibold">{cell.riskCount}</p>
            <p className="mt-1 text-sm opacity-90">
              {cell.totalStudents} tracked students · {cell.intensity}% intensity
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

