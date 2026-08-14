import { Users, BookOpen, Building2, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminStats } from "@/hooks/api";

const statConfig = [
  { key: "totalUsers", title: "Total Users", icon: Users },
  { key: "activeCourses", title: "Active Courses", icon: BookOpen },
  { key: "employers", title: "Employers", icon: Building2 },
  { key: "completionRate", title: "Completion Rate", icon: TrendingUp },
];

function formatValue(key: string, value: unknown) {
  if (value === undefined || value === null) return "—";
  if (key === "completionRate") return `${value}%`;
  if (typeof value === "number") return value.toLocaleString();
  return String(value);
}

const AdminDashboard = () => {
  const { data: stats, isLoading, isError, error } = useAdminStats();
  const recentUsers =
    (stats?.recentUsers as
      | { name: string; email: string; role: string; date: string }[]
      | undefined) ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground">
          Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">
          Overview of your platform performance
        </p>
      </div>

      {isError && (
        <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-xl p-4 text-sm">
          Failed to load admin stats
          {error instanceof Error ? `: ${error.message}` : "."}
        </div>
      )}

      {/* Stats grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="bg-card rounded-xl border border-border p-6 space-y-4"
              >
                <Skeleton className="w-10 h-10 rounded-lg" />
                <Skeleton className="h-7 w-20" />
                <Skeleton className="h-4 w-28" />
              </div>
            ))
          : !isError &&
            statConfig.map((s) => (
              <div
                key={s.key}
                className="bg-card rounded-xl border border-border p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <s.icon className="w-5 h-5 text-primary" />
                  </div>
                </div>
                <div className="text-2xl font-heading font-bold text-foreground">
                  {formatValue(s.key, stats?.[s.key])}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {s.title}
                </div>
              </div>
            ))}
      </div>

      {/* Recent users */}
      <div className="bg-card rounded-xl border border-border">
        <div className="p-6 border-b border-border">
          <h2 className="text-lg font-heading font-semibold text-foreground">
            Recent Registrations
          </h2>
        </div>
        <div className="divide-y divide-border">
          {isLoading && (
            <div className="p-6 space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          )}
          {!isLoading && !isError && recentUsers.length === 0 && (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No recent registrations.
            </div>
          )}
          {!isLoading &&
            recentUsers.map((u) => (
              <div
                key={u.email}
                className="flex items-center justify-between p-4 px-6 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-heading font-semibold text-primary text-sm">
                    {u.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div>
                    <div className="font-medium text-foreground text-sm">
                      {u.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {u.email}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary font-medium">
                    {u.role}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {u.date}
                  </span>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
