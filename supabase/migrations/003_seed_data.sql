-- ═══════════════════════════════════════════════════
-- VIDYASETU DEMO SEED DATA — FIXED
-- Fixed UUIDs for reproducibility.
-- Run AFTER migrations 001 and 002 are applied.
-- Mentors inserted with user_id = NULL (seed-safe).
-- Run scripts/seed.ts to attach real auth users for login.
-- ═══════════════════════════════════════════════════

-- Step 0: Temporarily allow NULL user_id for seed
-- (only in local dev / hackathon demo environment)
ALTER TABLE mentors ALTER COLUMN user_id DROP NOT NULL;

-- NGO
INSERT INTO ngos (id, name, contact_email, twilio_from_number)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Youngistaan Foundation',
  'info@youngistaan.org',
  '+14155551234'
) ON CONFLICT (id) DO NOTHING;

-- Centers
INSERT INTO centers (id, name, city, ngo_id) VALUES
  ('22222222-2222-2222-2222-222222222222', 'Nalgonda Center',   'Nalgonda',  '11111111-1111-1111-1111-111111111111'),
  ('33333333-3333-3333-3333-333333333333', 'Wanaparthy Center', 'Wanaparthy', '11111111-1111-1111-1111-111111111111'),
  ('44444444-4444-4444-4444-444444444444', 'GHMC Slum Cluster', 'Hyderabad',  '11111111-1111-1111-1111-111111111111')
ON CONFLICT (id) DO NOTHING;

-- Mentors (user_id NULL — safe for seed, attach later via scripts/seed.ts)
INSERT INTO mentors (
  id, user_id, name, phone, subjects, availability,
  center_id, gender, session_count, avg_student_improvement,
  active_student_count, active
) VALUES
  (
    'aaaa0001-0000-0000-0000-000000000001', NULL,
    'Ravi Kumar', '+919876541001',
    ARRAY['math','science'],
    '{"mon":["09:00","17:00"],"wed":["09:00","17:00"]}',
    '22222222-2222-2222-2222-222222222222',
    'M', 48, 0.80, 6, true
  ),
  (
    'aaaa0002-0000-0000-0000-000000000002', NULL,
    'Anita Reddy', '+919876541002',
    ARRAY['reading','english','comprehension'],
    '{"tue":["10:00","16:00"],"thu":["10:00","16:00"]}',
    '22222222-2222-2222-2222-222222222222',
    'F', 36, 0.75, 5, true
  ),
  (
    'aaaa0003-0000-0000-0000-000000000003', NULL,
    'Kumar Sai', '+919876541003',
    ARRAY['math','english'],
    '{"mon":["14:00","18:00"]}',
    '33333333-3333-3333-3333-333333333333',
    'M', 22, 0.60, 4, true
  ),
  (
    'aaaa0004-0000-0000-0000-000000000004', NULL,
    'Fatima Begum', '+919876541004',
    ARRAY['reading','comprehension'],
    '{"wed":["09:00","13:00"],"fri":["09:00","13:00"]}',
    '33333333-3333-3333-3333-333333333333',
    'F', 31, 0.70, 4, true
  ),
  (
    'aaaa0005-0000-0000-0000-000000000005', NULL,
    'Suresh Babu', '+919876541005',
    ARRAY['science','math'],
    '{"sat":["09:00","12:00"]}',
    '44444444-4444-4444-4444-444444444444',
    'M', 18, 0.55, 3, true
  )
ON CONFLICT (id) DO NOTHING;

-- Students
-- 4 RED: high gap_profile, last_session > 14 days ago
INSERT INTO students (id, name, grade, gender, center_id, assigned_mentor_id,
  gap_profile, risk_score, risk_color, last_session_at, engagement_score, preferred_time_slot, parent_language) VALUES
('bbbb0001-0000-0000-0000-000000000001', 'Priya Sharma',   5, 'F', '22222222-2222-2222-2222-222222222222',
  'aaaa0001-0000-0000-0000-000000000001',
  '{"math":2.3,"reading":2.0,"science":1.8,"english":2.5,"comprehension":2.1}',
  0.72, 'red', NOW() - INTERVAL '16 days', 0.6, '09:00', 'hi'),
('bbbb0002-0000-0000-0000-000000000002', 'Rahul Verma',    4, 'M', '22222222-2222-2222-2222-222222222222',
  'aaaa0001-0000-0000-0000-000000000001',
  '{"math":4.5,"reading":3.8,"science":4.0,"english":3.5,"comprehension":3.9}',
  0.85, 'red', NOW() - INTERVAL '22 days', 0.3, '09:00', 'te'),
('bbbb0003-0000-0000-0000-000000000003', 'Sita Devi',      3, 'F', '33333333-3333-3333-3333-333333333333',
  'aaaa0003-0000-0000-0000-000000000003',
  '{"math":3.8,"reading":4.2,"science":3.5,"english":4.0,"comprehension":4.1}',
  0.80, 'red', NOW() - INTERVAL '18 days', 0.4, '14:00', 'hi'),
('bbbb0004-0000-0000-0000-000000000004', 'Arjun Nair',     6, 'M', '44444444-4444-4444-4444-444444444444',
  'aaaa0005-0000-0000-0000-000000000005',
  '{"math":4.0,"reading":3.5,"science":3.8,"english":3.2,"comprehension":3.7}',
  0.78, 'red', NOW() - INTERVAL '20 days', 0.35, '09:00', 'en')
ON CONFLICT (id) DO NOTHING;

-- 4 AMBER: moderate gaps, session 7–14 days ago
INSERT INTO students (id, name, grade, gender, center_id, assigned_mentor_id,
  gap_profile, risk_score, risk_color, last_session_at, engagement_score, preferred_time_slot, parent_language) VALUES
('bbbb0005-0000-0000-0000-000000000005', 'Meera Singh',    5, 'F', '22222222-2222-2222-2222-222222222222',
  'aaaa0002-0000-0000-0000-000000000002',
  '{"math":2.8,"reading":2.5,"science":2.2,"english":3.0,"comprehension":2.7}',
  0.55, 'amber', NOW() - INTERVAL '10 days', 0.55, '10:00', 'hi'),
('bbbb0006-0000-0000-0000-000000000006', 'Vikram Rao',     4, 'M', '22222222-2222-2222-2222-222222222222',
  'aaaa0001-0000-0000-0000-000000000001',
  '{"math":3.1,"reading":2.0,"science":3.3,"english":2.5,"comprehension":2.8}',
  0.58, 'amber', NOW() - INTERVAL '12 days', 0.5, '09:00', 'te'),
('bbbb0007-0000-0000-0000-000000000007', 'Kavitha Reddy',  6, 'F', '33333333-3333-3333-3333-333333333333',
  'aaaa0004-0000-0000-0000-000000000004',
  '{"math":2.5,"reading":3.0,"science":2.0,"english":2.8,"comprehension":3.2}',
  0.52, 'amber', NOW() - INTERVAL '9 days', 0.6, '09:00', 'te'),
('bbbb0008-0000-0000-0000-000000000008', 'Sunil Patil',    5, 'M', '44444444-4444-4444-4444-444444444444',
  'aaaa0005-0000-0000-0000-000000000005',
  '{"math":2.9,"reading":2.3,"science":3.0,"english":2.6,"comprehension":2.4}',
  0.50, 'amber', NOW() - INTERVAL '8 days', 0.62, '09:00', 'hi')
ON CONFLICT (id) DO NOTHING;

-- 4 GREEN: low gaps, session within 7 days
INSERT INTO students (id, name, grade, gender, center_id, assigned_mentor_id,
  gap_profile, risk_score, risk_color, last_session_at, engagement_score, preferred_time_slot, parent_language) VALUES
('bbbb0009-0000-0000-0000-000000000009', 'Lakshmi Iyer',   5, 'F', '22222222-2222-2222-2222-222222222222',
  'aaaa0002-0000-0000-0000-000000000002',
  '{"math":0.8,"reading":0.5,"science":0.9,"english":0.6,"comprehension":0.7}',
  0.20, 'green', NOW() - INTERVAL '3 days', 0.85, '10:00', 'en'),
('bbbb0010-0000-0000-0000-000000000010', 'Deepak Mehta',   4, 'M', '22222222-2222-2222-2222-222222222222',
  'aaaa0001-0000-0000-0000-000000000001',
  '{"math":1.2,"reading":0.8,"science":1.0,"english":0.9,"comprehension":0.7}',
  0.25, 'green', NOW() - INTERVAL '5 days', 0.80, '09:00', 'hi'),
('bbbb0011-0000-0000-0000-000000000011', 'Pooja Sharma',   3, 'F', '33333333-3333-3333-3333-333333333333',
  'aaaa0004-0000-0000-0000-000000000004',
  '{"math":0.5,"reading":1.0,"science":0.8,"english":1.1,"comprehension":0.9}',
  0.18, 'green', NOW() - INTERVAL '2 days', 0.90, '09:00', 'hi'),
('bbbb0012-0000-0000-0000-000000000012', 'Kiran Bhat',     6, 'M', '44444444-4444-4444-4444-444444444444',
  'aaaa0005-0000-0000-0000-000000000005',
  '{"math":1.5,"reading":1.2,"science":1.3,"english":1.0,"comprehension":1.1}',
  0.28, 'green', NOW() - INTERVAL '4 days', 0.75, '09:00', 'en')
ON CONFLICT (id) DO NOTHING;

-- Parent contacts for all 12 students
INSERT INTO parent_contacts (student_id, phone, language, sms_consent) VALUES
('bbbb0001-0000-0000-0000-000000000001', '+919000000001', 'hi', true),
('bbbb0002-0000-0000-0000-000000000002', '+919000000002', 'te', true),
('bbbb0003-0000-0000-0000-000000000003', '+919000000003', 'hi', true),
('bbbb0004-0000-0000-0000-000000000004', '+919000000004', 'en', true),
('bbbb0005-0000-0000-0000-000000000005', '+919000000005', 'hi', true),
('bbbb0006-0000-0000-0000-000000000006', '+919000000006', 'te', true),
('bbbb0007-0000-0000-0000-000000000007', '+919000000007', 'te', true),
('bbbb0008-0000-0000-0000-000000000008', '+919000000008', 'hi', true),
('bbbb0009-0000-0000-0000-000000000009', '+919000000009', 'en', true),
('bbbb0010-0000-0000-0000-000000000010', '+919000000010', 'hi', true),
('bbbb0011-0000-0000-0000-000000000011', '+919000000011', 'hi', true),
('bbbb0012-0000-0000-0000-000000000012', '+919000000012', 'en', true)
ON CONFLICT (student_id) DO NOTHING;

-- Priya's gap_history healing arc (8 weeks)
INSERT INTO gap_history (student_id, week_start, gap_profile) VALUES
('bbbb0001-0000-0000-0000-000000000001', CURRENT_DATE - INTERVAL '56 days',
  '{"math":4.2,"reading":3.1,"science":2.0,"english":2.8,"comprehension":2.5}'),
('bbbb0001-0000-0000-0000-000000000001', CURRENT_DATE - INTERVAL '49 days',
  '{"math":4.0,"reading":3.0,"science":1.9,"english":2.7,"comprehension":2.4}'),
('bbbb0001-0000-0000-0000-000000000001', CURRENT_DATE - INTERVAL '42 days',
  '{"math":3.8,"reading":2.9,"science":1.9,"english":2.7,"comprehension":2.3}'),
('bbbb0001-0000-0000-0000-000000000001', CURRENT_DATE - INTERVAL '35 days',
  '{"math":3.5,"reading":2.8,"science":1.9,"english":2.6,"comprehension":2.2}'),
('bbbb0001-0000-0000-0000-000000000001', CURRENT_DATE - INTERVAL '28 days',
  '{"math":3.2,"reading":2.6,"science":1.8,"english":2.6,"comprehension":2.2}'),
('bbbb0001-0000-0000-0000-000000000001', CURRENT_DATE - INTERVAL '21 days',
  '{"math":2.9,"reading":2.4,"science":1.8,"english":2.5,"comprehension":2.1}'),
('bbbb0001-0000-0000-0000-000000000001', CURRENT_DATE - INTERVAL '14 days',
  '{"math":2.6,"reading":2.2,"science":1.8,"english":2.5,"comprehension":2.1}'),
('bbbb0001-0000-0000-0000-000000000001', CURRENT_DATE - INTERVAL '7 days',
  '{"math":2.3,"reading":2.0,"science":1.8,"english":2.5,"comprehension":2.1}')
ON CONFLICT (student_id, week_start) DO NOTHING;

-- 8 weeks of historical sessions for green students and Priya (so Foundation Pulse works)
-- Priya sessions (weekly for 8 weeks, paired with Ravi Kumar)
INSERT INTO sessions (offline_id, student_id, mentor_id, session_date, subjects_covered, skill_ratings, note, synced) VALUES
('seed-priya-w8', 'bbbb0001-0000-0000-0000-000000000001', 'aaaa0001-0000-0000-0000-000000000001',
  CURRENT_DATE - INTERVAL '56 days', ARRAY['math'], '{"math":"steady"}', 'Struggled with carrying', true),
('seed-priya-w7', 'bbbb0001-0000-0000-0000-000000000001', 'aaaa0001-0000-0000-0000-000000000001',
  CURRENT_DATE - INTERVAL '49 days', ARRAY['math'], '{"math":"steady"}', 'Practicing 3-digit subtraction', true),
('seed-priya-w6', 'bbbb0001-0000-0000-0000-000000000001', 'aaaa0001-0000-0000-0000-000000000001',
  CURRENT_DATE - INTERVAL '42 days', ARRAY['math','reading'], '{"math":"improving","reading":"steady"}', 'Carrying clicked! Used house method.', true),
('seed-priya-w5', 'bbbb0001-0000-0000-0000-000000000001', 'aaaa0001-0000-0000-0000-000000000001',
  CURRENT_DATE - INTERVAL '35 days', ARRAY['math','reading'], '{"math":"improving","reading":"improving"}', 'Good session with fractions', true),
('seed-priya-w4', 'bbbb0001-0000-0000-0000-000000000001', 'aaaa0001-0000-0000-0000-000000000001',
  CURRENT_DATE - INTERVAL '28 days', ARRAY['math'], '{"math":"improving"}', 'Multiplication tables 6 and 7', true),
('seed-priya-w3', 'bbbb0001-0000-0000-0000-000000000001', 'aaaa0001-0000-0000-0000-000000000001',
  CURRENT_DATE - INTERVAL '21 days', ARRAY['math','comprehension'], '{"math":"improving","comprehension":"steady"}', 'Main idea exercise done', true),
('seed-priya-w2', 'bbbb0001-0000-0000-0000-000000000001', 'aaaa0001-0000-0000-0000-000000000001',
  CURRENT_DATE - INTERVAL '14 days', ARRAY['math'], '{"math":"improving"}', 'Decimal point introduced', true),
('seed-priya-w1', 'bbbb0001-0000-0000-0000-000000000001', 'aaaa0001-0000-0000-0000-000000000001',
  CURRENT_DATE - INTERVAL '7 days', ARRAY['math','reading'], '{"math":"improving","reading":"improving"}', 'Good progress overall', true)
ON CONFLICT (offline_id) DO NOTHING;

-- Sessions for green students (last 4 weeks)
INSERT INTO sessions (offline_id, student_id, mentor_id, session_date, subjects_covered, skill_ratings, note, synced) VALUES
('seed-lakshmi-1', 'bbbb0009-0000-0000-0000-000000000009', 'aaaa0002-0000-0000-0000-000000000002',
  CURRENT_DATE - INTERVAL '3 days', ARRAY['reading','comprehension'], '{"reading":"improving","comprehension":"improving"}', 'Story level reading achieved', true),
('seed-deepak-1', 'bbbb0010-0000-0000-0000-000000000010', 'aaaa0001-0000-0000-0000-000000000001',
  CURRENT_DATE - INTERVAL '5 days', ARRAY['math','science'], '{"math":"improving","science":"steady"}', 'Place value mastered', true),
('seed-pooja-1', 'bbbb0011-0000-0000-0000-000000000011', 'aaaa0004-0000-0000-0000-000000000004',
  CURRENT_DATE - INTERVAL '2 days', ARRAY['reading'], '{"reading":"improving"}', 'Read aloud with expression', true),
('seed-kiran-1', 'bbbb0012-0000-0000-0000-000000000012', 'aaaa0005-0000-0000-0000-000000000005',
  CURRENT_DATE - INTERVAL '4 days', ARRAY['math','science'], '{"math":"improving","science":"improving"}', 'Excellent fraction work', true)
ON CONFLICT (offline_id) DO NOTHING;
