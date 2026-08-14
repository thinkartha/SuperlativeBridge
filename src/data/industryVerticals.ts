// 13 Industry Verticals aligned with mesirat.org GPM sectors
export const industryVerticals = [
  { id: "health", name: "Health & Healthcare", icon: "Heart", color: "bg-red-500" },
  { id: "agriculture", name: "Agriculture", icon: "Sprout", color: "bg-green-600" },
  { id: "commerce", name: "Commerce & Retail", icon: "ShoppingCart", color: "bg-blue-500" },
  { id: "construction", name: "Construction", icon: "HardHat", color: "bg-amber-600" },
  { id: "education", name: "Education", icon: "GraduationCap", color: "bg-indigo-500" },
  { id: "entertainment", name: "Entertainment & Media", icon: "Film", color: "bg-pink-500" },
  { id: "fmcg", name: "Fast Moving Consumer Goods", icon: "Package", color: "bg-orange-500" },
  { id: "it", name: "Information Technology", icon: "Monitor", color: "bg-violet-600" },
  { id: "manufacturing", name: "Manufacturing", icon: "Factory", color: "bg-slate-600" },
  { id: "professional-services", name: "Professional Services", icon: "Briefcase", color: "bg-teal-600" },
  { id: "tourism", name: "Tourism & Hospitality", icon: "Plane", color: "bg-cyan-500" },
  { id: "transport", name: "Transport & Logistics", icon: "Truck", color: "bg-yellow-600" },
  { id: "finance", name: "Finance & Business", icon: "DollarSign", color: "bg-emerald-600" },
] as const;

export type IndustryVertical = typeof industryVerticals[number];

// Courses mapped to industry verticals
export const allCourses = [
  // Health & Healthcare
  { id: 1, title: "Healthcare Fundamentals", category: "Health & Healthcare", language: "English", students: 2847, duration: "12 weeks", level: "Beginner", rating: 4.7, instructor: "Dr. Sarah Chen", image: "/placeholder.svg", status: "Published", description: "Comprehensive introduction to healthcare systems, patient care, and medical terminology." },
  { id: 2, title: "Nursing Assistant Certification", category: "Health & Healthcare", language: "English", students: 1563, duration: "16 weeks", level: "Intermediate", rating: 4.8, instructor: "Maria Johnson", image: "/placeholder.svg", status: "Published", description: "Prepare for CNA certification with hands-on clinical training." },
  { id: 3, title: "Home-Based Healthcare Services", category: "Health & Healthcare", language: "English", students: 980, duration: "8 weeks", level: "Beginner", rating: 4.5, instructor: "Dr. Mulugeta G.", image: "/placeholder.svg", status: "Published", description: "Learn to deliver quality healthcare services in home settings." },
  { id: 4, title: "Mental Health First Aid", category: "Health & Healthcare", language: "Spanish", students: 1120, duration: "6 weeks", level: "Beginner", rating: 4.6, instructor: "Dr. Lopez", image: "/placeholder.svg", status: "Published", description: "Recognize and respond to mental health crises effectively." },

  // Agriculture
  { id: 5, title: "Modern Farming Techniques", category: "Agriculture", language: "English", students: 2100, duration: "10 weeks", level: "Beginner", rating: 4.5, instructor: "Begashaw M.", image: "/placeholder.svg", status: "Published", description: "From traditional to mechanized farming with technology integration." },
  { id: 6, title: "Agricultural Supply Chain Management", category: "Agriculture", language: "English", students: 1340, duration: "8 weeks", level: "Intermediate", rating: 4.4, instructor: "James K.", image: "/placeholder.svg", status: "Published", description: "Optimize farm-to-market supply chains for maximum efficiency." },
  { id: 7, title: "Organic Farming & Sustainability", category: "Agriculture", language: "French", students: 890, duration: "6 weeks", level: "Beginner", rating: 4.3, instructor: "Pierre D.", image: "/placeholder.svg", status: "Published", description: "Sustainable farming practices for the modern agricultural landscape." },
  { id: 8, title: "Spice & Herb Processing", category: "Agriculture", language: "English", students: 560, duration: "4 weeks", level: "Beginner", rating: 4.2, instructor: "Kidist A.", image: "/placeholder.svg", status: "Draft", description: "Farm-gate processing techniques for spices and herbs." },

  // Commerce & Retail
  { id: 9, title: "E-Commerce Fundamentals", category: "Commerce & Retail", language: "English", students: 3201, duration: "8 weeks", level: "Beginner", rating: 4.6, instructor: "Alex Wong", image: "/placeholder.svg", status: "Published", description: "Build and manage successful online retail operations." },
  { id: 10, title: "Digital Marketing for Retail", category: "Commerce & Retail", language: "English", students: 2450, duration: "10 weeks", level: "Intermediate", rating: 4.7, instructor: "Lisa Park", image: "/placeholder.svg", status: "Published", description: "Master digital marketing strategies for retail businesses." },
  { id: 11, title: "Marketplace Platform Development", category: "Commerce & Retail", language: "English", students: 1200, duration: "12 weeks", level: "Advanced", rating: 4.8, instructor: "Dev Patel", image: "/placeholder.svg", status: "Published", description: "Build multi-sided marketplace platforms from scratch." },

  // Construction
  { id: 12, title: "Construction Management Basics", category: "Construction", language: "English", students: 1800, duration: "10 weeks", level: "Beginner", rating: 4.4, instructor: "Mike Torres", image: "/placeholder.svg", status: "Published", description: "Project planning, scheduling, and site management fundamentals." },
  { id: 13, title: "Electrical Certification Prep", category: "Construction", language: "English", students: 892, duration: "16 weeks", level: "Intermediate", rating: 4.5, instructor: "Robert Kim", image: "/placeholder.svg", status: "Published", description: "Prepare for electrical contractor certification exams." },
  { id: 14, title: "Plumbing Essentials", category: "Construction", language: "Spanish", students: 670, duration: "8 weeks", level: "Beginner", rating: 4.3, instructor: "Carlos R.", image: "/placeholder.svg", status: "Published", description: "Master residential and commercial plumbing fundamentals." },

  // Education
  { id: 15, title: "Instructional Design Mastery", category: "Education", language: "English", students: 1540, duration: "8 weeks", level: "Intermediate", rating: 4.6, instructor: "Dr. Amy Liu", image: "/placeholder.svg", status: "Published", description: "Design effective learning experiences for diverse audiences." },
  { id: 16, title: "EdTech Platform Development", category: "Education", language: "English", students: 980, duration: "12 weeks", level: "Advanced", rating: 4.7, instructor: "Sam B.", image: "/placeholder.svg", status: "Published", description: "Build educational technology platforms and LMS systems." },
  { id: 17, title: "Curriculum Development", category: "Education", language: "English", students: 1200, duration: "6 weeks", level: "Beginner", rating: 4.4, instructor: "Dr. Helen T.", image: "/placeholder.svg", status: "Draft", description: "Create engaging curricula aligned with learning objectives." },

  // Entertainment & Media
  { id: 18, title: "Digital Content Creation", category: "Entertainment & Media", language: "English", students: 2800, duration: "8 weeks", level: "Beginner", rating: 4.6, instructor: "Maya J.", image: "/placeholder.svg", status: "Published", description: "Create professional digital content for multiple platforms." },
  { id: 19, title: "Casting & Talent Management", category: "Entertainment & Media", language: "English", students: 740, duration: "6 weeks", level: "Intermediate", rating: 4.3, instructor: "Wengel A.", image: "/placeholder.svg", status: "Published", description: "Navigate the entertainment industry's casting ecosystem." },
  { id: 20, title: "Video Production & Editing", category: "Entertainment & Media", language: "English", students: 2100, duration: "10 weeks", level: "Intermediate", rating: 4.7, instructor: "Chris L.", image: "/placeholder.svg", status: "Published", description: "Professional video production from concept to final cut." },

  // FMCG
  { id: 21, title: "FMCG Supply Chain Optimization", category: "Fast Moving Consumer Goods", language: "English", students: 1650, duration: "8 weeks", level: "Intermediate", rating: 4.5, instructor: "Amir R.", image: "/placeholder.svg", status: "Published", description: "Optimize supply chains for fast-moving consumer products." },
  { id: 22, title: "Product Distribution Networks", category: "Fast Moving Consumer Goods", language: "English", students: 1100, duration: "6 weeks", level: "Beginner", rating: 4.4, instructor: "Sarah M.", image: "/placeholder.svg", status: "Published", description: "Build efficient distribution networks for consumer goods." },

  // Information Technology
  { id: 23, title: "Python for Data Science", category: "Information Technology", language: "English", students: 4200, duration: "12 weeks", level: "Intermediate", rating: 4.9, instructor: "Dr. Zhang Wei", image: "/placeholder.svg", status: "Published", description: "Master Python for data analysis, ML, and AI applications." },
  { id: 24, title: "Cloud Architecture (AWS/Azure)", category: "Information Technology", language: "English", students: 2210, duration: "10 weeks", level: "Advanced", rating: 4.8, instructor: "Raj Patel", image: "/placeholder.svg", status: "Published", description: "Design scalable cloud architectures on major platforms." },
  { id: 25, title: "Full-Stack Web Development", category: "Information Technology", language: "English", students: 3800, duration: "16 weeks", level: "Intermediate", rating: 4.7, instructor: "Nina S.", image: "/placeholder.svg", status: "Published", description: "Build modern web applications from frontend to backend." },
  { id: 26, title: "Machine Learning Bootcamp", category: "Information Technology", language: "English", students: 1847, duration: "14 weeks", level: "Advanced", rating: 4.8, instructor: "Dr. Alice K.", image: "/placeholder.svg", status: "Draft", description: "Deep dive into ML algorithms, neural networks, and deployment." },
  { id: 27, title: "Cybersecurity Essentials", category: "Information Technology", language: "English", students: 2900, duration: "10 weeks", level: "Beginner", rating: 4.6, instructor: "Mark H.", image: "/placeholder.svg", status: "Published", description: "Protect systems, networks, and data from cyber threats." },

  // Manufacturing
  { id: 28, title: "Lean Manufacturing Principles", category: "Manufacturing", language: "English", students: 1450, duration: "8 weeks", level: "Intermediate", rating: 4.5, instructor: "Tom K.", image: "/placeholder.svg", status: "Published", description: "Eliminate waste and optimize manufacturing processes." },
  { id: 29, title: "Quality Control & Assurance", category: "Manufacturing", language: "English", students: 1200, duration: "6 weeks", level: "Beginner", rating: 4.4, instructor: "Yuki T.", image: "/placeholder.svg", status: "Published", description: "Implement quality management systems in manufacturing." },
  { id: 30, title: "Industrial Automation", category: "Manufacturing", language: "English", students: 980, duration: "10 weeks", level: "Advanced", rating: 4.6, instructor: "Dr. Klaus F.", image: "/placeholder.svg", status: "Draft", description: "Automate industrial processes with modern control systems." },

  // Professional Services
  { id: 31, title: "Project Management Professional", category: "Professional Services", language: "English", students: 3500, duration: "10 weeks", level: "Advanced", rating: 4.8, instructor: "David Chen", image: "/placeholder.svg", status: "Published", description: "Comprehensive PMP exam preparation and project leadership." },
  { id: 32, title: "Sales & Business Development", category: "Professional Services", language: "English", students: 2100, duration: "8 weeks", level: "Intermediate", rating: 4.6, instructor: "Beza A.", image: "/placeholder.svg", status: "Published", description: "Master sales strategies and build lasting client relationships." },
  { id: 33, title: "Nanny & Housekeeping Certification", category: "Professional Services", language: "English", students: 840, duration: "6 weeks", level: "Beginner", rating: 4.5, instructor: "Milky M.", image: "/placeholder.svg", status: "Published", description: "Professional certification for childcare and housekeeping services." },
  { id: 34, title: "Leadership & Executive Coaching", category: "Professional Services", language: "English", students: 2103, duration: "6 weeks", level: "Advanced", rating: 4.7, instructor: "Jen Park", image: "/placeholder.svg", status: "Published", description: "Develop executive presence and leadership capabilities." },

  // Tourism & Hospitality
  { id: 35, title: "Hospitality Management", category: "Tourism & Hospitality", language: "English", students: 1650, duration: "10 weeks", level: "Beginner", rating: 4.5, instructor: "Elena R.", image: "/placeholder.svg", status: "Published", description: "Manage hotels, restaurants, and hospitality operations." },
  { id: 36, title: "Tour Guide Certification", category: "Tourism & Hospitality", language: "English", students: 780, duration: "6 weeks", level: "Beginner", rating: 4.4, instructor: "Abe T.", image: "/placeholder.svg", status: "Published", description: "Become a certified tour guide with cultural competency." },
  { id: 37, title: "Event Planning & Management", category: "Tourism & Hospitality", language: "French", students: 920, duration: "8 weeks", level: "Intermediate", rating: 4.6, instructor: "Marie D.", image: "/placeholder.svg", status: "Published", description: "Plan and execute memorable events from weddings to conferences." },

  // Transport & Logistics
  { id: 38, title: "Logistics & Fleet Management", category: "Transport & Logistics", language: "English", students: 1340, duration: "8 weeks", level: "Intermediate", rating: 4.5, instructor: "Blen H.", image: "/placeholder.svg", status: "Published", description: "Optimize logistics operations and manage transport fleets." },
  { id: 39, title: "Last-Mile Delivery Operations", category: "Transport & Logistics", language: "English", students: 1100, duration: "4 weeks", level: "Beginner", rating: 4.3, instructor: "Sisay M.", image: "/placeholder.svg", status: "Published", description: "Master last-mile delivery logistics for urban environments." },
  { id: 40, title: "Parking & Urban Mobility Solutions", category: "Transport & Logistics", language: "English", students: 640, duration: "6 weeks", level: "Intermediate", rating: 4.2, instructor: "Dr. Gemechu W.", image: "/placeholder.svg", status: "Draft", description: "Develop smart parking and urban transportation solutions." },

  // Finance & Business
  { id: 41, title: "Financial Literacy & Planning", category: "Finance & Business", language: "English", students: 2800, duration: "4 weeks", level: "Beginner", rating: 4.6, instructor: "Tom Reed", image: "/placeholder.svg", status: "Published", description: "Build financial literacy for personal and business success." },
  { id: 42, title: "Startup Funding & Investment", category: "Finance & Business", language: "English", students: 1900, duration: "8 weeks", level: "Intermediate", rating: 4.7, instructor: "Sarah K.", image: "/placeholder.svg", status: "Published", description: "Navigate seed funding, venture capital, and angel investment." },
  { id: 43, title: "Business Model Innovation", category: "Finance & Business", language: "English", students: 1450, duration: "6 weeks", level: "Intermediate", rating: 4.5, instructor: "Seyoum T.", image: "/placeholder.svg", status: "Published", description: "Design and validate innovative business models for marketplaces." },
  { id: 44, title: "Legal & Tax Navigation", category: "Finance & Business", language: "English", students: 1100, duration: "4 weeks", level: "Beginner", rating: 4.4, instructor: "Atty. Wilson", image: "/placeholder.svg", status: "Published", description: "Understand legal frameworks, tax obligations, and compliance." },
];

// GPM/Marketplace directory data
export const gpmDirectory = [
  { id: 1, name: "Mogzit", sector: "Professional Services", description: "A platform connecting customers with trusted caregivers for elderly, child, and home care services. Serving 120,000+ clients with 200+ caregivers.", website: "https://mogzit.com", founded: "2019", status: "Active", employees: "50-100", logo: "/placeholder.svg" },
  { id: 2, name: "YeneHealth", sector: "Health & Healthcare", description: "Transforming home healthcare in Ethiopia by connecting patients with certified healthcare professionals. Empowering African women in healthcare.", website: "https://yenehealth.com", founded: "2020", status: "Active", employees: "20-50", logo: "/placeholder.svg" },
  { id: 3, name: "Lenat", sector: "Professional Services", description: "Creating upskilling opportunities for gig workers and exploring new sectors through strategic collaborations and partnerships.", website: "https://lenat.com", founded: "2021", status: "Active", employees: "10-20", logo: "/placeholder.svg" },
  { id: 4, name: "ChapChap", sector: "Transport & Logistics", description: "A logistics solution focusing on the last-mile delivery needs of urban residents with efficient and reliable service.", website: "https://chapchap.et", founded: "2020", status: "Active", employees: "20-50", logo: "/placeholder.svg" },
  { id: 5, name: "TaskMoby", sector: "Professional Services", description: "An innovative platform driving change in the gig economy through quality networking and expert consultations.", website: "https://taskmoby.com", founded: "2019", status: "Active", employees: "10-20", logo: "/placeholder.svg" },
  { id: 6, name: "BeSingularity", sector: "Professional Services", description: "Providing sales skill training and sales outsourcing services for businesses across Ethiopia.", website: "https://besingularity.com", founded: "2021", status: "Active", employees: "10-20", logo: "/placeholder.svg" },
  { id: 7, name: "Beten", sector: "Construction", description: "A digital marketplace connecting customers with certified and screened service providers for home renovation needs.", website: "https://betenethiopia.com", founded: "2020", status: "Active", employees: "20-50", logo: "/placeholder.svg" },
  { id: 8, name: "BetterLife", sector: "Health & Healthcare", description: "Dedicated to transforming home healthcare services, recognizing the increasing demand for personalized care.", website: "https://betterlife.com", founded: "2021", status: "Active", employees: "10-20", logo: "/placeholder.svg" },
  { id: 9, name: "Bfarm-Tech", sector: "Agriculture", description: "Modernizing traditional farming by connecting farmers with mechanization services like tractor rentals and operators.", website: "https://bfarmtech.com", founded: "2020", status: "Active", employees: "10-20", logo: "/placeholder.svg" },
  { id: 10, name: "ChipChip", sector: "Fast Moving Consumer Goods", description: "Transforming the agricultural supply chain by connecting farmers directly with consumers through 'farm2fork' logistics.", website: "https://chipchip.social", founded: "2019", status: "Active", employees: "20-50", logo: "/placeholder.svg" },
  { id: 11, name: "Efoy Nanny", sector: "Professional Services", description: "A social enterprise offering comprehensive training programs in nanny and housekeeping services.", website: "https://efoynanny.com", founded: "2020", status: "Active", employees: "10-20", logo: "/placeholder.svg" },
  { id: 12, name: "Gojo Casting", sector: "Entertainment & Media", description: "Revolutionizing the traditional casting process with a safe, transparent, and equitable platform.", website: "https://gojocasting.com", founded: "2022", status: "Active", employees: "5-10", logo: "/placeholder.svg" },
  { id: 13, name: "Guaro Farms", sector: "Agriculture", description: "Innovative farm-gate processing of spices and herbs, creating sustainable value chains for farmers.", website: "https://guarofarms.com", founded: "2021", status: "Active", employees: "10-20", logo: "/placeholder.svg" },
  { id: 14, name: "Jasper Ethiopia", sector: "Professional Services", description: "Addressing critical gaps in Ethiopia's job market by connecting skilled professionals with opportunities.", website: "https://jasperethiopia.com", founded: "2019", status: "Active", employees: "20-50", logo: "/placeholder.svg" },
  { id: 15, name: "Kabba", sector: "Transport & Logistics", description: "AI-driven platform providing reliable and affordable transportation solutions in urban areas.", website: "https://kabbatransport.com", founded: "2021", status: "Active", employees: "20-50", logo: "/placeholder.svg" },
  { id: 16, name: "Jelani Sports", sector: "Entertainment & Media", description: "Elevating African sports talent by connecting athletes with opportunities through an online platform.", website: "https://jelanisports.com", founded: "2022", status: "Active", employees: "5-10", logo: "/placeholder.svg" },
  { id: 17, name: "Alen", sector: "Professional Services", description: "Transforming the landscape of informal work sectors by creating opportunities for gig workers and certified professionals.", website: "https://alen.com", founded: "2020", status: "Active", employees: "10-20", logo: "/placeholder.svg" },
  { id: 18, name: "Utentic", sector: "Tourism & Hospitality", description: "Providing authentic tourism experiences by connecting travelers with local guides and cultural experiences.", website: "https://utentic.com", founded: "2020", status: "Active", employees: "10-20", logo: "/placeholder.svg" },
];

// Government programs aligned with US context
export const governmentPrograms = [
  // Federal Job Programs
  { id: 1, type: "job", title: "IT Specialist (INFOSEC)", agency: "Department of Homeland Security", location: "Washington, DC", salary: "$89,834 - $116,788", grade: "GS-12", category: "Information Technology", posted: "2025-12-01", closes: "2026-04-15", series: "2210", qualifications: ["CISSP or equivalent", "5+ years cybersecurity", "US Citizen"] },
  { id: 2, type: "job", title: "Agricultural Program Specialist", agency: "USDA", location: "Multiple", salary: "$72,553 - $94,317", grade: "GS-11", category: "Agriculture", posted: "2025-11-15", closes: "2026-04-30", series: "1145", qualifications: ["BS in Agriculture", "3+ years experience", "Knowledge of USDA programs"] },
  { id: 3, type: "job", title: "Public Health Analyst", agency: "HHS / CDC", location: "Atlanta, GA", salary: "$103,409 - $134,435", grade: "GS-13", category: "Health & Healthcare", posted: "2025-12-10", closes: "2026-05-01", series: "0685", qualifications: ["MPH or equivalent", "Epidemiology experience", "US Citizen"] },
  { id: 4, type: "job", title: "Civil Engineer", agency: "Army Corps of Engineers", location: "Multiple", salary: "$89,834 - $116,788", grade: "GS-12", category: "Construction", posted: "2025-11-20", closes: "2026-04-20", series: "0810", qualifications: ["PE License", "5+ years", "Infrastructure experience"] },
  { id: 5, type: "job", title: "Transportation Specialist", agency: "DOT / FHWA", location: "Remote", salary: "$72,553 - $94,317", grade: "GS-11", category: "Transport & Logistics", posted: "2025-12-05", closes: "2026-05-15", series: "2101", qualifications: ["BS Transportation/Engineering", "3+ years", "CDL preferred"] },
  { id: 6, type: "job", title: "Financial Management Analyst", agency: "Treasury Department", location: "Washington, DC", salary: "$103,409 - $134,435", grade: "GS-13", category: "Finance & Business", posted: "2025-12-01", closes: "2026-04-30", series: "0501", qualifications: ["CPA or MBA", "5+ years", "Federal financial systems"] },
  { id: 7, type: "job", title: "Education Program Specialist", agency: "Department of Education", location: "Washington, DC", salary: "$82,764 - $107,590", grade: "GS-12", category: "Education", posted: "2025-11-25", closes: "2026-05-10", series: "1720", qualifications: ["M.Ed. or equivalent", "5+ years", "STEM education background"] },
  { id: 8, type: "job", title: "Manufacturing Engineer", agency: "DOD / DCMA", location: "Multiple", salary: "$89,834 - $116,788", grade: "GS-12", category: "Manufacturing", posted: "2025-12-08", closes: "2026-05-01", series: "0830", qualifications: ["BS Engineering", "5+ years manufacturing", "Quality assurance"] },

  // Funding/Grant Programs
  { id: 101, type: "funding", title: "WIOA Adult Training Program", agency: "Department of Labor", amount: "$5,000 - $10,000", category: "Professional Services", eligibility: "Adults 18+, unemployed/underemployed", deadline: "Rolling", description: "Workforce Innovation and Opportunity Act provides funding for job training and career services." },
  { id: 102, type: "funding", title: "Pell Grant", agency: "Department of Education", amount: "Up to $7,395", category: "Education", eligibility: "Undergraduate students with financial need", deadline: "June 30, 2026", description: "Federal grants for higher education based on financial need." },
  { id: 103, type: "funding", title: "GI Bill Benefits", agency: "VA", amount: "Full tuition + $2,000/mo BAH", category: "Education", eligibility: "Veterans, 90+ days active duty", deadline: "Rolling", description: "Education benefits for military service members and veterans." },
  { id: 104, type: "funding", title: "SBIR/STTR Grants", agency: "SBA / NSF", amount: "$50,000 - $1,000,000", category: "Information Technology", eligibility: "Small businesses with R&D capability", deadline: "Quarterly", description: "Small Business Innovation Research funding for tech-driven startups." },
  { id: 105, type: "funding", title: "USDA Beginning Farmer Grant", agency: "USDA", amount: "$25,000 - $250,000", category: "Agriculture", eligibility: "New farmers, <10 years experience", deadline: "November 2026", description: "Grants supporting new and beginning farmers and ranchers." },
  { id: 106, type: "funding", title: "HHS Community Health Center Grant", agency: "HRSA", amount: "$100,000 - $650,000", category: "Health & Healthcare", eligibility: "Community health organizations", deadline: "March 2026", description: "Expanding access to healthcare in underserved communities." },
  { id: 107, type: "funding", title: "DOT RAISE Grant", agency: "DOT", amount: "$1M - $25M", category: "Transport & Logistics", eligibility: "State/local governments, transit agencies", deadline: "February 2026", description: "Rebuilding American Infrastructure with Sustainability and Equity." },
  { id: 108, type: "funding", title: "Manufacturing Extension Partnership", agency: "NIST", amount: "Varies", category: "Manufacturing", eligibility: "Small-medium manufacturers", deadline: "Rolling", description: "Technical assistance for US manufacturers to compete globally." },
];

// Visa programs for study and work
export const visaPrograms = [
  { id: 1, type: "H-1B", name: "H-1B Specialty Occupation", description: "For workers in specialty occupations requiring at least a bachelor's degree. Most common work visa for IT, engineering, healthcare professionals.", duration: "3 years (renewable to 6)", eligibility: "Bachelor's degree + job offer in specialty occupation", industries: ["Information Technology", "Health & Healthcare", "Finance & Business", "Manufacturing"], annualCap: "85,000", status: "Active" },
  { id: 2, type: "F-1", name: "F-1 Student Visa", description: "For full-time students enrolled in academic programs at accredited US institutions. Allows limited on-campus work.", duration: "Duration of study", eligibility: "Admission to SEVP-certified school + financial proof", industries: ["Education"], annualCap: "Unlimited", status: "Active" },
  { id: 3, type: "OPT", name: "Optional Practical Training", description: "Temporary employment for F-1 students directly related to their major area of study. STEM OPT extends to 36 months.", duration: "12 months (36 for STEM)", eligibility: "F-1 student, completed 1 academic year", industries: ["Information Technology", "Health & Healthcare", "Manufacturing", "Agriculture"], annualCap: "N/A", status: "Active" },
  { id: 4, type: "H-2A", name: "H-2A Temporary Agricultural Workers", description: "For temporary or seasonal agricultural work. Employer must demonstrate shortage of US workers.", duration: "Up to 1 year", eligibility: "Job offer for agricultural work", industries: ["Agriculture"], annualCap: "Unlimited", status: "Active" },
  { id: 5, type: "H-2B", name: "H-2B Temporary Non-Agricultural Workers", description: "For temporary non-agricultural workers in hospitality, construction, landscaping, and other seasonal industries.", duration: "Up to 1 year", eligibility: "Temporary job offer, employer certification", industries: ["Tourism & Hospitality", "Construction", "Entertainment & Media"], annualCap: "66,000", status: "Active" },
  { id: 6, type: "J-1", name: "J-1 Exchange Visitor", description: "For cultural exchange programs including interns, trainees, teachers, and researchers.", duration: "Varies by category", eligibility: "Sponsorship by designated J-1 program", industries: ["Education", "Health & Healthcare", "Professional Services"], annualCap: "Varies", status: "Active" },
  { id: 7, type: "L-1", name: "L-1 Intracompany Transferee", description: "For employees of international companies transferring to a US office in a managerial, executive, or specialized knowledge capacity.", duration: "1-7 years", eligibility: "1+ year with company abroad", industries: ["Information Technology", "Finance & Business", "Manufacturing", "Professional Services"], annualCap: "Unlimited", status: "Active" },
  { id: 8, type: "O-1", name: "O-1 Extraordinary Ability", description: "For individuals with extraordinary ability in sciences, arts, education, business, or athletics.", duration: "Up to 3 years", eligibility: "Demonstrated extraordinary ability", industries: ["Entertainment & Media", "Information Technology", "Education", "Professional Services"], annualCap: "Unlimited", status: "Active" },
  { id: 9, type: "TN", name: "TN NAFTA Professional", description: "For Canadian and Mexican professionals in designated occupations under USMCA (formerly NAFTA).", duration: "3 years (renewable)", eligibility: "Canadian/Mexican citizen + qualifying profession", industries: ["Health & Healthcare", "Information Technology", "Finance & Business", "Professional Services"], annualCap: "Unlimited", status: "Active" },
  { id: 10, type: "E-2", name: "E-2 Treaty Investor", description: "For investors from treaty countries making a substantial investment in a US business.", duration: "2-5 years (renewable)", eligibility: "Treaty country national + substantial investment", industries: ["Commerce & Retail", "Tourism & Hospitality", "Manufacturing", "Finance & Business"], annualCap: "Unlimited", status: "Active" },
];

// Entrepreneurship program data
export const entrepreneurshipProgram = {
  title: "SuperlativeBridge Entrepreneurship Program",
  description: "Identifying and nurturing multi-sided marketplaces and gig professional platforms, providing comprehensive support to create employment opportunities across all industry verticals.",
  supports: [
    { title: "Technology", description: "Access to a white-labeled system for applications, vetting, onboarding, and user matching.", icon: "Monitor" },
    { title: "Marketing", description: "Assistance with developing and executing marketing campaigns to reach target audiences.", icon: "Megaphone" },
    { title: "Partner Network", description: "Access to a network of businesses and organizations that accelerate growth.", icon: "Network" },
    { title: "Access to Advisors", description: "Unlock expertise of business, legal, and finance advisors with templates for all needs.", icon: "Users" },
    { title: "Qualified Financing", description: "Businesses and gig workers can access qualified financing through the program.", icon: "DollarSign" },
    { title: "Mentorship", description: "Guidance from experienced entrepreneurs to avoid pitfalls and make better decisions.", icon: "GraduationCap" },
    { title: "Upskilling", description: "Content creation and training for marketplace operators and their gig workers.", icon: "TrendingUp" },
    { title: "Market Research", description: "Tailored research crafted to fit your sector and needs for strategic decision-making.", icon: "BarChart3" },
  ],
  eligibility: [
    "Registered business entity in the United States",
    "Tested idea with proof of concept",
    "Scalable business model that offers gig work opportunities",
    "An experienced team working full-time",
    "Disruptive or unique value proposition",
    "Business operating for at least 6 months",
  ],
  cohorts: [
    { number: 8, status: "Closed", applicants: 450, accepted: 15, startDate: "2025-09-01" },
    { number: 9, status: "Open", applicants: 0, accepted: 0, startDate: "2026-06-01" },
  ],
  stats: {
    startupsOnboarded: 66,
    gigWorkersRecruited: 113636,
    jobsCreated: 100786,
    youthUpskilled: 140195,
    femaleJobPercent: 40.4,
    femaleUpskilledPercent: 50.9,
  },
};

// Community hub resources
export const communityResources = [
  { id: 1, category: "Business Development", title: "Growth Hacking Strategies", description: "Proven strategies to accelerate your marketplace growth.", icon: "Target", items: 12 },
  { id: 2, category: "Marketing", title: "Digital Marketing Playbook", description: "Comprehensive guide to marketing your platform effectively.", icon: "Megaphone", items: 18 },
  { id: 3, category: "Finance", title: "Financial Planning Toolkit", description: "Templates and guides for budgeting, forecasting, and fundraising.", icon: "DollarSign", items: 9 },
  { id: 4, category: "Investment Readiness", title: "Investor Pitch Prep", description: "Prepare compelling pitches and secure funding for your venture.", icon: "TrendingUp", items: 7 },
  { id: 5, category: "Legal", title: "Legal & Compliance Guide", description: "Navigate regulations, contracts, and IP protection.", icon: "Scale", items: 14 },
  { id: 6, category: "Job Posts", title: "Opportunity Board", description: "Access a wide range of gig, freelance, and full-time opportunities.", icon: "Briefcase", items: 45 },
];
