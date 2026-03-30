create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.mentors (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text unique,
  phone text not null,
  languages text[] not null default array[]::text[],
  focus_grades text[] not null default array[]::text[],
  localities text[] not null default array[]::text[],
  weekly_capacity integer not null default 4 check (weekly_capacity between 1 and 14),
  sessions_completed integer not null default 0 check (sessions_completed >= 0),
  consistency_score integer not null default 0 check (consistency_score between 0 and 100),
  empathy_score integer not null default 0 check (empathy_score between 0 and 100),
  teaching_score integer not null default 0 check (teaching_score between 0 and 100),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  preferred_name text,
  age integer not null check (age between 5 and 18),
  grade text not null,
  school_name text,
  locality text not null,
  migration_status text not null default 'stable' check (
    migration_status in ('stable', 'seasonal', 'recently_migrated')
  ),
  baseline_reading_level integer not null default 3 check (baseline_reading_level between 1 and 5),
  baseline_arithmetic_level integer not null default 3 check (baseline_arithmetic_level between 1 and 5),
  attendance_rate numeric(5,2) not null default 100 check (attendance_rate between 0 and 100),
  guardian_name text not null,
  guardian_phone text not null,
  preferred_language text not null default 'en' check (preferred_language in ('en', 'hi', 'te')),
  sms_opt_in boolean not null default true,
  last_session_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.session_templates (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  focus_skills text[] not null default array[]::text[],
  note_hint text not null default '',
  duration_minutes integer not null default 60 check (duration_minutes between 15 and 180),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  offline_id text not null unique,
  student_id uuid not null references public.students(id) on delete cascade,
  mentor_id uuid not null references public.mentors(id) on delete restrict,
  template_id uuid references public.session_templates(id) on delete set null,
  session_date date not null,
  started_at timestamptz,
  duration_minutes integer not null check (duration_minutes between 15 and 180),
  mode text not null check (mode in ('offline', 'online', 'phone', 'home-visit')),
  attendance text not null check (attendance in ('present', 'absent', 'late')),
  engagement_level integer not null check (engagement_level between 1 and 5),
  confidence_delta integer not null default 0 check (confidence_delta between -2 and 2),
  notes text not null,
  learning_gaps text[] not null default array[]::text[],
  skill_ratings jsonb not null default '{}'::jsonb check (jsonb_typeof(skill_ratings) = 'object'),
  sync_source text not null default 'device' check (sync_source in ('device', 'server')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.passport_shares (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null unique references public.students(id) on delete cascade,
  public_code text not null unique,
  active boolean not null default true,
  last_viewed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.parent_messages (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  direction text not null check (direction in ('outbound', 'inbound')),
  channel text not null default 'sms' check (channel in ('sms')),
  locale text not null check (locale in ('en', 'hi', 'te')),
  body text not null,
  delivery_status text not null default 'queued',
  response_code text check (response_code in ('H', 'C', 'N')),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.risk_snapshots (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  risk_score integer not null check (risk_score between 0 and 100),
  risk_level text not null check (risk_level in ('low', 'moderate', 'high', 'critical')),
  reason_codes text[] not null default array[]::text[],
  calculated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.mentor_matches (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  mentor_id uuid not null references public.mentors(id) on delete cascade,
  score numeric(5,2) not null check (score between 0 and 100),
  signal_breakdown jsonb not null default '{}'::jsonb check (jsonb_typeof(signal_breakdown) = 'object'),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists mentors_localities_idx on public.mentors using gin (localities);
create index if not exists mentors_focus_grades_idx on public.mentors using gin (focus_grades);
create index if not exists students_locality_grade_idx on public.students (locality, grade);
create index if not exists sessions_student_date_idx on public.sessions (student_id, session_date desc);
create index if not exists sessions_mentor_date_idx on public.sessions (mentor_id, session_date desc);
create index if not exists parent_messages_student_created_idx on public.parent_messages (student_id, created_at desc);
create index if not exists risk_snapshots_student_created_idx on public.risk_snapshots (student_id, calculated_at desc);

drop trigger if exists set_mentors_updated_at on public.mentors;
create trigger set_mentors_updated_at
before update on public.mentors
for each row
execute function public.set_updated_at();

drop trigger if exists set_students_updated_at on public.students;
create trigger set_students_updated_at
before update on public.students
for each row
execute function public.set_updated_at();

drop trigger if exists set_sessions_updated_at on public.sessions;
create trigger set_sessions_updated_at
before update on public.sessions
for each row
execute function public.set_updated_at();

do $$
begin
  alter publication supabase_realtime add table public.sessions;
exception
  when duplicate_object then null;
end;
$$;

do $$
begin
  alter publication supabase_realtime add table public.risk_snapshots;
exception
  when duplicate_object then null;
end;
$$;

do $$
begin
  alter publication supabase_realtime add table public.parent_messages;
exception
  when duplicate_object then null;
end;
$$;

