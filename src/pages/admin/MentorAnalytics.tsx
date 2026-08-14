import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, Star } from "lucide-react";
import { useMentorAnalytics } from "@/hooks/api";

const MentorAnalytics = () => {
  const { id } = useParams();
  const { data, isLoading, isError, refetch } = useMentorAnalytics(id);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground mb-4">Unable to load mentor analytics.</p>
        <Button variant="outline" onClick={() => refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  const { mentor, metrics } = data;

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            to="/admin/mentors"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-3"
          >
            <ChevronLeft className="w-4 h-4" /> Back to mentors
          </Link>
          <h1 className="text-3xl font-heading font-bold text-foreground">
            {mentor.name}
          </h1>
          <p className="text-muted-foreground mt-1">
            {mentor.email} · {mentor.vertical}
          </p>
          <p className="text-sm text-muted-foreground mt-2 max-w-2xl">{mentor.bio}</p>
        </div>
        <Link to={`/admin/mentors/${mentor.id}/edit`}>
          <Button variant="outline">Edit mentor</Button>
        </Link>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Rating", value: metrics.rating },
          { label: "Listed students", value: metrics.listedStudents },
          { label: "Total bookings", value: metrics.totalBookings },
          { label: "Upcoming", value: metrics.upcoming },
          { label: "Completed", value: metrics.completed },
          { label: "Requested", value: metrics.requested },
          { label: "Confirmed", value: metrics.confirmed },
          { label: "Cancelled", value: metrics.cancelled },
        ].map((card) => (
          <div key={card.label} className="bg-card border border-border p-4">
            <div className="text-2xl font-heading font-bold flex items-center gap-1">
              {card.label === "Rating" && (
                <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
              )}
              {card.value}
            </div>
            <div className="text-sm text-muted-foreground mt-1">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="font-heading font-semibold">Booking calendar</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-xs uppercase text-muted-foreground">
                <th className="text-left p-4">When</th>
                <th className="text-left p-4">Learner</th>
                <th className="text-left p-4">Topic</th>
                <th className="text-left p-4">Duration</th>
                <th className="text-left p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.bookings.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-sm text-muted-foreground">
                    No bookings yet.
                  </td>
                </tr>
              )}
              {data.bookings.map((b) => (
                <tr key={b.id}>
                  <td className="p-4 text-sm">
                    {new Date(b.scheduledAt).toLocaleString()}
                  </td>
                  <td className="p-4 text-sm">
                    <div className="font-medium">{b.userName}</div>
                    <div className="text-xs text-muted-foreground">{b.userEmail}</div>
                  </td>
                  <td className="p-4 text-sm">{b.topic}</td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {b.durationMinutes} min
                  </td>
                  <td className="p-4">
                    <Badge variant="secondary" className="capitalize">
                      {b.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MentorAnalytics;
