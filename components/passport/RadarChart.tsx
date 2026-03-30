'use client';

import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart as RechartsRadarChart,
  ResponsiveContainer,
} from 'recharts';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import type { PassportSkillPoint } from '@/types';

interface RadarChartProps {
  points: PassportSkillPoint[];
}

export function RadarChart({ points }: RadarChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Skill radar</CardTitle>
        <CardDescription>Baseline vs current learning profile across five core signals.</CardDescription>
      </CardHeader>
      <CardContent className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsRadarChart data={points}>
            <PolarGrid stroke="#cbd5e1" />
            <PolarAngleAxis dataKey="subject" stroke="#334155" />
            <Radar
              name="Current"
              dataKey="current"
              stroke="#059669"
              fill="#34d399"
              fillOpacity={0.45}
            />
            <Radar
              name="Baseline"
              dataKey="baseline"
              stroke="#0f172a"
              fill="#94a3b8"
              fillOpacity={0.15}
            />
          </RechartsRadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

