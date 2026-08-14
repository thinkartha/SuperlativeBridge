export type Role = "admin" | "worker" | "employer" | "mentor";

export interface Quiz {
  id: string;
  moduleId: string;
  title: string;
  passScore: number;
  xpReward: number;
  questions: { question: string; options: string[]; answer: number | string }[];
}

export interface Module {
  id: string;
  courseId: string;
  title: string;
  order: number;
  videoUrl: string;
  duration: string;
  content: string;
  quiz?: Quiz;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  vertical: string;
  language: string;
  level: string;
  duration: string;
  students: number;
  rating: number;
  instructor: string;
  image: string;
  status: string;
  overview?: string;
  learningObjectives?: string[];
  audience?: string;
  modules?: Module[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  courseCount: number;
  status: string;
}

export interface Mentor {
  id: string;
  name: string;
  email: string;
  expertise: string[];
  vertical: string;
  bio: string;
  rating: number;
  students: number;
  status: string;
  avatar: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  vertical?: string;
  location?: string;
  phone?: string;
  bio?: string;
  avatar?: string;
  skills?: string[];
  createdAt: string;
  status: string;
}

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  progress: number;
  xp: number;
  grade?: string;
  lastModuleId?: string;
  enrolledAt: string;
  updatedAt?: string;
  course?: Course;
  completedModuleIds?: string[];
  quizAttempts?: QuizAttempt[];
}

export interface QuizAttempt {
  id: string;
  userId: string;
  quizId: string;
  enrollmentId?: string;
  score: number;
  passed: boolean;
  answers?: number[];
  createdAt: string;
}

export interface SavedCourse {
  id: string;
  userId: string;
  courseId: string;
  savedAt: string;
  course?: Course;
}

export type MentorBookingStatus = "requested" | "confirmed" | "completed" | "cancelled";

export interface MentorBooking {
  id: string;
  userId: string;
  mentorId: string;
  scheduledAt: string;
  durationMinutes: number;
  topic: string;
  notes?: string;
  status: MentorBookingStatus;
  createdAt: string;
  mentor?: Pick<Mentor, "id" | "name" | "expertise" | "avatar"> & { title?: string };
  learnerName?: string;
  learnerEmail?: string;
}

export interface MentorAvailabilitySlot {
  start: string;
  end: string;
  available: boolean;
}

export interface MentorAvailability {
  mentorId: string;
  slots: MentorAvailabilitySlot[];
}

export interface Certification {
  id: string;
  userId: string;
  name: string;
  issuer: string;
  expiresAt: string;
  status: string;
  daysLeft: number;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface Program {
  id: string;
  title: string;
  agency: string;
  description: string;
  programType: string;
  eligibility: string[];
  funding: string;
  deadline: string;
  verticals: string[];
}

export interface VisaProgram {
  id: string;
  title: string;
  visaType: string;
  category: string;
  description: string;
  eligibility: string[];
  duration: string;
  industryMatch: string[];
}

export interface MarketplaceEntry {
  id: string;
  name: string;
  vertical: string;
  description: string;
  location: string;
  founded: string;
  employees: string;
  tags: string[];
}

export interface StudentDashboard {
  stats: Record<string, unknown>;
  certifications: Certification[];
  notifications: Notification[];
  skills: string[];
  enrollments: Enrollment[];
  activity: unknown[];
}

export interface CommunityData {
  posts: unknown[];
  events: unknown[];
  groups: unknown[];
}

export interface EntrepreneurshipData {
  tracks: unknown[];
  resources: unknown[];
  stats: Record<string, unknown>;
  milestones: unknown[];
}

export interface AdminRecentUser {
  name: string;
  email: string;
  role: string;
  date: string;
}

export interface AdminStats {
  totalUsers: number;
  totalCourses: number;
  activeCourses: number;
  totalMentors: number;
  employers: number;
  completionRate: number;
  totalEnrollments: number;
  totalCandidates: number;
  usersByRole: Record<string, number>;
  coursesByStatus: Record<string, number>;
  recentUsers: AdminRecentUser[];
  [key: string]: unknown;
}

export interface UserAnalyticsRow {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: string;
  createdAt: string;
  vertical: string;
  location: string;
  enrollments: number;
  completed: number;
  avgProgress: number;
  totalXP: number;
  bookings: number;
}

export interface UserAnalyticsSummary {
  total: number;
  active: number;
  newThisMonth: number;
  byRole: Record<string, number>;
  avgEnrollments: number;
  completionRate: number;
}

export interface UserAnalyticsList {
  summary: UserAnalyticsSummary;
  users: UserAnalyticsRow[];
}

export interface UserAnalyticsDetail {
  user: User;
  metrics: {
    enrollments: number;
    completedCourses: number;
    avgProgress: number;
    totalXP: number;
    bookings: number;
    upcomingBookings: number;
    completedBookings: number;
    certifications: number;
    unreadNotifications: number;
  };
  skills: string[];
  certifications: Certification[];
  enrollments: Enrollment[];
  bookings: MentorBooking[];
  notifications: Notification[];
}

export interface MentorAnalyticsRow {
  id: string;
  name: string;
  email: string;
  vertical: string;
  rating: number;
  students: number;
  status: string;
  avatar: string;
  bookings: number;
  completed: number;
  requested: number;
  confirmed: number;
  cancelled: number;
  upcoming: number;
}

export interface MentorAnalyticsSummary {
  total: number;
  active: number;
  avgRating: number;
  totalBookings: number;
  completionRate: number;
}

export interface MentorAnalyticsList {
  summary: MentorAnalyticsSummary;
  mentors: MentorAnalyticsRow[];
}

export interface MentorAnalyticsDetail {
  mentor: Mentor;
  metrics: {
    totalBookings: number;
    upcoming: number;
    completed: number;
    requested: number;
    confirmed: number;
    cancelled: number;
    rating: number;
    listedStudents: number;
  };
  byStatus: Record<string, number>;
  bookings: Array<{
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    scheduledAt: string;
    durationMinutes: number;
    topic: string;
    notes: string;
    status: string;
    createdAt: string;
  }>;
}

export interface PlatformSettings {
  id: string;
  platformName: string;
  supportEmail: string;
  allowPublicRegistration: boolean;
  employerSelfService: boolean;
  mentorApplications: boolean;
  courseReviews: boolean;
  notifyNewUsers: boolean;
  notifyEnrollments: boolean;
  notifyBookings: boolean;
  updatedAt: string;
}

export interface AdminNotification {
  id: string;
  userId: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
  userName: string;
  userEmail: string;
}

export interface AdminNotificationList {
  unread: number;
  notifications: AdminNotification[];
}

export interface AuditLogFilters {
  table?: string;
  action?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface AuditLogItem {
  id: string;
  table: string;
  recordId: string;
  action: "INSERT" | "UPDATE" | "DELETE";
  actorId: string;
  actorEmail: string;
  oldData?: Record<string, unknown>;
  newData?: Record<string, unknown>;
  changedAt: string;
}

export interface AuditLogResponse {
  items: AuditLogItem[];
  total: number;
  page: number;
  pageSize: number;
  pages: number;
  tables: string[];
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface SignInPayload {
  email: string;
  password: string;
}

export interface SignUpPayload {
  name: string;
  email: string;
  password: string;
  role: Role;
}

export interface CoursesFilters {
  vertical?: string;
  category?: string;
  language?: string;
  status?: string;
  level?: string;
  search?: string;
}

export interface MentorsFilters {
  search?: string;
  status?: string;
}

export interface UsersFilters {
  role?: string;
  search?: string;
}

export interface ProgramsFilters {
  type?: string;
}

export interface VisaProgramsFilters {
  type?: string;
}

export interface MarketplaceFilters {
  vertical?: string;
  search?: string;
}

export interface CandidatesFilters {
  search?: string;
  skill?: string;
  vertical?: string;
  location?: string;
  education?: string;
  experience?: string;
  availability?: string;
  program?: string;
  visa?: string;
  minRating?: number | string;
  minRate?: number | string;
  maxRate?: number | string;
  openToRelocate?: string;
  sort?: string;
}

export interface Candidate {
  id: string;
  userId?: string;
  name: string;
  title: string;
  skills: string[];
  location: string;
  zip?: string;
  billingRate: number;
  vertical: string;
  education: string;
  programs: string[];
  rating: number;
  experience: string;
  bio?: string;
  email?: string;
  availability?: string;
  openToRelocate?: boolean;
  phone?: string;
  visaStatus?: string;
  lat?: number;
  lng?: number;
  resumeUrl?: string;
  resumeText?: string;
  status?: string;
  createdAt?: string;
}

export interface HealthCheck {
  status: "ok" | "fail";
  detail?: string;
  latencyMs?: string;
}

export interface HealthResponse {
  status: "ok" | "degraded";
  timestamp: string;
  checks: Record<string, HealthCheck>;
}

// ============= Employer Analytics (v1.1) =============

export interface EmployerAnalyticsFilters {
  vertical?: string;
  level?: string;
  from?: string;
  to?: string;
}

export interface EmployerAnalyticsSummary {
  totalCandidates: number;
  availableCandidates: number;
  totalEnrollments: number;
  completedEnrollments: number;
  completionRate: number;
  avgProgress: number;
}

export interface CandidatesByVertical {
  label: string;
  candidates: number;
  avgMatch: number;
}

export interface CandidatesByAvailability {
  label: string;
  count: number;
}

export interface CompletionByCourse {
  label: string;
  enrollments: number;
  completed: number;
  completionRate: number;
  avgProgress: number;
}

export interface EnrollmentTrendPoint {
  period: string;
  enrollments: number;
  completions: number;
}

export interface TopSkill {
  label: string;
  count: number;
}

export interface EmployerAnalyticsResponse {
  summary: EmployerAnalyticsSummary;
  candidatesByVertical: CandidatesByVertical[];
  candidatesByAvailability: CandidatesByAvailability[];
  completionByCourse: CompletionByCourse[];
  enrollmentTrend: EnrollmentTrendPoint[];
  topSkills: TopSkill[];
}

export type EmployerAnalyticsExportDataset = "candidates" | "completions";

export interface PipelineNode {
  id: string;
  name: string;
  type: string;
  dependsOn: string[];
}

export interface PipelineRunStep {
  nodeId: string;
  name: string;
  status: string;
  durationMs: number;
  log: string;
}

export interface PipelineRun {
  id: string;
  pipelineId: string;
  runNumber: number;
  status: string;
  trigger: string;
  startedAt: string;
  finishedAt?: string;
  steps: PipelineRunStep[];
  outputs?: Record<string, unknown>;
  metrics?: Record<string, unknown>;
}

export interface IntegrationPipeline {
  id: string;
  integrationId: string;
  name: string;
  kind: string;
  schedule: string;
  status: string;
  description: string;
  dag: PipelineNode[];
  settings?: Record<string, unknown>;
  recentRuns: PipelineRun[];
}

export interface Integration {
  id: string;
  name: string;
  slug: string;
  category: string;
  status: string;
  description: string;
  logo: string;
  config: Record<string, unknown>;
  lastSyncAt?: string;
  pipelines: IntegrationPipeline[];
}

export interface IntegrationObservabilityRow {
  integrationId: string;
  name: string;
  pipelines: number;
  runsLast24h: number;
  failedLast24h: number;
  successRate24h: number;
  lastRunStatus?: string;
  lastRunAt?: string;
}

export interface IntegrationObservability {
  totalPipelines: number;
  runningJobs: number;
  failedLast24h: number;
  successLast24h: number;
  avgDurationMs: number;
  totalRunsLast24h: number;
  byStatus: Record<string, number>;
  byIntegration: IntegrationObservabilityRow[];
}

export interface IntegrationsResponse {
  integrations: Integration[];
  observability?: IntegrationObservability;
}
