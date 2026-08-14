import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarClock, Users, Star, X } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { useAuth } from "@/contexts/AuthContext";
import { useMentors } from "@/hooks/api/useMentors";
import {
  useMentorAvailability,
  useMentorBookings,
  useCreateMentorBooking,
  useUpdateMentorBookingStatus,
} from "@/hooks/api/useMentorBookings";

const DURATIONS = [30, 45, 60] as const;

const BookMentor = () => {
  const { user } = useAuth();
  const { data: mentors, isLoading: mentorsLoading } = useMentors();
  const [mentorId, setMentorId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date(),
  );
  const [slot, setSlot] = useState<string>("");
  const [duration, setDuration] = useState<30 | 45 | 60>(45);
  const [topic, setTopic] = useState("");
  const [notes, setNotes] = useState("");

  const { data: availability, isLoading: availLoading } = useMentorAvailability(
    mentorId || undefined,
  );
  const { data: bookings, isLoading: bookingsLoading } = useMentorBookings(
    user?.id,
  );
  const createBooking = useCreateMentorBooking(user?.id);
  const updateBooking = useUpdateMentorBookingStatus(user?.id);

  const openSlots = useMemo(
    () => (availability?.slots ?? []).filter((s) => s.available),
    [availability],
  );
  const daysWithSlots = useMemo(() => {
    const set = new Set<string>();
    openSlots.forEach((s) => set.add(new Date(s.start).toDateString()));
    return set;
  }, [openSlots]);
  const slotsForDay = useMemo(() => {
    if (!selectedDate) return openSlots;
    return openSlots.filter(
      (s) => new Date(s.start).toDateString() === selectedDate.toDateString(),
    );
  }, [openSlots, selectedDate]);

  const upcoming = useMemo(
    () =>
      (bookings ?? [])
        .filter((b) => b.status !== "cancelled" && b.status !== "completed")
        .sort(
          (a, b) =>
            new Date(a.scheduledAt).getTime() -
            new Date(b.scheduledAt).getTime(),
        ),
    [bookings],
  );
  const past = useMemo(
    () =>
      (bookings ?? []).filter(
        (b) => b.status === "cancelled" || b.status === "completed",
      ),
    [bookings],
  );

  const canSubmit =
    !!mentorId && !!slot && topic.trim().length > 2 && !createBooking.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    createBooking.mutate(
      {
        mentorId,
        scheduledAt: slot,
        durationMinutes: duration,
        topic: topic.trim(),
        notes: notes.trim() || undefined,
      },
      {
        onSuccess: () => {
          setSlot("");
          setTopic("");
          setNotes("");
        },
      },
    );
  };

  const formatDateTime = (iso: string) =>
    new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });

  if (!user) {
    return (
      <div className="py-24 text-center text-muted-foreground">
        Sign in to book a mentor session.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground">
          Book a Mentor
        </h1>
        <p className="text-muted-foreground mt-1">
          Request a one-to-one session and keep track of your upcoming
          appointments.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Request form */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-3 bg-card border border-border p-6 space-y-5"
        >
          <h2 className="font-heading font-semibold text-foreground flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" /> Request a session
          </h2>

          <div className="space-y-2">
            <Label>Mentor</Label>
            {mentorsLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Select
                value={mentorId}
                onValueChange={(value) => {
                  setMentorId(value);
                  setSlot("");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a mentor" />
                </SelectTrigger>
                <SelectContent>
                  {(mentors ?? []).map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name} — {m.vertical}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {mentorId && (
            <div className="border border-border bg-muted/20 p-4 text-sm">
              {(() => {
                const m = (mentors ?? []).find((x) => x.id === mentorId);
                if (!m) return null;
                return (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">
                        {m.name}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Star className="w-3 h-3 text-primary" /> {m.rating} ·{" "}
                        {m.students} learners
                      </span>
                    </div>
                    <p className="text-muted-foreground">{m.bio}</p>
                    <div className="flex flex-wrap gap-1">
                      {m.expertise.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="text-xs"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          <div className="space-y-2">
            <Label>Pick a date and time</Label>
            {!mentorId ? (
              <p className="text-sm text-muted-foreground">
                Select a mentor to see availability.
              </p>
            ) : availLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : openSlots.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No open slots in the next two weeks.
              </p>
            ) : (
              <div className="grid gap-4 md:grid-cols-[auto,1fr]">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(day) => {
                    setSelectedDate(day);
                    setSlot("");
                  }}
                  disabled={(day) => !daysWithSlots.has(day.toDateString())}
                />
                <div className="grid grid-cols-2 gap-2 content-start max-h-64 overflow-y-auto pr-1">
                  {slotsForDay.length === 0 && (
                    <p className="col-span-2 text-sm text-muted-foreground">
                      No times on this day. Choose a highlighted date.
                    </p>
                  )}
                  {slotsForDay.map((s) => (
                    <button
                      key={s.start}
                      type="button"
                      onClick={() => setSlot(s.start)}
                      className={`border px-3 py-2 text-xs text-left transition-colors ${
                        slot === s.start
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:text-foreground hover:bg-muted/40"
                      }`}
                    >
                      {new Date(s.start).toLocaleTimeString(undefined, {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Duration</Label>
              <Select
                value={String(duration)}
                onValueChange={(v) => setDuration(Number(v) as 30 | 45 | 60)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DURATIONS.map((d) => (
                    <SelectItem key={d} value={String(d)}>
                      {d} minutes
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="topic">Topic</Label>
              <Input
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Career path in cybersecurity"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anything your mentor should prepare for?"
              rows={3}
            />
          </div>

          <Button type="submit" variant="hero" disabled={!canSubmit}>
            {createBooking.isPending ? "Requesting…" : "Request Session"}
          </Button>
        </form>

        {/* Appointments */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border">
            <div className="p-5 border-b border-border flex items-center gap-2">
              <CalendarClock className="w-5 h-5 text-primary" />
              <h2 className="font-heading font-semibold text-foreground">
                Upcoming
              </h2>
            </div>
            {bookingsLoading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : upcoming.length === 0 ? (
              <p className="p-8 text-center text-sm text-muted-foreground">
                No upcoming sessions yet.
              </p>
            ) : (
              <div className="divide-y divide-border">
                {upcoming.map((b) => (
                  <div key={b.id} className="p-4 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {b.mentor?.name ?? "Mentor"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {b.topic}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-xs capitalize">
                        {b.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-foreground">
                      {formatDateTime(b.scheduledAt)} · {b.durationMinutes} min
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                      disabled={updateBooking.isPending}
                      onClick={() =>
                        updateBooking.mutate({ id: b.id, status: "cancelled" })
                      }
                    >
                      <X className="w-3 h-3 mr-1" /> Cancel
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {past.length > 0 && (
            <div className="bg-card border border-border">
              <div className="p-5 border-b border-border">
                <h2 className="font-heading font-semibold text-foreground">
                  History
                </h2>
              </div>
              <div className="divide-y divide-border">
                {past.map((b) => (
                  <div
                    key={b.id}
                    className="p-4 flex items-center justify-between gap-2"
                  >
                    <div>
                      <p className="text-sm text-foreground">
                        {b.mentor?.name ?? "Mentor"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(b.scheduledAt)}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs capitalize">
                      {b.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookMentor;
