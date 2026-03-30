import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

type GapProfile = Record<string, number>;

const RISK_WEIGHTS = {
  gapSeverity: 0.40,
  sessionRecency: 0.30,
  parentEngagement: 0.20,
  improvementTrend: 0.10,
} as const;

function computeGapSeverity(gapProfile: GapProfile): number {
  const values = Object.values(gapProfile);
  return Math.max(...values) / 5.0;
}

function computeRecency(lastSessionAt: string | null): number {
  if (!lastSessionAt) return 1.0;
  const daysSince = (Date.now() - new Date(lastSessionAt).getTime()) / (1000 * 60 * 60 * 24);
  return Math.min(daysSince / 21, 1.0);
}

function computeEngagementRisk(engagementScore: number): number {
  return 1.0 - engagementScore;
}

async function computeImprovementTrend(
  studentId: string,
  currentProfile: GapProfile,
  supabase: SupabaseClient,
): Promise<number> {
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  const { data } = await supabase
    .from('gap_history')
    .select('gap_profile')
    .eq('student_id', studentId)
    .lte('week_start', twoWeeksAgo.toISOString().split('T')[0])
    .order('week_start', { ascending: false })
    .limit(1)
    .single();

  if (!data) return 0.5;

  const historical = data.gap_profile as GapProfile;
  const currentAvg = Object.values(currentProfile).reduce((left, right) => left + right, 0) / Object.keys(currentProfile).length;
  const historicalAvg = Object.values(historical).reduce((left, right) => left + right, 0) / Object.keys(historical).length;

  if (currentAvg < historicalAvg - 0.2) return 0.2;
  if (currentAvg > historicalAvg + 0.2) return 0.9;
  return 0.5;
}

serve(async (req) => {
  try {
    const { student_ids } = (await req.json()) as { student_ids: string[] };

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const updated: string[] = [];
    const redAlerts: string[] = [];

    for (const studentId of student_ids) {
      try {
        const { data: student } = await supabase
          .from('students')
          .select('id, gap_profile, last_session_at, engagement_score, risk_color')
          .eq('id', studentId)
          .single();

        if (!student) continue;

        const gapProfile = student.gap_profile as GapProfile;

        const gapSeverity = computeGapSeverity(gapProfile);
        const sessionRecency = computeRecency(student.last_session_at);
        const parentEngagement = computeEngagementRisk(student.engagement_score);
        const improvementTrend = await computeImprovementTrend(studentId, gapProfile, supabase);

        const riskScore =
          gapSeverity * RISK_WEIGHTS.gapSeverity +
          sessionRecency * RISK_WEIGHTS.sessionRecency +
          parentEngagement * RISK_WEIGHTS.parentEngagement +
          improvementTrend * RISK_WEIGHTS.improvementTrend;

        const clampedScore = Math.max(0, Math.min(1, riskScore));
        const riskColor = clampedScore > 0.7 ? 'red' : clampedScore > 0.4 ? 'amber' : 'green';

        await supabase.from('students').update({
          risk_score: clampedScore,
          risk_color: riskColor,
        }).eq('id', studentId);

        updated.push(studentId);

        if (riskColor === 'red') {
          redAlerts.push(studentId);

          if (student.risk_color !== 'red') {
            await supabase.from('coordinator_alerts').insert({
              student_id: studentId,
              ngo_id: Deno.env.get('DEFAULT_NGO_ID') ?? '',
              alert_type: 'risk_red',
            });
          }
        }
      } catch (err) {
        console.error(`Risk scorer error for ${studentId}:`, err);
      }
    }

    return new Response(JSON.stringify({ updated, redAlerts }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
