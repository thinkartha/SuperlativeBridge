-- Additive enrichment: course photos, extra GIG workers/employers,
-- staggered registrations, enrollments, bookings, settings, admin notifications.

CREATE TABLE IF NOT EXISTS platform_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  platform_name TEXT NOT NULL DEFAULT 'SuperlativeBridge',
  support_email TEXT NOT NULL DEFAULT 'support@superlativebridge.com',
  allow_public_registration BOOLEAN NOT NULL DEFAULT TRUE,
  employer_self_service BOOLEAN NOT NULL DEFAULT TRUE,
  mentor_applications BOOLEAN NOT NULL DEFAULT FALSE,
  course_reviews BOOLEAN NOT NULL DEFAULT TRUE,
  notify_new_users BOOLEAN NOT NULL DEFAULT TRUE,
  notify_enrollments BOOLEAN NOT NULL DEFAULT TRUE,
  notify_bookings BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO platform_settings (id) VALUES ('default')
ON CONFLICT (id) DO NOTHING;

-- Course cover photos (Unsplash)
UPDATE courses SET image = CASE title
  WHEN 'Healthcare Fundamentals' THEN 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80'
  WHEN 'Nursing Assistant Certification' THEN 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=800&q=80'
  WHEN 'Home-Based Healthcare Services' THEN 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80'
  WHEN 'Mental Health First Aid' THEN 'https://images.unsplash.com/photo-1544027993-37dbfe43562a?auto=format&fit=crop&w=800&q=80'
  WHEN 'Modern Farming Techniques' THEN 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80'
  WHEN 'Agricultural Supply Chain Management' THEN 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=800&q=80'
  WHEN 'Organic Farming & Sustainability' THEN 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=800&q=80'
  WHEN 'Spice & Herb Processing' THEN 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=800&q=80'
  WHEN 'E-Commerce Fundamentals' THEN 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=800&q=80'
  WHEN 'Digital Marketing for Retail' THEN 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80'
  WHEN 'Marketplace Platform Development' THEN 'https://images.unsplash.com/photo-1556155092-490a1ba16284?auto=format&fit=crop&w=800&q=80'
  WHEN 'Construction Management Basics' THEN 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=800&q=80'
  WHEN 'Electrical Certification Prep' THEN 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80'
  WHEN 'Plumbing Essentials' THEN 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=800&q=80'
  WHEN 'Instructional Design Mastery' THEN 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=800&q=80'
  WHEN 'EdTech Platform Development' THEN 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80'
  WHEN 'Curriculum Development' THEN 'https://images.unsplash.com/photo-14565130808-af10303f4b63?auto=format&fit=crop&w=800&q=80'
  WHEN 'Digital Content Creation' THEN 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=800&q=80'
  WHEN 'Casting & Talent Management' THEN 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=800&q=80'
  WHEN 'Video Production & Editing' THEN 'https://images.unsplash.com/photo-1492619375914-88005aa9e8fb?auto=format&fit=crop&w=800&q=80'
  WHEN 'FMCG Supply Chain Optimization' THEN 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80'
  WHEN 'Product Distribution Networks' THEN 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&w=800&q=80'
  WHEN 'Python for Data Science' THEN 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80'
  WHEN 'Cloud Architecture (AWS/Azure)' THEN 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80'
  WHEN 'Full-Stack Web Development' THEN 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80'
  WHEN 'Machine Learning Bootcamp' THEN 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=800&q=80'
  WHEN 'Cybersecurity Essentials' THEN 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80'
  WHEN 'Lean Manufacturing Principles' THEN 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80'
  WHEN 'Quality Control & Assurance' THEN 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=800&q=80'
  WHEN 'Industrial Automation' THEN 'https://images.unsplash.com/photo-1565514020176-b2cdf67d5673?auto=format&fit=crop&w=800&q=80'
  WHEN 'Project Management Professional' THEN 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80'
  WHEN 'Sales & Business Development' THEN 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=800&q=80'
  WHEN 'Nanny & Housekeeping Certification' THEN 'https://images.unsplash.com/photo-1476703993599-0035a21b17a9?auto=format&fit=crop&w=800&q=80'
  WHEN 'Leadership & Executive Coaching' THEN 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80'
  WHEN 'Hospitality Management' THEN 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'
  WHEN 'Tour Guide Certification' THEN 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80'
  WHEN 'Event Planning & Management' THEN 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=800&q=80'
  WHEN 'Logistics & Fleet Management' THEN 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=800&q=80'
  WHEN 'Last-Mile Delivery Operations' THEN 'https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?auto=format&fit=crop&w=800&q=80'
  WHEN 'Parking & Urban Mobility Solutions' THEN 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80'
  WHEN 'Financial Literacy & Planning' THEN 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=800&q=80'
  WHEN 'Startup Funding & Investment' THEN 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&w=800&q=80'
  WHEN 'Business Model Innovation' THEN 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=800&q=80'
  WHEN 'Legal & Tax Navigation' THEN 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80'
  ELSE image
END;

-- Mentor photos
UPDATE mentors SET avatar = 'https://i.pravatar.cc/150?u=' || email WHERE avatar IS NULL OR avatar = '';

-- Extra GIG workers + employers (password: password123)
INSERT INTO users (name, email, password_hash, role, vertical, location, phone, bio, avatar, status, created_at) VALUES
('Priya Sharma','priya.worker@example.com','$2b$10$Q4Xn9e0A4BT.HWFVe.nKtO3yQ.ivpnXhhpYA24s6gNSVEIR9hXtwu','worker','Health & Healthcare','Detroit, MI','+1 555-0111','Home-health aide upskilling into nursing.','https://i.pravatar.cc/150?u=priya.worker@example.com','Active', now() - interval '2 days'),
('Luis Ortega','luis@example.com','$2b$10$Q4Xn9e0A4BT.HWFVe.nKtO3yQ.ivpnXhhpYA24s6gNSVEIR9hXtwu','worker','Transport & Logistics','Austin, TX','+1 555-0112','Delivery driver moving into fleet operations.','https://i.pravatar.cc/150?u=luis@example.com','Active', now() - interval '4 days'),
('Fatima Al-Hassan','fatima@example.com','$2b$10$Q4Xn9e0A4BT.HWFVe.nKtO3yQ.ivpnXhhpYA24s6gNSVEIR9hXtwu','worker','Tourism & Hospitality','New York, NY','+1 555-0113','Hotel associate studying hospitality management.','https://i.pravatar.cc/150?u=fatima@example.com','Active', now() - interval '6 days'),
('Kenji Tanaka','kenji@example.com','$2b$10$Q4Xn9e0A4BT.HWFVe.nKtO3yQ.ivpnXhhpYA24s6gNSVEIR9hXtwu','worker','Manufacturing','Portland, OR','+1 555-0114','Line technician learning industrial automation.','https://i.pravatar.cc/150?u=kenji@example.com','Active', now() - interval '9 days'),
('Olivia Brooks','olivia@example.com','$2b$10$Q4Xn9e0A4BT.HWFVe.nKtO3yQ.ivpnXhhpYA24s6gNSVEIR9hXtwu','worker','Education','Denver, CO','+1 555-0115','Teaching assistant building instructional-design skills.','https://i.pravatar.cc/150?u=olivia@example.com','Active', now() - interval '1 day'),
('Marcus Johnson','marcus@example.com','$2b$10$Q4Xn9e0A4BT.HWFVe.nKtO3yQ.ivpnXhhpYA24s6gNSVEIR9hXtwu','worker','Construction','Atlanta, GA','+1 555-0116','Apprentice electrician preparing for certification.','https://i.pravatar.cc/150?u=marcus@example.com','Active', now() - interval '12 days'),
('Elena Rossi','elena@example.com','$2b$10$Q4Xn9e0A4BT.HWFVe.nKtO3yQ.ivpnXhhpYA24s6gNSVEIR9hXtwu','worker','Finance & Business','Boston, MA','+1 555-0117','Bookkeeper expanding into financial planning.','https://i.pravatar.cc/150?u=elena@example.com','Active', now() - interval '15 days'),
('Noah Kim','noah@example.com','$2b$10$Q4Xn9e0A4BT.HWFVe.nKtO3yQ.ivpnXhhpYA24s6gNSVEIR9hXtwu','worker','Entertainment & Media','Los Angeles, CA','+1 555-0118','Freelance editor studying video production.','https://i.pravatar.cc/150?u=noah@example.com','Active', now() - interval '18 days'),
('Jordan Lee','jordan.hr@example.com','$2b$10$Q4Xn9e0A4BT.HWFVe.nKtO3yQ.ivpnXhhpYA24s6gNSVEIR9hXtwu','employer','Commerce & Retail','Chicago, IL','+1 555-0120','Talent lead at a national retailer.','https://i.pravatar.cc/150?u=jordan.hr@example.com','Active', now() - interval '3 days'),
('Daniel Okonkwo','daniel.hr@example.com','$2b$10$Q4Xn9e0A4BT.HWFVe.nKtO3yQ.ivpnXhhpYA24s6gNSVEIR9hXtwu','employer','Health & Healthcare','Houston, TX','+1 555-0121','Clinic operations manager hiring care staff.','https://i.pravatar.cc/150?u=daniel.hr@example.com','Active', now() - interval '8 days'),
('Maya Kapoor','maya.hr@example.com','$2b$10$Q4Xn9e0A4BT.HWFVe.nKtO3yQ.ivpnXhhpYA24s6gNSVEIR9hXtwu','employer','Information Technology','New York, NY','+1 555-0122','Staffing partner for cloud and data roles.','https://i.pravatar.cc/150?u=maya.hr@example.com','Active', now() - interval '20 days')
ON CONFLICT (email) DO NOTHING;

UPDATE users SET avatar = 'https://i.pravatar.cc/150?u=' || email WHERE avatar IS NULL OR avatar = '';

UPDATE users SET created_at = now() - interval '30 days' WHERE email = 'admin@example.com';
UPDATE users SET created_at = now() - interval '28 days' WHERE email = 'maria@example.com';
UPDATE users SET created_at = now() - interval '25 days' WHERE email = 'james@example.com';
UPDATE users SET created_at = now() - interval '22 days' WHERE email = 'aisha@example.com';
UPDATE users SET created_at = now() - interval '19 days' WHERE email = 'carlos@example.com';
UPDATE users SET created_at = now() - interval '16 days' WHERE email = 'sarah@example.com';
UPDATE users SET created_at = now() - interval '14 days' WHERE email = 'sarah.mentor@example.com';

INSERT INTO skills (user_id, name, level)
SELECT u.id, s.name, s.level FROM users u JOIN (VALUES
('priya.worker@example.com','Patient Care',70),
('priya.worker@example.com','CPR',65),
('luis@example.com','Logistics',68),
('fatima@example.com','Hospitality',74),
('kenji@example.com','Quality Control',71),
('olivia@example.com','Curriculum',60),
('marcus@example.com','Electrical',66),
('elena@example.com','Bookkeeping',80),
('noah@example.com','Video Editing',77)
) AS s(email, name, level) ON u.email = s.email
ON CONFLICT DO NOTHING;

INSERT INTO enrollments (user_id, course_id, progress, xp, grade)
SELECT u.id, c.id, e.progress, e.xp, e.grade
FROM (VALUES
  ('james@example.com','Python for Data Science', 100, 480, 'A'),
  ('james@example.com','Cloud Architecture (AWS/Azure)', 55, 210, ''),
  ('carlos@example.com','Electrical Certification Prep', 80, 300, 'B+'),
  ('carlos@example.com','Construction Management Basics', 100, 420, 'A-'),
  ('sarah@example.com','Digital Content Creation', 70, 240, ''),
  ('sarah@example.com','Full-Stack Web Development', 25, 90, ''),
  ('priya.worker@example.com','Healthcare Fundamentals', 100, 450, 'A'),
  ('priya.worker@example.com','Nursing Assistant Certification', 45, 160, ''),
  ('priya.worker@example.com','Mental Health First Aid', 100, 380, 'A-'),
  ('luis@example.com','Last-Mile Delivery Operations', 90, 310, 'B+'),
  ('luis@example.com','Logistics & Fleet Management', 40, 120, ''),
  ('fatima@example.com','Hospitality Management', 100, 400, 'A'),
  ('fatima@example.com','Event Planning & Management', 30, 80, ''),
  ('kenji@example.com','Lean Manufacturing Principles', 100, 360, 'B+'),
  ('kenji@example.com','Quality Control & Assurance', 60, 200, ''),
  ('olivia@example.com','Instructional Design Mastery', 20, 50, ''),
  ('marcus@example.com','Electrical Certification Prep', 55, 180, ''),
  ('marcus@example.com','Plumbing Essentials', 100, 340, 'A-'),
  ('elena@example.com','Financial Literacy & Planning', 100, 390, 'A'),
  ('elena@example.com','Startup Funding & Investment', 35, 110, ''),
  ('noah@example.com','Video Production & Editing', 75, 260, ''),
  ('noah@example.com','Digital Content Creation', 100, 410, 'A-')
) AS e(user_email, course_title, progress, xp, grade)
JOIN users u ON u.email = e.user_email
JOIN courses c ON c.title = e.course_title
ON CONFLICT (user_id, course_id) DO NOTHING;

INSERT INTO certifications (user_id, name, issuer, expires_at, status)
SELECT u.id, c.name, c.issuer, c.expires_at::timestamptz, c.status
FROM users u JOIN (VALUES
  ('priya.worker@example.com','Mental Health First Aid','National Council','2027-06-01','active'),
  ('fatima@example.com','ServSafe Manager','NRA','2026-12-01','active'),
  ('elena@example.com','QuickBooks Certified','Intuit','2026-09-15','expiring'),
  ('kenji@example.com','Six Sigma Yellow Belt','ASQ','2027-01-20','active')
) AS c(email, name, issuer, expires_at, status) ON u.email = c.email;

INSERT INTO notifications (user_id, type, message, read, created_at)
SELECT u.id, n.type, n.message, n.read, now() - (n.hours || ' hours')::interval
FROM users u JOIN (VALUES
  ('admin@example.com','user','New GIG worker registered: Olivia Brooks', false, 6),
  ('admin@example.com','user','New employer registered: Jordan Lee', false, 18),
  ('admin@example.com','mentor','Mentor application pending: David Okonkwo', false, 30),
  ('admin@example.com','booking','New mentor booking requested (James Wilson → Aisha Mohammed)', true, 40),
  ('admin@example.com','course','Course completion spike: Healthcare Fundamentals hit 100% for Priya Sharma', true, 50),
  ('admin@example.com','system','Weekly digest: 12 new enrollments, 4 completed courses', true, 72),
  ('priya.worker@example.com','grade','Quiz graded: Healthcare Fundamentals — 96%', false, 8),
  ('fatima@example.com','course','New module available: Guest Experience Design', false, 12),
  ('luis@example.com','reminder','Complete Fleet Management Module 2 by Friday', false, 20),
  ('olivia@example.com','course','Welcome to SuperlativeBridge — start Instructional Design Mastery', false, 4)
) AS n(email, type, message, read, hours) ON u.email = n.email;

INSERT INTO mentor_bookings (user_id, mentor_id, scheduled_at, duration_minutes, topic, notes, status)
SELECT u.id, m.id, now() + (b.days || ' days')::interval + interval '10 hours', b.duration, b.topic, b.notes, b.status
FROM (VALUES
  ('priya.worker@example.com','priya@example.com', 2, 45, 'Healthcare IT career path', 'Discuss CNA to informatics jump', 'confirmed'),
  ('olivia@example.com','ezhang@example.com', 4, 30, 'UX for learning products', '', 'requested'),
  ('kenji@example.com','rwilliams@example.com', 6, 60, 'Leadership on the shop floor', 'Prep for supervisor interview', 'confirmed'),
  ('luis@example.com','ahmed.mentor@example.com', 1, 30, 'DevOps for logistics tools', '', 'requested'),
  ('elena@example.com','david.mentor@example.com', 8, 45, 'Business planning session', '', 'requested'),
  ('noah@example.com','ezhang@example.com', -3, 45, 'Portfolio review', 'Completed reel critique', 'completed'),
  ('marcus@example.com','carlos.mentor@example.com', -7, 60, 'Trades certification plan', '', 'completed'),
  ('fatima@example.com','sarah@example.com', 10, 30, 'Data skills for hospitality', '', 'confirmed')
) AS b(user_email, mentor_email, days, duration, topic, notes, status)
JOIN users u ON u.email = b.user_email
JOIN mentors m ON m.email = b.mentor_email
WHERE NOT EXISTS (
  SELECT 1 FROM mentor_bookings mb
  WHERE mb.user_id = u.id AND mb.mentor_id = m.id AND mb.topic = b.topic
);
