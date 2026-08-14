import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft } from "lucide-react";
import { useUserAnalytics } from "@/hooks/api";

const UserAnalytics = () => {
  const { id } = useParams();
  const { data, isLoading, isError, refetch } = useUserAnalytics(id);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-1/3" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground mb-4">Unable to load user analytics.</p>
        <Button variant="outline" onClick={() => refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  const { user, metrics } = data;

  return (
    <div className="space-y-8">
      <div>
        <Link
          to="/admin/users"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-3"
        >
          <ChevronLeft className="w-4 h-4" /> Back to users
        </Link>
        <h1 className="text-3xl font-heading font-bold text-foreground">
          {user.name}
        </h1>
        <p className="text-muted-foreground mt-1">
          {user.email} · {user.role} · {user.location || "—"}
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Enrollments", value: metrics.enrollments },
          { label: "Completed", value: metrics.completedCourses },
          { label: "Avg progress", value: `${metrics.avgProgress}%` },
          { label: "Total XP", value: metrics.totalXP },
          { label: "Bookings", value: metrics.bookings },
          { label: "Upcoming", value: metrics.upcomingBookings },
          { label: "Certifications", value: metrics.certifications },
          { label: "Unread alerts", value: metrics.unreadNotifications },
        ].map((card) => (
          <div key={card.label} className="bg-card border border-border p-4">
            <div className="text-2xl font-heading font-bold">{card.value}</div>
            <div className="text-sm text-muted-foreground mt-1">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border p-6 space-y-4">
          <h2 className="font-heading font-semibold">Enrollments</h2>
          {data.enrollments.length === 0 && (
            <p className="text-sm text-muted-foreground">No enrollments yet.</p>
          )}
          {data.enrollments.map((e) => (
            <div key={e.id} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{e.course?.title ?? e.courseId}</span>
                <span className="text-muted-foreground">{e.progress}%</span>
              </div>
              <Progress value={e.progress} className="h-2" />
            </div>
          ))}
        </div>

        <div className="bg-card border border-border p-6 space-y-3">
          <h2 className="font-heading font-semibold">Bookings</h2>
          {data.bookings.length === 0 && (
            <p className="text-sm text-muted-foreground">No mentor bookings.</p>
          )}
          {data.bookings.map((b) => (
            <div key={b.id} className="flex items-center justify-between text-sm">
              <div>
                <div className="font-medium">{b.topic}</div>
                <div className="text-xs text-muted-foreground">
                  {b.mentor?.name} · {new Date(b.scheduledAt).toLocaleString()}
                </div>
              </div>
              <Badge variant="secondary" className="capitalize">
                {b.status}
              </Badge>
            </div>
          ))}
        </div>
      </div>

      {data.skills.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {data.skills.map((s) => (
            <Badge key={s} variant="secondary">
              {s}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserAnalytics;
