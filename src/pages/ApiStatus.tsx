import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Activity,
  Database,
  KeyRound,
  RefreshCw,
  CheckCircle2,
  XCircle,
  BookOpen,
  Copy,
  Download,
  Pause,
  Play,
  AlertTriangle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { API_BASE_URL } from "@/lib/api";
import { useHealth } from "@/hooks/api/useHealth";
import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";

interface ProbeTarget {
  label: string;
  path: string;
  group: string;
}

const PROBES: ProbeTarget[] = [
  { label: "Health", path: "/api/health", group: "Platform" },
  { label: "Courses", path: "/api/courses", group: "Catalog" },
  { label: "Categories", path: "/api/categories", group: "Catalog" },
  { label: "Mentors", path: "/api/mentors", group: "Catalog" },
  { label: "Programs", path: "/api/programs", group: "Programs" },
  { label: "Visa Programs", path: "/api/visa-programs", group: "Programs" },
  {
    label: "Entrepreneurship",
    path: "/api/entrepreneurship",
    group: "Programs",
  },
  { label: "Marketplace", path: "/api/marketplace", group: "Community" },
  { label: "Community", path: "/api/community", group: "Community" },
  { label: "Candidates", path: "/api/candidates", group: "Employer" },
  { label: "Users", path: "/api/users", group: "Accounts" },
  { label: "Admin Stats", path: "/api/admin/stats", group: "Accounts" },
  { label: "User Analytics", path: "/api/admin/user-analytics", group: "Accounts" },
  { label: "Mentor Analytics", path: "/api/admin/mentor-analytics", group: "Accounts" },
  { label: "Notifications", path: "/api/admin/notifications", group: "Accounts" },
  { label: "Settings", path: "/api/settings", group: "Accounts" },
  { label: "Audit Log", path: "/api/admin/audit-log", group: "Accounts" },
  { label: "Integrations", path: "/api/integrations", group: "Accounts" },
  { label: "LMS Providers", path: "/api/lms/providers", group: "Accounts" },
];

interface ProbeResult {
  status: number | null;
  ms: number;
  records?: number;
  error?: string;
}

const POLL_OPTIONS = [5, 15, 30, 60];

function toYaml(value: unknown, indent = 0): string {
  const pad = "  ".repeat(indent);
  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    return value
      .map((item) => {
        const rendered = toYaml(item, indent + 1);
        return typeof item === "object" && item !== null
          ? `${pad}-\n${rendered}`
          : `${pad}- ${rendered.trim()}`;
      })
      .join("\n");
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return "{}";
    return entries
      .map(([key, val]) => {
        const safeKey = /^[A-Za-z0-9_.-]+$/.test(key)
          ? key
          : JSON.stringify(key);
        if (val && typeof val === "object") {
          const rendered = toYaml(val, indent + 1);
          return rendered === "[]" || rendered === "{}"
            ? `${pad}${safeKey}: ${rendered}`
            : `${pad}${safeKey}:\n${rendered}`;
        }
        return `${pad}${safeKey}: ${typeof val === "string" ? JSON.stringify(val) : String(val)}`;
      })
      .join("\n");
  }
  return typeof value === "string" ? JSON.stringify(value) : String(value);
}

const ApiStatus = () => {
  const { toast } = useToast();
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [pollSeconds, setPollSeconds] = useState(15);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const {
    data: health,
    isLoading: healthLoading,
    isError: healthError,
    refetch: refetchHealth,
    isFetching,
  } = useHealth();
  const [results, setResults] = useState<Record<string, ProbeResult>>({});
  const [probing, setProbing] = useState(false);

  const runProbes = useCallback(async () => {
    setProbing(true);
    const token = (() => {
      try {
        return JSON.parse(localStorage.getItem("sb_auth") ?? "{}")?.token as
          string | undefined;
      } catch {
        return undefined;
      }
    })();

    const entries = await Promise.all(
      PROBES.map(async (probe) => {
        const started = performance.now();
        try {
          const res = await fetch(`${API_BASE_URL}${probe.path}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          });
          const ms = Math.round(performance.now() - started);
          let records: number | undefined;
          try {
            const body = await res.json();
            if (Array.isArray(body)) records = body.length;
            else if (
              body &&
              typeof body === "object" &&
              Array.isArray((body as { items?: unknown[] }).items)
            )
              records = (body as { items: unknown[] }).items.length;
          } catch {
            /* non-JSON body */
          }
          return [probe.path, { status: res.status, ms, records }] as const;
        } catch (error) {
          return [
            probe.path,
            {
              status: null,
              ms: Math.round(performance.now() - started),
              error: (error as Error).message,
            },
          ] as const;
        }
      }),
    );

    setResults(Object.fromEntries(entries));
    setLastChecked(new Date());
    setProbing(false);
  }, []);

  useEffect(() => {
    void runProbes();
  }, [runProbes]);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = window.setInterval(() => {
      void refetchHealth();
      void runProbes();
    }, pollSeconds * 1000);
    return () => window.clearInterval(id);
  }, [autoRefresh, pollSeconds, refetchHealth, runProbes]);

  const base = API_BASE_URL || window.location.origin;

  const copyText = useCallback(
    async (text: string, label: string) => {
      try {
        await navigator.clipboard.writeText(text);
        toast({ title: `${label} copied`, description: text.slice(0, 120) });
      } catch {
        toast({
          title: "Copy failed",
          description: "Clipboard access was denied.",
          variant: "destructive",
        });
      }
    },
    [toast],
  );

  const curlFor = useCallback(
    (path: string) =>
      `curl -X GET "${base}${path}" \\\n  -H "Accept: application/json" \\\n  -H "Authorization: Bearer $TOKEN"`,
    [base],
  );

  const downloadSpec = useCallback(
    async (format: "json" | "yaml") => {
      try {
        const res = await fetch("/openapi.json");
        const spec = await res.json();
        const body =
          format === "json" ? JSON.stringify(spec, null, 2) : toYaml(spec);
        const blob = new Blob([body], {
          type: format === "json" ? "application/json" : "text/yaml",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `openapi.${format === "json" ? "json" : "yaml"}`;
        a.click();
        URL.revokeObjectURL(url);
      } catch {
        toast({
          title: "Download failed",
          description: "Could not read /openapi.json",
          variant: "destructive",
        });
      }
    },
    [toast],
  );

  const summary = useMemo(() => {
    const values = Object.values(results);
    const ok = values.filter((r) => r.status !== null && r.status < 400).length;
    const auth = values.filter(
      (r) => r.status === 401 || r.status === 403,
    ).length;
    const failed = values.filter(
      (r) => r.status === null || r.status >= 500,
    ).length;
    return { ok, auth, failed, total: PROBES.length };
  }, [results]);

  const statusTone = (result?: ProbeResult) => {
    if (!result) return "text-muted-foreground bg-muted";
    if (result.status === null || result.status >= 500)
      return "text-destructive bg-destructive/10";
    if (result.status === 401 || result.status === 403)
      return "text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/30";
    if (result.status >= 400)
      return "text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/30";
    return "text-emerald-600 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/30";
  };

  const grouped = useMemo(() => {
    return PROBES.reduce<Record<string, ProbeTarget[]>>((acc, probe) => {
      acc[probe.group] = [...(acc[probe.group] ?? []), probe];
      return acc;
    }, {});
  }, []);

  const dbCheck = health?.checks?.postgres ?? health?.checks?.database;
  const dbOk = dbCheck?.status === "ok";
  const jwtOk = health?.checks?.jwt?.status === "ok";

  const failures = useMemo(() => {
    const list: { label: string; detail: string }[] = [];
    if (healthError) {
      list.push({
        label: "API unreachable",
        detail: `No response from ${API_BASE_URL || window.location.origin}/api/health`,
      });
    } else if (health) {
      if (!dbOk) {
        list.push({
          label: "Postgres check failed",
          detail:
            dbCheck?.detail ??
            "The database check did not return ok.",
        });
      }
      if (!jwtOk) {
        list.push({
          label: "JWT check failed",
          detail:
            health.checks?.jwt?.detail ??
            "Sign/verify roundtrip did not return ok.",
        });
      }
    }
    PROBES.forEach((probe) => {
      const result = results[probe.path];
      if (!result) return;
      if (result.status === null || result.status >= 500) {
        list.push({
          label: `${probe.label} — GET ${probe.path}`,
          detail:
            result.error ?? `Responded ${result.status} after ${result.ms} ms`,
        });
      }
    });
    return list;
  }, [health, healthError, dbOk, dbCheck, jwtOk, results]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">
            API Status &amp; Documentation
          </h1>
          <p className="text-muted-foreground mt-1">
            Live health of Postgres and JWT, endpoint probes, and the full
            OpenAPI reference.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {lastChecked && (
            <span className="text-xs text-muted-foreground mr-1">
              Last checked {lastChecked.toLocaleTimeString()}
            </span>
          )}
          <select
            value={pollSeconds}
            onChange={(e) => setPollSeconds(Number(e.target.value))}
            className="h-10 border border-border bg-background px-2 text-sm"
            aria-label="Polling interval"
          >
            {POLL_OPTIONS.map((s) => (
              <option key={s} value={s}>
                Every {s}s
              </option>
            ))}
          </select>
          <Button variant="outline" onClick={() => setAutoRefresh((v) => !v)}>
            {autoRefresh ? (
              <Pause className="w-4 h-4 mr-2" />
            ) : (
              <Play className="w-4 h-4 mr-2" />
            )}
            {autoRefresh ? "Pause polling" : "Resume polling"}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              void refetchHealth();
              void runProbes();
            }}
            disabled={probing || isFetching}
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${probing || isFetching ? "animate-spin" : ""}`}
            />
            Re-run checks
          </Button>
        </div>
      </div>

      {failures.length > 0 && (
        <div
          role="alert"
          aria-live="assertive"
          className="border-l-4 border-destructive bg-destructive/10 p-5"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-destructive shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <h2 className="font-heading font-bold text-destructive text-lg">
                {failures.length} health check{failures.length > 1 ? "s" : ""}{" "}
                failing
              </h2>
              <p className="text-sm text-destructive/90 mt-1">
                The API is not fully healthy
                {lastChecked
                  ? ` as of ${lastChecked.toLocaleTimeString()}`
                  : ""}
                . Latest details:
              </p>
              <ul className="mt-3 space-y-2">
                {failures.map((failure) => (
                  <li key={failure.label} className="text-sm">
                    <span className="font-semibold text-destructive">
                      {failure.label}
                    </span>
                    <span className="block text-destructive/90 break-words font-mono text-xs mt-0.5">
                      {failure.detail}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    void refetchHealth();
                    void runProbes();
                  }}
                  disabled={probing || isFetching}
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 mr-2 ${probing || isFetching ? "animate-spin" : ""}`}
                  />
                  Re-check now
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    void copyText(
                      failures.map((f) => `${f.label}: ${f.detail}`).join("\n"),
                      "Failure details",
                    )
                  }
                >
                  <Copy className="w-3.5 h-3.5 mr-2" /> Copy details
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Health tiles */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-card border border-border p-5">
          <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wide mb-2">
            <Activity className="w-4 h-4 text-primary" /> API
          </div>
          {healthLoading ? (
            <Skeleton className="h-6 w-24" />
          ) : (
            <p className="text-xl font-heading font-bold text-foreground">
              {healthError ? "Unreachable" : (health?.status ?? "unknown")}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            {API_BASE_URL || window.location.origin}
          </p>
        </div>

        <div className="bg-card border border-border p-5">
          <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wide mb-2">
            <Database className="w-4 h-4 text-primary" /> Postgres
          </div>
          {healthLoading ? (
            <Skeleton className="h-6 w-24" />
          ) : (
            <p
              className={`text-xl font-heading font-bold ${dbOk ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}
            >
              {dbOk ? "Connected" : "Failing"}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1 break-words">
            {dbCheck?.detail ??
              (dbCheck?.latencyMs
                ? `${dbCheck.latencyMs} latency`
                : "—")}
          </p>
        </div>

        <div className="bg-card border border-border p-5">
          <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wide mb-2">
            <KeyRound className="w-4 h-4 text-primary" /> JWT
          </div>
          {healthLoading ? (
            <Skeleton className="h-6 w-24" />
          ) : (
            <p
              className={`text-xl font-heading font-bold ${jwtOk ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}
            >
              {jwtOk ? "Sign/verify OK" : "Failing"}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1 break-words">
            {health?.checks?.jwt?.detail ??
              (health?.checks?.jwt?.latencyMs
                ? `${health.checks.jwt.latencyMs} latency`
                : "—")}
          </p>
        </div>

        <div className="bg-card border border-border p-5">
          <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wide mb-2">
            <CheckCircle2 className="w-4 h-4 text-primary" /> Endpoint probes
          </div>
          <p className="text-xl font-heading font-bold text-foreground">
            {summary.ok}/{summary.total} passing
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {summary.auth} auth-gated · {summary.failed} failing
          </p>
        </div>
      </div>

      {/* Probe table */}
      <div className="space-y-6">
        {Object.entries(grouped).map(([group, probes]) => (
          <div key={group} className="bg-card border border-border">
            <div className="p-4 border-b border-border">
              <h2 className="font-heading font-semibold text-foreground">
                {group}
              </h2>
            </div>
            <div className="divide-y divide-border">
              {probes.map((probe) => {
                const result = results[probe.path];
                const passing =
                  result && result.status !== null && result.status < 400;
                return (
                  <div
                    key={probe.path}
                    className="p-4 flex flex-wrap items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {result ? (
                        passing ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-destructive shrink-0" />
                        )
                      ) : (
                        <Skeleton className="w-4 h-4 rounded-full" />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          {probe.label}
                        </p>
                        <code className="text-xs text-muted-foreground">
                          GET {probe.path}
                        </code>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {result?.records !== undefined && (
                        <Badge variant="secondary" className="text-xs">
                          {result.records} records
                        </Badge>
                      )}
                      {result && (
                        <span className="text-xs text-muted-foreground">
                          {result.ms} ms
                        </span>
                      )}
                      <span
                        className={`text-xs font-medium px-2 py-1 ${statusTone(result)}`}
                      >
                        {result
                          ? (result.status ?? "network error")
                          : "checking…"}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          void copyText(curlFor(probe.path), "curl request")
                        }
                        title="Copy curl request"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Swagger */}
      <div className="bg-card border border-border">
        <div className="p-4 border-b border-border flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            <h2 className="font-heading font-semibold text-foreground">
              OpenAPI Reference
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                void copyText(curlFor("/api/health"), "curl request")
              }
            >
              <Copy className="w-3.5 h-3.5 mr-2" /> Copy sample curl
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void downloadSpec("json")}
            >
              <Download className="w-3.5 h-3.5 mr-2" /> OpenAPI JSON
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void downloadSpec("yaml")}
            >
              <Download className="w-3.5 h-3.5 mr-2" /> OpenAPI YAML
            </Button>
          </div>
        </div>
        <div className="swagger-wrapper p-2">
          <SwaggerUI url="/openapi.json" docExpansion="list" tryItOutEnabled />
        </div>
      </div>
    </div>
  );
};

export default ApiStatus;
