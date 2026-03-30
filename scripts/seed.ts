import { createClient } from '@supabase/supabase-js';

import type { Database } from '../lib/supabase/types';

type MentorInsert = Database['public']['Tables']['mentors']['Insert'];
type StudentInsert = Database['public']['Tables']['students']['Insert'];
type TemplateInsert = Database['public']['Tables']['session_templates']['Insert'];
type ShareInsert = Database['public']['Tables']['passport_shares']['Insert'];
type SessionInsert = Database['public']['Tables']['sessions']['Insert'];
type RiskInsert = Database['public']['Tables']['risk_snapshots']['Insert'];
type ParentMessageInsert = Database['public']['Tables']['parent_messages']['Insert'];

const mentors: MentorInsert[] = [
  {
    id: '00000000-0000-0000-0000-000000000101',
    full_name: 'Ananya Rao',
    email: 'ananya@youngistaan.org',
    phone: '919900000101',
    languages: ['en', 'te'],
    focus_grades: ['3', '4', '5'],
    localities: ['Nalgonda', 'Saroornagar'],
    weekly_capacity: 6,
    sessions_completed: 52,
    consistency_score: 92,
    empathy_score: 90,
    teaching_score: 88,
  },
  {
    id: '00000000-0000-0000-0000-000000000102',
    full_name: 'Rahul Verma',
    email: 'rahul@youngistaan.org',
    phone: '919900000102',
    languages: ['en', 'hi'],
    focus_grades: ['2', '3', '4'],
    localities: ['Wanaparthy', 'Attapur'],
    weekly_capacity: 5,
    sessions_completed: 49,
    consistency_score: 88,
    empathy_score: 84,
    teaching_score: 86,
  },
  {
    id: '00000000-0000-0000-0000-000000000103',
    full_name: 'Sravani M',
    email: 'sravani@youngistaan.org',
    phone: '919900000103',
    languages: ['en', 'te'],
    focus_grades: ['1', '2', '3'],
    localities: ['Borabanda', 'Nalgonda'],
    weekly_capacity: 7,
    sessions_completed: 57,
    consistency_score: 95,
    empathy_score: 93,
    teaching_score: 89,
  },
  {
    id: '00000000-0000-0000-0000-000000000104',
    full_name: 'Imran Khan',
    email: 'imran@youngistaan.org',
    phone: '919900000104',
    languages: ['en', 'hi'],
    focus_grades: ['4', '5', '6'],
    localities: ['GHMC Slum Cluster', 'Saroornagar'],
    weekly_capacity: 4,
    sessions_completed: 41,
    consistency_score: 82,
    empathy_score: 85,
    teaching_score: 83,
  },
  {
    id: '00000000-0000-0000-0000-000000000105',
    full_name: 'Lakshmi Priya',
    email: 'lakshmi@youngistaan.org',
    phone: '919900000105',
    languages: ['en', 'te', 'hi'],
    focus_grades: ['Balwadi', 'KG', '1', '2'],
    localities: ['Wanaparthy', 'GHMC Slum Cluster'],
    weekly_capacity: 6,
    sessions_completed: 54,
    consistency_score: 91,
    empathy_score: 94,
    teaching_score: 87,
  },
];

const students: StudentInsert[] = [
  {
    id: '00000000-0000-0000-0000-000000000201',
    full_name: 'Aarav Naik',
    preferred_name: 'Aaru',
    age: 9,
    grade: '4',
    school_name: 'Govt Primary School Nalgonda',
    locality: 'Nalgonda',
    migration_status: 'stable',
    baseline_reading_level: 2,
    baseline_arithmetic_level: 2,
    attendance_rate: 83,
    guardian_name: 'Sunita Naik',
    guardian_phone: '919800000201',
    preferred_language: 'te',
    sms_opt_in: true,
    active: true,
  },
  {
    id: '00000000-0000-0000-0000-000000000202',
    full_name: 'Meena Kumari',
    age: 8,
    grade: '3',
    school_name: 'Mandal Parishad School',
    locality: 'Wanaparthy',
    migration_status: 'seasonal',
    baseline_reading_level: 3,
    baseline_arithmetic_level: 2,
    attendance_rate: 78,
    guardian_name: 'Raju Kumari',
    guardian_phone: '919800000202',
    preferred_language: 'hi',
    sms_opt_in: true,
    active: true,
  },
  {
    id: '00000000-0000-0000-0000-000000000203',
    full_name: 'Ritesh Yadav',
    age: 10,
    grade: '5',
    school_name: 'Govt School Attapur',
    locality: 'Attapur',
    migration_status: 'stable',
    baseline_reading_level: 2,
    baseline_arithmetic_level: 3,
    attendance_rate: 88,
    guardian_name: 'Sarita Yadav',
    guardian_phone: '919800000203',
    preferred_language: 'hi',
    sms_opt_in: true,
    active: true,
  },
  {
    id: '00000000-0000-0000-0000-000000000204',
    full_name: 'Navya B',
    preferred_name: 'Navu',
    age: 7,
    grade: '2',
    school_name: 'Community Learning Centre',
    locality: 'Borabanda',
    migration_status: 'recently_migrated',
    baseline_reading_level: 2,
    baseline_arithmetic_level: 1,
    attendance_rate: 69,
    guardian_name: 'Bhavani',
    guardian_phone: '919800000204',
    preferred_language: 'te',
    sms_opt_in: true,
    active: true,
  },
  {
    id: '00000000-0000-0000-0000-000000000205',
    full_name: 'Faizan Ali',
    age: 11,
    grade: '5',
    school_name: 'Govt High School',
    locality: 'GHMC Slum Cluster',
    migration_status: 'seasonal',
    baseline_reading_level: 3,
    baseline_arithmetic_level: 2,
    attendance_rate: 74,
    guardian_name: 'Shabana Ali',
    guardian_phone: '919800000205',
    preferred_language: 'en',
    sms_opt_in: true,
    active: true,
  },
  {
    id: '00000000-0000-0000-0000-000000000206',
    full_name: 'Keerthana G',
    age: 6,
    grade: '1',
    school_name: 'Bridge Centre Wanaparthy',
    locality: 'Wanaparthy',
    migration_status: 'stable',
    baseline_reading_level: 1,
    baseline_arithmetic_level: 1,
    attendance_rate: 92,
    guardian_name: 'Gopal G',
    guardian_phone: '919800000206',
    preferred_language: 'te',
    sms_opt_in: true,
    active: true,
  },
  {
    id: '00000000-0000-0000-0000-000000000207',
    full_name: 'Sohan Lal',
    age: 9,
    grade: '4',
    school_name: 'Municipal School',
    locality: 'Saroornagar',
    migration_status: 'stable',
    baseline_reading_level: 2,
    baseline_arithmetic_level: 3,
    attendance_rate: 86,
    guardian_name: 'Kamla Lal',
    guardian_phone: '919800000207',
    preferred_language: 'hi',
    sms_opt_in: true,
    active: true,
  },
  {
    id: '00000000-0000-0000-0000-000000000208',
    full_name: 'Pavani Reddy',
    age: 8,
    grade: '3',
    school_name: 'Community Learning Centre',
    locality: 'Nalgonda',
    migration_status: 'seasonal',
    baseline_reading_level: 3,
    baseline_arithmetic_level: 3,
    attendance_rate: 80,
    guardian_name: 'Madhavi Reddy',
    guardian_phone: '919800000208',
    preferred_language: 'te',
    sms_opt_in: true,
    active: true,
  },
  {
    id: '00000000-0000-0000-0000-000000000209',
    full_name: 'Jeevan Kumar',
    age: 12,
    grade: '6',
    school_name: 'Govt School Attapur',
    locality: 'Attapur',
    migration_status: 'stable',
    baseline_reading_level: 3,
    baseline_arithmetic_level: 2,
    attendance_rate: 77,
    guardian_name: 'Latha Kumar',
    guardian_phone: '919800000209',
    preferred_language: 'en',
    sms_opt_in: true,
    active: true,
  },
  {
    id: '00000000-0000-0000-0000-000000000210',
    full_name: 'Aisha Fatima',
    age: 7,
    grade: '2',
    school_name: 'Basti Learning Hub',
    locality: 'GHMC Slum Cluster',
    migration_status: 'recently_migrated',
    baseline_reading_level: 2,
    baseline_arithmetic_level: 1,
    attendance_rate: 66,
    guardian_name: 'Nusrat Fatima',
    guardian_phone: '919800000210',
    preferred_language: 'hi',
    sms_opt_in: true,
    active: true,
  },
  {
    id: '00000000-0000-0000-0000-000000000211',
    full_name: 'Charan Teja',
    age: 10,
    grade: '5',
    school_name: 'Govt Primary School Nalgonda',
    locality: 'Nalgonda',
    migration_status: 'stable',
    baseline_reading_level: 2,
    baseline_arithmetic_level: 2,
    attendance_rate: 90,
    guardian_name: 'Mahesh Teja',
    guardian_phone: '919800000211',
    preferred_language: 'te',
    sms_opt_in: true,
    active: true,
  },
  {
    id: '00000000-0000-0000-0000-000000000212',
    full_name: 'Jyothi Rani',
    age: 6,
    grade: '1',
    school_name: 'Bridge Centre Wanaparthy',
    locality: 'Wanaparthy',
    migration_status: 'seasonal',
    baseline_reading_level: 1,
    baseline_arithmetic_level: 2,
    attendance_rate: 72,
    guardian_name: 'Rani Devi',
    guardian_phone: '919800000212',
    preferred_language: 'hi',
    sms_opt_in: true,
    active: true,
  },
];

const templates: TemplateInsert[] = [
  {
    id: '00000000-0000-0000-0000-000000000301',
    title: 'Reading recovery',
    focus_skills: ['reading', 'comprehension', 'confidence'],
    note_hint: 'Student struggled with fluency and inference but responded well to paired reading.',
    duration_minutes: 60,
  },
  {
    id: '00000000-0000-0000-0000-000000000302',
    title: 'Arithmetic catch-up',
    focus_skills: ['arithmetic', 'confidence'],
    note_hint: 'Student needed support with regrouping, subtraction or multiplication strategy.',
    duration_minutes: 60,
  },
  {
    id: '00000000-0000-0000-0000-000000000303',
    title: 'Bridge writing practice',
    focus_skills: ['writing', 'reading', 'confidence'],
    note_hint: 'Student attempted sentence writing, dictation, and oral vocabulary transfer.',
    duration_minutes: 45,
  },
];

const shares: ShareInsert[] = students.map((student) => ({
  student_id: student.id as string,
  public_code: `VS-${(student.full_name ?? '').split(' ')[0].toUpperCase()}-${(student.id as string).slice(-3)}`,
  active: true,
}));

function buildSeedSessions(): SessionInsert[] {
  return students.flatMap((student, studentIndex) =>
    Array.from({ length: 8 }, (_, weekIndex) => {
      const mentor = mentors[(studentIndex + weekIndex) % mentors.length];
      const template = templates[weekIndex % templates.length];
      const sessionDate = new Date();
      sessionDate.setDate(sessionDate.getDate() - (7 - weekIndex) * 7);
      const note =
        (studentIndex + weekIndex) % 5 === 0
          ? `${student.full_name} struggled with subtraction borrowing and needed repeated modelling.`
          : (studentIndex + weekIndex) % 4 === 0
            ? `${student.full_name} improved reading fluency after paired practice but still hesitated on multisyllabic words.`
            : (studentIndex + weekIndex) % 3 === 0
              ? `${student.full_name} attempted sentence writing, but grammar and spacing need another round.`
              : `${student.full_name} stayed engaged, completed the worksheet, and responded well to oral prompts.`;

      return {
        offline_id: `seed-${String(student.id).slice(-4)}-${weekIndex}`,
        student_id: student.id as string,
        mentor_id: mentor.id as string,
        template_id: template.id as string,
        session_date: sessionDate.toISOString().slice(0, 10),
        started_at: sessionDate.toISOString(),
        duration_minutes: weekIndex % 3 === 0 ? 45 : 60,
        mode: weekIndex % 4 === 0 ? 'home-visit' : weekIndex % 3 === 0 ? 'phone' : 'offline',
        attendance:
          (studentIndex + weekIndex) % 11 === 0
            ? 'absent'
            : (studentIndex + weekIndex) % 7 === 0
              ? 'late'
              : 'present',
        engagement_level: (Math.min(5, 2 + ((studentIndex + weekIndex) % 3)) as 1 | 2 | 3 | 4 | 5),
        confidence_delta:
          weekIndex <= 2 && [1, 3, 9, 11].includes(studentIndex)
            ? -1
            : weekIndex >= 5
              ? 1
              : 0,
        notes: note,
        learning_gaps: [
          ...(studentIndex % 2 === 0 && weekIndex <= 3 ? ['arithmetic: subtraction'] : []),
          ...(studentIndex % 3 === 0 && weekIndex <= 4 ? ['reading: fluency'] : []),
        ],
        skill_ratings: {
          reading: Math.max(1, Math.min(5, Number(student.baseline_reading_level ?? 3) + Math.floor(weekIndex / 3))),
          comprehension: Math.max(1, Math.min(5, Number(student.baseline_reading_level ?? 3) + Math.floor((weekIndex + 1) / 4))),
          writing: Math.max(1, Math.min(5, Number(student.baseline_reading_level ?? 3) + Math.floor(weekIndex / 4))),
          arithmetic: Math.max(1, Math.min(5, Number(student.baseline_arithmetic_level ?? 3) + Math.floor(weekIndex / 3))),
          confidence: Math.max(1, Math.min(5, 2 + Math.floor(weekIndex / 3))),
        },
        sync_source: 'server',
      };
    }),
  );
}

function buildRiskSnapshots(): RiskInsert[] {
  return students.map((student) => {
    const criticalIds = new Set([
      '00000000-0000-0000-0000-000000000204',
      '00000000-0000-0000-0000-000000000210',
    ]);
    const highIds = new Set([
      '00000000-0000-0000-0000-000000000202',
      '00000000-0000-0000-0000-000000000205',
      '00000000-0000-0000-0000-000000000212',
    ]);
    const moderateIds = new Set([
      '00000000-0000-0000-0000-000000000201',
      '00000000-0000-0000-0000-000000000208',
      '00000000-0000-0000-0000-000000000209',
    ]);

    if (criticalIds.has(student.id as string)) {
      return {
        student_id: student.id as string,
        risk_score: 84,
        risk_level: 'critical',
        reason_codes: ['migration_risk', 'learning_gaps', 'attendance_drop'],
      };
    }

    if (highIds.has(student.id as string)) {
      return {
        student_id: student.id as string,
        risk_score: 66,
        risk_level: 'high',
        reason_codes: ['attendance_drop', 'session_gap'],
      };
    }

    if (moderateIds.has(student.id as string)) {
      return {
        student_id: student.id as string,
        risk_score: 42,
        risk_level: 'moderate',
        reason_codes: ['learning_gaps'],
      };
    }

    return {
      student_id: student.id as string,
      risk_score: 24,
      risk_level: 'low',
      reason_codes: ['stable'],
    };
  });
}

function buildParentMessages(): ParentMessageInsert[] {
  const outbound = students.map((student) => ({
    student_id: student.id as string,
    direction: 'outbound',
    channel: 'sms',
    locale: student.preferred_language ?? 'en',
    body: "VidyaSetu update: today's session was logged and your child's learning record is updated. Reply H or C.",
    delivery_status: 'delivered',
  }));

  const inbound: ParentMessageInsert[] = [
    { student_id: '00000000-0000-0000-0000-000000000201', direction: 'inbound', channel: 'sms', locale: 'te', body: 'H', delivery_status: 'received', response_code: 'H' },
    { student_id: '00000000-0000-0000-0000-000000000202', direction: 'inbound', channel: 'sms', locale: 'hi', body: 'C', delivery_status: 'received', response_code: 'C' },
    { student_id: '00000000-0000-0000-0000-000000000204', direction: 'inbound', channel: 'sms', locale: 'te', body: 'C', delivery_status: 'received', response_code: 'C' },
    { student_id: '00000000-0000-0000-0000-000000000206', direction: 'inbound', channel: 'sms', locale: 'te', body: 'H', delivery_status: 'received', response_code: 'H' },
    { student_id: '00000000-0000-0000-0000-000000000210', direction: 'inbound', channel: 'sms', locale: 'hi', body: 'C', delivery_status: 'received', response_code: 'C' },
    { student_id: '00000000-0000-0000-0000-000000000211', direction: 'inbound', channel: 'sms', locale: 'te', body: 'H', delivery_status: 'received', response_code: 'H' },
  ];

  return [...outbound, ...inbound];
}

async function upsertInChunks<T extends Record<string, unknown>>(
  operation: (chunk: T[]) => PromiseLike<{ error: Error | null }>,
  rows: T[],
  chunkSize = 50,
): Promise<void> {
  for (let index = 0; index < rows.length; index += chunkSize) {
    const chunk = rows.slice(index, index + chunkSize);
    const { error } = await operation(chunk);

    if (error) {
      throw error;
    }
  }
}

async function main(): Promise<void> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
    }

    const supabase = createClient<Database>(supabaseUrl, serviceRoleKey);
    const studentIds = students.map((student) => student.id as string);

    await upsertInChunks((chunk) => supabase.from('mentors').upsert(chunk), mentors);
    await upsertInChunks((chunk) => supabase.from('students').upsert(chunk), students);
    await upsertInChunks((chunk) => supabase.from('session_templates').upsert(chunk), templates);
    await upsertInChunks((chunk) => supabase.from('passport_shares').upsert(chunk), shares);

    const { error: deleteMatchError } = await supabase.from('mentor_matches').delete().in('student_id', studentIds);
    if (deleteMatchError) {
      throw deleteMatchError;
    }

    const { error: deleteRiskError } = await supabase.from('risk_snapshots').delete().in('student_id', studentIds);
    if (deleteRiskError) {
      throw deleteRiskError;
    }

    const { error: deleteMessagesError } = await supabase.from('parent_messages').delete().in('student_id', studentIds);
    if (deleteMessagesError) {
      throw deleteMessagesError;
    }

    const { error: deleteSessionsError } = await supabase.from('sessions').delete().like('offline_id', 'seed-%');
    if (deleteSessionsError) {
      throw deleteSessionsError;
    }

    await upsertInChunks((chunk) => supabase.from('sessions').upsert(chunk), buildSeedSessions());
    await upsertInChunks((chunk) => supabase.from('risk_snapshots').insert(chunk), buildRiskSnapshots());
    await upsertInChunks((chunk) => supabase.from('parent_messages').insert(chunk), buildParentMessages());

    console.log('VidyaSetu demo data seeded successfully.');
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Unable to seed demo data.');
    process.exit(1);
  }
}

void main();
