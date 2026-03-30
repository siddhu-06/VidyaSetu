insert into public.mentors (
  id,
  full_name,
  email,
  phone,
  languages,
  focus_grades,
  localities,
  weekly_capacity,
  sessions_completed,
  consistency_score,
  empathy_score,
  teaching_score
)
values
  ('00000000-0000-0000-0000-000000000101', 'Ananya Rao', 'ananya@youngistaan.org', '919900000101', array['en', 'te'], array['3', '4', '5'], array['Nalgonda', 'Saroornagar'], 6, 52, 92, 90, 88),
  ('00000000-0000-0000-0000-000000000102', 'Rahul Verma', 'rahul@youngistaan.org', '919900000102', array['en', 'hi'], array['2', '3', '4'], array['Wanaparthy', 'Attapur'], 5, 49, 88, 84, 86),
  ('00000000-0000-0000-0000-000000000103', 'Sravani M', 'sravani@youngistaan.org', '919900000103', array['en', 'te'], array['1', '2', '3'], array['Borabanda', 'Nalgonda'], 7, 57, 95, 93, 89),
  ('00000000-0000-0000-0000-000000000104', 'Imran Khan', 'imran@youngistaan.org', '919900000104', array['en', 'hi'], array['4', '5', '6'], array['GHMC Slum Cluster', 'Saroornagar'], 4, 41, 82, 85, 83),
  ('00000000-0000-0000-0000-000000000105', 'Lakshmi Priya', 'lakshmi@youngistaan.org', '919900000105', array['en', 'te', 'hi'], array['Balwadi', 'KG', '1', '2'], array['Wanaparthy', 'GHMC Slum Cluster'], 6, 54, 91, 94, 87)
on conflict (id) do update
set
  full_name = excluded.full_name,
  email = excluded.email,
  phone = excluded.phone,
  languages = excluded.languages,
  focus_grades = excluded.focus_grades,
  localities = excluded.localities,
  weekly_capacity = excluded.weekly_capacity,
  sessions_completed = excluded.sessions_completed,
  consistency_score = excluded.consistency_score,
  empathy_score = excluded.empathy_score,
  teaching_score = excluded.teaching_score;

insert into public.students (
  id,
  full_name,
  preferred_name,
  age,
  grade,
  school_name,
  locality,
  migration_status,
  baseline_reading_level,
  baseline_arithmetic_level,
  attendance_rate,
  guardian_name,
  guardian_phone,
  preferred_language,
  sms_opt_in,
  active
)
values
  ('00000000-0000-0000-0000-000000000201', 'Aarav Naik', 'Aaru', 9, '4', 'Govt Primary School Nalgonda', 'Nalgonda', 'stable', 2, 2, 83, 'Sunita Naik', '919800000201', 'te', true, true),
  ('00000000-0000-0000-0000-000000000202', 'Meena Kumari', null, 8, '3', 'Mandal Parishad School', 'Wanaparthy', 'seasonal', 3, 2, 78, 'Raju Kumari', '919800000202', 'hi', true, true),
  ('00000000-0000-0000-0000-000000000203', 'Ritesh Yadav', null, 10, '5', 'Govt School Attapur', 'Attapur', 'stable', 2, 3, 88, 'Sarita Yadav', '919800000203', 'hi', true, true),
  ('00000000-0000-0000-0000-000000000204', 'Navya B', 'Navu', 7, '2', 'Community Learning Centre', 'Borabanda', 'recently_migrated', 2, 1, 69, 'Bhavani', '919800000204', 'te', true, true),
  ('00000000-0000-0000-0000-000000000205', 'Faizan Ali', null, 11, '5', 'Govt High School', 'GHMC Slum Cluster', 'seasonal', 3, 2, 74, 'Shabana Ali', '919800000205', 'en', true, true),
  ('00000000-0000-0000-0000-000000000206', 'Keerthana G', null, 6, '1', 'Bridge Centre Wanaparthy', 'Wanaparthy', 'stable', 1, 1, 92, 'Gopal G', '919800000206', 'te', true, true),
  ('00000000-0000-0000-0000-000000000207', 'Sohan Lal', null, 9, '4', 'Municipal School', 'Saroornagar', 'stable', 2, 3, 86, 'Kamla Lal', '919800000207', 'hi', true, true),
  ('00000000-0000-0000-0000-000000000208', 'Pavani Reddy', null, 8, '3', 'Community Learning Centre', 'Nalgonda', 'seasonal', 3, 3, 80, 'Madhavi Reddy', '919800000208', 'te', true, true),
  ('00000000-0000-0000-0000-000000000209', 'Jeevan Kumar', null, 12, '6', 'Govt School Attapur', 'Attapur', 'stable', 3, 2, 77, 'Latha Kumar', '919800000209', 'en', true, true),
  ('00000000-0000-0000-0000-000000000210', 'Aisha Fatima', null, 7, '2', 'Basti Learning Hub', 'GHMC Slum Cluster', 'recently_migrated', 2, 1, 66, 'Nusrat Fatima', '919800000210', 'hi', true, true),
  ('00000000-0000-0000-0000-000000000211', 'Charan Teja', null, 10, '5', 'Govt Primary School Nalgonda', 'Nalgonda', 'stable', 2, 2, 90, 'Mahesh Teja', '919800000211', 'te', true, true),
  ('00000000-0000-0000-0000-000000000212', 'Jyothi Rani', null, 6, '1', 'Bridge Centre Wanaparthy', 'Wanaparthy', 'seasonal', 1, 2, 72, 'Rani Devi', '919800000212', 'hi', true, true)
on conflict (id) do update
set
  full_name = excluded.full_name,
  preferred_name = excluded.preferred_name,
  age = excluded.age,
  grade = excluded.grade,
  school_name = excluded.school_name,
  locality = excluded.locality,
  migration_status = excluded.migration_status,
  baseline_reading_level = excluded.baseline_reading_level,
  baseline_arithmetic_level = excluded.baseline_arithmetic_level,
  attendance_rate = excluded.attendance_rate,
  guardian_name = excluded.guardian_name,
  guardian_phone = excluded.guardian_phone,
  preferred_language = excluded.preferred_language,
  sms_opt_in = excluded.sms_opt_in,
  active = excluded.active;

insert into public.session_templates (
  id,
  title,
  focus_skills,
  note_hint,
  duration_minutes
)
values
  ('00000000-0000-0000-0000-000000000301', 'Reading recovery', array['reading', 'comprehension', 'confidence'], 'Student struggled with fluency and inference but responded well to paired reading.', 60),
  ('00000000-0000-0000-0000-000000000302', 'Arithmetic catch-up', array['arithmetic', 'confidence'], 'Student needed support with regrouping, subtraction or multiplication strategy.', 60),
  ('00000000-0000-0000-0000-000000000303', 'Bridge writing practice', array['writing', 'reading', 'confidence'], 'Student attempted sentence writing, dictation, and oral vocabulary transfer.', 45)
on conflict (id) do update
set
  title = excluded.title,
  focus_skills = excluded.focus_skills,
  note_hint = excluded.note_hint,
  duration_minutes = excluded.duration_minutes;

insert into public.passport_shares (
  student_id,
  public_code,
  active
)
values
  ('00000000-0000-0000-0000-000000000201', 'VS-AARAV-201', true),
  ('00000000-0000-0000-0000-000000000202', 'VS-MEENA-202', true),
  ('00000000-0000-0000-0000-000000000203', 'VS-RITESH-203', true),
  ('00000000-0000-0000-0000-000000000204', 'VS-NAVYA-204', true),
  ('00000000-0000-0000-0000-000000000205', 'VS-FAIZAN-205', true),
  ('00000000-0000-0000-0000-000000000206', 'VS-KEERTHANA-206', true),
  ('00000000-0000-0000-0000-000000000207', 'VS-SOHAN-207', true),
  ('00000000-0000-0000-0000-000000000208', 'VS-PAVANI-208', true),
  ('00000000-0000-0000-0000-000000000209', 'VS-JEEVAN-209', true),
  ('00000000-0000-0000-0000-000000000210', 'VS-AISHA-210', true),
  ('00000000-0000-0000-0000-000000000211', 'VS-CHARAN-211', true),
  ('00000000-0000-0000-0000-000000000212', 'VS-JYOTHI-212', true)
on conflict (student_id) do update
set
  public_code = excluded.public_code,
  active = excluded.active;

delete from public.mentor_matches
where student_id in (
  '00000000-0000-0000-0000-000000000201',
  '00000000-0000-0000-0000-000000000202',
  '00000000-0000-0000-0000-000000000203',
  '00000000-0000-0000-0000-000000000204',
  '00000000-0000-0000-0000-000000000205',
  '00000000-0000-0000-0000-000000000206',
  '00000000-0000-0000-0000-000000000207',
  '00000000-0000-0000-0000-000000000208',
  '00000000-0000-0000-0000-000000000209',
  '00000000-0000-0000-0000-000000000210',
  '00000000-0000-0000-0000-000000000211',
  '00000000-0000-0000-0000-000000000212'
);

delete from public.risk_snapshots
where student_id in (
  '00000000-0000-0000-0000-000000000201',
  '00000000-0000-0000-0000-000000000202',
  '00000000-0000-0000-0000-000000000203',
  '00000000-0000-0000-0000-000000000204',
  '00000000-0000-0000-0000-000000000205',
  '00000000-0000-0000-0000-000000000206',
  '00000000-0000-0000-0000-000000000207',
  '00000000-0000-0000-0000-000000000208',
  '00000000-0000-0000-0000-000000000209',
  '00000000-0000-0000-0000-000000000210',
  '00000000-0000-0000-0000-000000000211',
  '00000000-0000-0000-0000-000000000212'
);

delete from public.parent_messages
where student_id in (
  '00000000-0000-0000-0000-000000000201',
  '00000000-0000-0000-0000-000000000202',
  '00000000-0000-0000-0000-000000000203',
  '00000000-0000-0000-0000-000000000204',
  '00000000-0000-0000-0000-000000000205',
  '00000000-0000-0000-0000-000000000206',
  '00000000-0000-0000-0000-000000000207',
  '00000000-0000-0000-0000-000000000208',
  '00000000-0000-0000-0000-000000000209',
  '00000000-0000-0000-0000-000000000210',
  '00000000-0000-0000-0000-000000000211',
  '00000000-0000-0000-0000-000000000212'
);

delete from public.sessions
where offline_id like 'seed-%';

with student_seed as (
  select
    id,
    row_number() over (order by id) as student_index,
    full_name,
    locality,
    baseline_reading_level,
    baseline_arithmetic_level
  from public.students
  where id between '00000000-0000-0000-0000-000000000201' and '00000000-0000-0000-0000-000000000212'
),
mentor_seed as (
  select
    id,
    row_number() over (order by id) as mentor_index
  from public.mentors
  where id between '00000000-0000-0000-0000-000000000101' and '00000000-0000-0000-0000-000000000105'
),
template_seed as (
  select
    id,
    row_number() over (order by id) as template_index
  from public.session_templates
  where id between '00000000-0000-0000-0000-000000000301' and '00000000-0000-0000-0000-000000000303'
),
weeks as (
  select generate_series(0, 7) as week_index
)
insert into public.sessions (
  offline_id,
  student_id,
  mentor_id,
  template_id,
  session_date,
  started_at,
  duration_minutes,
  mode,
  attendance,
  engagement_level,
  confidence_delta,
  notes,
  learning_gaps,
  skill_ratings,
  sync_source,
  created_at,
  updated_at
)
select
  format('seed-%s-%s', right(student_seed.id::text, 4), weeks.week_index),
  student_seed.id,
  (
    select mentor_seed.id
    from mentor_seed
    where mentor_seed.mentor_index = ((student_seed.student_index + weeks.week_index - 1) % 5) + 1
  ),
  (
    select template_seed.id
    from template_seed
    where template_seed.template_index = (weeks.week_index % 3) + 1
  ),
  (current_date - ((7 - weeks.week_index) * interval '7 days'))::date,
  timezone('utc', now()) - ((7 - weeks.week_index) * interval '7 days') + interval '10 hours',
  case when weeks.week_index % 3 = 0 then 45 else 60 end,
  case
    when weeks.week_index % 4 = 0 then 'home-visit'
    when weeks.week_index % 3 = 0 then 'phone'
    else 'offline'
  end,
  case
    when (student_seed.student_index + weeks.week_index) % 11 = 0 then 'absent'
    when (student_seed.student_index + weeks.week_index) % 7 = 0 then 'late'
    else 'present'
  end,
  greatest(1, least(5, 2 + ((student_seed.student_index + weeks.week_index) % 3))),
  case
    when weeks.week_index <= 2 and student_seed.student_index in (2, 4, 10, 12) then -1
    when weeks.week_index >= 5 then 1
    else 0
  end,
  case
    when (student_seed.student_index + weeks.week_index) % 5 = 0 then
      student_seed.full_name || ' struggled with subtraction borrowing and needed repeated modelling.'
    when (student_seed.student_index + weeks.week_index) % 4 = 0 then
      student_seed.full_name || ' improved reading fluency after paired practice but still hesitated on multisyllabic words.'
    when (student_seed.student_index + weeks.week_index) % 3 = 0 then
      student_seed.full_name || ' attempted sentence writing, but grammar and spacing need another round.'
    else
      student_seed.full_name || ' stayed engaged, completed the worksheet, and responded well to oral prompts.'
  end,
  array_remove(
    array[
      case when student_seed.student_index in (1, 4, 5, 10) and weeks.week_index <= 3 then 'arithmetic: subtraction' end,
      case when student_seed.student_index in (2, 8, 11) and weeks.week_index between 1 and 5 then 'reading: fluency' end,
      case when student_seed.student_index in (4, 10, 12) and weeks.week_index <= 2 then 'writing: sentence construction' end
    ],
    null
  ),
  jsonb_build_object(
    'reading',
    greatest(1, least(5, student_seed.baseline_reading_level + floor(weeks.week_index / 3)::int)),
    'comprehension',
    greatest(1, least(5, student_seed.baseline_reading_level + floor((weeks.week_index + 1) / 4)::int)),
    'writing',
    greatest(1, least(5, student_seed.baseline_reading_level + floor(weeks.week_index / 4)::int)),
    'arithmetic',
    greatest(1, least(5, student_seed.baseline_arithmetic_level + floor(weeks.week_index / 3)::int)),
    'confidence',
    greatest(1, least(5, 2 + floor(weeks.week_index / 3)::int))
  ),
  'server',
  timezone('utc', now()) - ((7 - weeks.week_index) * interval '7 days'),
  timezone('utc', now()) - ((7 - weeks.week_index) * interval '7 days')
from student_seed
cross join weeks;

update public.students
set
  attendance_rate = session_stats.attendance_rate,
  last_session_at = session_stats.last_session_at
from (
  select
    student_id,
    round(
      100.0 * count(*) filter (where attendance = 'present') / greatest(count(*), 1),
      2
    ) as attendance_rate,
    max(started_at) as last_session_at
  from public.sessions
  where offline_id like 'seed-%'
  group by student_id
) as session_stats
where public.students.id = session_stats.student_id;

insert into public.risk_snapshots (
  student_id,
  risk_score,
  risk_level,
  reason_codes,
  calculated_at
)
select
  students.id,
  case
    when students.id in ('00000000-0000-0000-0000-000000000204', '00000000-0000-0000-0000-000000000210') then 84
    when students.id in ('00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000205', '00000000-0000-0000-0000-000000000212') then 66
    when students.id in ('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000208', '00000000-0000-0000-0000-000000000209') then 42
    else 24
  end,
  case
    when students.id in ('00000000-0000-0000-0000-000000000204', '00000000-0000-0000-0000-000000000210') then 'critical'
    when students.id in ('00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000205', '00000000-0000-0000-0000-000000000212') then 'high'
    when students.id in ('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000208', '00000000-0000-0000-0000-000000000209') then 'moderate'
    else 'low'
  end,
  case
    when students.id in ('00000000-0000-0000-0000-000000000204', '00000000-0000-0000-0000-000000000210') then array['migration_risk', 'learning_gaps', 'attendance_drop']
    when students.id in ('00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000205', '00000000-0000-0000-0000-000000000212') then array['attendance_drop', 'session_gap']
    when students.id in ('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000208', '00000000-0000-0000-0000-000000000209') then array['learning_gaps']
    else array['stable']
  end,
  timezone('utc', now())
from public.students
where students.id between '00000000-0000-0000-0000-000000000201' and '00000000-0000-0000-0000-000000000212';

insert into public.parent_messages (
  student_id,
  direction,
  channel,
  locale,
  body,
  delivery_status,
  response_code,
  created_at
)
select
  students.id,
  'outbound',
  'sms',
  students.preferred_language,
  'VidyaSetu update: today''s session was logged and your child''s learning record is updated. Reply H or C.',
  'delivered',
  null,
  timezone('utc', now()) - interval '2 days'
from public.students
where students.id between '00000000-0000-0000-0000-000000000201' and '00000000-0000-0000-0000-000000000212';

insert into public.parent_messages (
  student_id,
  direction,
  channel,
  locale,
  body,
  delivery_status,
  response_code,
  created_at
)
values
  ('00000000-0000-0000-0000-000000000201', 'inbound', 'sms', 'te', 'H', 'received', 'H', timezone('utc', now()) - interval '1 day'),
  ('00000000-0000-0000-0000-000000000202', 'inbound', 'sms', 'hi', 'C', 'received', 'C', timezone('utc', now()) - interval '1 day'),
  ('00000000-0000-0000-0000-000000000204', 'inbound', 'sms', 'te', 'C', 'received', 'C', timezone('utc', now()) - interval '1 day'),
  ('00000000-0000-0000-0000-000000000206', 'inbound', 'sms', 'te', 'H', 'received', 'H', timezone('utc', now()) - interval '1 day'),
  ('00000000-0000-0000-0000-000000000210', 'inbound', 'sms', 'hi', 'C', 'received', 'C', timezone('utc', now()) - interval '1 day'),
  ('00000000-0000-0000-0000-000000000211', 'inbound', 'sms', 'te', 'H', 'received', 'H', timezone('utc', now()) - interval '1 day');

with student_seed as (
  select
    id,
    row_number() over (order by id) as student_index
  from public.students
  where id between '00000000-0000-0000-0000-000000000201' and '00000000-0000-0000-0000-000000000212'
),
mentor_seed as (
  select
    id,
    row_number() over (order by id) as mentor_index
  from public.mentors
  where id between '00000000-0000-0000-0000-000000000101' and '00000000-0000-0000-0000-000000000105'
)
insert into public.mentor_matches (
  student_id,
  mentor_id,
  score,
  signal_breakdown,
  created_at
)
select
  student_seed.id,
  mentor_seed.id,
  72 + ((student_seed.student_index + mentor_seed.mentor_index) % 22),
  jsonb_build_object(
    'language', 80 + ((student_seed.student_index + mentor_seed.mentor_index) % 15),
    'location', 65 + ((student_seed.student_index + mentor_seed.mentor_index) % 20),
    'grade', 70 + ((student_seed.student_index + mentor_seed.mentor_index) % 18),
    'capacity', 68 + ((student_seed.student_index + mentor_seed.mentor_index) % 14),
    'consistency', 75 + mentor_seed.mentor_index
  ),
  timezone('utc', now())
from student_seed
join mentor_seed
  on mentor_seed.mentor_index = ((student_seed.student_index - 1) % 5) + 1;

