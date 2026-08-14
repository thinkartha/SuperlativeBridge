-- Sample full-course content (Healthcare + Python) and integration pipelines.
-- Additive. Safe to re-run.

-- ─── Course overview fields ────────────────────────────────────────────────
ALTER TABLE courses ADD COLUMN IF NOT EXISTS overview TEXT NOT NULL DEFAULT '';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS learning_objectives JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS audience TEXT NOT NULL DEFAULT '';

-- ─── Per-module completion + quiz attempts ─────────────────────────────────
CREATE TABLE IF NOT EXISTS enrollment_module_progress (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id  UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  module_id      UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  completed_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (enrollment_id, module_id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by     UUID,
  updated_by     UUID,
  deleted_at     TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_emp_enrollment ON enrollment_module_progress (enrollment_id);
CREATE INDEX IF NOT EXISTS idx_emp_module ON enrollment_module_progress (module_id);

CREATE TABLE IF NOT EXISTS quiz_attempts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quiz_id       UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  enrollment_id UUID REFERENCES enrollments(id) ON DELETE SET NULL,
  score         INT NOT NULL,
  passed        BOOLEAN NOT NULL,
  answers       JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by    UUID,
  updated_by    UUID,
  deleted_at    TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user ON quiz_attempts (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz ON quiz_attempts (quiz_id);

-- ─── Integrations (Salesforce and other apps) + Airflow-style pipelines ────
CREATE TABLE IF NOT EXISTS integrations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  slug         TEXT NOT NULL UNIQUE,
  category     TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'configured',
  description  TEXT NOT NULL DEFAULT '',
  logo         TEXT NOT NULL DEFAULT '',
  config       JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_sync_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by   UUID,
  updated_by   UUID,
  deleted_at   TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS integration_pipelines (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  kind           TEXT NOT NULL DEFAULT 'batch',
  schedule       TEXT NOT NULL DEFAULT '',
  status         TEXT NOT NULL DEFAULT 'idle',
  description    TEXT NOT NULL DEFAULT '',
  dag            JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by     UUID,
  updated_by     UUID,
  deleted_at     TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_pipelines_integration ON integration_pipelines (integration_id);

CREATE TABLE IF NOT EXISTS pipeline_runs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id UUID NOT NULL REFERENCES integration_pipelines(id) ON DELETE CASCADE,
  run_number  INT NOT NULL,
  status      TEXT NOT NULL,
  trigger     TEXT NOT NULL DEFAULT 'schedule',
  started_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  steps       JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by  UUID,
  updated_by  UUID,
  deleted_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_pipeline_runs_pipeline ON pipeline_runs (pipeline_id, started_at DESC);

-- Audit triggers on new tables
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'enrollment_module_progress', 'quiz_attempts',
    'integrations', 'integration_pipelines', 'pipeline_runs'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'set_updated_at') THEN
      EXECUTE format('DROP TRIGGER IF EXISTS trg_%s_updated_at ON %I', t, t);
      EXECUTE format(
        'CREATE TRIGGER trg_%s_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at()',
        t, t
      );
    END IF;
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'write_audit_log') THEN
      EXECUTE format('DROP TRIGGER IF EXISTS trg_%s_audit ON %I', t, t);
      EXECUTE format(
        'CREATE TRIGGER trg_%s_audit AFTER INSERT OR UPDATE OR DELETE ON %I FOR EACH ROW EXECUTE FUNCTION write_audit_log()',
        t, t
      );
    END IF;
  END LOOP;
END $$;

-- ─── Healthcare Fundamentals — full sample course (lookup by title) ────────
UPDATE courses SET
  duration = '6 weeks',
  overview = $ov$Healthcare Fundamentals is a complete on-ramp for GIG workers entering clinics, home health, and community care.

You will learn how care is organized in the U.S., how to talk with patients and families, how HIPAA actually works on the floor, and how to document vital signs and coordinate follow-up. Each module pairs a short video with a written lesson. Three quizzes check that you can apply the material, not just recall it.

Completing the course unlocks a SuperlativeBridge certificate that employers and Salesforce-connected hiring pipelines can see.$ov$,
  audience = 'GIG workers, career changers, and community health aides preparing for entry-level clinic, home-health, or patient-support roles. No clinical license required.',
  learning_objectives = $obj$[
    "Explain how patients move through primary, specialty, and community care",
    "Use teach-back and plain language when speaking with patients",
    "Apply HIPAA minimum-necessary rules to everyday situations",
    "Recognize standard infection-control precautions",
    "Record vital signs and flag values that need a licensed clinician",
    "Hand off a simple care-coordination plan across a care team"
  ]$obj$::jsonb
WHERE title = 'Healthcare Fundamentals';

UPDATE modules SET
  video_url = 'https://www.youtube.com/embed/Aw62P5P4oMw',
  duration = '18 min',
  content = $c$Welcome to the U.S. care system.

Most patients first meet a primary-care clinician, then may be referred to specialty care, imaging, or a hospital. Community health workers, medical assistants, and home-health aides sit at the seams of that journey — they are often the people who notice when a patient cannot fill a prescription or get a ride.

Key ideas
• Primary care is the usual first stop and the medical home.
• Acute care (ER / hospital) is for sudden, high-risk problems.
• Post-acute and home health continue recovery after discharge.
• Payers (Medicaid, Medicare, commercial) shape what is covered.

Practice
Sketch the last time you or a family member used care. Label each stop: who they saw, why they were sent there, and what information should have followed them.$c$
WHERE title = 'Introduction & Orientation'
  AND course_id = (SELECT id FROM courses WHERE title = 'Healthcare Fundamentals');

UPDATE modules SET
  video_url = 'https://www.youtube.com/embed/I3GJ6Uvs9uk',
  duration = '16 min',
  content = $c$Patients remember how you made them feel more than the words you used.

Use plain language. Avoid jargon like “NPO” or “ambulate” unless you immediately translate it. After you explain a step, ask the patient to teach it back in their own words. That is the teach-back method — it is a check on you, not a test of the patient.

Do
• Sit at eye level when you can.
• Pause after questions. Silence is useful.
• Confirm the preferred name and language.

Don’t
• Talk over family members who are translating.
• Promise outcomes you cannot control.
• Share another patient’s story as an example.$c$
WHERE title = 'Patient Care Basics'
  AND course_id = (SELECT id FROM courses WHERE title = 'Healthcare Fundamentals');

UPDATE modules SET
  video_url = 'https://www.youtube.com/embed/7tH8X_dG1zI',
  duration = '20 min',
  content = $c$HIPAA is not a slogan — it is a set of daily habits.

Protected health information (PHI) is any data that can identify a patient and relates to their care or payment. The minimum-necessary rule says you only look at, say, or send what the task requires.

Everyday scenarios
• Elevator: do not discuss a patient by name.
• Printer: pick up documents immediately.
• Phone: verify identity with two identifiers before sharing results.
• Screens: lock the workstation when you walk away.

A breach is unauthorized access or disclosure. Report it to your supervisor the same shift — delaying makes the incident worse, not better.$c$
WHERE title = 'Medical Terminology'
  AND course_id = (SELECT id FROM courses WHERE title = 'Healthcare Fundamentals');

INSERT INTO modules (course_id, title, "order", video_url, duration, content)
SELECT c.id, v.title, v.ord, v.video_url, v.duration, v.content
FROM courses c
JOIN (VALUES
  ('Clinical Safety & Infection Control', 4, 'https://www.youtube.com/embed/oOhKmz1Pd4I', '15 min', $c$Standard precautions assume every patient could transmit an infection.

Wash or sanitize hands before and after every patient contact. Wear gloves when you expect contact with body fluids. Know where the sharps container is before you start a task.

If you are unsure whether a mask or gown is required, stop and ask. Guessing is how exposures happen.

After this video, walk your workplace (or a clinic you know) and list: hand-hygiene stations, PPE storage, and the sharps container.$c$),
  ('Vital Signs & Documentation', 5, 'https://www.youtube.com/embed/gUWJ-6nL5-k', '22 min', $c$Vital signs are a conversation with the body: temperature, pulse, respiration, blood pressure, and often oxygen saturation and pain.

Your job is to measure carefully, write what you observed (not what you hoped), and escalate values outside the range your site uses. Never change a number to “look better.”

Documentation tips
• Time-stamp every entry.
• Use approved abbreviations only.
• If you make an error, follow the site’s correction policy — do not scribble over it.

Escalation example: a resting adult pulse of 42 or 140 is not “wait and see.” Notify a licensed clinician now.$c$),
  ('Capstone: Care Coordination', 6, 'https://www.youtube.com/embed/yS0s3QjpwE4', '14 min', $c$Care coordination is how a team keeps a patient from falling through the cracks.

A simple handoff answers: who is the patient, what just happened, what must happen next, and who owns it. SBAR (Situation, Background, Assessment, Recommendation) is one widely used frame.

Capstone task
Write an SBAR for a patient who missed two diabetes follow-up visits, cannot afford test strips, and has a sister who drives on weekends. Identify one community resource and one clinic action.$c$)
) AS v(title, ord, video_url, duration, content) ON TRUE
WHERE c.title = 'Healthcare Fundamentals'
  AND NOT EXISTS (SELECT 1 FROM modules m WHERE m.course_id = c.id AND m.title = v.title);

UPDATE quizzes SET
  title = 'HIPAA checkpoint',
  questions = $q$[
    {"question":"What does HIPAA primarily protect?","options":["Hospital parking rules","Patient health information","Staff vacation calendars","Insurance premiums only"],"answer":1},
    {"question":"The minimum-necessary rule means you should:","options":["Share the full chart with anyone on the unit","Only access what the current task requires","Never look at any record","Post results on the family portal first"],"answer":1},
    {"question":"You overhear a coworker naming a patient in the elevator. You should:","options":["Join the conversation","Ignore it — elevators are private","Remind them and report if it continues","Record it for social media training"],"answer":2}
  ]$q$::jsonb
WHERE module_id IN (
  SELECT m.id FROM modules m JOIN courses c ON c.id = m.course_id
  WHERE c.title = 'Healthcare Fundamentals' AND m.title = 'Introduction & Orientation'
);

INSERT INTO quizzes (module_id, title, pass_score, xp_reward, questions)
SELECT m.id, v.title, v.pass, v.xp, v.questions::jsonb
FROM modules m
JOIN courses c ON c.id = m.course_id
JOIN (VALUES
  ('Patient Care Basics', 'Communication checkpoint', 70, 25, $q$[
   {"question":"Teach-back is used to:","options":["Test the patient's memory","Check that your explanation was clear","Replace written consent","Speed up discharge"],"answer":1},
   {"question":"Which phrase is better with patients?","options":["You need to ambulate TID","Let's take a short walk three times today","NPO after midnight, obviously","Your BMP was unremarkable"],"answer":1},
   {"question":"If a family member is translating, you should:","options":["Speak only to the translator","Confirm the patient's preferred language and pause for both","Ask the child to translate clinical terms","Skip consent"],"answer":1}
 ]$q$),
  ('Capstone: Care Coordination', 'Care coordination capstone quiz', 70, 40, $q$[
   {"question":"SBAR stands for:","options":["Sign, Bill, Assess, Review","Situation, Background, Assessment, Recommendation","Safety, Beds, Admissions, Rooms","Schedule, Budget, Audit, Report"],"answer":1},
   {"question":"A good handoff always includes:","options":["The next owner and the next action","Only the diagnosis code","Staff gossip about adherence","The full legal chart"],"answer":0},
   {"question":"A patient cannot afford test strips. The coordinator should:","options":["Close the case","Document the barrier and connect to a resource","Tell them to try harder","Ignore it if A1C is pending"],"answer":1}
 ]$q$)
) AS v(mod_title, title, pass, xp, questions) ON m.title = v.mod_title
WHERE c.title = 'Healthcare Fundamentals'
  AND NOT EXISTS (SELECT 1 FROM quizzes q WHERE q.module_id = m.id AND q.title = v.title);

-- ─── Python for Data Science — second full sample course ───────────────────
UPDATE courses SET
  duration = '8 weeks',
  overview = $ov$Python for Data Science walks a working adult from zero to a small, honest analysis.

You will write Python, shape tables with pandas, explore a workforce dataset, and present a chart a hiring manager can understand. Videos are short. Lessons include copy-ready snippets. Quizzes sit after the setup, pandas, and capstone modules.

This is the IT-track sample course — use it to see how modules, video, text, quizzes, and progress feel for a technical path.$ov$,
  audience = 'GIG workers and career switchers who are comfortable with a laptop and want an analyst or operations-analytics foothold. No prior programming required.',
  learning_objectives = $obj$[
    "Run Python and explain variables, lists, and dictionaries",
    "Load a CSV into a pandas DataFrame and filter rows",
    "Compute group summaries for a workforce dataset",
    "Choose a chart that matches the question",
    "Write a one-page finding with a caveat"
  ]$obj$::jsonb
WHERE title = 'Python for Data Science';

INSERT INTO modules (course_id, title, "order", video_url, duration, content)
SELECT c.id, v.title, v.ord, v.video_url, v.duration, v.content
FROM courses c
JOIN (VALUES
  ('Python setup and syntax', 1, 'https://www.youtube.com/embed/kqtD5dpn9C8', '24 min', $c$Install Python 3 and a notebook (Jupyter or VS Code). A program is a list of instructions. A variable is a named box.

name = "Amina"
weeks = 8
print(name, "is in week", weeks)

Indentation matters in Python. A colon starts a block. Read error messages from the bottom up — the last line usually names the problem.

Exercise: print a one-line bio using two variables.$c$),
  ('Data structures for analytics', 2, 'https://www.youtube.com/embed/W8KRzm-HUcc', '18 min', $c$Lists keep order. Dictionaries map a key to a value. You will use both constantly.

skills = ["python", "sql", "excel"]
worker = {"name": "Luis", "xp": 240, "skills": skills}

Loop with for item in skills. Look up worker["xp"]. Prefer clear names over clever one-liners.

Exercise: represent three classmates as a list of dictionaries.$c$),
  ('pandas DataFrames', 3, 'https://www.youtube.com/embed/vmEHCJofslg', '26 min', $c$pandas is the spreadsheet of Python. A DataFrame is rows and named columns.

import pandas as pd
df = pd.read_csv("enrollments.csv")
df.head()
df[df["progress"] >= 80]

Never assume the file is clean. Check dtypes, missing values, and a few raw rows before you chart anything.

Exercise: load a CSV and count how many rows have progress == 100.$c$),
  ('Exploratory analysis', 4, 'https://www.youtube.com/embed/r-uOLxNrNk8', '20 min', $c$Exploration is structured curiosity. Ask one question at a time.

df["vertical"].value_counts()
df.groupby("vertical")["progress"].mean()

Write the question above the code. Write the finding below it. If the data cannot answer the question, say so — that is still analysis.

Exercise: which course vertical has the highest average completion in the sample file?$c$),
  ('Charts that tell the truth', 5, 'https://www.youtube.com/embed/3Xc3CA655Y4', '17 min', $c$Pick the chart for the question. Counts → bar. Change over time → line. Two numbers → scatter. Parts of a whole → use a bar, not a 3-D pie.

Label axes. Start bar charts at zero. Title the chart with the finding, not the column name.

Exercise: bar-chart enrollments by vertical and write a one-sentence caption.$c$),
  ('Capstone: workforce skills dataset', 6, 'https://www.youtube.com/embed/GPVsHOlRBBI', '15 min', $c$Capstone brief

You are briefing an employer partner. Using a workforce enrollments extract:
1. State one question they care about (example: who finishes healthcare courses).
2. Show one table or chart.
3. Add one caveat (sample size, missing data, or selection bias).

Keep it to one page. Clarity beats decoration.$c$)
) AS v(title, ord, video_url, duration, content) ON TRUE
WHERE c.title = 'Python for Data Science'
  AND NOT EXISTS (SELECT 1 FROM modules m WHERE m.course_id = c.id AND m.title = v.title);

INSERT INTO quizzes (module_id, title, pass_score, xp_reward, questions)
SELECT m.id, v.title, v.pass, v.xp, v.questions::jsonb
FROM modules m
JOIN courses c ON c.id = m.course_id
JOIN (VALUES
  ('Python setup and syntax', 'Python syntax checkpoint', 70, 20, $q$[
   {"question":"Which assignment is valid Python?","options":["int x := 3","x = 3","let x = 3","var x = 3"],"answer":1},
   {"question":"What does print do?","options":["Deletes a variable","Writes output you can see","Compiles the program","Connects to Salesforce"],"answer":1},
   {"question":"Indentation in Python:","options":["Is optional decoration","Defines code blocks","Only matters in notebooks","Is replaced by braces"],"answer":1}
 ]$q$),
  ('pandas DataFrames', 'pandas checkpoint', 70, 25, $q$[
   {"question":"read_csv is used to:","options":["Draw a chart","Load a tabular file into a DataFrame","Train a model","Send email"],"answer":1},
   {"question":"df[df[\"progress\"] >= 80] returns:","options":["Column names only","Rows where progress is at least 80","A PDF report","Deleted rows"],"answer":1},
   {"question":"Before charting you should:","options":["Check types, missing values, and sample rows","Delete outliers silently","Transpose twice","Export to Salesforce first"],"answer":0}
 ]$q$),
  ('Capstone: workforce skills dataset', 'Capstone briefing quiz', 70, 40, $q$[
   {"question":"A one-page briefing should include:","options":["Every column in the extract","A question, evidence, and a caveat","Only a 3-D pie chart","Unlabeled axes"],"answer":1},
   {"question":"A caveat is useful because:","options":["It hides bad news","It states what the data cannot support","It replaces the finding","It increases XP"],"answer":1},
   {"question":"Bar charts should usually:","options":["Start the value axis at zero","Start at the minimum value to dramatize gaps","Use six colors per bar","Omit the title"],"answer":0}
 ]$q$)
) AS v(mod_title, title, pass, xp, questions) ON m.title = v.mod_title
WHERE c.title = 'Python for Data Science'
  AND NOT EXISTS (SELECT 1 FROM quizzes q WHERE q.module_id = m.id AND q.title = v.title);

-- Ensure Maria can open both sample courses with progress
INSERT INTO enrollments (user_id, course_id, progress, xp)
SELECT u.id, c.id, 50, 165
FROM users u, courses c
WHERE u.email = 'maria@example.com' AND c.title = 'Healthcare Fundamentals'
ON CONFLICT (user_id, course_id) DO UPDATE SET progress = EXCLUDED.progress, xp = EXCLUDED.xp;

INSERT INTO enrollment_module_progress (enrollment_id, module_id, completed_at)
SELECT e.id, m.id, now() - (7 - m."order") * interval '1 day'
FROM enrollments e
JOIN users u ON u.id = e.user_id
JOIN courses c ON c.id = e.course_id
JOIN modules m ON m.course_id = c.id
WHERE u.email = 'maria@example.com'
  AND c.title = 'Healthcare Fundamentals'
  AND m."order" <= 3
ON CONFLICT (enrollment_id, module_id) DO NOTHING;

INSERT INTO enrollment_module_progress (enrollment_id, module_id, completed_at)
SELECT e.id, m.id, now() - interval '4 days'
FROM enrollments e
JOIN users u ON u.id = e.user_id
JOIN courses c ON c.id = e.course_id
JOIN modules m ON m.course_id = c.id
WHERE u.email = 'maria@example.com'
  AND c.title = 'Python for Data Science'
  AND m.title = 'Python setup and syntax'
ON CONFLICT (enrollment_id, module_id) DO NOTHING;

UPDATE enrollments e
SET last_module_id = m.id,
    progress = 50
FROM users u, courses c, modules m
WHERE e.user_id = u.id AND e.course_id = c.id
  AND u.email = 'maria@example.com' AND c.title = 'Healthcare Fundamentals'
  AND m.course_id = c.id AND m.title = 'Medical Terminology';

UPDATE enrollments e
SET last_module_id = m.id
FROM users u, courses c, modules m
WHERE e.user_id = u.id AND e.course_id = c.id
  AND u.email = 'maria@example.com' AND c.title = 'Python for Data Science'
  AND m.course_id = c.id AND m.title = 'Python setup and syntax';

INSERT INTO quiz_attempts (user_id, quiz_id, enrollment_id, score, passed, answers, created_at)
SELECT u.id, q.id, e.id, 100, true, '[1,1,2]'::jsonb, now() - interval '6 days'
FROM users u
JOIN enrollments e ON e.user_id = u.id
JOIN courses c ON c.id = e.course_id
JOIN modules m ON m.course_id = c.id AND m.title = 'Introduction & Orientation'
JOIN quizzes q ON q.module_id = m.id
WHERE u.email = 'maria@example.com' AND c.title = 'Healthcare Fundamentals'
  AND NOT EXISTS (SELECT 1 FROM quiz_attempts a WHERE a.user_id = u.id AND a.quiz_id = q.id);

INSERT INTO quiz_attempts (user_id, quiz_id, enrollment_id, score, passed, answers, created_at)
SELECT u.id, q.id, e.id, 67, false, '[1,1,0]'::jsonb, now() - interval '3 days'
FROM users u
JOIN enrollments e ON e.user_id = u.id
JOIN courses c ON c.id = e.course_id
JOIN modules m ON m.course_id = c.id AND m.title = 'Python setup and syntax'
JOIN quizzes q ON q.module_id = m.id
WHERE u.email = 'maria@example.com' AND c.title = 'Python for Data Science'
  AND NOT EXISTS (SELECT 1 FROM quiz_attempts a WHERE a.user_id = u.id AND a.quiz_id = q.id);

-- ─── Integration connectors + pipelines ────────────────────────────────────
INSERT INTO integrations (id, name, slug, category, status, description, logo, config, last_sync_at) VALUES
('d0000001-0000-0000-0000-000000000001', 'Salesforce CRM', 'salesforce', 'CRM', 'connected',
 'Bi-directional sync of learners, certifications, and employer opportunities. SuperlativeBridge writes Contacts and custom Certification__c records; Salesforce webhooks update opportunity stage.',
 'salesforce',
 '{"org":"superlativebridge.my.salesforce.com","apiVersion":"60.0","objects":["Contact","Opportunity","Certification__c"],"auth":"OAuth 2.0 JWT","sandbox":false}'::jsonb,
 now() - interval '18 minutes'),
('d0000001-0000-0000-0000-000000000002', 'Workday HCM', 'workday', 'HRIS', 'connected',
 'Inbound worker and job-profile feed. New hires matching a learning plan are auto-enrolled in the mapped course track.',
 'workday',
 '{"tenant":"superlative_bridge","raas":"INT_Workers_Learning","auth":"OAuth refresh"}'::jsonb,
 now() - interval '2 hours'),
('d0000001-0000-0000-0000-000000000003', 'Greenhouse ATS', 'greenhouse', 'ATS', 'connected',
 'Pushes certified GIG workers into Greenhouse as candidates on partner requisitions. Stage changes flow back for employer analytics.',
 'greenhouse',
 '{"harvestApi":"v1","onBehalfOf":"talent-ops","jobBoard":"partners"}'::jsonb,
 now() - interval '41 minutes'),
('d0000001-0000-0000-0000-000000000004', 'Slack', 'slack', 'Messaging', 'connected',
 'Posts pipeline success/failure and mentor-booking alerts to #workforce-ops and #employer-success.',
 'slack',
 '{"workspace":"SuperlativeBridge","channels":["#workforce-ops","#employer-success"]}'::jsonb,
 now() - interval '5 minutes'),
('d0000001-0000-0000-0000-000000000005', 'Stripe Billing', 'stripe', 'Payments', 'configured',
 'Invoices employer cohort seats and records tuition grants. Live charges are off in this demo tenant.',
 'stripe',
 '{"mode":"test","product":"employer_cohort_seat"}'::jsonb,
 now() - interval '1 day'),
('d0000001-0000-0000-0000-000000000006', 'Twilio SMS', 'twilio', 'Messaging', 'degraded',
 'Course-reminder SMS. Carrier filtering in one region is elevated; the pipeline retries with email fallback.',
 'twilio',
 '{"from":"+1-415-555-0199","fallback":"email"}'::jsonb,
 now() - interval '3 hours')
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  description = EXCLUDED.description,
  config = EXCLUDED.config,
  last_sync_at = EXCLUDED.last_sync_at;

INSERT INTO integration_pipelines (id, integration_id, name, kind, schedule, status, description, dag) VALUES
('e1000001-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000001',
 'Salesforce contact & cert sync', 'batch', '0 */4 * * *', 'success',
 'Extracts learners and certificates, upserts Salesforce Contact + Certification__c, writes back CRM ids.',
 $dag$[
   {"id":"extract","name":"Extract LMS learners","type":"extract","dependsOn":[]},
   {"id":"map","name":"Map to Contact fields","type":"transform","dependsOn":["extract"]},
   {"id":"upsert","name":"Upsert Salesforce","type":"load","dependsOn":["map"]},
   {"id":"writeback","name":"Write CRM ids","type":"load","dependsOn":["upsert"]},
   {"id":"notify","name":"Slack #workforce-ops","type":"notify","dependsOn":["writeback"]}
 ]$dag$::jsonb),
('e1000001-0000-0000-0000-000000000002', 'd0000001-0000-0000-0000-000000000001',
 'Certified graduate → Opportunity', 'event', 'on certification.issued', 'success',
 'When a learner earns a certificate, create or update a Salesforce Opportunity on the employer account and assign the AE.',
 $dag$[
   {"id":"hook","name":"Certification webhook","type":"extract","dependsOn":[]},
   {"id":"match","name":"Match employer account","type":"transform","dependsOn":["hook"]},
   {"id":"opp","name":"Upsert Opportunity","type":"load","dependsOn":["match"]},
   {"id":"ae","name":"Assign account executive","type":"load","dependsOn":["opp"]}
 ]$dag$::jsonb),
('e1000001-0000-0000-0000-000000000003', 'd0000001-0000-0000-0000-000000000002',
 'Workday hire → auto-enroll', 'batch', '15 6 * * *', 'success',
 'Pulls yesterday''s hires from Workday RaaS, maps job profile to a course track, enrolls the worker.',
 $dag$[
   {"id":"raas","name":"Workday RaaS pull","type":"extract","dependsOn":[]},
   {"id":"profile","name":"Map job profile","type":"transform","dependsOn":["raas"]},
   {"id":"enroll","name":"Create enrollments","type":"load","dependsOn":["profile"]},
   {"id":"ack","name":"Ack Workday","type":"notify","dependsOn":["enroll"]}
 ]$dag$::jsonb),
('e1000001-0000-0000-0000-000000000004', 'd0000001-0000-0000-0000-000000000003',
 'Greenhouse certified export', 'batch', '0 7 * * 1-5', 'running',
 'Exports candidates who completed a partner course and posts Greenhouse applications.',
 $dag$[
   {"id":"query","name":"Query certified workers","type":"extract","dependsOn":[]},
   {"id":"score","name":"Score vs requisition","type":"transform","dependsOn":["query"]},
   {"id":"post","name":"POST Harvest applications","type":"load","dependsOn":["score"]},
   {"id":"stage","name":"Listen for stage webhooks","type":"notify","dependsOn":["post"]}
 ]$dag$::jsonb),
('e1000001-0000-0000-0000-000000000005', 'd0000001-0000-0000-0000-000000000004',
 'Ops alert fan-out', 'event', 'on pipeline.*', 'success',
 'Formats Airflow-style events and posts to Slack. Dedupes repeats within 15 minutes.',
 $dag$[
   {"id":"in","name":"Receive event","type":"extract","dependsOn":[]},
   {"id":"fmt","name":"Format Block Kit","type":"transform","dependsOn":["in"]},
   {"id":"post","name":"chat.postMessage","type":"notify","dependsOn":["fmt"]}
 ]$dag$::jsonb),
('e1000001-0000-0000-0000-000000000006', 'd0000001-0000-0000-0000-000000000005',
 'Employer cohort invoicing', 'batch', '0 12 1 * *', 'idle',
 'Builds Stripe invoice items from enrolled employer seats. Test mode only in this tenant.',
 $dag$[
   {"id":"seats","name":"Count billable seats","type":"extract","dependsOn":[]},
   {"id":"items","name":"Build invoice items","type":"transform","dependsOn":["seats"]},
   {"id":"invoice","name":"Create Stripe invoice","type":"load","dependsOn":["items"]}
 ]$dag$::jsonb),
('e1000001-0000-0000-0000-000000000007', 'd0000001-0000-0000-0000-000000000006',
 'SMS lesson reminders', 'batch', '0 17 * * *', 'failed',
 'Sends same-day lesson reminders. Currently failing carrier lookup in one region; email fallback still runs.',
 $dag$[
   {"id":"due","name":"Learners due today","type":"extract","dependsOn":[]},
   {"id":"sms","name":"Twilio send","type":"notify","dependsOn":["due"]},
   {"id":"fallback","name":"Email fallback","type":"notify","dependsOn":["sms"]}
 ]$dag$::jsonb)
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  dag = EXCLUDED.dag,
  description = EXCLUDED.description,
  schedule = EXCLUDED.schedule;

INSERT INTO pipeline_runs (id, pipeline_id, run_number, status, trigger, started_at, finished_at, steps) VALUES
('f1000001-0000-0000-0000-000000000101', 'e1000001-0000-0000-0000-000000000001', 128, 'success', 'schedule',
 now() - interval '18 minutes', now() - interval '12 minutes',
 $s$[
   {"nodeId":"extract","name":"Extract LMS learners","status":"success","durationMs":41000,"log":"12,448 learner rows from enrollments + users"},
   {"nodeId":"map","name":"Map to Contact fields","status":"success","durationMs":9000,"log":"Mapped email, name, vertical; skipped 14 invalid emails"},
   {"nodeId":"upsert","name":"Upsert Salesforce","status":"success","durationMs":188000,"log":"Bulk API 2.0: 12,434 upserted, 0 failed"},
   {"nodeId":"writeback","name":"Write CRM ids","status":"success","durationMs":22000,"log":"Wrote salesforce_contact_id on 12,434 users"},
   {"nodeId":"notify","name":"Slack #workforce-ops","status":"success","durationMs":800,"log":"Posted run 128 summary"}
 ]$s$::jsonb),
('f1000001-0000-0000-0000-000000000102', 'e1000001-0000-0000-0000-000000000001', 127, 'success', 'manual',
 now() - interval '5 hours', now() - interval '4 hours 52 minutes',
 $s$[
   {"nodeId":"extract","name":"Extract LMS learners","status":"success","durationMs":39000,"log":"Manual backfill after schema change"},
   {"nodeId":"map","name":"Map to Contact fields","status":"success","durationMs":8000,"log":"ok"},
   {"nodeId":"upsert","name":"Upsert Salesforce","status":"success","durationMs":201000,"log":"ok"},
   {"nodeId":"writeback","name":"Write CRM ids","status":"success","durationMs":21000,"log":"ok"},
   {"nodeId":"notify","name":"Slack #workforce-ops","status":"success","durationMs":700,"log":"ok"}
 ]$s$::jsonb),
('f1000001-0000-0000-0000-000000000201', 'e1000001-0000-0000-0000-000000000002', 44, 'success', 'webhook',
 now() - interval '3 hours', now() - interval '2 hours 58 minutes',
 $s$[
   {"nodeId":"hook","name":"Certification webhook","status":"success","durationMs":120,"log":"cert HIPAA Fundamentals — Maria Santos"},
   {"nodeId":"match","name":"Match employer account","status":"success","durationMs":640,"log":"Matched Acme Health Account 001xx"},
   {"nodeId":"opp","name":"Upsert Opportunity","status":"success","durationMs":1100,"log":"Opportunity 006xx stage=Qualified"},
   {"nodeId":"ae","name":"Assign account executive","status":"success","durationMs":400,"log":"Owner = Jordan Lee"}
 ]$s$::jsonb),
('f1000001-0000-0000-0000-000000000301', 'e1000001-0000-0000-0000-000000000003', 56, 'success', 'schedule',
 now() - interval '2 hours', now() - interval '1 hour 54 minutes',
 $s$[
   {"nodeId":"raas","name":"Workday RaaS pull","status":"success","durationMs":88000,"log":"37 new hires since 06:15"},
   {"nodeId":"profile","name":"Map job profile","status":"success","durationMs":2100,"log":"29 mapped to Healthcare track, 8 to IT"},
   {"nodeId":"enroll","name":"Create enrollments","status":"success","durationMs":5400,"log":"37 enrollments created"},
   {"nodeId":"ack","name":"Ack Workday","status":"success","durationMs":900,"log":"Integration event posted"}
 ]$s$::jsonb),
('f1000001-0000-0000-0000-000000000401', 'e1000001-0000-0000-0000-000000000004', 19, 'running', 'schedule',
 now() - interval '6 minutes', NULL,
 $s$[
   {"nodeId":"query","name":"Query certified workers","status":"success","durationMs":3200,"log":"84 certified in last 7 days"},
   {"nodeId":"score","name":"Score vs requisition","status":"success","durationMs":1800,"log":"61 above partner threshold"},
   {"nodeId":"post","name":"POST Harvest applications","status":"running","durationMs":0,"log":"Posting page 2 of 3…"},
   {"nodeId":"stage","name":"Listen for stage webhooks","status":"queued","durationMs":0,"log":""}
 ]$s$::jsonb),
('f1000001-0000-0000-0000-000000000501', 'e1000001-0000-0000-0000-000000000005', 902, 'success', 'webhook',
 now() - interval '12 minutes', now() - interval '12 minutes',
 $s$[
   {"nodeId":"in","name":"Receive event","status":"success","durationMs":40,"log":"pipeline.success sf-contact-sync #128"},
   {"nodeId":"fmt","name":"Format Block Kit","status":"success","durationMs":15,"log":"ok"},
   {"nodeId":"post","name":"chat.postMessage","status":"success","durationMs":180,"log":"ts=1723380000.1"}
 ]$s$::jsonb),
('f1000001-0000-0000-0000-000000000701', 'e1000001-0000-0000-0000-000000000007', 33, 'failed', 'schedule',
 now() - interval '3 hours', now() - interval '2 hours 58 minutes',
 $s$[
   {"nodeId":"due","name":"Learners due today","status":"success","durationMs":2100,"log":"412 reminder targets"},
   {"nodeId":"sms","name":"Twilio send","status":"failed","durationMs":6400,"log":"21606: carrier rejected 38% of US-west numbers"},
   {"nodeId":"fallback","name":"Email fallback","status":"success","durationMs":8900,"log":"412 emails queued via Postmark"}
 ]$s$::jsonb)
ON CONFLICT (id) DO NOTHING;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO sbuser;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO sbuser;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'vivekvardhan') THEN
    GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO vivekvardhan;
    GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO vivekvardhan;
  END IF;
END $$;
