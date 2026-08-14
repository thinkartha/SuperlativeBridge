import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useMarketplace, useCategories } from "@/hooks/api";
import {
  Search,
  Users,
  Building2,
  ChevronLeft,
  ChevronRight,
  MapPin,
} from "lucide-react";
import type { MarketplaceEntry } from "@/types/api";

const ITEMS_PER_PAGE = 9;

const MarketplaceDirectory = () => {
  const [search, setSearch] = useState("");
  const [sectorFilter, setSectorFilter] = useState("all");
  const [sortField] = useState("name");
  const [sortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [selectedGpm, setSelectedGpm] = useState<MarketplaceEntry | null>(null);

  const { data: categories } = useCategories();
  const {
    data: entries,
    isLoading,
    isError,
    refetch,
  } = useMarketplace({
    search: search || undefined,
    vertical: sectorFilter !== "all" ? sectorFilter : undefined,
  });

  const allEntries = entries ?? [];
  const sectors = [
    "all",
    ...Array.from(new Set(allEntries.map((g) => g.vertical))),
  ];

  const filtered = allEntries.sort((a, b) => {
    const aVal = a[sortField as keyof typeof a] ?? "";
    const bVal = b[sortField as keyof typeof b] ?? "";
    const cmp = String(aVal).localeCompare(String(bVal));
    return sortDir === "asc" ? cmp : -cmp;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground">
          Marketplace Directory
        </h1>
        <p className="text-muted-foreground mt-1">
          Discover {allEntries.length} startups and marketplaces across{" "}
          {categories?.length ?? 0} industry verticals
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search marketplaces..."
            className="pl-9"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {sectors.map((s) => (
          <Button
            key={s}
            variant={sectorFilter === s ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setSectorFilter(s);
              setPage(1);
            }}
            className="text-xs"
          >
            {s === "all" ? "All Sectors" : s}
          </Button>
        ))}
      </div>

      {isLoading && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))}
        </div>
      )}

      {isError && !isLoading && (
        <div className="bg-card rounded-xl border border-border py-16 text-center">
          <p className="text-muted-foreground mb-4">
            Unable to load the marketplace directory right now.
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Try Again
          </Button>
        </div>
      )}

      {!isLoading && !isError && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginated.map((gpm) => (
            <div
              key={gpm.id}
              className="bg-card rounded-xl border border-border p-6 hover:border-primary/30 transition-colors cursor-pointer group"
              onClick={() =>
                setSelectedGpm(selectedGpm?.id === gpm.id ? null : gpm)
              }
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                  <Building2 className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-foreground">
                    {gpm.name}
                  </h3>
                  <Badge variant="secondary" className="text-xs mt-1">
                    {gpm.vertical}
                  </Badge>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-3">
                {gpm.description}
              </p>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" /> {gpm.employees}
                  </span>
                  <span>Est. {gpm.founded}</span>
                </div>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {gpm.location}
                </span>
              </div>

              {selectedGpm?.id === gpm.id && (
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex flex-wrap gap-2">
                    {(gpm.tags ?? []).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!isLoading && !isError && filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Building2 className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>No marketplaces found matching your criteria.</p>
        </div>
      )}

      {!isLoading && !isError && totalPages > 1 && (
        <div className="flex items-center justify-between">
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
  );
};

export default MarketplaceDirectory;
