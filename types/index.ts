export type AppLocale = 'en' | 'hi' | 'te';

export type AppRole = 'mentor' | 'coordinator' | 'viewer';

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

export interface SessionRecord {
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

export interface QueuedSessionRecord extends SessionRecord {
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

export interface MentorMatchSignal {
  key: MentorSignalKey;
  label: string;
  score: number;
  weight: number;
  reason: string;
}

export interface MentorMatchResult {
  mentor: MentorRecord;
  totalScore: number;
  rationale: string;
  recommended: boolean;
  signals: MentorMatchSignal[];
}

export interface RiskAssessmentInput {
  student: StudentRecord;
  sessions: SessionRecord[];
  latestParentResponse: ParentResponseCode | null;
}

export interface RiskAssessmentResult {
  studentId: string;
  score: number;
  level: RiskLevel;
  reasonCodes: string[];
  headline: string;
}

export interface DashboardStats {
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
  stats: DashboardStats;
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

