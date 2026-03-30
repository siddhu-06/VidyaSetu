-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- NGOs table
CREATE TABLE ngos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  contact_email TEXT,
  twilio_from_number TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Centers table
CREATE TABLE centers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  city        TEXT NOT NULL,
  ngo_id      UUID NOT NULL REFERENCES ngos(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Students table (forward-declares assigned_mentor_id, FK added after mentors)
CREATE TABLE students (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 TEXT NOT NULL,
  grade                SMALLINT NOT NULL CHECK (grade BETWEEN 3 AND 6),
  gender               TEXT NOT NULL DEFAULT 'M' CHECK (gender IN ('M','F','other')),
  center_id            UUID NOT NULL REFERENCES centers(id) ON DELETE CASCADE,
  assigned_mentor_id   UUID,
  gap_profile          JSONB NOT NULL DEFAULT '{"math":0,"reading":0,"science":0,"english":0,"comprehension":0}',
  risk_score           FLOAT NOT NULL DEFAULT 0.5 CHECK (risk_score BETWEEN 0 AND 1),
  risk_color           TEXT NOT NULL DEFAULT 'amber' CHECK (risk_color IN ('green','amber','red')),
  last_session_at      TIMESTAMPTZ,
  engagement_score     FLOAT NOT NULL DEFAULT 0.5 CHECK (engagement_score BETWEEN 0 AND 1),
  preferred_time_slot  TEXT,
  parent_language      TEXT NOT NULL DEFAULT 'hi' CHECK (parent_language IN ('hi','te','en')),
  created_at           TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_students_center_id ON students(center_id);
CREATE INDEX idx_students_risk_color ON students(risk_color);
CREATE INDEX idx_students_assigned_mentor ON students(assigned_mentor_id);

-- Mentors table
CREATE TABLE mentors (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name                    TEXT NOT NULL,
  phone                   TEXT NOT NULL,
  subjects                TEXT[] NOT NULL DEFAULT '{}',
  availability            JSONB NOT NULL DEFAULT '{}',
  center_id               UUID NOT NULL REFERENCES centers(id) ON DELETE CASCADE,
  gender                  TEXT NOT NULL DEFAULT 'M',
  session_count           INT NOT NULL DEFAULT 0,
  avg_student_improvement FLOAT NOT NULL DEFAULT 0.5 CHECK (avg_student_improvement BETWEEN 0 AND 1),
  active_student_count    INT NOT NULL DEFAULT 0,
  active                  BOOLEAN NOT NULL DEFAULT true,
  created_at              TIMESTAMPTZ DEFAULT now()
);

-- Fix forward reference: students → mentors
ALTER TABLE students
  ADD CONSTRAINT students_assigned_mentor_id_fkey
  FOREIGN KEY (assigned_mentor_id) REFERENCES mentors(id) ON DELETE SET NULL;

-- Sessions table
CREATE TABLE sessions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offline_id       TEXT NOT NULL UNIQUE,    -- client UUID for deduplication
  student_id       UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  mentor_id        UUID NOT NULL REFERENCES mentors(id) ON DELETE CASCADE,
  session_date     DATE NOT NULL,
  subjects_covered TEXT[] NOT NULL DEFAULT '{}',
  skill_ratings    JSONB NOT NULL DEFAULT '{}',
  note             TEXT NOT NULL DEFAULT '',
  raw_tags         TEXT[] NOT NULL DEFAULT '{}',
  synced           BOOLEAN NOT NULL DEFAULT true,  -- true once in DB
  synced_at        TIMESTAMPTZ DEFAULT now(),
  created_at       TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_sessions_student_id ON sessions(student_id);
CREATE INDEX idx_sessions_mentor_id ON sessions(mentor_id);
CREATE INDEX idx_sessions_session_date ON sessions(session_date DESC);
CREATE INDEX idx_sessions_offline_id ON sessions(offline_id);

-- Parent contacts
CREATE TABLE parent_contacts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE UNIQUE,
  phone       TEXT NOT NULL,
  language    TEXT NOT NULL DEFAULT 'hi' CHECK (language IN ('hi','te','en')),
  sms_consent BOOLEAN NOT NULL DEFAULT true,
  last_sms_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- SMS log
CREATE TABLE sms_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  session_id  UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  phone       TEXT NOT NULL,
  message_body TEXT NOT NULL,
  twilio_sid  TEXT,
  reply       TEXT,
  sentiment   SMALLINT CHECK (sentiment IN (-1, 1)),
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_sms_log_student_id ON sms_log(student_id);
CREATE INDEX idx_sms_log_created_at ON sms_log(created_at DESC);

-- Gap history (for Foundation Pulse healing chart)
CREATE TABLE gap_history (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  week_start  DATE NOT NULL,
  gap_profile JSONB NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, week_start)
);

CREATE INDEX idx_gap_history_student_week ON gap_history(student_id, week_start DESC);

-- Coordinator alerts
CREATE TABLE coordinator_alerts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  ngo_id      UUID NOT NULL REFERENCES ngos(id) ON DELETE CASCADE,
  alert_type  TEXT NOT NULL,  -- 'risk_red', 'parent_silence', 'gap_stagnation'
  resolved    BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- User profiles (extends auth.users)
CREATE TABLE user_profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL DEFAULT 'mentor' CHECK (role IN ('mentor','coordinator','admin')),
  ngo_id     UUID REFERENCES ngos(id) ON DELETE SET NULL,
  center_id  UUID REFERENCES centers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Realtime on key tables
ALTER PUBLICATION supabase_realtime ADD TABLE sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE students;
ALTER PUBLICATION supabase_realtime ADD TABLE sms_log;
ALTER PUBLICATION supabase_realtime ADD TABLE coordinator_alerts;
