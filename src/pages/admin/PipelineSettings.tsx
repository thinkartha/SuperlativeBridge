import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Play, Save } from "lucide-react";
import {
  useIntegration,
  useRunPipeline,
  useUpdatePipelineSettings,
} from "@/hooks/api";
import type { PipelineNode } from "@/types/api";

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

const PipelineSettings = () => {
  const { id, pipelineId } = useParams();
  const { data, isLoading, isError } = useIntegration(id);
  const save = useUpdatePipelineSettings();
  const run = useRunPipeline();

  const pipe = data?.pipelines.find((p) => p.id === pipelineId);

  const [schedule, setSchedule] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("idle");
  const [retries, setRetries] = useState("3");
  const [timeoutMinutes, setTimeoutMinutes] = useState("45");
  const [concurrency, setConcurrency] = useState("1");
  const [alertChannel, setAlertChannel] = useState("#workforce-ops");
  const [alertOnFailure, setAlertOnFailure] = useState(true);
  const [owner, setOwner] = useState("");
  const [settingsExtra, setSettingsExtra] = useState("{}");
  const [settingsError, setSettingsError] = useState("");

  useEffect(() => {
    if (!pipe) return;
    setSchedule(pipe.schedule);
    setDescription(pipe.description);
    setStatus(pipe.status);
    const s = pipe.settings ?? {};
    setRetries(String(s.retries ?? 3));
    setTimeoutMinutes(String(s.timeoutMinutes ?? 45));
    setConcurrency(String(s.concurrency ?? 1));
    setAlertChannel(String(s.alertChannel ?? "#workforce-ops"));
    setAlertOnFailure(Boolean(s.alertOnFailure ?? true));
    setOwner(String(s.owner ?? ""));
    const known = new Set([
      "retries",
      "retryDelayMinutes",
      "timeoutMinutes",
      "concurrency",
      "alertOnFailure",
      "alertChannel",
      "owner",
      "tags",
      "testMode",
    ]);
    const rest: Record<string, unknown> = {};
    Object.entries(s).forEach(([k, v]) => {
      if (!known.has(k)) rest[k] = v;
    });
    if (s.tags) rest.tags = s.tags;
    if (s.testMode != null) rest.testMode = s.testMode;
    if (s.retryDelayMinutes != null) rest.retryDelayMinutes = s.retryDelayMinutes;
    setSettingsExtra(JSON.stringify(rest, null, 2));
  }, [pipe]);

  const layers = useMemo(() => dagLayers(pipe?.dag ?? []), [pipe]);

  const latest = pipe?.recentRuns?.[0];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !data || !pipe) {
    return (
      <div className="py-16 text-center space-y-4">
        <p className="text-muted-foreground">Pipeline not found.</p>
        <Button variant="outline" asChild>
          <Link to="/admin/integrations">Back</Link>
        </Button>
      </div>
    );
  }

  const onSave = () => {
    let extra: Record<string, unknown> = {};
    try {
      extra = JSON.parse(settingsExtra) as Record<string, unknown>;
      setSettingsError("");
    } catch {
      setSettingsError("Extra settings must be valid JSON");
      return;
    }
    save.mutate({
      pipelineId: pipe.id,
      schedule,
      description,
      status,
      settings: {
        ...extra,
        retries: Number(retries) || 0,
        timeoutMinutes: Number(timeoutMinutes) || 0,
        concurrency: Number(concurrency) || 1,
        alertOnFailure,
        alertChannel,
        owner,
      },
    });
  };

  return (
    <div className="w-full space-y-6">
      <Link
        to={`/admin/integrations/${data.id}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
      >
        <ChevronLeft className="w-4 h-4" /> {data.name} settings
      </Link>

      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
            Pipeline settings
          </p>
          <h1 className="text-2xl font-heading font-bold text-foreground">
            {pipe.name}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {pipe.kind} · {pipe.dag.length} DAG tasks
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="gap-1.5"
            disabled={run.isPending}
            onClick={() => run.mutate(pipe.id)}
          >
            <Play className="w-4 h-4" /> Run now
          </Button>
          <Button
            variant="hero"
            className="gap-1.5"
            disabled={!!settingsError || save.isPending}
            onClick={onSave}
          >
            <Save className="w-4 h-4" /> Save settings
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="border border-border bg-card p-5 space-y-4">
          <div className="space-y-2">
            <Label>Schedule</Label>
            <Input
              value={schedule}
              onChange={(e) => setSchedule(e.target.value)}
              placeholder="cron or event trigger"
            />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="success">success</SelectItem>
                <SelectItem value="running">running</SelectItem>
                <SelectItem value="failed">failed</SelectItem>
                <SelectItem value="idle">idle</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Retries</Label>
              <Input value={retries} onChange={(e) => setRetries(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Timeout (min)</Label>
              <Input
                value={timeoutMinutes}
                onChange={(e) => setTimeoutMinutes(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Concurrency</Label>
              <Input
                value={concurrency}
                onChange={(e) => setConcurrency(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Owner</Label>
            <Input value={owner} onChange={(e) => setOwner(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Alert channel</Label>
            <Input
              value={alertChannel}
              onChange={(e) => setAlertChannel(e.target.value)}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={alertOnFailure}
              onChange={(e) => setAlertOnFailure(e.target.checked)}
            />
            Alert on failure
          </label>
          <div className="space-y-2">
            <Label>Extra settings (JSON)</Label>
            <Textarea
              value={settingsExtra}
              onChange={(e) => setSettingsExtra(e.target.value)}
              rows={6}
              className="font-mono text-xs"
            />
            {settingsError && (
              <p className="text-xs text-destructive">{settingsError}</p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="border border-border bg-card p-5">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-3">
              DAG example ({pipe.dag.length} tasks)
            </p>
            <div className="overflow-x-auto">
              <div className="flex items-stretch gap-3 min-w-max">
                {layers.map((layer, li) => (
                  <div key={li} className="flex items-center gap-3">
                    <div className="flex flex-col gap-2">
                      {layer.map((node) => (
                        <div
                          key={node.id}
                          className="border border-border bg-background px-3 py-2 min-w-[150px]"
                        >
                          <p className="text-[10px] uppercase text-muted-foreground">
                            {node.type}
                          </p>
                          <p className="text-xs font-medium">{node.name}</p>
                        </div>
                      ))}
                    </div>
                    {li < layers.length - 1 && (
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="border border-border bg-card p-5 space-y-3">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Latest run output
            </p>
            {latest ? (
              <>
                <p className="text-sm text-muted-foreground">
                  #{latest.runNumber} · {latest.status} ·{" "}
                  {new Date(latest.startedAt).toLocaleString()}
                </p>
                <pre className="text-xs font-mono bg-muted/40 border border-border p-3 overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(latest.outputs ?? {}, null, 2)}
                </pre>
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground pt-2">
                  Metrics
                </p>
                <pre className="text-xs font-mono bg-muted/40 border border-border p-3 overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(latest.metrics ?? {}, null, 2)}
                </pre>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No runs yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PipelineSettings;
