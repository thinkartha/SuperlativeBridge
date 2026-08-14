-- Employer search enrichment + mentor portal seed data

ALTER TABLE candidates ADD COLUMN IF NOT EXISTS availability TEXT NOT NULL DEFAULT 'open';
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS open_to_relocate BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS phone TEXT NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_candidates_location_lower ON candidates (lower(location));
CREATE INDEX IF NOT EXISTS idx_candidates_availability ON candidates (availability);
CREATE INDEX IF NOT EXISTS idx_candidates_rating ON candidates (rating DESC);
CREATE INDEX IF NOT EXISTS idx_candidates_billing_rate ON candidates (billing_rate);

-- Align mentor login with mentor directory record
UPDATE mentors SET email = 'sarah.mentor@example.com'
WHERE name = 'Dr. Sarah Johnson' AND email <> 'sarah.mentor@example.com';

-- Enrich existing candidates for LinkedIn-style search
UPDATE candidates SET availability = 'open', open_to_relocate = true
WHERE email IN ('maria@example.com', 'james@example.com', 'robert.kim@example.com');
UPDATE candidates SET availability = 'open', phone = '+1 555-0101'
WHERE email = 'maria@example.com';
UPDATE candidates SET availability = 'hiring', bio = COALESCE(NULLIF(bio,''), 'Experienced professional ready for the next opportunity.')
WHERE email IN ('carlos@example.com', 'fatima@example.com');
UPDATE candidates SET availability = 'passive', open_to_relocate = false
WHERE email IN ('sarah@example.com', 'david.brown@example.com', 'aisha.candidate@example.com');

-- More candidates for filter richness
INSERT INTO candidates (name, title, skills, location, zip, billing_rate, vertical, education, programs, rating, experience, bio, email, availability, open_to_relocate, phone)
SELECT * FROM (VALUES
  ('Priya Sharma', 'Cloud Solutions Architect', ARRAY['AWS','Azure','Terraform','Kubernetes']::text[], 'Dallas, TX', '75201', 110, 'Information Technology', 'MS Cloud Computing', ARRAY['WOTC']::text[], 4.8, '10 years',
   'Designs multi-cloud platforms for mid-market employers. AWS SA Pro + Azure Architect.', 'priya.sharma@example.com', 'open', true, '+1 555-0201'),
  ('Luis Ortega', 'Registered Nurse', ARRAY['Med-Surg','Patient Care','EMR','BLS']::text[], 'Phoenix, AZ', '85001', 65, 'Health & Healthcare', 'BSN Nursing', ARRAY['Refugee Employment']::text[], 4.7, '6 years',
   'Bedside RN seeking clinic or home-health GIG placements. Bilingual EN/ES.', 'luis.ortega@example.com', 'open', false, '+1 555-0202'),
  ('Amira Hassan', 'Digital Marketing Specialist', ARRAY['SEO','Google Ads','Content','Analytics']::text[], 'Atlanta, GA', '30301', 60, 'Commerce & Retail', 'BA Marketing', ARRAY['MWBE']::text[], 4.6, '4 years',
   'Performance marketer for e-commerce brands. Looking for remote-first roles.', 'amira.hassan@example.com', 'open', true, '+1 555-0203'),
  ('Kenji Tanaka', 'DevOps Engineer', ARRAY['CI/CD','Docker','Python','Linux']::text[], 'Portland, OR', '97201', 95, 'Information Technology', 'BS Computer Engineering', '{}'::text[], 4.9, '7 years',
   'Automates delivery pipelines. Open to contract-to-hire.', 'kenji.tanaka@example.com', 'hiring', true, '+1 555-0204'),
  ('Nadia Brooks', 'Instructional Designer', ARRAY['Curriculum','Articulate','LMS','Accessibility']::text[], 'Remote', '00000', 70, 'Education', 'M.Ed Learning Design', ARRAY['WOTC']::text[], 4.8, '8 years',
   'Builds workforce learning paths for adult learners. Fully remote.', 'nadia.brooks@example.com', 'open', false, '+1 555-0205'),
  ('Omar Farouk', 'Construction Supervisor', ARRAY['Scheduling','OSHA','Blueprint','Team Lead']::text[], 'Houston, TX', '77002', 50, 'Construction', 'Trade Certificate', ARRAY['HUBZone','Veterans']::text[], 4.5, '15 years',
   'Site supervisor with safety focus. Available for metro Houston projects.', 'omar.farouk@example.com', 'open', false, '+1 555-0206'),
  ('Elena Rossi', 'Business Analyst', ARRAY['SQL','Requirements','Stakeholder Mgmt','Jira']::text[], 'New York, NY', '10001', 80, 'Professional Services', 'MBA', ARRAY['MWBE']::text[], 4.7, '5 years',
   'Bridges product and engineering for SaaS employers.', 'elena.rossi@example.com', 'passive', true, '+1 555-0207'),
  ('Jamal Wright', 'Cybersecurity Specialist', ARRAY['SOC','Splunk','Incident Response','CISSP']::text[], 'Washington, DC', '20001', 105, 'Information Technology', 'BS Information Security', ARRAY['Veterans','WOTC']::text[], 4.9, '9 years',
   'SOC lead seeking cleared or commercial security ops roles.', 'jamal.wright@example.com', 'open', true, '+1 555-0208')
) AS v(name, title, skills, location, zip, billing_rate, vertical, education, programs, rating, experience, bio, email, availability, open_to_relocate, phone)
WHERE NOT EXISTS (SELECT 1 FROM candidates c WHERE c.email = v.email);

-- Mentor portal seed: sessions for Dr. Sarah Johnson (sarah.mentor@example.com)
INSERT INTO mentor_bookings (user_id, mentor_id, scheduled_at, duration_minutes, topic, notes, status)
SELECT u.id, m.id, now() + (offs.days || ' days')::interval, offs.dur, offs.topic, offs.notes, offs.status
FROM mentors m
JOIN (VALUES
  ('maria@example.com', 1, 30, 'Onboarding Q&A', 'First session goals', 'confirmed'),
  ('james@example.com', 3, 60, 'SQL deep dive', 'Window functions practice', 'confirmed'),
  ('maria@example.com', 5, 45, 'Certification plan', 'AWS SAA timeline', 'requested'),
  ('james@example.com', 8, 30, 'Weekly standup', 'Blockers and next steps', 'confirmed'),
  ('maria@example.com', -2, 45, 'Completed: Resume polish', 'Shipped LinkedIn updates', 'completed'),
  ('james@example.com', 2, 45, 'Mock interview — Python', 'Focus on pandas and SQL', 'confirmed'),
  ('maria@example.com', 10, 60, 'Career path in data science', 'Review resume and target roles', 'requested')
) AS offs(email, days, dur, topic, notes, status) ON TRUE
JOIN users u ON u.email = offs.email
WHERE m.email = 'sarah.mentor@example.com'
  AND NOT EXISTS (
    SELECT 1 FROM mentor_bookings mb
    WHERE mb.mentor_id = m.id AND mb.user_id = u.id AND mb.topic = offs.topic
  );

-- Notifications for the mentor user
INSERT INTO notifications (user_id, type, message, read)
SELECT u.id, n.type, n.message, n.read
FROM users u
JOIN (VALUES
  ('booking', 'New session requested: Certification plan — Maria Garcia', false),
  ('booking', 'Confirmed tomorrow: Career path in data science', false),
  ('reminder', 'Prepare materials for SQL deep dive with James', true),
  ('course', '3 learners completed courses you recommended this week', false)
) AS n(type, message, read) ON TRUE
WHERE u.email = 'sarah.mentor@example.com'
  AND NOT EXISTS (
    SELECT 1 FROM notifications x WHERE x.user_id = u.id AND x.message = n.message
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO sbuser;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'vivekvardhan') THEN
    GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO vivekvardhan;
  END IF;
END $$;
