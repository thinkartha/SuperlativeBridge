import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  useSettings,
  useUpdateSettings,
  useAdminNotifications,
  useMarkNotification,
} from "@/hooks/api";
import type { PlatformSettings } from "@/types/api";

const AdminSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data, isLoading, isError, refetch } = useSettings();
  const updateSettings = useUpdateSettings();
  const { data: notifData } = useAdminNotifications();
  const markNotif = useMarkNotification();
  const [form, setForm] = useState<Partial<PlatformSettings>>({});

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const setField = <K extends keyof PlatformSettings>(
    key: K,
    value: PlatformSettings[K],
  ) => setForm((p) => ({ ...p, [key]: value }));

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync(form);
      toast({ title: "Settings saved" });
    } catch (e) {
      toast({
        title: "Failed to save settings",
        description: e instanceof Error ? e.message : undefined,
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground mb-4">Unable to load settings.</p>
        <Button variant="outline" onClick={() => refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  const notifications = notifData?.notifications ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground">
          Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Platform configuration and notifications
        </p>
      </div>

      <div className="bg-card border border-border p-6 space-y-6">
        <h2 className="font-heading font-semibold text-foreground">
          Admin Account
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={user?.name ?? ""} readOnly />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={user?.email ?? ""} readOnly />
          </div>
        </div>
      </div>

      <div className="bg-card border border-border p-6 space-y-6">
        <h2 className="font-heading font-semibold text-foreground">General</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Platform Name</Label>
            <Input
              value={form.platformName ?? ""}
              onChange={(e) => setField("platformName", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Support Email</Label>
            <Input
              value={form.supportEmail ?? ""}
              onChange={(e) => setField("supportEmail", e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="bg-card border border-border p-6 space-y-4">
        <h2 className="font-heading font-semibold text-foreground">Features</h2>
        {(
          [
            [
              "allowPublicRegistration",
              "Allow public registration",
              "Anyone can create an account",
            ],
            [
              "employerSelfService",
              "Employer self-service",
              "Employers can search candidates without admin approval",
            ],
            [
              "mentorApplications",
              "Mentor applications",
              "Allow users to apply as mentors",
            ],
            [
              "courseReviews",
              "Course reviews",
              "Students can leave reviews on courses",
            ],
          ] as const
        ).map(([key, label, desc]) => (
          <div key={key} className="flex items-center justify-between">
            <div>
              <div className="font-medium text-foreground text-sm">{label}</div>
              <div className="text-xs text-muted-foreground">{desc}</div>
            </div>
            <Switch
              checked={Boolean(form[key])}
              onCheckedChange={(v) => setField(key, v)}
            />
          </div>
        ))}
      </div>

      <div className="bg-card border border-border p-6 space-y-4">
        <h2 className="font-heading font-semibold text-foreground">
          Notification preferences
        </h2>
        {(
          [
            ["notifyNewUsers", "New user registrations"],
            ["notifyEnrollments", "Course enrollments"],
            ["notifyBookings", "Mentor bookings"],
          ] as const
        ).map(([key, label]) => (
          <div key={key} className="flex items-center justify-between">
            <div className="font-medium text-foreground text-sm">{label}</div>
            <Switch
              checked={Boolean(form[key])}
              onCheckedChange={(v) => setField(key, v)}
            />
          </div>
        ))}
      </div>

      <Button
        variant="hero"
        onClick={handleSave}
        disabled={updateSettings.isPending}
      >
        {updateSettings.isPending ? "Saving…" : "Save Changes"}
      </Button>

      <div className="bg-card border border-border">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h2 className="font-heading font-semibold">Notifications</h2>
          <Badge variant="secondary">{notifData?.unread ?? 0} unread</Badge>
        </div>
        <div className="divide-y divide-border">
          {notifications.length === 0 && (
            <p className="p-8 text-sm text-center text-muted-foreground">
              No notifications yet.
            </p>
          )}
          {notifications.map((n) => (
            <div
              key={n.id}
              className="flex items-start justify-between gap-4 p-4 px-6"
            >
              <div>
                <div className="text-sm font-medium text-foreground">
                  {n.message}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {n.userName} · {n.type} ·{" "}
                  {new Date(n.createdAt).toLocaleString()}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={n.read || markNotif.isPending}
                onClick={() => markNotif.mutate({ id: n.id, read: true })}
              >
                {n.read ? "Read" : "Mark read"}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
