-- Ethiopian GIG workers for employer map toggle (US / Ethiopia).

INSERT INTO candidates (
  name, title, skills, location, zip, billing_rate, vertical, education, programs,
  rating, experience, bio, email, availability, open_to_relocate, phone,
  visa_status, lat, lng, resume_url, resume_text
)
SELECT * FROM (VALUES
  ('Abebe Bekele', 'Full Stack Developer', ARRAY['React','Node.js','PostgreSQL']::text[], 'Addis Ababa, Ethiopia', '1000', 45, 'Information Technology', 'BSc Computer Science — AAU', ARRAY['WOTC']::text[], 4.8, '6 years',
   'Builds workforce platforms for East African employers. Open to remote US contracts.', 'abebe.bekele@example.com', 'open', true, '+251 911 0101',
   'Work Authorization', 9.0320, 38.7469, '/resumes/abebe-bekele.pdf',
   $r$ABEBE BEKELE
Addis Ababa, Ethiopia · abebe.bekele@example.com
Visa: Ethiopian work authorization · open to remote

SUMMARY
Full-stack engineer shipping LMS and marketplace products across East Africa.
$r$),
  ('Hanna Tadesse', 'Registered Nurse', ARRAY['Patient Care','EMR','Triage','Amharic']::text[], 'Addis Ababa, Ethiopia', '1000', 35, 'Health & Healthcare', 'BSc Nursing — Jimma University', ARRAY['Refugee Employment']::text[], 4.7, '5 years',
   'Clinic RN with telehealth experience. Interested in US hospital partnerships.', 'hanna.tadesse@example.com', 'open', true, '+251 911 0102',
   'Work Authorization', 9.0100, 38.7610, '/resumes/hanna-tadesse.pdf',
   $r$HANNA TADESSE
Addis Ababa, Ethiopia · hanna.tadesse@example.com

SUMMARY
Registered nurse — outpatient triage and EMR documentation.
$r$),
  ('Yonas Gebre', 'Data Analyst', ARRAY['Python','SQL','Excel','Power BI']::text[], 'Bahir Dar, Ethiopia', '6000', 32, 'Information Technology', 'MSc Statistics — Bahir Dar University', '{}'::text[], 4.6, '4 years',
   'Analyzes learning outcomes for regional training programs.', 'yonas.gebre@example.com', 'open', true, '+251 911 0103',
   'Work Authorization', 11.5742, 37.3614, '/resumes/yonas-gebre.pdf',
   $r$YONAS GEBRE
Bahir Dar, Ethiopia · yonas.gebre@example.com

SUMMARY
Data analyst for workforce and education programs.
$r$),
  ('Selamawit Alemu', 'UX Designer', ARRAY['Figma','Research','Prototyping','Amharic']::text[], 'Hawassa, Ethiopia', '1500', 38, 'Information Technology', 'BA Design — Hawassa University', ARRAY['MWBE']::text[], 4.9, '5 years',
   'Designs accessible learning apps for mobile-first users.', 'selam.alemu@example.com', 'hiring', true, '+251 911 0104',
   'Work Authorization', 7.0621, 38.4760, '/resumes/selam-alemu.pdf',
   $r$SELAMAWIT ALEMU
Hawassa, Ethiopia · selam.alemu@example.com

SUMMARY
UX designer focused on mobile workforce learning.
$r$),
  ('Dawit Mekonnen', 'Electrician', ARRAY['Electrical','Solar','Safety','Installation']::text[], 'Dire Dawa, Ethiopia', '3000', 28, 'Construction', 'TVET Electrical Certificate', ARRAY['HUBZone']::text[], 4.5, '8 years',
   'Commercial and solar installation lead for industrial sites.', 'dawit.mekonnen@example.com', 'open', false, '+251 911 0105',
   'Work Authorization', 9.5931, 41.8660, '/resumes/dawit-mekonnen.pdf',
   $r$DAWIT MEKONNEN
Dire Dawa, Ethiopia · dawit.mekonnen@example.com

SUMMARY
Electrician / solar installer — industrial and commercial.
$r$),
  ('Meron Haile', 'Digital Marketing Specialist', ARRAY['SEO','Social','Content','Analytics']::text[], 'Mekelle, Ethiopia', '7000', 30, 'Commerce & Retail', 'BA Marketing — Mekelle University', ARRAY['MWBE']::text[], 4.6, '4 years',
   'Grows marketplace brands across Ethiopian and diaspora audiences.', 'meron.haile@example.com', 'open', true, '+251 911 0106',
   'Work Authorization', 13.4967, 39.4753, '/resumes/meron-haile.pdf',
   $r$MERON HAILE
Mekelle, Ethiopia · meron.haile@example.com

SUMMARY
Digital marketer for commerce and workforce brands.
$r$),
  ('Kidus Assefa', 'DevOps Engineer', ARRAY['Docker','CI/CD','Linux','AWS']::text[], 'Adama, Ethiopia', '2000', 42, 'Information Technology', 'BSc Software Engineering — ASTU', '{}'::text[], 4.8, '5 years',
   'Runs CI pipelines for Open edX and LMS sync jobs.', 'kidus.assefa@example.com', 'open', true, '+251 911 0107',
   'Work Authorization', 8.5400, 39.2700, '/resumes/kidus-assefa.pdf',
   $r$KIDUS ASSEFA
Adama (Nazret), Ethiopia · kidus.assefa@example.com

SUMMARY
DevOps engineer — Docker, CI/CD, cloud ops.
$r$),
  ('Rahel Girma', 'Project Manager', ARRAY['Agile','Scrum','Stakeholder Mgmt','Amharic']::text[], 'Gondar, Ethiopia', '6200', 40, 'Professional Services', 'MBA — University of Gondar', ARRAY['WOTC']::text[], 4.7, '7 years',
   'Delivers training cohort launches for employer partners.', 'rahel.girma@example.com', 'passive', true, '+251 911 0108',
   'Work Authorization', 12.6000, 37.4667, '/resumes/rahel-girma.pdf',
   $r$RAHEL GIRMA
Gondar, Ethiopia · rahel.girma@example.com

SUMMARY
Project manager for workforce training programs.
$r$),
  ('Biruk Solomon', 'Cybersecurity Analyst', ARRAY['SOC','Network Security','Python','SIEM']::text[], 'Jimma, Ethiopia', '3780', 48, 'Information Technology', 'BSc Information Security — JU', ARRAY['Veterans']::text[], 4.5, '4 years',
   'Secures learner data platforms for regional NGOs and employers.', 'biruk.solomon@example.com', 'open', true, '+251 911 0109',
   'Work Authorization', 7.6667, 36.8333, '/resumes/biruk-solomon.pdf',
   $r$BIRUK SOLOMON
Jimma, Ethiopia · biruk.solomon@example.com

SUMMARY
Cybersecurity analyst — SOC monitoring and hardening.
$r$),
  ('Tigist Mulugeta', 'Community Health Worker', ARRAY['Outreach','Case Mgmt','Amharic','Oromo']::text[], 'Assosa, Ethiopia', '5800', 22, 'Health & Healthcare', 'CHW Certificate', ARRAY['Refugee Employment','WOTC']::text[], 4.6, '6 years',
   'Connects rural communities to clinic and skills programs.', 'tigist.mulugeta@example.com', 'open', false, '+251 911 0110',
   'Work Authorization', 10.0667, 34.5333, '/resumes/tigist-mulugeta.pdf',
   $r$TIGIST MULUGETA
Assosa, Ethiopia · tigist.mulugeta@example.com

SUMMARY
Community health worker — bilingual outreach and case management.
$r$)
) AS v(
  name, title, skills, location, zip, billing_rate, vertical, education, programs,
  rating, experience, bio, email, availability, open_to_relocate, phone,
  visa_status, lat, lng, resume_url, resume_text
)
WHERE NOT EXISTS (SELECT 1 FROM candidates c WHERE c.email = v.email);

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO sbuser;
