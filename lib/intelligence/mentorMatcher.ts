import type {
  LegacyMentorMatchResult as MentorMatchResult,
  LegacyMentorMatchSignal as MentorMatchSignal,
  MentorRecord,
  StudentRecord,
} from '@/types';

interface MentorMatchContext {
  activeAssignmentsByMentorId?: Record<string, number>;
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function gradeBandFromStudentGrade(grade: string): string[] {
  const normalizedGrade = grade.toLowerCase();

  if (normalizedGrade.includes('balwadi') || normalizedGrade.includes('kg') || normalizedGrade === '1') {
    return ['Balwadi', 'KG', '1', '2'];
  }

  if (normalizedGrade === '2' || normalizedGrade === '3') {
    return ['2', '3', '4'];
  }

  if (normalizedGrade === '4' || normalizedGrade === '5') {
    return ['4', '5', '6'];
  }

  return [grade];
}

function buildSignal(
  key: MentorMatchSignal['key'],
  label: string,
  score: number,
  weight: number,
  reason: string,
): MentorMatchSignal {
  return {
    key,
    label,
    score: clampScore(score),
    weight,
    reason,
  };
}

export function scoreMentorForStudent(
  student: StudentRecord,
  mentor: MentorRecord,
  context?: MentorMatchContext,
): MentorMatchResult {
  const studentLanguage = student.parentContact.preferredLanguage;
  const languageScore = mentor.languages.includes(studentLanguage) ? 100 : 40;
  const locationScore = mentor.localities.includes(student.locality) ? 100 : 55;
  const gradeOptions = gradeBandFromStudentGrade(student.grade);
  const gradeScore = mentor.focusGrades.some((grade) => gradeOptions.includes(grade)) ? 100 : 45;
  const activeAssignments = context?.activeAssignmentsByMentorId?.[mentor.id] ?? 0;
  const availableCapacity = Math.max(mentor.weeklyCapacity - activeAssignments, 0);
  const capacityScore = mentor.weeklyCapacity === 0 ? 0 : (availableCapacity / mentor.weeklyCapacity) * 100;
  const consistencyScore = mentor.consistencyScore;

  const signals = [
    buildSignal(
      'language_match',
      'Language fit',
      languageScore,
      0.25,
      languageScore > 80
        ? `Mentor speaks ${studentLanguage.toUpperCase()} and can explain to the family directly.`
        : 'Language overlap is partial, so coordinator support may be needed.',
    ),
    buildSignal(
      'location_match',
      'Locality fit',
      locationScore,
      0.2,
      locationScore > 80
        ? `${mentor.fullName} already serves ${student.locality}.`
        : `${mentor.fullName} can travel, but this is not a primary locality.`,
    ),
    buildSignal(
      'grade_fit',
      'Grade fit',
      gradeScore,
      0.2,
      gradeScore > 80
        ? `Mentor focus grades align with Grade ${student.grade}.`
        : 'Mentor can stretch to this grade band, but it is not the strongest fit.',
    ),
    buildSignal(
      'capacity_fit',
      'Weekly capacity',
      capacityScore,
      0.15,
      availableCapacity > 0
        ? `${availableCapacity} open mentoring slots remain this week.`
        : 'Weekly capacity is already full, so the match is fragile.',
    ),
    buildSignal(
      'consistency',
      'Consistency',
      consistencyScore,
      0.2,
      consistencyScore > 75
        ? 'Strong attendance and follow-through history.'
        : 'Consistency is improving but needs coordinator support.',
    ),
  ];

  const totalScore = clampScore(
    signals.reduce((sum, signal) => sum + signal.score * signal.weight, 0),
  );

  return {
    mentor,
    totalScore,
    recommended: totalScore >= 75,
    rationale:
      totalScore >= 75
        ? `${mentor.fullName} is a strong operational fit for ${student.fullName}.`
        : `${mentor.fullName} can support ${student.fullName}, but there may be a stronger match.`,
    signals,
  };
}

export function rankMentorsForStudent(
  student: StudentRecord,
  mentors: MentorRecord[],
  context?: MentorMatchContext,
): MentorMatchResult[] {
  return mentors
    .map((mentor) => scoreMentorForStudent(student, mentor, context))
    .sort((left, right) => right.totalScore - left.totalScore);
}
