// lib/intelligence/mentorMatcher.ts
import type {
  GapProfile,
  LegacyMentorMatchResult,
  LegacyMentorMatchSignal,
  Mentor,
  MentorMatchResult,
  MentorMatchSignals,
  MentorRecord,
  Student,
  StudentRecord,
  Subject,
} from '@/types';

const WEIGHTS = {
  subjectFit: 0.35,
  availability: 0.2,
  loadBalance: 0.2,
  outcomeHistory: 0.15,
  genderSafety: 0.1,
} as const;

const LEGACY_SIGNAL_CONFIG: Array<{
  key: LegacyMentorMatchSignal['key'];
  label: string;
  weight: number;
  read: (signals: MentorMatchSignals) => number;
  reason: (mentor: MentorRecord, signals: MentorMatchSignals) => string;
}> = [
  {
    key: 'grade_fit',
    label: 'Subject fit',
    weight: WEIGHTS.subjectFit,
    read: (signals) => signals.subjectFit,
    reason: (_mentor, signals) =>
      signals.subjectFit >= 0.5 ? 'Matches the student’s highest-need subjects.' : 'Partial subject overlap.',
  },
  {
    key: 'capacity_fit',
    label: 'Availability',
    weight: WEIGHTS.availability,
    read: (signals) => signals.availability,
    reason: (_mentor, signals) =>
      signals.availability === 1 ? 'Available during the preferred time slot.' : 'Time slot may need adjustment.',
  },
  {
    key: 'location_match',
    label: 'Load balance',
    weight: WEIGHTS.loadBalance,
    read: (signals) => signals.loadBalance,
    reason: (mentor) =>
      `${mentor.fullName} can absorb additional learners without overloading the roster.`,
  },
  {
    key: 'consistency',
    label: 'Outcomes',
    weight: WEIGHTS.outcomeHistory,
    read: (signals) => signals.outcomeHistory,
    reason: (_mentor, signals) =>
      signals.outcomeHistory >= 0.7 ? 'Strong student outcome history.' : 'Average improvement history.',
  },
  {
    key: 'language_match',
    label: 'Safety',
    weight: WEIGHTS.genderSafety,
    read: (signals) => signals.genderSafety,
    reason: (_mentor, signals) =>
      signals.genderSafety === 1 ? 'Safe match for the current assignment policy.' : 'Reduced safety preference match.',
  },
];

export function scoreMentors(
  student: Student,
  mentors: Mentor[],
  options: { genderSafeMode: boolean } = { genderSafeMode: false },
): MentorMatchResult[] {
  return mentors
    .filter((mentor) => mentor.active)
    .map((mentor) => {
      const signals = computeSignals(student, mentor, options);
      const totalScore = (Object.entries(signals) as [keyof typeof WEIGHTS, number][]).reduce(
        (sum, [key, value]) => sum + value * WEIGHTS[key],
        0,
      );

      return {
        mentor,
        totalScore: Math.round(totalScore * 100),
        signals,
        explanation: buildExplanation(mentor, signals),
        rank: 0 as 1 | 2 | 3,
      };
    })
    .sort((left, right) => right.totalScore - left.totalScore)
    .slice(0, 3)
    .map((result, index) => ({ ...result, rank: (index + 1) as 1 | 2 | 3 }));
}

function computeSignals(
  student: Student,
  mentor: Mentor,
  options: { genderSafeMode: boolean },
): MentorMatchSignals {
  return {
    subjectFit: computeSubjectFit(student, mentor),
    availability: computeAvailability(student, mentor),
    loadBalance: computeLoadBalance(mentor),
    outcomeHistory: mentor.avg_student_improvement,
    genderSafety: computeGenderSafety(student, mentor, options),
  };
}

function computeSubjectFit(student: Student, mentor: Mentor): number {
  const topGapSubjects = (Object.entries(student.gap_profile) as [Subject, number][])
    .sort(([, left], [, right]) => right - left)
    .slice(0, 2)
    .map(([subject]) => subject);

  const matches = topGapSubjects.filter((subject) => mentor.subjects.includes(subject)).length;
  return matches / 2;
}

function computeAvailability(student: Student, mentor: Mentor): number {
  if (!student.preferred_time_slot) {
    return 0.5;
  }

  const hour = Number.parseInt(student.preferred_time_slot.split(':')[0] ?? '0', 10);

  return Object.values(mentor.availability).some(([start, end]) => {
    const startHour = Number.parseInt(start.split(':')[0] ?? '0', 10);
    const endHour = Number.parseInt(end.split(':')[0] ?? '0', 10);
    return hour >= startHour && hour < endHour;
  })
    ? 1
    : 0;
}

function computeLoadBalance(mentor: Mentor): number {
  const MAX_STUDENTS = 15;
  return Math.max(0, 1 - mentor.active_student_count / MAX_STUDENTS);
}

function computeGenderSafety(
  student: Student,
  mentor: Mentor,
  options: { genderSafeMode: boolean },
): number {
  if (!options.genderSafeMode || student.gender !== 'F') {
    return 1;
  }

  return mentor.gender === 'F' ? 1 : 0.3;
}

function buildExplanation(mentor: Mentor, signals: MentorMatchSignals): string {
  const parts: string[] = [];

  if (signals.subjectFit >= 0.5) {
    parts.push('Subject match');
  }

  if (signals.availability === 1) {
    parts.push('Available at preferred time');
  }

  if (signals.loadBalance >= 0.7) {
    parts.push(`${mentor.active_student_count} current student${mentor.active_student_count !== 1 ? 's' : ''}`);
  }

  if (signals.outcomeHistory >= 0.7) {
    parts.push('Strong outcomes history');
  }

  return parts.join(' · ') || 'General match';
}

function normalizeGrade(grade: string): 3 | 4 | 5 | 6 {
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

function buildGapProfile(student: StudentRecord): GapProfile {
  const readingGap = Math.max(0, 5 - student.baselineReadingLevel);
  const arithmeticGap = Math.max(0, 5 - student.baselineArithmeticLevel);

  return {
    math: arithmeticGap,
    reading: readingGap,
    science: Math.max(0, arithmeticGap - 1),
    english: readingGap,
    comprehension: readingGap,
  };
}

function mapLegacyStudentToCanonical(student: StudentRecord): Student {
  const riskScore = Math.max(0, Math.min(1, 1 - student.attendanceRate / 100));
  const riskColor = riskScore >= 0.7 ? 'red' : riskScore >= 0.4 ? 'amber' : 'green';

  return {
    id: student.id,
    name: student.fullName,
    grade: normalizeGrade(student.grade),
    gender: 'other',
    center_id: student.locality,
    assigned_mentor_id: null,
    gap_profile: buildGapProfile(student),
    risk_score: riskScore,
    risk_color: riskColor,
    last_session_at: student.lastSessionAt,
    engagement_score: student.parentContact.smsOptIn ? 0.5 : 0.2,
    preferred_time_slot: null,
    parent_language: student.parentContact.preferredLanguage,
    created_at: student.createdAt,
  };
}

function mapLegacyMentorToCanonical(
  mentor: MentorRecord,
  activeAssignments: number,
): Mentor {
  return {
    id: mentor.id,
    user_id: mentor.id,
    name: mentor.fullName,
    phone: mentor.phone,
    subjects: ['math', 'reading', 'science', 'english', 'comprehension'],
    availability: {
      mon: ['09:00', '18:00'],
      tue: ['09:00', '18:00'],
      wed: ['09:00', '18:00'],
      thu: ['09:00', '18:00'],
      fri: ['09:00', '18:00'],
    },
    center_id: mentor.localities[0] ?? '',
    gender: 'other',
    session_count: mentor.sessionsCompleted,
    avg_student_improvement: Math.max(0, Math.min(1, mentor.teachingScore / 100)),
    active_student_count: activeAssignments,
    active: true,
    created_at: mentor.createdAt,
  };
}

function toLegacySignals(
  mentor: MentorRecord,
  signals: MentorMatchSignals,
): LegacyMentorMatchSignal[] {
  return LEGACY_SIGNAL_CONFIG.map((config) => ({
    key: config.key,
    label: config.label,
    score: Math.round(config.read(signals) * 100),
    weight: config.weight,
    reason: config.reason(mentor, signals),
  }));
}

function toLegacyMatch(
  match: MentorMatchResult,
  mentor: MentorRecord,
): LegacyMentorMatchResult {
  return {
    mentor,
    totalScore: match.totalScore,
    rationale: match.explanation,
    recommended: match.totalScore >= 70,
    signals: toLegacySignals(mentor, match.signals),
  };
}

export function scoreMentorForStudent(
  student: StudentRecord,
  mentor: MentorRecord,
  context?: { activeAssignmentsByMentorId?: Record<string, number> },
): LegacyMentorMatchResult {
  const canonicalStudent = mapLegacyStudentToCanonical(student);
  const activeAssignments = context?.activeAssignmentsByMentorId?.[mentor.id] ?? 0;
  const canonicalMentor = mapLegacyMentorToCanonical(mentor, activeAssignments);
  const [match] = scoreMentors(canonicalStudent, [canonicalMentor]);

  return toLegacyMatch(
    match ?? {
      mentor: canonicalMentor,
      totalScore: 0,
      signals: {
        subjectFit: 0,
        availability: 0,
        loadBalance: 0,
        outcomeHistory: 0,
        genderSafety: 0,
      },
      explanation: 'General match',
      rank: 1,
    },
    mentor,
  );
}

export function rankMentorsForStudent(
  student: StudentRecord,
  mentors: MentorRecord[],
  context?: { activeAssignmentsByMentorId?: Record<string, number> },
): LegacyMentorMatchResult[] {
  const canonicalStudent = mapLegacyStudentToCanonical(student);
  const mentorLookup = mentors.reduce<Record<string, MentorRecord>>((accumulator, mentor) => {
    accumulator[mentor.id] = mentor;
    return accumulator;
  }, {});

  return scoreMentors(
    canonicalStudent,
    mentors.map((mentor) =>
      mapLegacyMentorToCanonical(
        mentor,
        context?.activeAssignmentsByMentorId?.[mentor.id] ?? 0,
      ),
    ),
  ).map((match) => toLegacyMatch(match, mentorLookup[match.mentor.id] ?? mentors[0]!));
}
