import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Search, Shield } from "lucide-react";
import { useAuditLog } from "@/hooks/api";

const PAGE_SIZE = 20;

const actionColor: Record<string, string> = {
  INSERT: "bg-emerald-100 text-emerald-700",
  UPDATE: "bg-amber-100 text-amber-800",
  DELETE: "bg-destructive/10 text-destructive",
};

function summaryOf(item: {
  action: string;
  newData?: Record<string, unknown>;
  oldData?: Record<string, unknown>;
}) {
  const data = item.newData ?? item.oldData ?? {};
  const label =
    (data.title as string) ||
    (data.name as string) ||
    (data.email as string) ||
    (data.topic as string) ||
    (data.message as string);
  return label || "—";
}

const AuditLog = () => {
  const [params, setParams] = useSearchParams();
  const table = params.get("table") ?? "all";
  const action = params.get("action") ?? "all";
  const search = params.get("q") ?? "";
  const page = Math.max(1, Number(params.get("page") ?? "1"));

  const filters = useMemo(
    () => ({
      table: table === "all" ? undefined : table,
      action: action === "all" ? undefined : action,
      search: search || undefined,
      page,
      pageSize: PAGE_SIZE,
    }),
    [table, action, search, page],
  );

  const { data, isLoading, isError, error, refetch } = useAuditLog(filters);

  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (!value || value === "all") next.delete(key);
    else next.set(key, value);
    next.delete("page");
    setParams(next);
  };

  const setPage = (nextPage: number) => {
    const next = new URLSearchParams(params);
    if (nextPage <= 1) next.delete("page");
    else next.set("page", String(nextPage));
    setParams(next);
  };

  const items = data?.items ?? [];
  const tables = data?.tables ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground flex items-center gap-2">
          <Shield className="w-7 h-7 text-primary" />
          Audit log
        </h1>
        <p className="text-muted-foreground mt-1">
          Every insert, update, and delete across the platform. Passwords are
          never stored here.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9 h-10"
            placeholder="Search table, email, record…"
            defaultValue={search}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setFilter("q", (e.target as HTMLInputElement).value);
              }
            }}
          />
        </div>
        <Select value={table} onValueChange={(v) => setFilter("table", v)}>
          <SelectTrigger className="w-52 h-10">
            <SelectValue placeholder="All tables" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All tables</SelectItem>
            {tables.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={action} onValueChange={(v) => setFilter("action", v)}>
          <SelectTrigger className="w-40 h-10">
            <SelectValue placeholder="All actions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All actions</SelectItem>
            <SelectItem value="INSERT">INSERT</SelectItem>
            <SelectItem value="UPDATE">UPDATE</SelectItem>
            <SelectItem value="DELETE">DELETE</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isError && (
        <div className="bg-destructive/10 border border-destructive/30 text-destructive p-4 text-sm">
          Failed to load audit log
          {error instanceof Error ? `: ${error.message}` : "."}
          <Button variant="outline" size="sm" className="ml-3" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      )}

      <div className="bg-card border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-xs uppercase text-muted-foreground">
                <th className="text-left p-4">When</th>
                <th className="text-left p-4">Action</th>
                <th className="text-left p-4">Table</th>
                <th className="text-left p-4">Summary</th>
                <th className="text-left p-4">Actor</th>
                <th className="text-left p-4">Record</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading &&
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td className="p-4" colSpan={6}>
                      <Skeleton className="h-8 w-full" />
                    </td>
                  </tr>
                ))}
              {!isLoading && items.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-sm text-muted-foreground">
                    No audit events match these filters.
                  </td>
                </tr>
              )}
              {!isLoading &&
                items.map((item) => (
                  <tr key={item.id} className="align-top">
                    <td className="p-4 text-sm whitespace-nowrap">
                      {new Date(item.changedAt).toLocaleString()}
                    </td>
                    <td className="p-4">
                      <span
                        className={`text-xs px-2 py-1 font-medium ${actionColor[item.action] ?? "bg-muted"}`}
                      >
                        {item.action}
                      </span>
                    </td>
                    <td className="p-4 text-sm font-medium">{item.table}</td>
                    <td className="p-4 text-sm">
                      <div>{summaryOf(item)}</div>
                      <details className="mt-1">
                        <summary className="text-xs text-muted-foreground cursor-pointer">
                          View payload
                        </summary>
                        <pre className="mt-2 text-xs bg-muted/40 p-3 overflow-x-auto max-w-xl whitespace-pre-wrap">
                          {JSON.stringify(
                            { old: item.oldData, new: item.newData },
                            null,
                            2,
                          )}
                        </pre>
                      </details>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {item.actorEmail || "system"}
                    </td>
                    <td className="p-4 text-xs text-muted-foreground font-mono">
                      {item.recordId.slice(0, 8)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-border">
          <p className="text-sm text-muted-foreground">
            {data ? `${data.total} events` : "—"}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="h-8 gap-1"
            >
              <ChevronLeft className="w-4 h-4" /> Prev
            </Button>
            <Badge variant="secondary">
              {page} / {Math.max(1, data?.pages ?? 1)}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= (data?.pages ?? 1)}
              onClick={() => setPage(page + 1)}
              className="h-8 gap-1"
            >
              Next <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLog;
