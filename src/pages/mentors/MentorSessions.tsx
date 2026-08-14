import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, Clock, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  useMentorSessionBookings,
  useUpdateMentorBookingStatus,
} from "@/hooks/api";
import type { MentorBookingStatus } from "@/types/api";

const MentorSessions = () => {
  const { user } = useAuth();
  const { data: bookings, isLoading, isError, refetch } =
    useMentorSessionBookings("me");
  const updateStatus = useUpdateMentorBookingStatus(user?.id);
  const sessions = bookings ?? [];

  return (
    <div className="w-full space-y-6">
      <div>
        <Link
          to="/mentor"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-3"
        >
          <ChevronLeft className="w-4 h-4" /> Dashboard
        </Link>
        <h1 className="text-2xl font-heading font-bold text-foreground">
          My sessions
        </h1>
        <p className="text-sm text-muted-foreground">
          All bookings where you are the mentor.
        </p>
      </div>

      {isLoading && <Skeleton className="h-32 w-full" />}
      {isError && (
        <div className="text-sm text-destructive">
          Failed to load.{" "}
          <button className="underline" onClick={() => refetch()}>
            Retry
          </button>
        </div>
      )}

      <div className="space-y-3">
        {sessions.map((b) => (
          <div
            key={b.id}
            className="border border-border bg-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div>
              <p className="font-heading font-semibold text-foreground">
                {b.topic}
              </p>
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <Users className="w-3.5 h-3.5" />
                {b.learnerName || "Learner"}
                {b.learnerEmail ? ` · ${b.learnerEmail}` : ""}
              </p>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <Clock className="w-3 h-3" />
                {new Date(b.scheduledAt).toLocaleString()} · {b.durationMinutes}{" "}
                min
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{b.status}</Badge>
              {b.status === "requested" && (
                <>
                  <Button
                    size="sm"
                    variant="hero"
                    onClick={() =>
                      updateStatus.mutate({
                        id: b.id,
                        status: "confirmed" as MentorBookingStatus,
                      })
                    }
                  >
                    Confirm
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      updateStatus.mutate({
                        id: b.id,
                        status: "cancelled" as MentorBookingStatus,
                      })
                    }
                  >
                    Decline
                  </Button>
                </>
              )}
            </div>
          </div>
        ))}
        {!isLoading && sessions.length === 0 && (
          <p className="text-sm text-muted-foreground border border-border p-6">
            No sessions yet.
          </p>
        )}
      </div>
    </div>
  );
};

export default MentorSessions;
