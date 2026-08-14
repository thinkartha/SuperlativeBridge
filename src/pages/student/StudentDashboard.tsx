import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Award,
  Bell,
  BookOpen,
  Download,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Zap,
  BarChart3,
  CalendarClock,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  useStudentDashboard,
  useEnrollments,
  useMentorBookings,
} from "@/hooks/api";

const StudentDashboard = () => {
  const { user } = useAuth();
  const { data, isLoading, isError, refetch } = useStudentDashboard(user?.id);
  const { data: liveEnrollments } = useEnrollments(user?.id);
  const { data: bookings } = useMentorBookings(user?.id);
  const [showAllNotifs, setShowAllNotifs] = useState(false);

  const stats = data?.stats ?? {};
  const certifications = data?.certifications ?? [];
  const notifications = data?.notifications ?? [];
  const skills = data?.skills ?? [];
  const enrollments = data?.enrollments ?? [];
  const activeEnrollments = liveEnrollments?.length
    ? liveEnrollments
    : enrollments;
  const upcomingBookings = useMemo(
    () =>
      (bookings ?? [])
        .filter(
          (b) =>
            b.status !== "cancelled" &&
            b.status !== "completed" &&
            new Date(b.scheduledAt) >= new Date(),
        )
        .sort(
          (a, b) =>
            new Date(a.scheduledAt).getTime() -
            new Date(b.scheduledAt).getTime(),
        )
        .slice(0, 5),
    [bookings],
  );

  const unreadCount = notifications.filter((n) => !n.read).length;
  const displayedNotifs = showAllNotifs
    ? notifications
    : notifications.slice(0, 3);

  const handleDownload = (format: "pdf" | "docx") => {
    const link = document.createElement("a");
    const content = `Resume — ${user?.name ?? "Student"}\n\nSkills: ${skills.join(", ")}\nCertifications: ${certifications
      .filter((c) => c.status !== "expired")
      .map((c) => c.name)
      .join(", ")}`;
    const blob = new Blob([content], { type: "text/plain" });
    link.href = URL.createObjectURL(blob);
    link.download = `resume.${format === "pdf" ? "pdf" : "docx"}`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const certStatusColor = (status: string) => {
    if (status === "expired") return "text-destructive bg-destructive/10";
    if (status === "expiring")
      return "text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/30";
    return "text-emerald-600 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/30";
  };

  const certStatusLabel = (status: string) => {
    if (status === "expired") return "Expired";
    if (status === "expiring") return "Expiring Soon";
    return "Active";
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-24">
        <p className="text-muted-foreground mb-4">
          Unable to load your dashboard right now.
        </p>
        <Button variant="outline" onClick={() => refetch()}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">
            Welcome back, {user?.name ?? "GIG Worker"}
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's an overview of your learning journey
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => handleDownload("pdf")}
          >
            <Download className="w-4 h-4" /> Resume PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => handleDownload("docx")}
          >
            <FileText className="w-4 h-4" /> Resume DOCX
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Courses Completed",
            value: Number(stats.completed ?? 0),
            icon: CheckCircle2,
            color: "text-emerald-500",
          },
          {
            label: "In Progress",
            value: Number(stats.inProgress ?? 0),
            icon: BookOpen,
            color: "text-primary",
          },
          {
            label: "Total Hours",
            value: `${Number(stats.totalHours ?? 0)}h`,
            icon: Clock,
            color: "text-accent",
          },
          {
            label: "Avg Grade",
            value: `${Number(stats.avgGrade ?? 0)}%`,
            icon: TrendingUp,
            color: "text-orange-500",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-card border border-border p-5 rounded-none"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">
                {stat.label}
              </span>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <p className="text-3xl font-bold text-foreground">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Certifications */}
        <div className="lg:col-span-2 bg-card border border-border rounded-none">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              <h2 className="font-heading font-semibold text-foreground">
                Certifications
              </h2>
            </div>
            <Badge variant="secondary" className="text-xs">
              {certifications.length} total
            </Badge>
          </div>
          {certifications.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No certifications yet.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {certifications.map((cert) => (
                <div
                  key={cert.id}
                  className="p-4 flex items-center justify-between hover:bg-muted/20 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium text-foreground text-sm">
                      {cert.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {cert.issuer} · Expires {cert.expiresAt}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {cert.status === "expiring" && (
                      <AlertTriangle className="w-4 h-4 text-orange-500" />
                    )}
                    {cert.status === "expired" && (
                      <AlertTriangle className="w-4 h-4 text-destructive" />
                    )}
                    <span
                      className={`text-xs font-medium px-2.5 py-1 rounded-full ${certStatusColor(cert.status)}`}
                    >
                      {certStatusLabel(cert.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="bg-card border border-border rounded-none">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              <h2 className="font-heading font-semibold text-foreground">
                Notifications
              </h2>
            </div>
            {unreadCount > 0 && (
              <Badge className="bg-primary text-primary-foreground text-xs">
                {unreadCount} new
              </Badge>
            )}
          </div>
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No notifications.
            </div>
          ) : (
            <>
              <div className="divide-y divide-border">
                {displayedNotifs.map((n) => (
                  <div
                    key={n.id}
                    className={`p-4 transition-colors hover:bg-muted/20 ${!n.read ? "bg-primary/5" : ""}`}
                  >
                    <p
                      className={`text-sm ${!n.read ? "font-medium text-foreground" : "text-muted-foreground"}`}
                    >
                      {n.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(n.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
              {notifications.length > 3 && (
                <div className="p-3 border-t border-border">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => setShowAllNotifs(!showAllNotifs)}
                  >
                    {showAllNotifs
                      ? "Show Less"
                      : `View All (${notifications.length})`}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Skills Overview */}
        <div className="bg-card border border-border rounded-none">
          <div className="p-5 border-b border-border flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            <h2 className="font-heading font-semibold text-foreground">
              Skills Overview
            </h2>
          </div>
          {skills.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No skills recorded yet.
            </div>
          ) : (
            <div className="p-5 flex flex-wrap gap-2">
              {skills.map((skill) => (
                <Badge
                  key={skill}
                  variant="secondary"
                  className="text-sm py-1.5 px-3"
                >
                  {skill}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Active Courses */}
        <div className="bg-card border border-border rounded-none">
          <div className="p-5 border-b border-border flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              <h2 className="font-heading font-semibold text-foreground">
                Active Courses
              </h2>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/courses/my">My Courses</Link>
            </Button>
          </div>
          {activeEnrollments.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              <p className="mb-4">You haven't enrolled in any courses yet.</p>
              <Button variant="hero" size="sm" asChild>
                <Link to="/courses">Browse Catalog</Link>
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {activeEnrollments.map((enrollment) => (
                <div
                  key={enrollment.id}
                  className="p-4 hover:bg-muted/20 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-foreground text-sm">
                      {enrollment.course?.title ?? "Course"}
                    </p>
                    <Badge variant="secondary" className="text-xs">
                      {enrollment.grade ?? "—"}
                    </Badge>
                  </div>
                  <Progress
                    value={enrollment.progress}
                    className="h-1.5 mb-2"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      XP: {enrollment.xp}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-medium text-primary">
                        {enrollment.progress}%
                      </span>
                      {enrollment.courseId && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          asChild
                        >
                          <Link to={`/courses/${enrollment.courseId}`}>
                            Resume
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming mentor sessions */}
        <div className="bg-card border border-border rounded-none lg:col-span-2">
          <div className="p-5 border-b border-border flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CalendarClock className="w-5 h-5 text-primary" />
              <h2 className="font-heading font-semibold text-foreground">
                Upcoming Mentor Sessions
              </h2>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/mentors/book">Book a session</Link>
            </Button>
          </div>
          {upcomingBookings.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              <p className="mb-4">No upcoming one-to-one sessions.</p>
              <Button variant="hero" size="sm" asChild>
                <Link to="/mentors/book">Request a Mentor Session</Link>
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {upcomingBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="p-4 flex items-center justify-between gap-4"
                >
                  <div>
                    <p className="font-medium text-foreground text-sm">
                      {booking.mentor?.name ?? "Mentor"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {booking.topic}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-foreground">
                      {new Date(booking.scheduledAt).toLocaleString(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                    <Badge
                      variant="secondary"
                      className="text-xs mt-1 capitalize"
                    >
                      {booking.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
