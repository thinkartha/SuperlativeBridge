import { useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Activity,
  ChevronDown,
  ChevronRight,
  GitBranch,
  Play,
  RefreshCw,
  Settings2,
  Timer,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { useIntegrations, useRunPipeline } from "@/hooks/api";
import type {
  Integration,
  IntegrationPipeline,
  PipelineNode,
  PipelineRun,
} from "@/types/api";

const statusClass: Record<string, string> = {
  connected: "bg-emerald-100 text-emerald-800",
  configured: "bg-amber-100 text-amber-800",
  degraded: "bg-destructive/10 text-destructive",
  success: "bg-emerald-100 text-emerald-800",
  running: "bg-primary/10 text-primary",
  failed: "bg-destructive/10 text-destructive",
  idle: "bg-muted text-muted-foreground",
  queued: "bg-muted text-muted-foreground",
};

function fmtTime(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}

function durationOf(run: PipelineRun) {
  if (!run.finishedAt) return "in progress";
  const ms =
    new Date(run.finishedAt).getTime() - new Date(run.startedAt).getTime();
  if (ms < 60000) return `${Math.round(ms / 1000)}s`;
  return `${Math.round(ms / 60000)}m`;
}

function fmtMs(ms?: number) {
  if (ms == null || Number.isNaN(ms)) return "—";
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

function dagLayers(nodes: PipelineNode[]): PipelineNode[][] {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const depth = new Map<string, number>();
  const visit = (id: string, stack: Set<string>): number => {
    if (depth.has(id)) return depth.get(id)!;
    if (stack.has(id)) return 0;
    stack.add(id);
    const node = byId.get(id);
    const deps = node?.dependsOn ?? [];
    const d =
      deps.length === 0
        ? 0
        : Math.max(...deps.map((dep) => visit(dep, stack))) + 1;
    stack.delete(id);
    depth.set(id, d);
    return d;
  };
  nodes.forEach((n) => visit(n.id, new Set()));
  const max = Math.max(0, ...[...depth.values()]);
  const layers: PipelineNode[][] = Array.from({ length: max + 1 }, () => []);
  nodes.forEach((n) => layers[depth.get(n.id) ?? 0].push(n));
  return layers;
}

function JsonBlock({ value }: { value?: Record<string, unknown> }) {
  if (!value || Object.keys(value).length === 0) {
    return (
      <p className="text-xs text-muted-foreground">No data for this run.</p>
    );
  }
  return (
    <pre className="text-xs font-mono bg-muted/40 border border-border p-3 overflow-x-auto whitespace-pre-wrap">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

const Integrations = () => {
  const { data, isLoading, isError, refetch } = useIntegrations();
  const runPipeline = useRunPipeline();
  const integrations = data?.integrations ?? [];
  const obs = data?.observability;
  const [selectedId, setSelectedId] = useState<string>("");
  const [openRun, setOpenRun] = useState<string>("");

  const selected: Integration | undefined = useMemo(() => {
    if (!integrations.length) return undefined;
    return integrations.find((i) => i.id === selectedId) ?? integrations[0];
  }, [integrations, selectedId]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground mb-4">Unable to load integrations.</p>
        <Button variant="outline" onClick={() => refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">
            Integrations & pipelines
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Airflow-style DAGs, job outputs, and run observability. Click a
            connector or pipeline to open its settings.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => refetch()}
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </Button>
      </div>

      {obs && (
        <div className="grid sm:grid-cols-2 xl:grid-cols-5 gap-3">
          <ObsStat
            icon={<GitBranch className="w-4 h-4" />}
            label="Pipelines"
            value={String(obs.totalPipelines)}
          />
          <ObsStat
            icon={<Activity className="w-4 h-4 text-primary" />}
            label="Running now"
            value={String(obs.runningJobs)}
          />
          <ObsStat
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
            label="Success (24h)"
            value={String(obs.successLast24h)}
          />
          <ObsStat
            icon={<AlertTriangle className="w-4 h-4 text-destructive" />}
            label="Failed (24h)"
            value={String(obs.failedLast24h)}
          />
          <ObsStat
            icon={<Timer className="w-4 h-4" />}
            label="Avg duration (24h)"
            value={fmtMs(obs.avgDurationMs)}
          />
        </div>
      )}

      {obs && obs.byIntegration.length > 0 && (
        <div className="border border-border bg-card overflow-x-auto">
          <div className="px-5 py-3 border-b border-border flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-heading font-semibold">
              Job observability (last 24h)
            </h2>
          </div>
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground border-b border-border">
              <tr>
                <th className="text-left font-medium px-5 py-2">Integration</th>
                <th className="text-left font-medium px-5 py-2">Pipelines</th>
                <th className="text-left font-medium px-5 py-2">Runs</th>
                <th className="text-left font-medium px-5 py-2">Failed</th>
                <th className="text-left font-medium px-5 py-2">Success rate</th>
                <th className="text-left font-medium px-5 py-2">Last run</th>
              </tr>
            </thead>
            <tbody>
              {obs.byIntegration.map((row) => (
                <tr key={row.integrationId} className="border-b border-border">
                  <td className="px-5 py-3">
                    <Link
                      to={`/admin/integrations/${row.integrationId}`}
                      className="font-medium text-foreground hover:text-primary"
                    >
                      {row.name}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {row.pipelines}
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {row.runsLast24h}
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {row.failedLast24h}
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {row.runsLast24h
                      ? `${Math.round(row.successRate24h * 100)}%`
                      : "—"}
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {row.lastRunStatus ? (
                      <span className="inline-flex items-center gap-2">
                        <span
                          className={`text-[11px] px-2 py-0.5 uppercase ${statusClass[row.lastRunStatus] ?? "bg-muted"}`}
                        >
                          {row.lastRunStatus}
                        </span>
                        <span className="text-xs">{fmtTime(row.lastRunAt)}</span>
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {integrations.map((item) => {
          const active = selected?.id === item.id;
          return (
            <div
              key={item.id}
              className={`border p-4 transition-colors ${
                active
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:bg-muted/30"
              }`}
            >
              <button
                type="button"
                onClick={() => setSelectedId(item.id)}
                className="w-full text-left"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-heading font-semibold text-foreground text-sm">
                    {item.name}
                  </span>
                  <span
                    className={`text-[11px] px-2 py-0.5 uppercase tracking-wide ${statusClass[item.status] ?? "bg-muted"}`}
                  >
                    {item.status}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  {item.category} · {item.pipelines.length} pipeline
                  {item.pipelines.length === 1 ? "" : "s"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Last sync {fmtTime(item.lastSyncAt)}
                </p>
              </button>
              <div className="mt-3 pt-3 border-t border-border">
                <Link
                  to={`/admin/integrations/${item.id}`}
                  className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                >
                  <Settings2 className="w-3.5 h-3.5" />
                  Open settings
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {selected && (
        <div className="space-y-6">
          <div className="border border-border bg-card p-5">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-2">
              <h2 className="font-heading font-semibold text-foreground">
                {selected.name}
              </h2>
              <Button variant="outline" size="sm" asChild className="gap-1.5">
                <Link to={`/admin/integrations/${selected.id}`}>
                  <Settings2 className="w-3.5 h-3.5" />
                  Integration settings
                </Link>
              </Button>
            </div>
            <p className="text-sm text-foreground leading-relaxed mb-4">
              {selected.description}
            </p>
            <div className="flex flex-wrap gap-2 text-xs">
              {Object.entries(selected.config).map(([k, v]) => (
                <Badge key={k} variant="secondary" className="font-normal">
                  {k}: {Array.isArray(v) ? v.join(", ") : String(v)}
                </Badge>
              ))}
            </div>
          </div>

          {selected.pipelines.map((pipe) => (
            <PipelineCard
              key={pipe.id}
              integrationId={selected.id}
              pipe={pipe}
              openRun={openRun}
              setOpenRun={setOpenRun}
              running={runPipeline.isPending}
              onRun={() => runPipeline.mutate(pipe.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

function ObsStat({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-muted-foreground mb-1">
        {icon}
        <span className="text-[11px] uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-2xl font-heading font-bold text-foreground">{value}</p>
    </div>
  );
}

function DagGraph({ nodes }: { nodes: PipelineNode[] }) {
  const layers = useMemo(() => dagLayers(nodes), [nodes]);
  return (
    <div className="overflow-x-auto">
      <div className="flex items-stretch gap-3 min-w-max py-1">
        {layers.map((layer, li) => (
          <div key={li} className="flex items-center gap-3">
            <div className="flex flex-col gap-2 justify-center">
              {layer.map((node) => (
                <div
                  key={node.id}
                  className="border border-border bg-card px-3 py-2 min-w-[150px]"
                  title={
                    node.dependsOn?.length
                      ? `depends on: ${node.dependsOn.join(", ")}`
                      : "root task"
                  }
                >
                  <p className="text-[10px] uppercase text-muted-foreground">
                    {node.type}
                  </p>
                  <p className="text-xs font-medium text-foreground">
                    {node.name}
                  </p>
                  {node.dependsOn?.length > 0 && (
                    <p className="text-[10px] text-muted-foreground mt-1">
                      ← {node.dependsOn.join(", ")}
                    </p>
                  )}
                </div>
              ))}
            </div>
            {li < layers.length - 1 && (
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function PipelineCard({
  integrationId,
  pipe,
  openRun,
  setOpenRun,
  running,
  onRun,
}: {
  integrationId: string;
  pipe: IntegrationPipeline;
  openRun: string;
  setOpenRun: (id: string) => void;
  running: boolean;
  onRun: () => void;
}) {
  return (
    <div className="border border-border bg-background">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-5 py-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <GitBranch className="w-4 h-4 text-primary" />
            <Link
              to={`/admin/integrations/${integrationId}/pipelines/${pipe.id}`}
              className="font-heading font-semibold text-foreground text-sm hover:text-primary"
            >
              {pipe.name}
            </Link>
            <span
              className={`text-[11px] px-2 py-0.5 uppercase ${statusClass[pipe.status] ?? "bg-muted"}`}
            >
              {pipe.status}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {pipe.kind} · {pipe.schedule} · {pipe.description}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild className="gap-1.5">
            <Link
              to={`/admin/integrations/${integrationId}/pipelines/${pipe.id}`}
            >
              <Settings2 className="w-3.5 h-3.5" /> Settings
            </Link>
          </Button>
          <Button
            size="sm"
            variant="hero"
            className="gap-1.5"
            disabled={running}
            onClick={onRun}
          >
            <Play className="w-3.5 h-3.5" /> Run now
          </Button>
        </div>
      </div>

      <div className="px-5 py-4">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-3">
          DAG ({pipe.dag.length} tasks)
        </p>
        <DagGraph nodes={pipe.dag} />
      </div>

      <div className="border-t border-border">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground px-5 pt-4 pb-2">
          Run history · outputs & metrics
        </p>
        <table className="w-full text-sm">
          <thead className="text-xs text-muted-foreground border-b border-border">
            <tr>
              <th className="text-left font-medium px-5 py-2">Build</th>
              <th className="text-left font-medium px-5 py-2">Status</th>
              <th className="text-left font-medium px-5 py-2">Trigger</th>
              <th className="text-left font-medium px-5 py-2">Started</th>
              <th className="text-left font-medium px-5 py-2">Duration</th>
              <th className="px-5 py-2" />
            </tr>
          </thead>
          <tbody>
            {pipe.recentRuns.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-4 text-muted-foreground text-sm"
                >
                  No runs yet.
                </td>
              </tr>
            )}
            {pipe.recentRuns.map((run) => {
              const open = openRun === run.id;
              return (
                <tr key={run.id} className="border-b border-border align-top">
                  <td
                    className="px-5 py-3 font-medium text-foreground"
                    colSpan={open ? 6 : undefined}
                  >
                    {!open ? (
                      <>#{run.runNumber}</>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex flex-wrap gap-6 text-sm">
                          <span className="font-medium">#{run.runNumber}</span>
                          <span
                            className={`text-[11px] px-2 py-0.5 uppercase ${statusClass[run.status] ?? "bg-muted"}`}
                          >
                            {run.status}
                          </span>
                          <span className="text-muted-foreground">
                            {run.trigger}
                          </span>
                          <span className="text-muted-foreground">
                            {fmtTime(run.startedAt)}
                          </span>
                          <span className="text-muted-foreground">
                            {durationOf(run)}
                          </span>
                          <button
                            type="button"
                            className="ml-auto text-xs text-primary"
                            onClick={() => setOpenRun("")}
                          >
                            Hide details
                          </button>
                        </div>

                        <div className="grid lg:grid-cols-2 gap-4">
                          <div>
                            <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-2">
                              Integration output
                            </p>
                            <JsonBlock value={run.outputs} />
                          </div>
                          <div>
                            <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-2">
                              Job metrics
                            </p>
                            <JsonBlock value={run.metrics} />
                          </div>
                        </div>

                        <div>
                          <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-2">
                            Task log
                          </p>
                          <ol className="space-y-2">
                            {run.steps.map((step) => (
                              <li
                                key={step.nodeId}
                                className="border border-border px-3 py-2"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-xs font-medium text-foreground">
                                    {step.name}
                                  </span>
                                  <span
                                    className={`text-[10px] px-1.5 py-0.5 uppercase ${statusClass[step.status] ?? "bg-muted"}`}
                                  >
                                    {step.status}
                                    {step.durationMs
                                      ? ` · ${Math.round(step.durationMs / 1000)}s`
                                      : ""}
                                  </span>
                                </div>
                                {step.log && (
                                  <p className="text-xs text-muted-foreground mt-1 font-mono">
                                    {step.log}
                                  </p>
                                )}
                              </li>
                            ))}
                          </ol>
                        </div>
                      </div>
                    )}
                  </td>
                  {!open && (
                    <>
                      <td className="px-5 py-3">
                        <span
                          className={`text-[11px] px-2 py-0.5 uppercase ${statusClass[run.status] ?? "bg-muted"}`}
                        >
                          {run.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {run.trigger}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {fmtTime(run.startedAt)}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {durationOf(run)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          type="button"
                          className="text-xs text-primary inline-flex items-center gap-1"
                          onClick={() => setOpenRun(run.id)}
                        >
                          Outputs <ChevronDown className="w-3 h-3" />
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Integrations;
