'use client';

import { useMemo } from 'react';
import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart as RechartsRadarChart,
  ResponsiveContainer,
  Tooltip,
  type TooltipProps,
} from 'recharts';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { SUBJECTS, SUBJECT_LABELS, type GapProfile, type Subject } from '@/types';

interface RadarChartProps {
  current: GapProfile;
  historical?: GapProfile;
}

interface RadarPoint {
  subject: Subject;
  label: string;
  currentMastery: number;
  historicalMastery?: number;
  currentGap: number;
  historicalGap?: number;
}

function toMastery(gapScore: number): number {
  return Math.round(((5 - gapScore) / 5) * 100);
}

function RadarTooltip(props: TooltipProps<number, string>) {
  const point = props.payload?.[0]?.payload as RadarPoint | undefined;

  if (!props.active || !point) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-lg">
      <p className="text-sm font-semibold text-slate-900">{point.label}</p>
      <p className="mt-2 text-xs text-slate-600">
        Current: gap {point.currentGap.toFixed(1)} | mastery {point.currentMastery}%
      </p>
      <p className="mt-1 text-xs text-slate-500">
        4 weeks ago:{' '}
        {typeof point.historicalGap === 'number'
          ? `gap ${point.historicalGap.toFixed(1)} | mastery ${point.historicalMastery ?? 0}%`
          : 'Unavailable'}
      </p>
    </div>
  );
}

export function RadarChart({ current, historical }: RadarChartProps) {
  const data = useMemo<RadarPoint[]>(
    () =>
      SUBJECTS.map((subject) => ({
        subject,
        label: SUBJECT_LABELS[subject],
        currentMastery: toMastery(current[subject]),
        historicalMastery: historical ? toMastery(historical[subject]) : undefined,
        currentGap: current[subject],
        historicalGap: historical?.[subject],
      })),
    [current, historical],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Learning profile radar</CardTitle>
        <CardDescription>
          Mastery is derived from the student&apos;s gap profile. Lower gap scores produce a stronger radar shape.
        </CardDescription>
      </CardHeader>
      <CardContent className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsRadarChart data={data} outerRadius="72%">
            <PolarGrid stroke="#cbd5e1" />
            <PolarAngleAxis dataKey="label" tick={{ fill: '#334155', fontSize: 12 }} />
            <Tooltip content={<RadarTooltip />} />
            <Radar
              name="Current profile"
              dataKey="currentMastery"
              stroke="#B8F04A"
              fill="#B8F04A"
              fillOpacity={0.2}
              strokeWidth={2}
            />
            {historical ? (
              <Radar
                name="4 weeks ago"
                dataKey="historicalMastery"
                stroke="#71717A"
                fill="transparent"
                strokeWidth={2}
                strokeOpacity={0.9}
              />
            ) : null}
          </RechartsRadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
