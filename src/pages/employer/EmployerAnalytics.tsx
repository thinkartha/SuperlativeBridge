import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Download,
  Users,
  UserCheck,
  GraduationCap,
  TrendingUp,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  useCategories,
  useEmployerAnalytics,
  exportEmployerAnalytics,
} from "@/hooks/api";
import type { EmployerAnalyticsExportDataset } from "@/types/api";

const LEVELS = ["Beginner", "Intermediate", "Advanced"];
const ROWS_PER_PAGE = 5;
const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(var(--muted-foreground))",
  "hsl(var(--secondary))",
];

const EmployerAnalytics = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(1);

  const vertical = searchParams.get("vertical") ?? "all";
  const level = searchParams.get("level") ?? "all";
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";

  const { data: categories } = useCategories();

  const filters = {
    vertical: vertical !== "all" ? vertical : undefined,
    level: level !== "all" ? level : undefined,
    from: from || undefined,
    to: to || undefined,
  };

  const { data, isLoading, isError, error, refetch } =
    useEmployerAnalytics(filters);

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (!value || value === "all") next.delete(key);
    else next.set(key, value);
    setSearchParams(next);
    setPage(1);
  };

  const [exporting, setExporting] =
    useState<EmployerAnalyticsExportDataset | null>(null);
  const handleExport = async (dataset: EmployerAnalyticsExportDataset) => {
    setExporting(dataset);
    try {
      await exportEmployerAnalytics(dataset, filters);
    } catch (e) {
      // surfaced via toast-less inline banner
      console.error(e);
    } finally {
      setExporting(null);
    }
  };

  const completionRows = data?.completionByCourse ?? [];
  const totalPages = Math.max(
    1,
    Math.ceil(completionRows.length / ROWS_PER_PAGE),
  );
  const pagedRows = useMemo(
    () =>
      completionRows.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE),
    [completionRows, page],
  );

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          Employer Analytics
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Candidate pipeline and course completion insights.
        </p>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-end gap-4 bg-card border border-border p-4">
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">Vertical</Label>
          <Select
            value={vertical}
            onValueChange={(v) => updateParam("vertical", v)}
          >
            <SelectTrigger className="w-48 h-10">
              <SelectValue placeholder="All Verticals" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Verticals</SelectItem>
              {(categories ?? []).map((c) => (
                <SelectItem key={c.id} value={c.name}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">Level</Label>
          <Select value={level} onValueChange={(v) => updateParam("level", v)}>
            <SelectTrigger className="w-40 h-10">
              <SelectValue placeholder="All Levels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              {LEVELS.map((l) => (
                <SelectItem key={l} value={l}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">From</Label>
          <Input
            type="date"
            className="h-10 w-40"
            value={from}
            onChange={(e) => updateParam("from", e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">To</Label>
          <Input
            type="date"
            className="h-10 w-40"
            value={to}
            onChange={(e) => updateParam("to", e.target.value)}
          />
        </div>
        <div className="flex-1" />
        <Button
          variant="outline"
          className="gap-1.5"
          disabled={exporting === "candidates"}
          onClick={() => handleExport("candidates")}
        >
          <Download className="w-4 h-4" />
          {exporting === "candidates"
            ? "Exporting..."
            : "Export Candidates CSV"}
        </Button>
        <Button
          variant="outline"
          className="gap-1.5"
          disabled={exporting === "completions"}
          onClick={() => handleExport("completions")}
        >
          <Download className="w-4 h-4" />
          {exporting === "completions"
            ? "Exporting..."
            : "Export Completions CSV"}
        </Button>
      </div>

      {isError && (
        <div className="border border-destructive/40 bg-destructive/10 text-destructive px-4 py-3 text-sm flex items-center justify-between">
          <span>
            {error instanceof Error
              ? error.message
              : "Failed to load analytics data."}
          </span>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      )}

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      )}

      {!isLoading && !isError && data && (
        <>
          {/* KPI tiles */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <KpiTile
              icon={Users}
              label="Total Candidates"
              value={data.summary.totalCandidates}
            />
            <KpiTile
              icon={UserCheck}
              label="Available Candidates"
              value={data.summary.availableCandidates}
            />
            <KpiTile
              icon={GraduationCap}
              label="Completed Enrollments"
              value={data.summary.completedEnrollments}
              sub={`of ${data.summary.totalEnrollments} total`}
            />
            <KpiTile
              icon={TrendingUp}
              label="Completion Rate"
              value={`${data.summary.completionRate}%`}
              sub={`Avg progress ${data.summary.avgProgress}%`}
            />
          </div>

          {data.candidatesByVertical.length === 0 &&
          data.candidatesByAvailability.length === 0 &&
          data.completionByCourse.length === 0 &&
          data.enrollmentTrend.length === 0 &&
          data.topSkills.length === 0 ? (
            <div className="border border-border bg-card p-10 text-center text-sm text-muted-foreground">
              No analytics data available for the selected filters.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ChartPanel title="Candidates by Vertical">
                  {data.candidatesByVertical.length ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={data.candidatesByVertical}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="hsl(var(--border))"
                        />
                        <XAxis
                          dataKey="label"
                          tick={{ fontSize: 11 }}
                          interval={0}
                          angle={-20}
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="candidates" fill="hsl(var(--primary))" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyChart />
                  )}
                </ChartPanel>

                <ChartPanel title="Availability Breakdown">
                  {data.candidatesByAvailability.length ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie
                          data={data.candidatesByAvailability}
                          dataKey="count"
                          nameKey="label"
                          outerRadius={100}
                        >
                          {data.candidatesByAvailability.map((_, idx) => (
                            <Cell
                              key={idx}
                              fill={CHART_COLORS[idx % CHART_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyChart />
                  )}
                </ChartPanel>

                <ChartPanel title="Course Completion Rate">
                  {data.completionByCourse.length ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={data.completionByCourse}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="hsl(var(--border))"
                        />
                        <XAxis
                          dataKey="label"
                          tick={{ fontSize: 11 }}
                          interval={0}
                          angle={-20}
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar
                          dataKey="completionRate"
                          fill="hsl(var(--accent))"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyChart />
                  )}
                </ChartPanel>

                <ChartPanel title="Enrollment / Completion Trend">
                  {data.enrollmentTrend.length ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <LineChart data={data.enrollmentTrend}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="hsl(var(--border))"
                        />
                        <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="enrollments"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                        />
                        <Line
                          type="monotone"
                          dataKey="completions"
                          stroke="hsl(var(--accent))"
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyChart />
                  )}
                </ChartPanel>

                <ChartPanel title="Top Skills" className="lg:col-span-2">
                  {data.topSkills.length ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={data.topSkills} layout="vertical">
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="hsl(var(--border))"
                        />
                        <XAxis type="number" tick={{ fontSize: 11 }} />
                        <YAxis
                          type="category"
                          dataKey="label"
                          width={120}
                          tick={{ fontSize: 11 }}
                        />
                        <Tooltip />
                        <Bar dataKey="count" fill="hsl(var(--primary))" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyChart />
                  )}
                </ChartPanel>
              </div>

              {/* Completion outcomes table */}
              <div className="border border-border bg-card">
                <div className="px-4 py-3 border-b border-border">
                  <h2 className="font-heading text-sm font-semibold text-foreground">
                    Course Completion Outcomes
                  </h2>
                </div>
                {completionRows.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No completion data available.
                  </div>
                ) : (
                  <>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-left text-xs text-muted-foreground">
                          <th className="px-4 py-2 font-medium">Course</th>
                          <th className="px-4 py-2 font-medium">Enrollments</th>
                          <th className="px-4 py-2 font-medium">Completed</th>
                          <th className="px-4 py-2 font-medium">
                            Completion Rate
                          </th>
                          <th className="px-4 py-2 font-medium">
                            Avg Progress
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {pagedRows.map((row) => (
                          <tr
                            key={row.label}
                            className="border-b border-border last:border-b-0"
                          >
                            <td className="px-4 py-2 text-foreground">
                              {row.label}
                            </td>
                            <td className="px-4 py-2 text-foreground">
                              {row.enrollments}
                            </td>
                            <td className="px-4 py-2 text-foreground">
                              {row.completed}
                            </td>
                            <td className="px-4 py-2 text-foreground">
                              {row.completionRate}%
                            </td>
                            <td className="px-4 py-2 text-foreground">
                              {row.avgProgress}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="flex items-center justify-between px-4 py-3 border-t border-border text-sm">
                      <span className="text-muted-foreground">
                        Page {page} of {totalPages}
                      </span>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={page <= 1}
                          onClick={() => setPage((p) => p - 1)}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={page >= totalPages}
                          onClick={() => setPage((p) => p + 1)}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

function KpiTile({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="border border-border bg-card p-4 flex flex-col gap-2">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="w-4 h-4" />
        <span className="text-xs font-medium">{label}</span>
      </div>
      <span className="text-2xl font-heading font-bold text-foreground">
        {value}
      </span>
      {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
    </div>
  );
}

function ChartPanel({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`border border-border bg-card p-4 ${className}`}>
      <h3 className="font-heading text-sm font-semibold text-foreground mb-3">
        {title}
      </h3>
      {children}
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="h-[280px] flex items-center justify-center text-sm text-muted-foreground">
      No data available.
    </div>
  );
}

export default EmployerAnalytics;
