// types/index.ts — COMPLETE TYPE DEFINITIONS

export type Subject =
  | 'math'
  | 'reading'
  | 'science'
  | 'english'
  | 'comprehension';

export const SUBJECTS: Subject[] = [
  'math',
  'reading',
  'science',
  'english',
  'comprehension',
];

export const SUBJECT_LABELS: Record<Subject, string> = {
  math: 'Mathematics',
  reading: 'Reading Fluency',
  science: 'Science',
  english: 'English',
  comprehension: 'Comprehension',
};

export type SkillRating = 'improving' | 'steady' | 'not_covered';

export const SKILL_RATINGS: SkillRating[] = ['improving', 'steady', 'not_covered'];

export const SKILL_RATING_LABELS: Record<SkillRating, string> = {
  improving: 'Improving',
  steady: 'Steady',
  not_covered: 'Not Covered',
};

export type RiskColor = 'green' | 'amber' | 'red';

export type Language = 'hi' | 'te' | 'en';

export type UserRole = 'ngo' | 'volunteer' | 'student';

export interface Profile {
  id: string;
  role: UserRole;
  first_name: string;
  last_name: string;
  city: string;
  org_name?: string;
  created_at: string;
  updated_at: string;
}

export interface GapProfile {
  math: number;
  reading: number;
  science: number;
  english: number;
  comprehension: number;
}

export const DEFAULT_GAP_PROFILE: GapProfile = {
  math: 0,
  reading: 0,
  science: 0,
  english: 0,
  comprehension: 0,
};

export interface Student {
  id: string;
  name: string;
  grade: 3 | 4 | 5 | 6;
  gender: 'M' | 'F' | 'other';
  center_id: string;
  assigned_mentor_id: string | null;
  gap_profile: GapProfile;
  risk_score: number;
  risk_color: RiskColor;
  last_session_at: string | null;
  engagement_score: number;
  preferred_time_slot: string | null;
  parent_language: Language;
  created_at: string;
}

export interface Mentor {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  subjects: Subject[];
  availability: Record<string, [string, string]>;
  center_id: string;
  gender: string;
  session_count: number;
  avg_student_improvement: number;
  active_student_count: number;
  active: boolean;
  created_at: string;
}

export interface Center {
  id: string;
  name: string;
  city: string;
  ngo_id: string;
  created_at: string;
}

export interface NGO {
  id: string;
  name: string;
  contact_email: string;
  twilio_from_number: string | null;
  created_at: string;
}

export interface SessionRecord {
  id?: string;
  student_id: string;
  mentor_id: string;
  session_date: string;
  subjects_covered: Subject[];
  skill_ratings: Partial<Record<Subject, SkillRating>>;
  note: string;
  raw_tags: string[];
  synced: boolean;
  synced_at: string | null;
  created_at: string;
  offline_id: string;
  sync_attempts: number;
  sync_failed: boolean;
}

export interface QueuedSession extends SessionRecord {
  queued_at: string;
  last_attempt_at: string | null;
  error_message: string | null;
}

export interface SessionTemplate {
  id: string;
  title: string;
  grade: 3 | 4 | 5 | 6;
  subject: Subject;
  gap_tag: string;
  warm_up: string;
  core_concept: string;
  closing_activity: string;
  duration_minutes: number;
  offline_cached: boolean;
}

export interface MentorMatchSignals {
  subjectFit: number;
  availability: number;
  loadBalance: number;
  outcomeHistory: number;
  genderSafety: number;
}

export interface MentorMatchResult {
  mentor: Mentor;
  totalScore: number;
  signals: MentorMatchSignals;
  explanation: string;
  rank: 1 | 2 | 3;
}

export interface SyncStatus {
  pendingCount: number;
  failedCount: number;
  lastSyncAt: string | null;
  isSyncing: boolean;
  lastError: string | null;
}

export interface RiskAlert {
  student_id: string;
  student_name: string;
  risk_color: RiskColor;
  risk_score: number;
  signals: {
    attendanceDrop: boolean;
    gapStagnation: boolean;
    parentSilence: boolean;
  };
  created_at: string;
}

export interface SMSLog {
  id: string;
  student_id: string;
  session_id: string;
  phone: string;
  message_body: string;
  twilio_sid: string;
  reply: string | null;
  sentiment: 1 | -1 | null;
  created_at: string;
}

export interface DashboardStats {
  totalStudents: number;
  activeStudents: number;
  activeMentors: number;
  sessionsThisMonth: number;
  avgRiskScore: number;
  parentEngagementRate: number;
  redCount: number;
  amberCount: number;
  greenCount: number;
}

export interface GapHistoryPoint {
  week: string;
  math: number;
  reading: number;
  science: number;
  english: number;
  comprehension: number;
}

export interface RealtimeSessionPayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: SessionRecord;
  old: Partial<SessionRecord>;
}

export interface AppError {
  code: string;
  message: string;
  details?: string;
}

// Compatibility layer for the existing app while Module 03 becomes the
// source of truth for downstream modules.

export type AppLocale = Language;

export type AppRole = UserRole | 'mentor' | 'coordinator' | 'admin' | 'viewer';

export type AttendanceStatus = 'present' | 'absent' | 'late';

export type SessionMode = 'offline' | 'online' | 'phone' | 'home-visit';

export type SyncState = 'idle' | 'queued' | 'syncing' | 'synced' | 'error' | 'offline';

export type MigrationStatus = 'stable' | 'seasonal' | 'recently_migrated';

export type RiskLevel = 'low' | 'moderate' | 'high' | 'critical';

export type SkillDomain =
  | 'reading'
  | 'comprehension'
  | 'writing'
  | 'arithmetic'
  | 'confidence';

export type MentorSignalKey =
  | 'language_match'
  | 'location_match'
  | 'grade_fit'
  | 'capacity_fit'
  | 'consistency';

export type ParentResponseCode = 'H' | 'C' | 'N';

export type SkillScore = 1 | 2 | 3 | 4 | 5;

export type ConfidenceDelta = -2 | -1 | 0 | 1 | 2;

export type GradeBand = 'foundation' | 'grade_1_2' | 'grade_3_5' | 'grade_6_plus';

export interface ParentContact {
  guardianName: string;
  phone: string;
  preferredLanguage: AppLocale;
  smsOptIn: boolean;
}

export interface StudentRecord {
  id: string;
  fullName: string;
  preferredName: string | null;
  age: number;
  grade: string;
  schoolName: string | null;
  locality: string;
  migrationStatus: MigrationStatus;
  baselineReadingLevel: SkillScore;
  baselineArithmeticLevel: SkillScore;
  attendanceRate: number;
  lastSessionAt: string | null;
  active: boolean;
  parentContact: ParentContact;
  createdAt: string;
  updatedAt: string;
}

export interface MentorRecord {
  id: string;
  fullName: string;
  email: string | null;
  phone: string;
  languages: AppLocale[];
  focusGrades: string[];
  localities: string[];
  weeklyCapacity: number;
  sessionsCompleted: number;
  consistencyScore: number;
  empathyScore: number;
  teachingScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface SessionTemplateRecord {
  id: string;
  title: string;
  focusSkills: SkillDomain[];
  noteHint: string;
  durationMinutes: number;
  createdAt: string;
}

export type SkillRatings = Record<SkillDomain, SkillScore>;

export interface LegacySessionRecord {
  id: string;
  offlineId: string;
  studentId: string;
  mentorId: string;
  templateId: string | null;
  sessionDate: string;
  startedAt: string | null;
  durationMinutes: number;
  mode: SessionMode;
  attendance: AttendanceStatus;
  engagementLevel: SkillScore;
  confidenceDelta: ConfidenceDelta;
  notes: string;
  learningGaps: string[];
  skillRatings: SkillRatings;
  syncStatus: SyncState;
  syncAttempts: number;
  syncError: string | null;
  lastSyncedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface QueueMetrics {
  queued: number;
  syncing: number;
  failed: number;
}

export interface QueuedSessionRecord extends LegacySessionRecord {
  nextRetryAt: string | null;
  serverId: string | null;
}

export interface GapKeywordMatch {
  keyword: string;
  domain: SkillDomain;
  concept: string;
  stage: GradeBand;
  severity: RiskLevel;
}

export interface GapDetectionResult {
  gaps: string[];
  matches: GapKeywordMatch[];
  summary: string;
  confidence: number;
}

export interface LegacyMentorMatchSignal {
  key: MentorSignalKey;
  label: string;
  score: number;
  weight: number;
  reason: string;
}

export interface LegacyMentorMatchResult {
  mentor: MentorRecord;
  totalScore: number;
  rationale: string;
  recommended: boolean;
  signals: LegacyMentorMatchSignal[];
}

export interface RiskAssessmentInput {
  student: StudentRecord;
  sessions: LegacySessionRecord[];
  latestParentResponse: ParentResponseCode | null;
}

export interface RiskAssessmentResult {
  studentId: string;
  score: number;
  level: RiskLevel;
  reasonCodes: string[];
  headline: string;
}

export interface LegacyDashboardStats {
  activeStudents: number;
  activeMentors: number;
  sessionsThisWeek: number;
  highRiskStudents: number;
  parentResponses: number;
  averageAttendance: number;
}

export interface DashboardHeatmapCell {
  locality: string;
  grade: string;
  riskCount: number;
  totalStudents: number;
  intensity: number;
}

export interface DashboardPulsePoint {
  label: string;
  wellbeingIndex: number;
  readingIndex: number;
  arithmeticIndex: number;
  attendanceRate: number;
}

export interface LeaderboardEntry {
  mentorId: string;
  mentorName: string;
  rank: number;
  sessionsCompleted: number;
  consistencyScore: number;
  averageStudentGrowth: number;
  badgeLabel: string;
}

export interface PassportSkillPoint {
  subject: SkillDomain;
  current: number;
  baseline: number;
}

export interface PassportTimelinePoint {
  id: string;
  sessionDate: string;
  notes: string;
  attendance: AttendanceStatus;
  learningGaps: string[];
  scoreDelta: number;
}

export interface PassportSnapshot {
  student: StudentRecord;
  risk: RiskAssessmentResult | null;
  radar: PassportSkillPoint[];
  timeline: PassportTimelinePoint[];
  publicCode: string;
  qrValue: string;
}

export interface CSRImpactStory {
  title: string;
  body: string;
  studentName: string;
}

export interface CSRReportData {
  ngoName: string;
  donorName: string;
  reportingWindow: string;
  generatedAt: string;
  stats: LegacyDashboardStats;
  heatmap: DashboardHeatmapCell[];
  pulse: DashboardPulsePoint[];
  leaderboard: LeaderboardEntry[];
  stories: CSRImpactStory[];
}

export interface SyncStatusSnapshot {
  state: SyncState;
  queueMetrics: QueueMetrics;
  lastSyncedAt: string | null;
  message: string;
}

export interface AppNotification {
  id: string;
  title: string;
  description: string;
  tone: 'info' | 'success' | 'warning' | 'error';
}

export interface LoginFormValues {
  email: string;
  role: AppRole;
}

export interface SessionFormValues {
  studentId: string;
  mentorId: string;
  templateId: string | null;
  sessionDate: string;
  durationMinutes: number;
  mode: SessionMode;
  attendance: AttendanceStatus;
  engagementLevel: SkillScore;
  confidenceDelta: ConfidenceDelta;
  notes: string;
  skillRatings: SkillRatings;
}

export interface MentorFilterValues {
  locale: AppLocale | 'all';
  locality: string;
  grade: string;
}

export interface ParentSmsTemplateContext {
  childName: string;
  mentorName: string;
  sessionDateLabel: string;
  progressHighlight: string;
  concernFlag: boolean;
}

export interface DashboardRealtimePayload {
  type: 'session_created' | 'risk_updated' | 'mentor_updated';
  entityId: string;
  occurredAt: string;
}
