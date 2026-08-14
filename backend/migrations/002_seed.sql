-- Idempotent seed data extracted from frontend mocks
-- Password for all seeded users below is 'password123' (bcrypt hashed)

INSERT INTO categories (name, slug, icon, color, course_count, status) VALUES
('Health & Healthcare', 'health', 'Heart', 'bg-red-500', 0, 'Active'),
('Agriculture', 'agriculture', 'Sprout', 'bg-green-600', 0, 'Active'),
('Commerce & Retail', 'commerce', 'ShoppingCart', 'bg-blue-500', 0, 'Active'),
('Construction', 'construction', 'HardHat', 'bg-amber-600', 0, 'Active'),
('Education', 'education', 'GraduationCap', 'bg-indigo-500', 0, 'Active'),
('Entertainment & Media', 'entertainment', 'Film', 'bg-pink-500', 0, 'Active'),
('Fast Moving Consumer Goods', 'fmcg', 'Package', 'bg-orange-500', 0, 'Active'),
('Information Technology', 'it', 'Monitor', 'bg-violet-600', 0, 'Active'),
('Manufacturing', 'manufacturing', 'Factory', 'bg-slate-600', 0, 'Active'),
('Professional Services', 'professional-services', 'Briefcase', 'bg-teal-600', 0, 'Active'),
('Tourism & Hospitality', 'tourism', 'Plane', 'bg-cyan-500', 0, 'Active'),
('Transport & Logistics', 'transport', 'Truck', 'bg-yellow-600', 0, 'Active'),
('Finance & Business', 'finance', 'DollarSign', 'bg-emerald-600', 0, 'Active')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO courses (title, description, category, vertical, language, level, duration, students, rating, instructor, image, status) VALUES
('Healthcare Fundamentals','Comprehensive introduction to healthcare systems, patient care, and medical terminology.','Health & Healthcare','health','English','Beginner','12 weeks',2847,4.7,'Dr. Sarah Chen','/placeholder.svg','Published'),
('Nursing Assistant Certification','Prepare for CNA certification with hands-on clinical training.','Health & Healthcare','health','English','Intermediate','16 weeks',1563,4.8,'Maria Johnson','/placeholder.svg','Published'),
('Home-Based Healthcare Services','Learn to deliver quality healthcare services in home settings.','Health & Healthcare','health','English','Beginner','8 weeks',980,4.5,'Dr. Mulugeta G.','/placeholder.svg','Published'),
('Mental Health First Aid','Recognize and respond to mental health crises effectively.','Health & Healthcare','health','Spanish','Beginner','6 weeks',1120,4.6,'Dr. Lopez','/placeholder.svg','Published'),
('Modern Farming Techniques','From traditional to mechanized farming with technology integration.','Agriculture','agriculture','English','Beginner','10 weeks',2100,4.5,'Begashaw M.','/placeholder.svg','Published'),
('Agricultural Supply Chain Management','Optimize farm-to-market supply chains for maximum efficiency.','Agriculture','agriculture','English','Intermediate','8 weeks',1340,4.4,'James K.','/placeholder.svg','Published'),
('Organic Farming & Sustainability','Sustainable farming practices for the modern agricultural landscape.','Agriculture','agriculture','French','Beginner','6 weeks',890,4.3,'Pierre D.','/placeholder.svg','Published'),
('Spice & Herb Processing','Farm-gate processing techniques for spices and herbs.','Agriculture','agriculture','English','Beginner','4 weeks',560,4.2,'Kidist A.','/placeholder.svg','Draft'),
('E-Commerce Fundamentals','Build and manage successful online retail operations.','Commerce & Retail','commerce','English','Beginner','8 weeks',3201,4.6,'Alex Wong','/placeholder.svg','Published'),
('Digital Marketing for Retail','Master digital marketing strategies for retail businesses.','Commerce & Retail','commerce','English','Intermediate','10 weeks',2450,4.7,'Lisa Park','/placeholder.svg','Published'),
('Marketplace Platform Development','Build multi-sided marketplace platforms from scratch.','Commerce & Retail','commerce','English','Advanced','12 weeks',1200,4.8,'Dev Patel','/placeholder.svg','Published'),
('Construction Management Basics','Project planning, scheduling, and site management fundamentals.','Construction','construction','English','Beginner','10 weeks',1800,4.4,'Mike Torres','/placeholder.svg','Published'),
('Electrical Certification Prep','Prepare for electrical contractor certification exams.','Construction','construction','English','Intermediate','16 weeks',892,4.5,'Robert Kim','/placeholder.svg','Published'),
('Plumbing Essentials','Master residential and commercial plumbing fundamentals.','Construction','construction','Spanish','Beginner','8 weeks',670,4.3,'Carlos R.','/placeholder.svg','Published'),
('Instructional Design Mastery','Design effective learning experiences for diverse audiences.','Education','education','English','Intermediate','8 weeks',1540,4.6,'Dr. Amy Liu','/placeholder.svg','Published'),
('EdTech Platform Development','Build educational technology platforms and LMS systems.','Education','education','English','Advanced','12 weeks',980,4.7,'Sam B.','/placeholder.svg','Published'),
('Curriculum Development','Create engaging curricula aligned with learning objectives.','Education','education','English','Beginner','6 weeks',1200,4.4,'Dr. Helen T.','/placeholder.svg','Draft'),
('Digital Content Creation','Create professional digital content for multiple platforms.','Entertainment & Media','entertainment','English','Beginner','8 weeks',2800,4.6,'Maya J.','/placeholder.svg','Published'),
('Casting & Talent Management','Navigate the entertainment industry''s casting ecosystem.','Entertainment & Media','entertainment','English','Intermediate','6 weeks',740,4.3,'Wengel A.','/placeholder.svg','Published'),
('Video Production & Editing','Professional video production from concept to final cut.','Entertainment & Media','entertainment','English','Intermediate','10 weeks',2100,4.7,'Chris L.','/placeholder.svg','Published'),
('FMCG Supply Chain Optimization','Optimize supply chains for fast-moving consumer products.','Fast Moving Consumer Goods','fmcg','English','Intermediate','8 weeks',1650,4.5,'Amir R.','/placeholder.svg','Published'),
('Product Distribution Networks','Build efficient distribution networks for consumer goods.','Fast Moving Consumer Goods','fmcg','English','Beginner','6 weeks',1100,4.4,'Sarah M.','/placeholder.svg','Published'),
('Python for Data Science','Master Python for data analysis, ML, and AI applications.','Information Technology','it','English','Intermediate','12 weeks',4200,4.9,'Dr. Zhang Wei','/placeholder.svg','Published'),
('Cloud Architecture (AWS/Azure)','Design scalable cloud architectures on major platforms.','Information Technology','it','English','Advanced','10 weeks',2210,4.8,'Raj Patel','/placeholder.svg','Published'),
('Full-Stack Web Development','Build modern web applications from frontend to backend.','Information Technology','it','English','Intermediate','16 weeks',3800,4.7,'Nina S.','/placeholder.svg','Published'),
('Machine Learning Bootcamp','Deep dive into ML algorithms, neural networks, and deployment.','Information Technology','it','English','Advanced','14 weeks',1847,4.8,'Dr. Alice K.','/placeholder.svg','Draft'),
('Cybersecurity Essentials','Protect systems, networks, and data from cyber threats.','Information Technology','it','English','Beginner','10 weeks',2900,4.6,'Mark H.','/placeholder.svg','Published'),
('Lean Manufacturing Principles','Eliminate waste and optimize manufacturing processes.','Manufacturing','manufacturing','English','Intermediate','8 weeks',1450,4.5,'Tom K.','/placeholder.svg','Published'),
('Quality Control & Assurance','Implement quality management systems in manufacturing.','Manufacturing','manufacturing','English','Beginner','6 weeks',1200,4.4,'Yuki T.','/placeholder.svg','Published'),
('Industrial Automation','Automate industrial processes with modern control systems.','Manufacturing','manufacturing','English','Advanced','10 weeks',980,4.6,'Dr. Klaus F.','/placeholder.svg','Draft'),
('Project Management Professional','Comprehensive PMP exam preparation and project leadership.','Professional Services','professional-services','English','Advanced','10 weeks',3500,4.8,'David Chen','/placeholder.svg','Published'),
('Sales & Business Development','Master sales strategies and build lasting client relationships.','Professional Services','professional-services','English','Intermediate','8 weeks',2100,4.6,'Beza A.','/placeholder.svg','Published'),
('Nanny & Housekeeping Certification','Professional certification for childcare and housekeeping services.','Professional Services','professional-services','English','Beginner','6 weeks',840,4.5,'Milky M.','/placeholder.svg','Published'),
('Leadership & Executive Coaching','Develop executive presence and leadership capabilities.','Professional Services','professional-services','English','Advanced','6 weeks',2103,4.7,'Jen Park','/placeholder.svg','Published'),
('Hospitality Management','Manage hotels, restaurants, and hospitality operations.','Tourism & Hospitality','tourism','English','Beginner','10 weeks',1650,4.5,'Elena R.','/placeholder.svg','Published'),
('Tour Guide Certification','Become a certified tour guide with cultural competency.','Tourism & Hospitality','tourism','English','Beginner','6 weeks',780,4.4,'Abe T.','/placeholder.svg','Published'),
('Event Planning & Management','Plan and execute memorable events from weddings to conferences.','Tourism & Hospitality','tourism','French','Intermediate','8 weeks',920,4.6,'Marie D.','/placeholder.svg','Published'),
('Logistics & Fleet Management','Optimize logistics operations and manage transport fleets.','Transport & Logistics','transport','English','Intermediate','8 weeks',1340,4.5,'Blen H.','/placeholder.svg','Published'),
('Last-Mile Delivery Operations','Master last-mile delivery logistics for urban environments.','Transport & Logistics','transport','English','Beginner','4 weeks',1100,4.3,'Sisay M.','/placeholder.svg','Published'),
('Parking & Urban Mobility Solutions','Develop smart parking and urban transportation solutions.','Transport & Logistics','transport','English','Intermediate','6 weeks',640,4.2,'Dr. Gemechu W.','/placeholder.svg','Draft'),
('Financial Literacy & Planning','Build financial literacy for personal and business success.','Finance & Business','finance','English','Beginner','4 weeks',2800,4.6,'Tom Reed','/placeholder.svg','Published'),
('Startup Funding & Investment','Navigate seed funding, venture capital, and angel investment.','Finance & Business','finance','English','Intermediate','8 weeks',1900,4.7,'Sarah K.','/placeholder.svg','Published'),
('Business Model Innovation','Design and validate innovative business models for marketplaces.','Finance & Business','finance','English','Intermediate','6 weeks',1450,4.5,'Seyoum T.','/placeholder.svg','Published'),
('Legal & Tax Navigation','Understand legal frameworks, tax obligations, and compliance.','Finance & Business','finance','English','Beginner','4 weeks',1100,4.4,'Atty. Wilson','/placeholder.svg','Published');


INSERT INTO modules (course_id, title, "order", video_url, duration, content)
SELECT id, m.title, m.ord, m.video_url, m.duration, m.content FROM courses,
 (VALUES
   ('Introduction & Orientation', 1, 'https://example.com/video1', '18 min', 'Overview of the course and healthcare systems.'),
   ('Patient Care Basics', 2, 'https://example.com/video2', '25 min', 'Core principles of patient care and communication.'),
   ('Medical Terminology', 3, 'https://example.com/video3', '20 min', 'Common medical terms used in clinical settings.')
 ) AS m(title, ord, video_url, duration, content)
WHERE courses.title = 'Healthcare Fundamentals';

INSERT INTO quizzes (module_id, title, pass_score, xp_reward, questions)
SELECT m.id, 'Module 1 Quiz', 70, 50,
 '[{"question":"What is the first step in patient care?","options":["Diagnosis","Assessment","Treatment","Discharge"],"answer":1}]'::jsonb
FROM modules m JOIN courses c ON c.id = m.course_id
WHERE c.title = 'Healthcare Fundamentals' AND m.title = 'Introduction & Orientation';

INSERT INTO mentors (name, email, expertise, vertical, bio, rating, students, status, avatar) VALUES
('Dr. Sarah Johnson','sarah@example.com',ARRAY['Data Science']::text[],'Information Technology','Experienced mentor specializing in Data Science.',4.9,234,'Active',''),
('Michael Chen','mchen@example.com',ARRAY['Cloud Architecture']::text[],'Information Technology','Experienced mentor specializing in Cloud Architecture.',4.8,189,'Active',''),
('Priya Patel','priya@example.com',ARRAY['Healthcare IT']::text[],'Information Technology','Experienced mentor specializing in Healthcare IT.',4.7,156,'Active',''),
('Robert Williams','rwilliams@example.com',ARRAY['Leadership']::text[],'Information Technology','Experienced mentor specializing in Leadership.',4.6,302,'Active',''),
('Aisha Mohammed','aisha.mentor@example.com',ARRAY['Cybersecurity']::text[],'Information Technology','Experienced mentor specializing in Cybersecurity.',4.9,98,'Active',''),
('Carlos Rivera','carlos.mentor@example.com',ARRAY['Trades']::text[],'Information Technology','Experienced mentor specializing in Trades.',4.5,145,'On Leave',''),
('Emily Zhang','ezhang@example.com',ARRAY['UX Design']::text[],'Information Technology','Experienced mentor specializing in UX Design.',4.8,210,'Active',''),
('David Okonkwo','david.mentor@example.com',ARRAY['Business']::text[],'Information Technology','Experienced mentor specializing in Business.',4.4,167,'Pending',''),
('Lisa Thompson','lisa.mentor@example.com',ARRAY['Machine Learning']::text[],'Information Technology','Experienced mentor specializing in Machine Learning.',4.7,278,'Active',''),
('Ahmed Hassan','ahmed.mentor@example.com',ARRAY['DevOps']::text[],'Information Technology','Experienced mentor specializing in DevOps.',4.6,121,'Active','')
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (name, email, password_hash, role, vertical, location, phone, bio, avatar, status) VALUES
('Maria Garcia','maria@example.com','$2b$10$Q4Xn9e0A4BT.HWFVe.nKtO3yQ.ivpnXhhpYA24s6gNSVEIR9hXtwu','worker','Information Technology','Houston, TX','+1 555-0101','Passionate software developer with 5 years of experience in full-stack development.','','Active'),
('James Wilson','james@example.com','$2b$10$Q4Xn9e0A4BT.HWFVe.nKtO3yQ.ivpnXhhpYA24s6gNSVEIR9hXtwu','worker','Information Technology','Chicago, IL','+1 555-0102','Data analyst focused on business intelligence.','','Active'),
('Aisha Patel','aisha@example.com','$2b$10$Q4Xn9e0A4BT.HWFVe.nKtO3yQ.ivpnXhhpYA24s6gNSVEIR9hXtwu','employer','Professional Services','San Jose, CA','+1 555-0103','Project manager and hiring lead.','','Active'),
('Carlos Mendez','carlos@example.com','$2b$10$Q4Xn9e0A4BT.HWFVe.nKtO3yQ.ivpnXhhpYA24s6gNSVEIR9hXtwu','worker','Construction','Miami, FL','+1 555-0104','Licensed electrician with 12 years experience.','','Active'),
('Sarah Chen','sarah@example.com','$2b$10$Q4Xn9e0A4BT.HWFVe.nKtO3yQ.ivpnXhhpYA24s6gNSVEIR9hXtwu','worker','Information Technology','Seattle, WA','+1 555-0105','UX designer passionate about accessible design.','','Active'),
('Admin User','admin@example.com','$2b$10$Q4Xn9e0A4BT.HWFVe.nKtO3yQ.ivpnXhhpYA24s6gNSVEIR9hXtwu','admin','','Washington, DC','+1 555-0100','Platform administrator.','','Active'),
('Dr. Sarah Johnson','sarah.mentor@example.com','$2b$10$Q4Xn9e0A4BT.HWFVe.nKtO3yQ.ivpnXhhpYA24s6gNSVEIR9hXtwu','mentor','Information Technology','Remote','+1 555-0201','Mentor specializing in data science.','','Active')
ON CONFLICT (email) DO NOTHING;

INSERT INTO skills (user_id, name, level)
SELECT u.id, s.name, s.level FROM users u JOIN (VALUES
('maria@example.com','React',92),
('maria@example.com','TypeScript',85),
('maria@example.com','Python',78),
('maria@example.com','AWS',72),
('james@example.com','Python',80),
('james@example.com','SQL',75),
('james@example.com','Tableau',70)) AS s(email, name, level) ON u.email = s.email
ON CONFLICT DO NOTHING;


INSERT INTO certifications (user_id, name, issuer, expires_at, status)
SELECT id, c.name, c.issuer, c.expires_at::timestamptz, c.status FROM users,
 (VALUES
   ('AWS Solutions Architect','Amazon','2026-04-15','expiring'),
   ('CompTIA Security+','CompTIA','2026-06-30','active'),
   ('Google Data Analytics','Google','2026-08-12','active'),
   ('PMP Certification','PMI','2026-03-30','expired')
 ) AS c(name, issuer, expires_at, status)
WHERE users.email = 'maria@example.com';

INSERT INTO notifications (user_id, type, message, read)
SELECT id, n.type, n.message, n.read FROM users,
 (VALUES
   ('course','New module available: Advanced React Patterns', false),
   ('grade','Quiz graded: Cybersecurity Fundamentals — 92%', false),
   ('cert','AWS Solutions Architect expires in 18 days', true),
   ('course','Course updated: Data Science with Python', true),
   ('reminder','Complete Module 3 quiz by Friday', true)
 ) AS n(type, message, read)
WHERE users.email = 'maria@example.com';

INSERT INTO enrollments (user_id, course_id, progress, xp, grade)
SELECT u.id, c.id, e.progress, e.xp, e.grade
FROM (VALUES
   ('maria@example.com','Python for Data Science', 65, 320, ''),
   ('maria@example.com','Cybersecurity Essentials', 100, 500, 'A-'),
   ('maria@example.com','Full-Stack Web Development', 40, 150, '')
) AS e(user_email, course_title, progress, xp, grade)
JOIN users u ON u.email = e.user_email
JOIN courses c ON c.title = e.course_title
ON CONFLICT (user_id, course_id) DO NOTHING;

INSERT INTO programs (title, agency, description, program_type, eligibility, funding, deadline, verticals) VALUES
('IT Specialist (INFOSEC)','Department of Homeland Security','Federal cybersecurity specialist role.','job',ARRAY['CISSP or equivalent','5+ years cybersecurity','US Citizen']::text[],'$89,834 - $116,788','2026-04-15',ARRAY['Information Technology']::text[]),
('Agricultural Program Specialist','USDA','Support USDA agricultural programs nationwide.','job',ARRAY['BS in Agriculture','3+ years experience','Knowledge of USDA programs']::text[],'$72,553 - $94,317','2026-04-30',ARRAY['Agriculture']::text[]),
('Public Health Analyst','HHS / CDC','Analyze public health data and programs.','job',ARRAY['MPH or equivalent','Epidemiology experience','US Citizen']::text[],'$103,409 - $134,435','2026-05-01',ARRAY['Health & Healthcare']::text[]),
('WIOA Adult Training Program','Department of Labor','Workforce Innovation and Opportunity Act funding for job training.','funding',ARRAY['Adults 18+','unemployed/underemployed']::text[],'$5,000 - $10,000','Rolling',ARRAY['Professional Services']::text[]),
('Pell Grant','Department of Education','Federal grants for higher education based on financial need.','funding',ARRAY['Undergraduate students with financial need']::text[],'Up to $7,395','2026-06-30',ARRAY['Education']::text[]),
('SBIR/STTR Grants','SBA / NSF','Small Business Innovation Research funding for tech-driven startups.','funding',ARRAY['Small businesses with R&D capability']::text[],'$50,000 - $1,000,000','Quarterly',ARRAY['Information Technology']::text[]),
('USDA Beginning Farmer Grant','USDA','Grants supporting new and beginning farmers and ranchers.','funding',ARRAY['New farmers','<10 years experience']::text[],'$25,000 - $250,000','2026-11-01',ARRAY['Agriculture']::text[]);

INSERT INTO visa_programs (title, visa_type, category, description, eligibility, duration, industry_match) VALUES
('H-1B Specialty Occupation','H-1B','Work','For workers in specialty occupations requiring at least a bachelor''s degree.',ARRAY['Bachelor''s degree + job offer in specialty occupation']::text[],'3 years (renewable to 6)',ARRAY['Information Technology','Health & Healthcare','Finance & Business','Manufacturing']::text[]),
('F-1 Student Visa','F-1','Study','For full-time students enrolled in academic programs at accredited US institutions.',ARRAY['Admission to SEVP-certified school + financial proof']::text[],'Duration of study',ARRAY['Education']::text[]),
('Optional Practical Training','OPT','Work','Temporary employment for F-1 students directly related to their major.',ARRAY['F-1 student, completed 1 academic year']::text[],'12 months (36 for STEM)',ARRAY['Information Technology','Health & Healthcare','Manufacturing','Agriculture']::text[]),
('H-2A Temporary Agricultural Workers','H-2A','Work','For temporary or seasonal agricultural work.',ARRAY['Job offer for agricultural work']::text[],'Up to 1 year',ARRAY['Agriculture']::text[]),
('H-2B Temporary Non-Agricultural Workers','H-2B','Work','For temporary non-agricultural workers.',ARRAY['Temporary job offer','employer certification']::text[],'Up to 1 year',ARRAY['Tourism & Hospitality','Construction','Entertainment & Media']::text[]),
('J-1 Exchange Visitor','J-1','Exchange','For cultural exchange programs including interns, trainees, teachers, and researchers.',ARRAY['Sponsorship by designated J-1 program']::text[],'Varies by category',ARRAY['Education','Health & Healthcare','Professional Services']::text[]),
('L-1 Intracompany Transferee','L-1','Work','For employees of international companies transferring to a US office.',ARRAY['1+ year with company abroad']::text[],'1-7 years',ARRAY['Information Technology','Finance & Business','Manufacturing','Professional Services']::text[]),
('O-1 Extraordinary Ability','O-1','Work','For individuals with extraordinary ability.',ARRAY['Demonstrated extraordinary ability']::text[],'Up to 3 years',ARRAY['Entertainment & Media','Information Technology','Education','Professional Services']::text[]),
('TN NAFTA Professional','TN','Work','For Canadian and Mexican professionals in designated occupations.',ARRAY['Canadian/Mexican citizen + qualifying profession']::text[],'3 years (renewable)',ARRAY['Health & Healthcare','Information Technology','Finance & Business','Professional Services']::text[]),
('E-2 Treaty Investor','E-2','Investment','For investors from treaty countries making a substantial investment.',ARRAY['Treaty country national + substantial investment']::text[],'2-5 years (renewable)',ARRAY['Commerce & Retail','Tourism & Hospitality','Manufacturing','Finance & Business']::text[]);

INSERT INTO marketplace_entries (name, vertical, description, location, founded, employees, tags) VALUES
('Mogzit','Professional Services','A platform connecting customers with trusted caregivers for elderly, child, and home care services.','Ethiopia','2019','50-100',ARRAY['Professional Services']::text[]),
('YeneHealth','Health & Healthcare','Transforming home healthcare in Ethiopia by connecting patients with certified healthcare professionals.','Ethiopia','2020','20-50',ARRAY['Health & Healthcare']::text[]),
('Lenat','Professional Services','Creating upskilling opportunities for gig workers and exploring new sectors.','Ethiopia','2021','10-20',ARRAY['Professional Services']::text[]),
('ChapChap','Transport & Logistics','A logistics solution focusing on last-mile delivery needs of urban residents.','Ethiopia','2020','20-50',ARRAY['Transport & Logistics']::text[]),
('TaskMoby','Professional Services','An innovative platform driving change in the gig economy.','Ethiopia','2019','10-20',ARRAY['Professional Services']::text[]),
('BeSingularity','Professional Services','Providing sales skill training and sales outsourcing services.','Ethiopia','2021','10-20',ARRAY['Professional Services']::text[]),
('Beten','Construction','A digital marketplace connecting customers with certified service providers for home renovation.','Ethiopia','2020','20-50',ARRAY['Construction']::text[]),
('BetterLife','Health & Healthcare','Dedicated to transforming home healthcare services.','Ethiopia','2021','10-20',ARRAY['Health & Healthcare']::text[]),
('Bfarm-Tech','Agriculture','Modernizing traditional farming by connecting farmers with mechanization services.','Ethiopia','2020','10-20',ARRAY['Agriculture']::text[]),
('ChipChip','Fast Moving Consumer Goods','Transforming agricultural supply chain via farm2fork logistics.','Ethiopia','2019','20-50',ARRAY['Fast Moving Consumer Goods']::text[]),
('Efoy Nanny','Professional Services','A social enterprise offering training programs in nanny and housekeeping services.','Ethiopia','2020','10-20',ARRAY['Professional Services']::text[]),
('Gojo Casting','Entertainment & Media','Revolutionizing the traditional casting process.','Ethiopia','2022','5-10',ARRAY['Entertainment & Media']::text[]),
('Guaro Farms','Agriculture','Innovative farm-gate processing of spices and herbs.','Ethiopia','2021','10-20',ARRAY['Agriculture']::text[]),
('Jasper Ethiopia','Professional Services','Addressing critical gaps in Ethiopia''s job market.','Ethiopia','2019','20-50',ARRAY['Professional Services']::text[]),
('Kabba','Transport & Logistics','AI-driven platform providing reliable transportation solutions.','Ethiopia','2021','20-50',ARRAY['Transport & Logistics']::text[]),
('Jelani Sports','Entertainment & Media','Elevating African sports talent through an online platform.','Ethiopia','2022','5-10',ARRAY['Entertainment & Media']::text[]),
('Alen','Professional Services','Transforming informal work sectors for gig workers.','Ethiopia','2020','10-20',ARRAY['Professional Services']::text[]),
('Utentic','Tourism & Hospitality','Providing authentic tourism experiences.','Ethiopia','2020','10-20',ARRAY['Tourism & Hospitality']::text[]);


INSERT INTO community_events (title, event_date, type, attendees) VALUES
('Growth Hacking Workshop','2026-04-15','Workshop',120),
('Legal & Tax Webinar for Startups','2026-04-22','Webinar',85),
('Investor Pitch Night','2026-05-01','Networking',200),
('Digital Marketing Masterclass','2026-05-10','Masterclass',150);

INSERT INTO community_groups (name, category, members, icon) VALUES
('Growth Advisors Circle','Marketing',420,'Megaphone'),
('Finance & Funding Mentors','Finance',310,'DollarSign'),
('Legal & Compliance Network','Legal',180,'Scale'),
('Healthcare Innovators','Health & Healthcare',260,'Heart');

INSERT INTO community_posts (author, title, body, category, likes) VALUES
('Sarah K.','Growth Hacking Strategies','Proven strategies to accelerate your marketplace growth.','Business Development',34),
('David C.','Investor Pitch Prep','Prepare compelling pitches and secure funding for your venture.','Investment Readiness',21),
('Atty. Wilson','Legal & Compliance Guide','Navigate regulations, contracts, and IP protection.','Legal',15),
('Dr. Mulugeta G.','Healthcare Innovation Trends','Insights on home healthcare innovation in emerging markets.','Business Development',12);


INSERT INTO entrepreneurship_tracks (title, description, icon, "order") VALUES
('Technology','Access to a white-labeled system for applications, vetting, onboarding, and user matching.','Monitor',1),
('Marketing','Assistance with developing and executing marketing campaigns to reach target audiences.','Megaphone',2),
('Partner Network','Access to a network of businesses and organizations that accelerate growth.','Network',3),
('Access to Advisors','Unlock expertise of business, legal, and finance advisors with templates for all needs.','Users',4),
('Qualified Financing','Businesses and gig workers can access qualified financing through the program.','DollarSign',5),
('Mentorship','Guidance from experienced entrepreneurs to avoid pitfalls and make better decisions.','GraduationCap',6),
('Upskilling','Content creation and training for marketplace operators and their gig workers.','TrendingUp',7),
('Market Research','Tailored research crafted to fit your sector and needs for strategic decision-making.','BarChart3',8);

INSERT INTO entrepreneurship_resources (category, title, description, icon, items) VALUES
('Business Development','Growth Hacking Strategies','Proven strategies to accelerate your marketplace growth.','Target',12),
('Marketing','Digital Marketing Playbook','Comprehensive guide to marketing your platform effectively.','Megaphone',18),
('Finance','Financial Planning Toolkit','Templates and guides for budgeting, forecasting, and fundraising.','DollarSign',9),
('Investment Readiness','Investor Pitch Prep','Prepare compelling pitches and secure funding for your venture.','TrendingUp',7),
('Legal','Legal & Compliance Guide','Navigate regulations, contracts, and IP protection.','Scale',14),
('Job Posts','Opportunity Board','Access a wide range of gig, freelance, and full-time opportunities.','Briefcase',45);

INSERT INTO candidates (name, title, skills, location, zip, billing_rate, vertical, education, programs, rating, experience, email) VALUES
('Maria Garcia','Full Stack Developer',ARRAY['React','Python','AWS']::text[],'Houston, TX','77001',85,'Information Technology','BS Computer Science',ARRAY['WOTC','HUBZone']::text[],4.9,'5 years','maria@example.com'),
('James Wilson','Data Analyst',ARRAY['Python','SQL','Tableau']::text[],'Chicago, IL','60601',70,'Information Technology','MS Data Science',ARRAY['Veterans','WOTC']::text[],4.7,'3 years','james@example.com'),
('Liya Mengistu','Project Manager',ARRAY['Agile','Scrum','Leadership']::text[],'San Jose, CA','95101',95,'Professional Services','MBA',ARRAY['MWBE']::text[],4.8,'8 years','aisha.candidate@example.com'),
('Carlos Mendez','Electrician',ARRAY['Electrical','HVAC','Safety']::text[],'Miami, FL','33101',55,'Construction','Trade Certificate',ARRAY['WOTC','HUBZone']::text[],4.6,'12 years','carlos@example.com'),
('Sarah Chen','UX Designer',ARRAY['Figma','Research','Prototyping']::text[],'Seattle, WA','98101',90,'Information Technology','BFA Design','{}'::text[],4.9,'4 years','sarah@example.com'),
('David Brown','Cybersecurity Analyst',ARRAY['Network Security','SIEM','Python']::text[],'Austin, TX','73301',100,'Information Technology','BS Cybersecurity',ARRAY['Veterans']::text[],4.5,'6 years','david.brown@example.com'),
('Fatima Al-Hassan','Nurse Practitioner',ARRAY['Patient Care','Diagnostics','EMR']::text[],'Detroit, MI','48201',75,'Health & Healthcare','MSN Nursing',ARRAY['Refugee Employment']::text[],4.8,'7 years','fatima@example.com'),
('Robert Kim','Machine Learning Engineer',ARRAY['TensorFlow','Python','NLP']::text[],'Boston, MA','02101',120,'Information Technology','PhD Computer Science','{}'::text[],5.0,'9 years','robert.kim@example.com');
