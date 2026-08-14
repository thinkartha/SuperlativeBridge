import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import AdminTopNav from "@/components/layouts/AdminTopNav";
import EmployerTopNav from "@/components/layouts/EmployerTopNav";
import StudentTopNav from "@/components/layouts/StudentTopNav";
import MentorTopNav from "@/components/layouts/MentorTopNav";

interface AppLayoutProps {
  children: ReactNode;
}

/** Routes that render their own full-bleed sections and must not get layout padding. */
const FULL_BLEED_ROUTES = ["/"];

export default function AppLayout({ children }: AppLayoutProps) {
  const { isAuthenticated, role } = useAuth();
  const { pathname } = useLocation();
  const fullBleed = FULL_BLEED_ROUTES.includes(pathname);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className={fullBleed ? "flex-1 w-full" : "flex-1 pt-16 pb-12 w-full px-6 lg:px-10"}>
          {children}
        </main>
        <Footer />
      </div>
    );
  }

  const TopNav =
    role === "admin"
      ? AdminTopNav
      : role === "employer"
        ? EmployerTopNav
        : role === "mentor"
          ? MentorTopNav
          : StudentTopNav;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopNav />
      <main className={fullBleed ? "flex-1 w-full" : "flex-1 w-full px-6 lg:px-8 py-6 lg:py-8"}>
        {children}
      </main>
      {fullBleed && <Footer />}
    </div>
  );
}
