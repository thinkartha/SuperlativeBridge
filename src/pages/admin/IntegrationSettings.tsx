import { useEffect, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle2,
  ChevronLeft,
  GitBranch,
  Loader2,
  PlugZap,
  Save,
  XCircle,
} from "lucide-react";
import {
  useIntegration,
  useUpdateIntegrationSettings,
} from "@/hooks/api";

type SfConfig = {
  org: string;
  loginUrl: string;
  apiVersion: string;
  auth: string;
  sandbox: boolean;
  connectedApp: string;
  consumerKey: string;
  username: string;
  jwtAudience: string;
  certificateAlias: string;
  objects: string;
  syncDirection: string;
  bulkApi: boolean;
  bulkBatchSize: string;
  webhookEndpoint: string;
  webhookSecretSet: boolean;
  namedCredential: string;
  integrationUserProfile: string;
  fieldMappingProfile: string;
  retryPolicy: string;
  maxRetries: string;
  timeoutSeconds: string;
  ipAllowlist: string;
};

const defaultSf = (): SfConfig => ({
  org: "",
  loginUrl: "https://login.salesforce.com",
  apiVersion: "60.0",
  auth: "OAuth 2.0 JWT Bearer",
  sandbox: false,
  connectedApp: "",
  consumerKey: "",
  username: "",
  jwtAudience: "https://login.salesforce.com",
  certificateAlias: "",
  objects: "Contact, Opportunity, Account, Certification__c",
  syncDirection: "bidirectional",
  bulkApi: true,
  bulkBatchSize: "2000",
  webhookEndpoint: "",
  webhookSecretSet: true,
  namedCredential: "",
  integrationUserProfile: "Integration User",
  fieldMappingProfile: "default_v3",
  retryPolicy: "exponential",
  maxRetries: "3",
  timeoutSeconds: "120",
  ipAllowlist: "",
});

function configToSf(cfg: Record<string, unknown>): SfConfig {
  const base = defaultSf();
  const str = (k: keyof SfConfig, fallback = "") =>
    String(cfg[k] ?? fallback);
  const arr = (k: string) =>
    Array.isArray(cfg[k]) ? (cfg[k] as string[]).join(", ") : String(cfg[k] ?? "");
  return {
    ...base,
    org: str("org"),
    loginUrl: str("loginUrl", "https://login.salesforce.com"),
    apiVersion: str("apiVersion", "60.0"),
    auth: str("auth", "OAuth 2.0 JWT Bearer"),
    sandbox: Boolean(cfg.sandbox),
    connectedApp: str("connectedApp"),
    consumerKey: str("consumerKey"),
    username: str("username"),
    jwtAudience: str("jwtAudience", "https://login.salesforce.com"),
    certificateAlias: str("certificateAlias"),
    objects: arr("objects") || base.objects,
    syncDirection: str("syncDirection", "bidirectional"),
    bulkApi: cfg.bulkApi !== false,
    bulkBatchSize: str("bulkBatchSize", "2000"),
    webhookEndpoint: str("webhookEndpoint"),
    webhookSecretSet: cfg.webhookSecretSet !== false,
    namedCredential: str("namedCredential"),
    integrationUserProfile: str("integrationUserProfile", "Integration User"),
    fieldMappingProfile: str("fieldMappingProfile", "default_v3"),
    retryPolicy: str("retryPolicy", "exponential"),
    maxRetries: str("maxRetries", "3"),
    timeoutSeconds: str("timeoutSeconds", "120"),
    ipAllowlist: arr("ipAllowlist"),
  };
}

function sfToConfig(sf: SfConfig): Record<string, unknown> {
  return {
    org: sf.org,
    loginUrl: sf.loginUrl,
    apiVersion: sf.apiVersion,
    auth: sf.auth,
    sandbox: sf.sandbox,
    connectedApp: sf.connectedApp,
    consumerKey: sf.consumerKey,
    username: sf.username,
    jwtAudience: sf.jwtAudience,
    certificateAlias: sf.certificateAlias,
    objects: sf.objects
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    syncDirection: sf.syncDirection,
    bulkApi: sf.bulkApi,
    bulkBatchSize: Number(sf.bulkBatchSize) || 2000,
    webhookEndpoint: sf.webhookEndpoint,
    webhookSecretSet: sf.webhookSecretSet,
    namedCredential: sf.namedCredential,
    integrationUserProfile: sf.integrationUserProfile,
    fieldMappingProfile: sf.fieldMappingProfile,
    retryPolicy: sf.retryPolicy,
    maxRetries: Number(sf.maxRetries) || 3,
    timeoutSeconds: Number(sf.timeoutSeconds) || 120,
    ipAllowlist: sf.ipAllowlist
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  };
}

type TestResult = {
  ok: boolean;
  latencyMs: number;
  orgId: string;
  apiVersion: string;
  userInfo: string;
  checked: string[];
  message: string;
};

const IntegrationSettings = () => {
  const { id } = useParams();
  const { data, isLoading, isError } = useIntegration(id);
  const save = useUpdateIntegrationSettings(id);
  const [status, setStatus] = useState("connected");
  const [description, setDescription] = useState("");
  const [configText, setConfigText] = useState("{}");
  const [sf, setSf] = useState<SfConfig>(defaultSf());
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  const isSalesforce = data?.slug === "salesforce";

  useEffect(() => {
    if (!data) return;
    setStatus(data.status);
    setDescription(data.description);
    setConfigText(JSON.stringify(data.config ?? {}, null, 2));
    if (data.slug === "salesforce") {
      setSf(configToSf(data.config ?? {}));
    }
    setTestResult(null);
  }, [data]);

  const pipelines = data?.pipelines ?? [];

  let parsedConfig: Record<string, unknown> | null = null;
  let liveConfigError = "";
  if (isSalesforce) {
    parsedConfig = sfToConfig(sf);
  } else {
    try {
      parsedConfig = JSON.parse(configText) as Record<string, unknown>;
    } catch {
      liveConfigError = "Config must be valid JSON";
    }
  }

  const runTestConnection = async () => {
    if (!isSalesforce) return;
    setTesting(true);
    setTestResult(null);
    await new Promise((r) => setTimeout(r, 1400));
    const ok = Boolean(sf.org && sf.username && sf.consumerKey);
    const result: TestResult = ok
      ? {
          ok: true,
          latencyMs: 312 + Math.floor(Math.random() * 180),
          orgId: "00D5g000000DEMO",
          apiVersion: sf.apiVersion || "60.0",
          userInfo: sf.username || "integrations@superlativebridge.com",
          checked: [
            "Login host reachable",
            "JWT audience accepted",
            "Connected App authorized",
            "Integration user profile OK",
            `Objects readable: ${(sf.objects || "Contact").split(",")[0].trim()}`,
            sf.bulkApi ? "Bulk API 2.0 enabled" : "REST API only",
          ],
          message: `Connected to ${sf.org || "Salesforce org"} successfully (mock).`,
        }
      : {
          ok: false,
          latencyMs: 890,
          orgId: "—",
          apiVersion: sf.apiVersion || "60.0",
          userInfo: sf.username || "—",
          checked: [
            "Login host reachable",
            "Missing org, username, or consumer key",
          ],
          message:
            "Mock test failed — fill Org, Username, and Consumer Key, then try again.",
        };
    setTestResult(result);
    setTesting(false);
    if (parsedConfig) {
      save.mutate({
        config: {
          ...parsedConfig,
          lastConnectionTest: new Date().toISOString(),
          lastConnectionStatus: result.ok ? "success" : "failed",
        },
        status: result.ok ? "connected" : status,
        description,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="py-16 text-center space-y-4">
        <p className="text-muted-foreground">Integration not found.</p>
        <Button variant="outline" asChild>
          <Link to="/admin/integrations">Back</Link>
        </Button>
      </div>
    );
  }

  const setSfField =
    (key: keyof SfConfig) =>
    (value: string | boolean) =>
      setSf((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="w-full space-y-6">
      <Link
        to="/admin/integrations"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
      >
        <ChevronLeft className="w-4 h-4" /> Back to integrations
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
            Integration settings
          </p>
          <h1 className="text-2xl font-heading font-bold text-foreground">
            {data.name}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {data.category} · slug <span className="font-mono">{data.slug}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isSalesforce && (
            <Button
              variant="outline"
              className="gap-1.5"
              disabled={testing}
              onClick={runTestConnection}
            >
              {testing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <PlugZap className="w-4 h-4" />
              )}
              {testing ? "Testing…" : "Test connection"}
            </Button>
          )}
          <Button
            variant="hero"
            className="gap-1.5"
            disabled={!!liveConfigError || save.isPending}
            onClick={() => {
              if (!parsedConfig) return;
              save.mutate({
                config: parsedConfig,
                status,
                description,
              });
            }}
          >
            <Save className="w-4 h-4" /> Save settings
          </Button>
        </div>
      </div>

      {testResult && (
        <div
          className={`border p-5 ${
            testResult.ok
              ? "border-emerald-500/40 bg-emerald-500/5"
              : "border-destructive/40 bg-destructive/5"
          }`}
        >
          <div className="flex items-start gap-3">
            {testResult.ok ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            )}
            <div className="min-w-0 flex-1 space-y-3">
              <div>
                <p className="font-heading font-semibold text-foreground">
                  {testResult.ok
                    ? "Connection successful (mock)"
                    : "Connection failed (mock)"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {testResult.message}
                </p>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                <div className="border border-border bg-card/80 p-3">
                  <p className="text-[11px] uppercase text-muted-foreground">
                    Latency
                  </p>
                  <p className="font-medium text-foreground">
                    {testResult.latencyMs} ms
                  </p>
                </div>
                <div className="border border-border bg-card/80 p-3">
                  <p className="text-[11px] uppercase text-muted-foreground">
                    Org Id
                  </p>
                  <p className="font-medium text-foreground font-mono text-xs">
                    {testResult.orgId}
                  </p>
                </div>
                <div className="border border-border bg-card/80 p-3">
                  <p className="text-[11px] uppercase text-muted-foreground">
                    API
                  </p>
                  <p className="font-medium text-foreground">
                    v{testResult.apiVersion}
                  </p>
                </div>
                <div className="border border-border bg-card/80 p-3">
                  <p className="text-[11px] uppercase text-muted-foreground">
                    User
                  </p>
                  <p className="font-medium text-foreground truncate text-xs">
                    {testResult.userInfo}
                  </p>
                </div>
              </div>
              <ul className="space-y-1">
                {testResult.checked.map((c) => (
                  <li
                    key={c}
                    className="text-xs text-muted-foreground flex items-center gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="border border-border bg-card p-5 space-y-4">
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="connected">connected</SelectItem>
                <SelectItem value="configured">configured</SelectItem>
                <SelectItem value="degraded">degraded</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
            />
          </div>
        </div>

        {!isSalesforce && (
          <div className="border border-border bg-card p-5 space-y-2">
            <Label>Connector config (JSON)</Label>
            <Textarea
              value={configText}
              onChange={(e) => setConfigText(e.target.value)}
              rows={14}
              className="font-mono text-xs"
            />
            {liveConfigError && (
              <p className="text-xs text-destructive">{liveConfigError}</p>
            )}
          </div>
        )}

        {isSalesforce && (
          <div className="border border-border bg-card p-5 space-y-4 lg:col-span-1">
            <div>
              <h2 className="text-sm font-heading font-semibold text-foreground">
                Salesforce connection
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Org login, JWT connected app, and sync options used by CRM
                pipelines.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Org (my.salesforce.com)">
                <Input
                  value={sf.org}
                  onChange={(e) => setSfField("org")(e.target.value)}
                />
              </Field>
              <Field label="Login URL">
                <Input
                  value={sf.loginUrl}
                  onChange={(e) => setSfField("loginUrl")(e.target.value)}
                />
              </Field>
              <Field label="API version">
                <Input
                  value={sf.apiVersion}
                  onChange={(e) => setSfField("apiVersion")(e.target.value)}
                />
              </Field>
              <Field label="Auth method">
                <Input
                  value={sf.auth}
                  onChange={(e) => setSfField("auth")(e.target.value)}
                />
              </Field>
              <Field label="Connected app">
                <Input
                  value={sf.connectedApp}
                  onChange={(e) => setSfField("connectedApp")(e.target.value)}
                />
              </Field>
              <Field label="Consumer key">
                <Input
                  value={sf.consumerKey}
                  onChange={(e) => setSfField("consumerKey")(e.target.value)}
                />
              </Field>
              <Field label="Integration username">
                <Input
                  value={sf.username}
                  onChange={(e) => setSfField("username")(e.target.value)}
                />
              </Field>
              <Field label="JWT audience">
                <Input
                  value={sf.jwtAudience}
                  onChange={(e) => setSfField("jwtAudience")(e.target.value)}
                />
              </Field>
              <Field label="Certificate alias">
                <Input
                  value={sf.certificateAlias}
                  onChange={(e) =>
                    setSfField("certificateAlias")(e.target.value)
                  }
                />
              </Field>
              <Field label="Named credential">
                <Input
                  value={sf.namedCredential}
                  onChange={(e) =>
                    setSfField("namedCredential")(e.target.value)
                  }
                />
              </Field>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={sf.sandbox}
                onCheckedChange={(v) => setSfField("sandbox")(!!v)}
              />
              Sandbox org
            </label>
          </div>
        )}
      </div>

      {isSalesforce && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="border border-border bg-card p-5 space-y-4">
            <h2 className="text-sm font-heading font-semibold">
              Sync & objects
            </h2>
            <Field label="Objects (comma-separated)">
              <Input
                value={sf.objects}
                onChange={(e) => setSfField("objects")(e.target.value)}
              />
            </Field>
            <Field label="Sync direction">
              <Select
                value={sf.syncDirection}
                onValueChange={(v) => setSfField("syncDirection")(v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bidirectional">bidirectional</SelectItem>
                  <SelectItem value="outbound">outbound</SelectItem>
                  <SelectItem value="inbound">inbound</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Field mapping profile">
              <Input
                value={sf.fieldMappingProfile}
                onChange={(e) =>
                  setSfField("fieldMappingProfile")(e.target.value)
                }
              />
            </Field>
            <Field label="Integration user profile">
              <Input
                value={sf.integrationUserProfile}
                onChange={(e) =>
                  setSfField("integrationUserProfile")(e.target.value)
                }
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Bulk batch size">
                <Input
                  value={sf.bulkBatchSize}
                  onChange={(e) => setSfField("bulkBatchSize")(e.target.value)}
                />
              </Field>
              <label className="flex items-center gap-2 text-sm pt-7">
                <Checkbox
                  checked={sf.bulkApi}
                  onCheckedChange={(v) => setSfField("bulkApi")(!!v)}
                />
                Bulk API 2.0
              </label>
            </div>
          </div>

          <div className="border border-border bg-card p-5 space-y-4">
            <h2 className="text-sm font-heading font-semibold">
              Webhooks & reliability
            </h2>
            <Field label="Webhook endpoint">
              <Input
                value={sf.webhookEndpoint}
                onChange={(e) => setSfField("webhookEndpoint")(e.target.value)}
              />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={sf.webhookSecretSet}
                onCheckedChange={(v) => setSfField("webhookSecretSet")(!!v)}
              />
              Webhook secret configured
            </label>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Retry policy">
                <Input
                  value={sf.retryPolicy}
                  onChange={(e) => setSfField("retryPolicy")(e.target.value)}
                />
              </Field>
              <Field label="Max retries">
                <Input
                  value={sf.maxRetries}
                  onChange={(e) => setSfField("maxRetries")(e.target.value)}
                />
              </Field>
              <Field label="Timeout (sec)">
                <Input
                  value={sf.timeoutSeconds}
                  onChange={(e) =>
                    setSfField("timeoutSeconds")(e.target.value)
                  }
                />
              </Field>
            </div>
            <Field label="IP allowlist (comma-separated)">
              <Input
                value={sf.ipAllowlist}
                onChange={(e) => setSfField("ipAllowlist")(e.target.value)}
              />
            </Field>
          </div>
        </div>
      )}

      <div className="border border-border bg-card">
        <div className="px-5 py-3 border-b border-border">
          <h2 className="text-sm font-heading font-semibold">Pipelines</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Open a pipeline to edit schedule, retries, alerts, and view its DAG.
          </p>
        </div>
        <ul className="divide-y divide-border">
          {pipelines.map((p) => (
            <li
              key={p.id}
              className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-start gap-2 min-w-0">
                <GitBranch className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {p.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {p.kind} · {p.schedule} · {p.dag.length} DAG tasks ·{" "}
                    {p.status}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link to={`/admin/integrations/${data.id}/pipelines/${p.id}`}>
                  Pipeline settings
                </Link>
              </Button>
            </li>
          ))}
          {pipelines.length === 0 && (
            <li className="px-5 py-6 text-sm text-muted-foreground">
              No pipelines on this connector.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

export default IntegrationSettings;
