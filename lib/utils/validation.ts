// lib/utils/validation.ts
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  role: z.enum(['mentor', 'coordinator', 'viewer']),
});

export const sessionFormSchema = z.object({
  student_id: z.string().uuid('Please select a student'),
  skill_ratings: z
    .record(
      z.enum(['math', 'reading', 'science', 'english', 'comprehension']),
      z.enum(['improving', 'steady', 'not_covered']),
    )
    .refine((ratings) => Object.values(ratings).some((rating) => rating !== 'not_covered'), {
      message: 'At least one subject must be rated as Improving or Steady',
    }),
  note: z.string().max(280, 'Note must be 280 characters or less'),
  session_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date'),
});

export type LoginSchemaValues = z.infer<typeof loginSchema>;
export type SessionFormValues = z.infer<typeof sessionFormSchema>;
