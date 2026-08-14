import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import AppLayout from "@/components/layouts/AppLayout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index.tsx";
import SignIn from "./pages/SignIn.tsx";
import SignUp from "./pages/SignUp.tsx";
import AdminDashboard from "./pages/admin/AdminDashboard.tsx";
import ManageUsers from "./pages/admin/ManageUsers.tsx";
import ManageCourses from "./pages/admin/ManageCourses.tsx";
import CourseForm from "./pages/admin/CourseForm.tsx";
import ManageCategories from "./pages/admin/ManageCategories.tsx";
import CategoryForm from "./pages/admin/CategoryForm.tsx";
import ManageMentors from "./pages/admin/ManageMentors.tsx";
import MentorForm from "./pages/admin/MentorForm.tsx";
import AdminSettings from "./pages/admin/AdminSettings.tsx";
import AuditLog from "./pages/admin/AuditLog.tsx";
import Integrations from "./pages/admin/Integrations.tsx";
import IntegrationSettings from "./pages/admin/IntegrationSettings.tsx";
import PipelineSettings from "./pages/admin/PipelineSettings.tsx";
import CourseCatalog from "./pages/courses/CourseCatalog.tsx";
import CourseDetail from "./pages/courses/CourseDetail.tsx";
import CandidateSearch from "./pages/employer/CandidateSearch.tsx";
import CandidateProfile from "./pages/employer/CandidateProfile.tsx";
import EmployerAnalytics from "./pages/employer/EmployerAnalytics.tsx";
import UserProfile from "./pages/profile/UserProfile.tsx";
import GovPrograms from "./pages/programs/GovPrograms.tsx";
import EntrepreneurshipProgram from "./pages/programs/EntrepreneurshipProgram.tsx";
import CommunityHub from "./pages/programs/CommunityHub.tsx";
import MarketplaceDirectory from "./pages/programs/MarketplaceDirectory.tsx";
import VisaPrograms from "./pages/programs/VisaPrograms.tsx";
import StudentDashboard from "./pages/student/StudentDashboard.tsx";
import UserAnalytics from "./pages/admin/UserAnalytics.tsx";
import MentorAnalytics from "./pages/admin/MentorAnalytics.tsx";
import MyCourses from "./pages/courses/MyCourses.tsx";
import BookMentor from "./pages/mentors/BookMentor.tsx";
import MentorDashboard from "./pages/mentors/MentorDashboard.tsx";
import MentorSessions from "./pages/mentors/MentorSessions.tsx";
import ApiStatus from "./pages/ApiStatus.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppLayout>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/signin" element={<SignIn />} />
              <Route path="/signup" element={<SignUp />} />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <UserProfile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student"
                element={
                  <ProtectedRoute allowedRoles={["worker"]}>
                    <StudentDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/mentor"
                element={
                  <ProtectedRoute allowedRoles={["mentor"]}>
                    <MentorDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/mentor/sessions"
                element={
                  <ProtectedRoute allowedRoles={["mentor"]}>
                    <MentorSessions />
                  </ProtectedRoute>
                }
              />
              <Route path="/programs" element={<GovPrograms />} />
              <Route path="/entrepreneurship" element={<EntrepreneurshipProgram />} />
              <Route path="/community" element={<CommunityHub />} />
              <Route path="/marketplace" element={<MarketplaceDirectory />} />
              <Route path="/visa-programs" element={<VisaPrograms />} />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <ManageUsers />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/users/:id"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <UserAnalytics />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/courses"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <ManageCourses />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/courses/new"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <CourseForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/courses/:id/edit"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <CourseForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/categories"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <ManageCategories />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/categories/new"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <CategoryForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/mentors"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <ManageMentors />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/mentors/new"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <MentorForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/mentors/:id/edit"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <MentorForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/mentors/:id"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <MentorAnalytics />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/settings"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <AdminSettings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/audit"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <AuditLog />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/integrations"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <Integrations />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/integrations/:id"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <IntegrationSettings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/integrations/:id/pipelines/:pipelineId"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <PipelineSettings />
                  </ProtectedRoute>
                }
              />
              <Route path="/system/api-docs" element={<ApiStatus />} />
              <Route path="/courses" element={<CourseCatalog />} />
              <Route
                path="/courses/my"
                element={
                  <ProtectedRoute>
                    <MyCourses />
                  </ProtectedRoute>
                }
              />
              <Route path="/courses/:id" element={<CourseDetail />} />
              <Route
                path="/mentors/book"
                element={
                  <ProtectedRoute allowedRoles={["worker"]}>
                    <BookMentor />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/employer/search"
                element={
                  <ProtectedRoute allowedRoles={["employer"]}>
                    <CandidateSearch />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/employer/candidate/:id"
                element={
                  <ProtectedRoute allowedRoles={["employer"]}>
                    <CandidateProfile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/employer/analytics"
                element={
                  <ProtectedRoute allowedRoles={["employer"]}>
                    <EmployerAnalytics />
                  </ProtectedRoute>
                }
              />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppLayout>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
