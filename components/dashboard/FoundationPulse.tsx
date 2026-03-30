'use client';

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import type { DashboardPulsePoint } from '@/types';

interface FoundationPulseProps {
  points: DashboardPulsePoint[];
}

export function FoundationPulse({ points }: FoundationPulseProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Foundation Pulse</CardTitle>
        <CardDescription>The healing chart blends attendance, reading and arithmetic into one weekly arc.</CardDescription>
      </CardHeader>
      <CardContent className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points}>
            <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" />
            <XAxis dataKey="label" stroke="#64748b" />
            <YAxis stroke="#64748b" />
            <Tooltip />
            <Line type="monotone" dataKey="wellbeingIndex" stroke="#059669" strokeWidth={3} />
            <Line type="monotone" dataKey="readingIndex" stroke="#0f172a" strokeWidth={2} />
            <Line type="monotone" dataKey="arithmeticIndex" stroke="#2563eb" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

