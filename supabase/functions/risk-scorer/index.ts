import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

type MigrationStatus = 'stable' | 'seasonal' | 'recently_migrated';
type ParentResponseCode = 'H' | 'C' | 'N' | null;
type SkillRatings = {
  reading: number;
  comprehension: number;
  writing: number;
  arithmetic: number;
  confidence: number;
};

interface StudentInput {
  id: string;
  fullName: string;
  attendanceRate: number;
  migrationStatus: MigrationStatus;
}

interface SessionInput {
  sessionDate: string;
  attendance: 'present' | 'absent' | 'late';
  skillRatings: SkillRatings;
}

interface RiskRequestBody {
  student: StudentInput;
  sessions: SessionInput[];
  latestParentResponse: ParentResponseCode;
}

type RiskLevel = 'low' | 'moderate' | 'high' | 'critical';

function determineRiskLevel(score: number): RiskLevel {
  if (score >= 80) {
    return 'critical';
  }

  if (score >= 60) {
    return 'high';
  }

  if (score >= 35) {
    return 'moderate';
  }

  return 'low';
}

function buildRiskPayload(body: RiskRequestBody) {
  const sortedSessions = [...body.sessions].sort(
    (left, right) => new Date(right.sessionDate).getTime() - new Date(left.sessionDate).getTime(),
  );
  const latestSession = sortedSessions[0];
  const lowSkillRatings = sortedSessions.flatMap((session) =>
    Object.values(session.skillRatings).filter((score) => score <= 2),
  ).length;
  const absentSessions = sortedSessions.filter((session) => session.attendance !== 'present').length;
  const daysSinceLastSession = latestSession
    ? Math.max(
        0,
        Math.round((Date.now() - new Date(latestSession.sessionDate).getTime()) / (1000 * 60 * 60 * 24)),
      )
    : 30;

  const reasonCodes: string[] = [];
  let score = 0;

  if (body.student.attendanceRate < 75) {
    score += 24;
    reasonCodes.push('attendance_drop');
  }

  if (body.student.migrationStatus !== 'stable') {
    score += body.student.migrationStatus === 'recently_migrated' ? 20 : 12;
    reasonCodes.push('migration_risk');
  }

  if (absentSessions >= 2) {
    score += 18;
    reasonCodes.push('repeated_absence');
  }

  if (lowSkillRatings >= 3) {
    score += 18;
    reasonCodes.push('learning_gaps');
  }

  if (daysSinceLastSession > 10) {
    score += 12;
    reasonCodes.push('session_gap');
  }

  if (body.latestParentResponse === 'C') {
    score += 20;
    reasonCodes.push('parent_concern');
  }

  if (sortedSessions.length === 0) {
    score += 16;
    reasonCodes.push('no_recent_sessions');
  }

  const clampedScore = Math.min(100, score);

  return {
    studentId: body.student.id,
    score: clampedScore,
    level: determineRiskLevel(clampedScore),
    reasonCodes,
    headline:
      clampedScore >= 60
        ? `${body.student.fullName} needs coordinator follow-up.`
        : `${body.student.fullName} is currently being monitored.`,
  };
}

serve(async (request) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = (await request.json()) as RiskRequestBody;
    const payload = buildRiskPayload(body);

    return new Response(JSON.stringify(payload), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      status: 200,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unable to score student risk.',
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 400,
      },
    );
  }
});

