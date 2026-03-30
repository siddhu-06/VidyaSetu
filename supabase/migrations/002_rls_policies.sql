-- Enable RLS on all tables
ALTER TABLE ngos ENABLE ROW LEVEL SECURITY;
ALTER TABLE centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentors ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE gap_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE coordinator_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Helper function: get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM user_profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper function: get current user's ngo_id
CREATE OR REPLACE FUNCTION get_user_ngo_id()
RETURNS UUID AS $$
  SELECT ngo_id FROM user_profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper function: get current user's mentor id
CREATE OR REPLACE FUNCTION get_mentor_id()
RETURNS UUID AS $$
  SELECT id FROM mentors WHERE user_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER;

-- STUDENTS policies
CREATE POLICY "Mentors read own center students" ON students
  FOR SELECT USING (
    center_id IN (
      SELECT center_id FROM mentors WHERE user_id = auth.uid()
    )
  );
CREATE POLICY "Coordinators read NGO students" ON students
  FOR SELECT USING (
    get_user_role() IN ('coordinator', 'admin') AND
    center_id IN (SELECT id FROM centers WHERE ngo_id = get_user_ngo_id())
  );
CREATE POLICY "Coordinators update students" ON students
  FOR UPDATE USING (
    get_user_role() IN ('coordinator', 'admin') AND
    center_id IN (SELECT id FROM centers WHERE ngo_id = get_user_ngo_id())
  );
CREATE POLICY "Service role full access students" ON students
  USING (auth.role() = 'service_role');

-- SESSIONS policies
CREATE POLICY "Mentors insert own sessions" ON sessions
  FOR INSERT WITH CHECK (mentor_id = get_mentor_id());
CREATE POLICY "Mentors read own sessions" ON sessions
  FOR SELECT USING (mentor_id = get_mentor_id());
CREATE POLICY "Coordinators read NGO sessions" ON sessions
  FOR SELECT USING (
    get_user_role() IN ('coordinator', 'admin') AND
    student_id IN (
      SELECT s.id FROM students s
      JOIN centers c ON s.center_id = c.id
      WHERE c.ngo_id = get_user_ngo_id()
    )
  );
CREATE POLICY "Service role full access sessions" ON sessions
  USING (auth.role() = 'service_role');

-- MENTORS policies
CREATE POLICY "Anyone in NGO can read mentors" ON mentors
  FOR SELECT USING (
    center_id IN (SELECT id FROM centers WHERE ngo_id = get_user_ngo_id())
  );
CREATE POLICY "Mentors update own profile" ON mentors
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Service role full access mentors" ON mentors
  USING (auth.role() = 'service_role');

-- SMS_LOG, GAP_HISTORY: coordinators read, service role full access
CREATE POLICY "Coordinators read sms_log" ON sms_log
  FOR SELECT USING (get_user_role() IN ('coordinator', 'admin'));
CREATE POLICY "Service role full access sms_log" ON sms_log
  USING (auth.role() = 'service_role');

CREATE POLICY "Coordinators read gap_history" ON gap_history
  FOR SELECT USING (get_user_role() IN ('coordinator', 'admin'));
CREATE POLICY "Mentors read own students gap_history" ON gap_history
  FOR SELECT USING (
    student_id IN (
      SELECT id FROM students WHERE assigned_mentor_id = get_mentor_id()
    )
  );
CREATE POLICY "Service role full access gap_history" ON gap_history
  USING (auth.role() = 'service_role');

-- PUBLIC passport: anyone can read student passport data (read-only, limited columns)
CREATE POLICY "Public read passport" ON students
  FOR SELECT USING (true);  -- Restrict columns via API select, not RLS
