import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import type { Role } from "@/types/api";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: Role[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && (!role || !allowedRoles.includes(role))) {
    const home =
      role === "admin"
        ? "/admin"
        : role === "employer"
          ? "/employer/search"
          : role === "mentor"
            ? "/mentor"
            : role
              ? "/student"
              : "/";
    return <Navigate to={home} replace />;
  }


  return <>{children}</>;
}
