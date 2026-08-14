import { useState } from "react";
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
import { usePrograms, useCategories } from "@/hooks/api";
import {
  Search,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Briefcase,
  Globe,
} from "lucide-react";
import { Link } from "react-router-dom";

const ITEMS_PER_PAGE = 6;

const GovPrograms = () => {
  const [activeTab, setActiveTab] = useState<"jobs" | "funding">("jobs");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState("title");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const { data: categories } = useCategories();
  const {
    data: programs,
    isLoading,
    isError,
    refetch,
  } = usePrograms({
    type: activeTab === "jobs" ? "job" : "funding",
  });

  const toggleSort = (field: string) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const allPrograms = programs ?? [];

  const filtered = allPrograms
    .filter((p) => {
      const matchSearch =
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.agency.toLowerCase().includes(search.toLowerCase());
      const matchCat =
        categoryFilter === "all" ||
        (p.verticals ?? []).includes(categoryFilter);
      return matchSearch && matchCat;
    })
    .sort((a, b) => {
      const aVal = String(a[sortField as keyof typeof a] ?? "");
      const bVal = String(b[sortField as keyof typeof b] ?? "");
      const cmp = aVal.localeCompare(bVal);
      return sortDir === "asc" ? cmp : -cmp;
    });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE,
  );

  const SortHeader = ({
    field,
    children,
  }: {
    field: string;
    children: React.ReactNode;
  }) => (
    <th
      className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer select-none hover:text-foreground transition-colors"
      onClick={() => toggleSort(field)}
    >
      <span className="inline-flex items-center gap-1">
        {children}{" "}
        <ArrowUpDown
          className={`w-3 h-3 ${sortField === field ? "text-primary" : ""}`}
        />
      </span>
    </th>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">
            Government Programs
          </h1>
          <p className="text-muted-foreground mt-1">
            US federal jobs, funding, grants, and visa programs
          </p>
        </div>
        <Link to="/visa-programs">
          <Button variant="outline">
            <Globe className="w-4 h-4 mr-1" /> Visa Programs
          </Button>
        </Link>
      </div>

      <div className="flex gap-2">
        {[
          { key: "jobs" as const, label: "Federal Jobs", icon: Briefcase },
          {
            key: "funding" as const,
            label: "Funding & Grants",
            icon: DollarSign,
          },
        ].map((tab) => (
          <Button
            key={tab.key}
            variant={activeTab === tab.key ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setActiveTab(tab.key);
              setSearch("");
              setPage(1);
              setCategoryFilter("all");
            }}
          >
            <tab.icon className="w-4 h-4 mr-1" /> {tab.label}
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search programs..."
            className="pl-9 h-10"
          />
        </div>
        <Select
          value={categoryFilter}
          onValueChange={(v) => {
            setCategoryFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-52 h-10">
            <SelectValue placeholder="All Industries" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Industries</SelectItem>
            {(categories ?? []).map((v) => (
              <SelectItem key={v.id} value={v.name}>
                {v.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading && (
        <div className="bg-card rounded-xl border border-border p-6 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      )}

      {isError && !isLoading && (
        <div className="bg-card rounded-xl border border-border py-16 text-center">
          <p className="text-muted-foreground mb-4">
            Unable to load programs right now.
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Try Again
          </Button>
        </div>
      )}

      {!isLoading && !isError && activeTab === "jobs" && (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <SortHeader field="title">Position</SortHeader>
                  <SortHeader field="agency">Agency</SortHeader>
                  <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase">
                    Verticals
                  </th>
                  <SortHeader field="funding">Funding</SortHeader>
                  <SortHeader field="deadline">Closes</SortHeader>
                  <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginated.map((job) => (
                  <tr
                    key={job.id}
                    className="hover:bg-muted/20 transition-colors"
                  >
                    <td className="p-4">
                      <div className="font-medium text-foreground text-sm">
                        {job.title}
                      </div>
                      <div className="text-xs text-muted-foreground line-clamp-1 max-w-xs">
                        {job.description}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {job.agency}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {(job.verticals ?? []).map((v) => (
                          <Badge
                            key={v}
                            variant="secondary"
                            className="text-xs"
                          >
                            {v}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {job.funding}
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {job.deadline}
                    </td>
                    <td className="p-4">
                      <Button size="sm">Apply</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No jobs found.
            </div>
          )}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Showing {(page - 1) * ITEMS_PER_PAGE + 1}–
                {Math.min(page * ITEMS_PER_PAGE, filtered.length)} of{" "}
                {filtered.length}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="w-4 h-4" /> Prev
                </Button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <Button
                    key={i}
                    variant={page === i + 1 ? "default" : "outline"}
                    size="sm"
                    className="w-8 h-8 p-0"
                    onClick={() => setPage(i + 1)}
                  >
                    {i + 1}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {!isLoading && !isError && activeTab === "funding" && (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <SortHeader field="title">Program</SortHeader>
                  <SortHeader field="agency">Agency</SortHeader>
                  <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase">
                    Verticals
                  </th>
                  <SortHeader field="funding">Amount</SortHeader>
                  <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase">
                    Eligibility
                  </th>
                  <SortHeader field="deadline">Deadline</SortHeader>
                  <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginated.map((fund) => (
                  <tr
                    key={fund.id}
                    className="hover:bg-muted/20 transition-colors"
                  >
                    <td className="p-4">
                      <div className="font-medium text-foreground text-sm">
                        {fund.title}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 max-w-xs line-clamp-2">
                        {fund.description}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {fund.agency}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {(fund.verticals ?? []).map((v) => (
                          <Badge
                            key={v}
                            variant="secondary"
                            className="text-xs"
                          >
                            {v}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 text-sm font-medium text-foreground">
                      {fund.funding}
                    </td>
                    <td className="p-4 text-sm text-muted-foreground max-w-[200px]">
                      {(fund.eligibility ?? []).join(", ")}
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {fund.deadline}
                    </td>
                    <td className="p-4">
                      <Button size="sm" variant="outline">
                        Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No funding programs found.
            </div>
          )}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Showing {(page - 1) * ITEMS_PER_PAGE + 1}–
                {Math.min(page * ITEMS_PER_PAGE, filtered.length)} of{" "}
                {filtered.length}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="w-4 h-4" /> Prev
                </Button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <Button
                    key={i}
                    variant={page === i + 1 ? "default" : "outline"}
                    size="sm"
                    className="w-8 h-8 p-0"
                    onClick={() => setPage(i + 1)}
                  >
                    {i + 1}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GovPrograms;
