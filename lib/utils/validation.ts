import { z } from 'zod';

const localeSchema = z.enum(['en', 'hi', 'te']);
const roleSchema = z.enum(['mentor', 'coordinator', 'viewer']);
const attendanceSchema = z.enum(['present', 'absent', 'late']);
const sessionModeSchema = z.enum(['offline', 'online', 'phone', 'home-visit']);
const migrationSchema = z.enum(['stable', 'seasonal', 'recently_migrated']);
const skillScoreSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
]);

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  role: roleSchema,
});

export const parentContactSchema = z.object({
  guardianName: z.string().min(2, 'Guardian name is required'),
  phone: z
    .string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(15, 'Phone number must be at most 15 digits'),
  preferredLanguage: localeSchema,
  smsOptIn: z.boolean(),
});

export const studentSchema = z.object({
  fullName: z.string().min(2, 'Student name is required'),
  preferredName: z.string().nullable(),
  age: z.number().int().min(5).max(18),
  grade: z.string().min(1, 'Grade is required'),
  schoolName: z.string().nullable(),
  locality: z.string().min(2, 'Locality is required'),
  migrationStatus: migrationSchema,
  baselineReadingLevel: skillScoreSchema,
  baselineArithmeticLevel: skillScoreSchema,
  attendanceRate: z.number().min(0).max(100),
  lastSessionAt: z.string().nullable(),
  active: z.boolean(),
  parentContact: parentContactSchema,
});

export const mentorSchema = z.object({
  fullName: z.string().min(2, 'Mentor name is required'),
  email: z.string().email().nullable(),
  phone: z
    .string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(15, 'Phone number must be at most 15 digits'),
  languages: z.array(localeSchema).min(1, 'Choose at least one language'),
  focusGrades: z.array(z.string()).min(1, 'Choose at least one grade band'),
  localities: z.array(z.string()).min(1, 'Choose at least one locality'),
  weeklyCapacity: z.number().int().min(1).max(14),
  sessionsCompleted: z.number().int().min(0),
  consistencyScore: z.number().min(0).max(100),
  empathyScore: z.number().min(0).max(100),
  teachingScore: z.number().min(0).max(100),
});

export const skillRatingsSchema = z.object({
  reading: skillScoreSchema,
  comprehension: skillScoreSchema,
  writing: skillScoreSchema,
  arithmetic: skillScoreSchema,
  confidence: skillScoreSchema,
});

export const sessionFormSchema = z.object({
  studentId: z.string().uuid('Select a student'),
  mentorId: z.string().uuid('Mentor is required'),
  templateId: z.string().uuid().nullable(),
  sessionDate: z.string().min(1, 'Session date is required'),
  durationMinutes: z.number().int().min(15).max(180),
  mode: sessionModeSchema,
  attendance: attendanceSchema,
  engagementLevel: skillScoreSchema,
  confidenceDelta: z.union([
    z.literal(-2),
    z.literal(-1),
    z.literal(0),
    z.literal(1),
    z.literal(2),
  ]),
  notes: z.string().min(8, 'Add a short observation'),
  skillRatings: skillRatingsSchema,
});

export const mentorFilterSchema = z.object({
  locale: z.union([localeSchema, z.literal('all')]),
  locality: z.string(),
  grade: z.string(),
});

export const smsResponseSchema = z.object({
  phone: z.string().min(10).max(15),
  code: z.enum(['H', 'C', 'N']),
  body: z.string().min(1),
});

export type LoginSchemaValues = z.infer<typeof loginSchema>;
export type StudentSchemaValues = z.infer<typeof studentSchema>;
export type MentorSchemaValues = z.infer<typeof mentorSchema>;
export type SessionFormSchemaValues = z.infer<typeof sessionFormSchema>;
export type MentorFilterSchemaValues = z.infer<typeof mentorFilterSchema>;
export type SmsResponseSchemaValues = z.infer<typeof smsResponseSchema>;

