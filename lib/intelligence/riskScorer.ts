import { formatRelativeDate } from '@/lib/utils/date';
import type { RiskAssessmentInput, RiskAssessmentResult, RiskLevel } from '@/types';

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

export function scoreStudentRisk(input: RiskAssessmentInput): RiskAssessmentResult {
  const { student, sessions, latestParentResponse } = input;
  const sortedSessions = [...sessions].sort(
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

  if (student.attendanceRate < 75) {
    score += 24;
    reasonCodes.push('attendance_drop');
  }

  if (student.migrationStatus !== 'stable') {
    score += student.migrationStatus === 'recently_migrated' ? 20 : 12;
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

  if (latestParentResponse === 'C') {
    score += 20;
    reasonCodes.push('parent_concern');
  }

  if (sortedSessions.length === 0) {
    score += 16;
    reasonCodes.push('no_recent_sessions');
  }

  const clampedScore = Math.min(100, score);
  const level = determineRiskLevel(clampedScore);
  const lastSeenLabel = latestSession ? formatRelativeDate(latestSession.sessionDate) : 'No logged session';
  const headline =
    level === 'critical'
      ? `${student.fullName} needs immediate follow-up. Last session: ${lastSeenLabel}.`
      : level === 'high'
        ? `${student.fullName} shows multiple risk signals. Last session: ${lastSeenLabel}.`
        : level === 'moderate'
          ? `${student.fullName} should be monitored this week. Last session: ${lastSeenLabel}.`
          : `${student.fullName} is currently stable. Last session: ${lastSeenLabel}.`;

  return {
    studentId: student.id,
    score: clampedScore,
    level,
    reasonCodes,
    headline,
  };
}

