'use client';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { PassportQR } from '@/components/passport/PassportQR';
import { RadarChart } from '@/components/passport/RadarChart';
import { SessionTimeline } from '@/components/passport/SessionTimeline';
import { formatDate } from '@/lib/utils/date';
import type { PassportSnapshot } from '@/types';

interface PrintablePassportProps {
  snapshot: PassportSnapshot;
}

export function PrintablePassport({ snapshot }: PrintablePassportProps) {
  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader className="md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>{snapshot.student.fullName}</CardTitle>
            <CardDescription>
              Grade {snapshot.student.grade} · {snapshot.student.locality} · Updated{' '}
              {formatDate(snapshot.student.updatedAt)}
            </CardDescription>
          </div>
          <Button variant="secondary" onClick={() => window.print()}>
            Print passport
          </Button>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Migration status</p>
            <p className="mt-1 font-semibold text-slate-900">{snapshot.student.migrationStatus}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Attendance rate</p>
            <p className="mt-1 font-semibold text-slate-900">{snapshot.student.attendanceRate}%</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Current risk</p>
            <p className="mt-1 font-semibold text-slate-900">
              {snapshot.risk ? `${snapshot.risk.level} (${snapshot.risk.score})` : 'Not yet scored'}
            </p>
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <RadarChart points={snapshot.radar} />
        <PassportQR value={snapshot.qrValue} publicCode={snapshot.publicCode} />
      </div>
      <SessionTimeline timeline={snapshot.timeline} />
    </div>
  );
}

