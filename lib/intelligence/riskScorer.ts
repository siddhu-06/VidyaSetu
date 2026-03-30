import type { RiskColor, Student } from '@/types';

export function previewRiskColor(student: Student): RiskColor {
  const maxGap = Math.max(...Object.values(student.gap_profile));
  const gapSeverity = maxGap / 5.0;

  const daysSince = student.last_session_at
    ? (Date.now() - new Date(student.last_session_at).getTime()) / (1000 * 60 * 60 * 24)
    : 21;
  const sessionRecency = Math.min(daysSince / 21, 1.0);

  const parentEngagement = 1.0 - student.engagement_score;

  const riskScore =
    gapSeverity * 0.40 + sessionRecency * 0.30 + parentEngagement * 0.20 + 0.5 * 0.10;

  return riskScore > 0.7 ? 'red' : riskScore > 0.4 ? 'amber' : 'green';
}
