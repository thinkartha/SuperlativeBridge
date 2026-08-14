-- Rename connectors, remove HubSpot, enrich Salesforce settings,
-- candidate visa / geo / resume for employer map & filters.

-- ─── Integrations renames & HubSpot removal ────────────────────────────────
UPDATE integrations SET
  name = 'Open edX',
  slug = 'openedx',
  logo = 'openedx',
  category = 'LMS',
  description = 'Imports Open edX course shells, learner progress, and grade completions into SuperlativeBridge enrollments.',
  config = jsonb_build_object(
    'lmsUrl', 'https://courses.superlativebridge.org',
    'oauthClientId', 'sb-openedx-demo',
    'auth', 'OAuth2',
    'courseOrgs', jsonb_build_array('SBX', 'Healthcare', 'IT'),
    'webhookSecretSet', true,
    'syncGrades', true,
    'syncEnrollments', true
  ),
  updated_at = now()
WHERE id = 'd0000001-0000-0000-0000-000000000008' OR slug IN ('canvas', 'openedx');

UPDATE integration_pipelines SET
  name = 'Open edX gradebook → enrollments',
  description = 'Polls Open edX gradebook for mapped courses and advances SuperlativeBridge enrollment progress.',
  dag = $dag$[
    {"id":"courses","name":"List mapped courses","type":"extract","dependsOn":[]},
    {"id":"grades","name":"Fetch Open edX grades","type":"extract","dependsOn":["courses"]},
    {"id":"map","name":"Map to enrollments","type":"transform","dependsOn":["grades"]},
    {"id":"progress","name":"Update progress %","type":"load","dependsOn":["map"]},
    {"id":"certs","name":"Issue certificates","type":"load","dependsOn":["progress"]},
    {"id":"metrics","name":"Emit job metrics","type":"notify","dependsOn":["certs"]}
  ]$dag$::jsonb,
  updated_at = now()
WHERE id = 'e1000001-0000-0000-0000-000000000010';

UPDATE integrations SET
  name = 'Jenkins CI/CD',
  slug = 'jenkins',
  logo = 'jenkins',
  category = 'DevOps',
  description = 'Triggers and observes Jenkins jobs that build, test, and promote SuperlativeBridge integration pipelines and LMS sync workers.',
  config = jsonb_build_object(
    'baseUrl', 'https://ci.superlativebridge.internal',
    'folder', 'integrations',
    'auth', 'API token',
    'defaultAgent', 'linux-docker',
    'webhookEnabled', true,
    'jobs', jsonb_build_array('sf-contact-sync', 'openedx-grade-sync', 'workday-hire-enroll')
  ),
  updated_at = now()
WHERE id = 'd0000001-0000-0000-0000-000000000003' OR slug IN ('greenhouse', 'jenkins');

UPDATE integration_pipelines SET
  name = 'Jenkins certified-export job',
  description = 'Jenkins job that exports certified GIG workers and posts results to employer partner feeds.',
  dag = $dag$[
    {"id":"query","name":"Query certified workers","type":"extract","dependsOn":[]},
    {"id":"build","name":"Jenkins build agent","type":"transform","dependsOn":["query"]},
    {"id":"test","name":"Run export tests","type":"transform","dependsOn":["build"]},
    {"id":"publish","name":"Publish artifacts","type":"load","dependsOn":["test"]},
    {"id":"notify","name":"Notify #workforce-ops","type":"notify","dependsOn":["publish"]}
  ]$dag$::jsonb,
  settings = COALESCE(settings, '{}'::jsonb) || '{"tags":["devops","export"],"owner":"platform"}'::jsonb,
  updated_at = now()
WHERE id = 'e1000001-0000-0000-0000-000000000004';

-- Remove HubSpot (pipelines/runs cascade)
DELETE FROM integrations WHERE id = 'd0000001-0000-0000-0000-000000000007' OR slug = 'hubspot';

-- Full Salesforce connector settings (demo)
UPDATE integrations SET
  config = jsonb_build_object(
    'org', 'superlativebridge.my.salesforce.com',
    'loginUrl', 'https://login.salesforce.com',
    'apiVersion', '60.0',
    'auth', 'OAuth 2.0 JWT Bearer',
    'sandbox', false,
    'connectedApp', 'SuperlativeBridge_Integrations',
    'consumerKey', '3MVG9demo_consumer_key_xxxx',
    'username', 'integrations@superlativebridge.com',
    'jwtAudience', 'https://login.salesforce.com',
    'certificateAlias', 'sb_sf_jwt_2026',
    'objects', jsonb_build_array('Contact', 'Opportunity', 'Account', 'Certification__c', 'Forecast__c'),
    'syncDirection', 'bidirectional',
    'bulkApi', true,
    'bulkBatchSize', 2000,
    'webhookEndpoint', 'https://api.superlativebridge.com/webhooks/salesforce',
    'webhookSecretSet', true,
    'namedCredential', 'SB_Salesforce_NC',
    'integrationUserProfile', 'Integration User',
    'fieldMappingProfile', 'default_v3',
    'retryPolicy', 'exponential',
    'maxRetries', 3,
    'timeoutSeconds', 120,
    'ipAllowlist', jsonb_build_array('52.x.x.x/28', '3.x.x.x/28'),
    'lastConnectionTest', null,
    'lastConnectionStatus', 'never_tested'
  ),
  updated_at = now()
WHERE slug = 'salesforce';

-- Also align LMS provider label if present
UPDATE lms_providers SET
  name = 'Open edX',
  slug = 'openedx',
  base_url = 'https://courses.superlativebridge.org',
  description = 'Partner Open edX course catalog and grade sync.'
WHERE slug = 'canvas';

-- ─── Candidate visa, geo, resume ───────────────────────────────────────────
ALTER TABLE candidates
  ADD COLUMN IF NOT EXISTS visa_status TEXT NOT NULL DEFAULT 'Work Authorization',
  ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS resume_url TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS resume_text TEXT NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_candidates_visa ON candidates (visa_status);
CREATE INDEX IF NOT EXISTS idx_candidates_geo ON candidates (lat, lng);

-- Geo + visa + resume for existing candidates (by email / location)
UPDATE candidates SET
  visa_status = v.visa,
  lat = v.lat,
  lng = v.lng,
  resume_url = '/resumes/' || lower(replace(split_part(candidates.email,'@',1), '.', '-')) || '.pdf',
  resume_text = v.resume
FROM (VALUES
  ('maria@example.com', 'OPT', 29.7604, -95.3698,
   $r$MARIA GARCIA
Houston, TX · maria@example.com · +1 555-0101
Visa: F-1 OPT

SUMMARY
Full-stack engineer building workforce learning products. Strong in React, Python, and AWS.

EXPERIENCE
Senior Software Engineer — TechBridge (2021–Present)
• Led LMS module delivery for 12k learners
• Built Salesforce contact sync workers

Software Engineer — DataNest (2018–2021)
• Shipped analytics dashboards in React + Python

EDUCATION
BS Computer Science — University of Houston

SKILLS
React, Python, AWS, PostgreSQL, REST APIs
$r$),
  ('james@example.com', 'US Citizen', 41.8781, -87.6298,
   $r$JAMES WILSON
Chicago, IL · james@example.com
Visa: US Citizen

SUMMARY
Data analyst specializing in workforce outcomes and SQL analytics.

EXPERIENCE
Data Analyst — Midwest Health (2020–Present)
• Built Tableau scorecards for training completion

EDUCATION
MS Data Science — UIC

SKILLS
Python, SQL, Tableau
$r$),
  ('aisha.candidate@example.com', 'H-1B', 37.3382, -121.8863,
   $r$AISHA PATEL
San Jose, CA · aisha.candidate@example.com
Visa: H-1B

SUMMARY
Project manager for professional-services delivery teams.

EXPERIENCE
PM — Bay Area Consulting (2016–Present)

EDUCATION
MBA — Santa Clara University

SKILLS
Agile, Scrum, Leadership
$r$),
  ('carlos@example.com', 'Green Card', 25.7617, -80.1918,
   $r$CARLOS MENDEZ
Miami, FL · carlos@example.com
Visa: Green Card

SUMMARY
Licensed electrician / HVAC technician for commercial sites.

SKILLS
Electrical, HVAC, Safety
$r$),
  ('sarah@example.com', 'US Citizen', 47.6062, -122.3321,
   $r$SARAH CHEN
Seattle, WA · sarah@example.com
Visa: US Citizen

SUMMARY
UX designer focused on accessible workforce learning experiences.
$r$),
  ('david.brown@example.com', 'US Citizen', 30.2672, -97.7431,
   $r$DAVID BROWN
Austin, TX · david.brown@example.com
Visa: US Citizen

SUMMARY
Cybersecurity analyst with SIEM and network defense experience.
$r$),
  ('fatima@example.com', 'Asylum/Refugee', 42.3314, -83.0458,
   $r$FATIMA AL-HASSAN
Detroit, MI · fatima@example.com
Visa: Asylum / Refugee work authorization

SUMMARY
Nurse practitioner seeking clinic and home-health GIG roles.
$r$),
  ('robert.kim@example.com', 'TN', 42.3601, -71.0589,
   $r$ROBERT KIM
Boston, MA · robert.kim@example.com
Visa: TN

SUMMARY
Machine learning engineer for NLP and TensorFlow systems.
$r$),
  ('priya.sharma@example.com', 'H-1B', 32.7767, -96.7970,
   $r$PRIYA SHARMA
Dallas, TX · priya.sharma@example.com
Visa: H-1B

SUMMARY
Cloud solutions architect (AWS / Azure).
$r$),
  ('luis.ortega@example.com', 'Work Authorization', 33.4484, -112.0740,
   $r$LUIS ORTEGA
Phoenix, AZ · luis.ortega@example.com
Visa: Work Authorization

SUMMARY
Registered nurse — med-surg and home health.
$r$),
  ('amira.hassan@example.com', 'OPT', 33.7490, -84.3880,
   $r$AMIRA HASSAN
Atlanta, GA · amira.hassan@example.com
Visa: F-1 OPT

SUMMARY
Digital marketing specialist for e-commerce brands.
$r$),
  ('kenji.tanaka@example.com', 'US Citizen', 45.5152, -122.6784,
   $r$KENJI TANAKA
Portland, OR · kenji.tanaka@example.com
Visa: US Citizen

SUMMARY
DevOps engineer — CI/CD, Docker, Linux.
$r$),
  ('nadia.brooks@example.com', 'US Citizen', 39.7392, -104.9903,
   $r$NADIA BROOKS
Denver, CO (Remote) · nadia.brooks@example.com
Visa: US Citizen

SUMMARY
Instructional designer for adult workforce learning.
$r$),
  ('omar.farouk@example.com', 'Green Card', 29.7604, -95.3698,
   $r$OMAR FAROUK
Houston, TX · omar.farouk@example.com
Visa: Green Card

SUMMARY
Construction supervisor with OSHA focus.
$r$),
  ('elena.rossi@example.com', 'H-1B', 40.7128, -74.0060,
   $r$ELENA ROSSI
New York, NY · elena.rossi@example.com
Visa: H-1B

SUMMARY
Business analyst bridging product and engineering.
$r$),
  ('jamal.wright@example.com', 'US Citizen', 38.9072, -77.0369,
   $r$JAMAL WRIGHT
Washington, DC · jamal.wright@example.com
Visa: US Citizen

SUMMARY
Cybersecurity specialist — SOC and incident response.
$r$)
) AS v(email, visa, lat, lng, resume)
WHERE candidates.email = v.email;

-- Extra candidates across more US regions
INSERT INTO candidates (name, title, skills, location, zip, billing_rate, vertical, education, programs, rating, experience, bio, email, availability, open_to_relocate, phone, visa_status, lat, lng, resume_url, resume_text)
SELECT * FROM (VALUES
  ('Maya Thompson', 'Community Health Worker', ARRAY['Outreach','Case Mgmt','Bilingual']::text[], 'New Orleans, LA', '70112', 45, 'Health & Healthcare', 'Certificate CHW', ARRAY['WOTC']::text[], 4.6, '5 years',
   'Community outreach across Gulf Coast clinics.', 'maya.thompson@example.com', 'open', false, '+1 555-0301', 'US Citizen', 29.9511, -90.0715, '/resumes/maya-thompson.pdf',
   $r$MAYA THOMPSON
New Orleans, LA · maya.thompson@example.com
Visa: US Citizen

SUMMARY
Community health worker connecting families to care and workforce programs.
$r$),
  ('Noah Berger', 'Full Stack Developer', ARRAY['Node.js','React','Postgres']::text[], 'Minneapolis, MN', '55401', 88, 'Information Technology', 'BS Software Engineering', ARRAY['Veterans']::text[], 4.7, '6 years',
   'Builds internal tools for mid-market employers.', 'noah.berger@example.com', 'open', true, '+1 555-0302', 'US Citizen', 44.9778, -93.2650, '/resumes/noah-berger.pdf',
   $r$NOAH BERGER
Minneapolis, MN · noah.berger@example.com
Visa: US Citizen

SUMMARY
Full-stack developer (Node, React, Postgres). Veteran.
$r$),
  ('Sofia Alvarez', 'Dental Assistant', ARRAY['Chairside','Radiology','Patient Care']::text[], 'Albuquerque, NM', '87101', 42, 'Health & Healthcare', 'Dental Assisting Diploma', ARRAY['MWBE']::text[], 4.5, '4 years',
   'Bilingual dental assistant seeking clinic GIG shifts.', 'sofia.alvarez@example.com', 'hiring', false, '+1 555-0303', 'Work Authorization', 35.0844, -106.6504, '/resumes/sofia-alvarez.pdf',
   $r$SOFIA ALVAREZ
Albuquerque, NM · sofia.alvarez@example.com
Visa: Work Authorization

SUMMARY
Dental assistant with radiology certification.
$r$),
  ('Ethan Park', 'Data Engineer', ARRAY['Spark','Airflow','Python','SQL']::text[], 'Philadelphia, PA', '19103', 100, 'Information Technology', 'MS Information Systems', '{}'::text[], 4.8, '7 years',
   'Pipelines for learning analytics warehouses.', 'ethan.park@example.com', 'open', true, '+1 555-0304', 'OPT', 39.9526, -75.1652, '/resumes/ethan-park.pdf',
   $r$ETHAN PARK
Philadelphia, PA · ethan.park@example.com
Visa: F-1 OPT

SUMMARY
Data engineer — Spark, Airflow, SQL.
$r$),
  ('Grace Okonkwo', 'HR Coordinator', ARRAY['Onboarding','Workday','Compliance']::text[], 'Nashville, TN', '37201', 55, 'Professional Services', 'BA Human Resources', ARRAY['WOTC']::text[], 4.6, '5 years',
   'Supports employer onboarding for GIG cohorts.', 'grace.okonkwo@example.com', 'passive', true, '+1 555-0305', 'Green Card', 36.1627, -86.7816, '/resumes/grace-okonkwo.pdf',
   $r$GRACE OKONKWO
Nashville, TN · grace.okonkwo@example.com
Visa: Green Card

SUMMARY
HR coordinator specializing in workforce onboarding.
$r$),
  ('Liam Nguyen', 'Mobile Developer', ARRAY['Swift','Kotlin','Firebase']::text[], 'Las Vegas, NV', '89101', 92, 'Information Technology', 'BS Computer Science', ARRAY['HUBZone']::text[], 4.7, '5 years',
   'Ships learner mobile apps for partner orgs.', 'liam.nguyen@example.com', 'open', true, '+1 555-0306', 'US Citizen', 36.1699, -115.1398, '/resumes/liam-nguyen.pdf',
   $r$LIAM NGUYEN
Las Vegas, NV · liam.nguyen@example.com
Visa: US Citizen

SUMMARY
Mobile developer — iOS/Android workforce apps.
$r$),
  ('Hannah Brooks', 'Bookkeeper', ARRAY['QuickBooks','AP/AR','Excel']::text[], 'Kansas City, MO', '64105', 48, 'Professional Services', 'AAS Accounting', ARRAY['WOTC']::text[], 4.4, '8 years',
   'Remote-friendly bookkeeping for small employers.', 'hannah.brooks@example.com', 'open', false, '+1 555-0307', 'US Citizen', 39.0997, -94.5786, '/resumes/hannah-brooks.pdf',
   $r$HANNAH BROOKS
Kansas City, MO · hannah.brooks@example.com
Visa: US Citizen

SUMMARY
Bookkeeper — QuickBooks, AP/AR.
$r$),
  ('Diego Morales', 'Warehouse Lead', ARRAY['Inventory','Forklift','Safety']::text[], 'Salt Lake City, UT', '84101', 40, 'Commerce & Retail', 'High School + OSHA', ARRAY['HUBZone']::text[], 4.5, '10 years',
   'Leads receiving teams for regional DCs.', 'diego.morales@example.com', 'open', false, '+1 555-0308', 'Work Authorization', 40.7608, -111.8910, '/resumes/diego-morales.pdf',
   $r$DIEGO MORALES
Salt Lake City, UT · diego.morales@example.com
Visa: Work Authorization

SUMMARY
Warehouse lead with forklift and safety certifications.
$r$)
) AS v(name, title, skills, location, zip, billing_rate, vertical, education, programs, rating, experience, bio, email, availability, open_to_relocate, phone, visa_status, lat, lng, resume_url, resume_text)
WHERE NOT EXISTS (SELECT 1 FROM candidates c WHERE c.email = v.email);

-- Default remaining candidates without geo to US center-ish placeholders by zip prefix
UPDATE candidates SET
  lat = COALESCE(lat, 39.8283),
  lng = COALESCE(lng, -98.5795),
  visa_status = COALESCE(NULLIF(visa_status, ''), 'Work Authorization'),
  resume_text = CASE WHEN resume_text = '' OR resume_text IS NULL THEN
    name || E'\n' || location || E'\n\n' || COALESCE(title, '') || E'\n\n' || COALESCE(bio, 'GIG worker on SuperlativeBridge.')
  ELSE resume_text END
WHERE lat IS NULL OR resume_text = '' OR resume_text IS NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO sbuser;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO sbuser;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'vivekvardhan') THEN
    GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO vivekvardhan;
    GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO vivekvardhan;
  END IF;
END $$;
