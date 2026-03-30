'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { useStudents as useLegacyStudents } from '@/hooks/useStudents';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { formatDate, getStartOfWeek, toIsoDate } from '@/lib/utils/date';
import {
  DEFAULT_GAP_PROFILE,
  SUBJECT_LABELS,
  type GapHistoryPoint,
  type GapProfile,
  type Student,
  type StudentRecord,
  type Subject,
} from '@/types';

interface FoundationPulseProps {
  students: Student[];
}

interface GapHistoryRow {
  week_start: string;
  gap_profile: GapProfile;
}

interface ChartPoint extends GapHistoryPoint {
  label: string;
}

function normalizeLegacyGrade(grade: string): 3 | 4 | 5 | 6 {
  const numericGrade = Number.parseInt(grade.match(/\d+/)?.[0] ?? '3', 10);

  if (numericGrade <= 3) {
    return 3;
  }

  if (numericGrade === 4) {
    return 4;
  }

  if (numericGrade === 5) {
    return 5;
  }

  return 6;
}

function mapLegacyStudentToCanonical(student: StudentRecord): Student {
  const riskScore = Math.max(0, Math.min(1, 1 - student.attendanceRate / 100));
  const riskColor = riskScore >= 0.7 ? 'red' : riskScore >= 0.4 ? 'amber' : 'green';

  return {
    id: student.id,
    name: student.fullName,
    grade: normalizeLegacyGrade(student.grade),
    gender: 'other',
    center_id: student.locality,
    assigned_mentor_id: null,
    gap_profile: {
      math: Math.max(0, 5 - student.baselineArithmeticLevel),
      reading: Math.max(0, 5 - student.baselineReadingLevel),
      science: Math.max(0, 4 - student.baselineArithmeticLevel),
      english: Math.max(0, 5 - student.baselineReadingLevel),
      comprehension: Math.max(0, 5 - student.baselineReadingLevel),
    },
    risk_score: riskScore,
    risk_color: riskColor,
    last_session_at: student.lastSessionAt,
    engagement_score: student.parentContact.smsOptIn ? 0.5 : 0,
    preferred_time_slot: null,
    parent_language: student.parentContact.preferredLanguage,
    created_at: student.createdAt,
  };
}

function buildEightWeekSeries(currentProfile: GapProfile, historyRows: GapHistoryRow[]): GapHistoryPoint[] {
  const historyMap = new Map<string, GapProfile>();

  historyRows.forEach((row) => {
    historyMap.set(row.week_start, row.gap_profile);
  });

  return Array.from({ length: 8 }).map((_, index) => {
    const weekDate = getStartOfWeek(new Date(Date.now() - (7 - index) * 7 * 24 * 60 * 60 * 1000));
    const weekKey = toIsoDate(weekDate);
    const profile = historyMap.get(weekKey) ?? currentProfile;

    return {
      week: weekKey,
      math: profile.math,
      reading: profile.reading,
      science: profile.science,
      english: profile.english,
      comprehension: profile.comprehension,
    };
  });
}

async function loadPulseHistory(student: Student): Promise<GapHistoryPoint[]> {
  const supabase = getSupabaseBrowserClient();

  if (!supabase) {
    return buildEightWeekSeries(student.gap_profile, []);
  }

  const historyQuery = supabase.from('gap_history') as unknown as {
    select(query: string): {
      eq(column: string, value: string): {
        order(
          column: string,
          options?: { ascending?: boolean },
        ): {
          limit(value: number): Promise<{ data: GapHistoryRow[] | null; error: { message: string } | null }>;
        };
      };
    };
  };

  try {
    const { data, error } = await historyQuery
      .select('week_start,gap_profile')
      .eq('student_id', student.id)
      .order('week_start', { ascending: true })
      .limit(8);

    if (error) {
      throw new Error(error.message);
    }

    return buildEightWeekSeries(student.gap_profile, data ?? []);
  } catch {
    return buildEightWeekSeries(student.gap_profile, []);
  }
}

const SUBJECT_COLORS: Record<Subject, string> = {
  math: '#B8F04A',
  reading: '#60A5FA',
  science: '#F59E0B',
  english: '#A78BFA',
  comprehension: '#F87171',
};

export function FoundationPulse({ students }: FoundationPulseProps) {
  const legacyStudentsQuery = useLegacyStudents();
  const fallbackStudents = useMemo(
    () => (legacyStudentsQuery.data ?? []).map(mapLegacyStudentToCanonical),
    [legacyStudentsQuery.data],
  );
  const availableStudents = students.length > 0 ? students : fallbackStudents;
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');

  useEffect(() => {
    if (!selectedStudentId && availableStudents[0]) {
      setSelectedStudentId(availableStudents[0].id);
      return;
    }

    if (selectedStudentId && !availableStudents.some((student) => student.id === selectedStudentId) && availableStudents[0]) {
      setSelectedStudentId(availableStudents[0].id);
    }
  }, [availableStudents, selectedStudentId]);

  const selectedStudent = availableStudents.find((student) => student.id === selectedStudentId) ?? null;

  const historyQuery = useQuery({
    queryKey: ['foundation-pulse', selectedStudentId],
    queryFn: async () => {
      if (!selectedStudent) {
        return [] as GapHistoryPoint[];
      }

      return loadPulseHistory(selectedStudent);
    },
    enabled: Boolean(selectedStudent),
  });

  const chartData = useMemo<ChartPoint[]>(
    () =>
      (historyQuery.data ?? []).map((point) => ({
        ...point,
        label: formatDate(point.week, { month: 'short', day: 'numeric' }),
      })),
    [historyQuery.data],
  );

  const improvement = useMemo(() => {
    if (chartData.length < 2) {
      return null;
    }

    const earliest = chartData[0];
    const latest = chartData[chartData.length - 1];
    let bestSubject: Subject | null = null;
    let bestDelta = 0;

    (['math', 'reading', 'science', 'english', 'comprehension'] as Subject[]).forEach((subject) => {
      const delta = earliest[subject] - latest[subject];

      if (delta > bestDelta) {
        bestDelta = delta;
        bestSubject = subject;
      }
    });

    return bestSubject && bestDelta > 0
      ? { subject: bestSubject, delta: bestDelta }
      : null;
  }, [chartData]);

  if (legacyStudentsQuery.isLoading && availableStudents.length === 0) {
    return <SkeletonCard />;
  }

  if (!selectedStudent) {
    return <SkeletonCard />;
  }

  if (historyQuery.isLoading && chartData.length === 0) {
    return <SkeletonCard />;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <CardTitle>Foundation Pulse</CardTitle>
            <CardDescription>
              Healing over time across the five core learning gap signals.
            </CardDescription>
          </div>
          <label className="grid gap-2 text-sm text-slate-600">
            <span className="font-medium text-slate-700">Student</span>
            <select
              className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-emerald-500"
              value={selectedStudentId}
              onChange={(event) => setSelectedStudentId(event.target.value)}
            >
              {availableStudents.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" />
              <XAxis dataKey="label" stroke="#64748b" />
              <YAxis
                domain={[0, 5]}
                stroke="#64748b"
                label={{ value: 'Gap Score - lower is better', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip />
              {(['math', 'reading', 'science', 'english', 'comprehension'] as Subject[]).map((subject) => (
                <Line
                  key={`${selectedStudentId}-${subject}`}
                  type="monotone"
                  dataKey={subject}
                  name={SUBJECT_LABELS[subject]}
                  stroke={SUBJECT_COLORS[subject]}
                  strokeWidth={3}
                  dot={{ r: 3 }}
                  isAnimationActive
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
        {improvement ? (
          <div>
            <Badge tone="success">
              ↓ {improvement.delta.toFixed(1)} points improvement in {SUBJECT_LABELS[improvement.subject]}
            </Badge>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
