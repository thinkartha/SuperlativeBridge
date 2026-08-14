import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CalendarClock,
  CheckCircle2,
  Clock,
  Users,
  Bell,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  useMentorSessionBookings,
  useUpdateMentorBookingStatus,
  useStudentDashboard,
} from "@/hooks/api";
import type { MentorBookingStatus } from "@/types/api";

const MentorDashboard = () => {
  const { user } = useAuth();
  const { data: bookings, isLoading, isError, refetch } =
    useMentorSessionBookings("me");
  const { data: dash } = useStudentDashboard(user?.id);
  const updateStatus = useUpdateMentorBookingStatus(user?.id);

  const sessions = bookings ?? [];
  const upcoming = useMemo(
    () =>
      sessions
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
        ),
    [sessions],
  );
  const requested = sessions.filter((b) => b.status === "requested");
  const completed = sessions.filter((b) => b.status === "completed");
  const notifications = dash?.notifications ?? [];

  const setStatus = (id: string, status: MentorBookingStatus) => {
    updateStatus.mutate({ id, status });
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">
            Mentor dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Your sessions, requests, and learner follow-ups — not booking for
            yourself.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link to="/mentor/sessions">View all sessions</Link>
        </Button>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">
            Upcoming
          </p>
          <p className="text-3xl font-heading font-bold text-foreground mt-1">
            {upcoming.length}
          </p>
        </div>
        <div className="border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">
            Requests
          </p>
          <p className="text-3xl font-heading font-bold text-foreground mt-1">
            {requested.length}
          </p>
        </div>
        <div className="border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">
            Completed
          </p>
          <p className="text-3xl font-heading font-bold text-foreground mt-1">
            {completed.length}
          </p>
        </div>
      </div>

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      )}

      {isError && (
        <div className="border border-destructive/30 bg-destructive/10 text-destructive p-4 text-sm">
          Unable to load mentor sessions.{" "}
          <button className="underline" onClick={() => refetch()}>
            Retry
          </button>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="font-heading font-semibold text-foreground flex items-center gap-2">
            <CalendarClock className="w-4 h-4 text-primary" /> Upcoming sessions
          </h2>
          {upcoming.length === 0 && !isLoading && (
            <p className="text-sm text-muted-foreground border border-border p-5">
              No upcoming sessions. New learner requests will show here.
            </p>
          )}
          {upcoming.map((b) => (
            <div key={b.id} className="border border-border bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-heading font-semibold text-foreground">
                    {b.topic}
                  </p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    <Users className="w-3.5 h-3.5 inline mr-1" />
                    {b.learnerName || "Learner"}
                    {b.learnerEmail ? ` · ${b.learnerEmail}` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(b.scheduledAt).toLocaleString()} ·{" "}
                    {b.durationMinutes} min
                  </p>
                  {b.notes && (
                    <p className="text-sm text-foreground mt-2">{b.notes}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant="secondary">{b.status}</Badge>
                  {b.status === "requested" && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="hero"
                        onClick={() => setStatus(b.id, "confirmed")}
                      >
                        Confirm
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setStatus(b.id, "cancelled")}
                      >
                        Decline
                      </Button>
                    </div>
                  )}
                  {b.status === "confirmed" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1"
                      onClick={() => setStatus(b.id, "completed")}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Mark complete
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <h2 className="font-heading font-semibold text-foreground flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" /> Notifications
          </h2>
          <div className="border border-border bg-card divide-y divide-border">
            {notifications.length === 0 && (
              <p className="text-sm text-muted-foreground p-4">
                No notifications yet.
              </p>
            )}
            {notifications.slice(0, 8).map((n) => (
              <div key={n.id} className="p-4 text-sm">
                <p className="text-foreground">{n.message}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {n.read ? "Read" : "Unread"} · {n.type}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MentorDashboard;
