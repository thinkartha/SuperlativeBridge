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
import { useVisaPrograms, useCategories } from "@/hooks/api";
import { Search, Globe, Clock, ChevronDown, ChevronUp } from "lucide-react";

const VisaPrograms = () => {
  const [search, setSearch] = useState("");
  const [industryFilter, setIndustryFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: categories } = useCategories();
  const { data: visaPrograms, isLoading, isError, refetch } = useVisaPrograms();

  const allVisas = visaPrograms ?? [];
  const visaTypes = [
    "all",
    ...Array.from(new Set(allVisas.map((v) => v.visaType))),
  ];

  const filtered = allVisas.filter((v) => {
    const matchSearch =
      v.title.toLowerCase().includes(search.toLowerCase()) ||
      v.description.toLowerCase().includes(search.toLowerCase());
    const matchIndustry =
      industryFilter === "all" ||
      (v.industryMatch ?? []).some((i) =>
        i.toLowerCase().includes(industryFilter.toLowerCase()),
      );
    const matchType = typeFilter === "all" || v.visaType === typeFilter;
    return matchSearch && matchIndustry && matchType;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground">
          US Visa Programs
        </h1>
        <p className="text-muted-foreground mt-1">
          Explore work and study visa programs supported by the United States
          for international talent
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search visa programs..."
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Visa Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {visaTypes
              .filter((t) => t !== "all")
              .map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
        <Select value={industryFilter} onValueChange={setIndustryFilter}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Industry" />
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
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      )}

      {isError && !isLoading && (
        <div className="bg-card rounded-xl border border-border py-16 text-center">
          <p className="text-muted-foreground mb-4">
            Unable to load visa programs right now.
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Try Again
          </Button>
        </div>
      )}

      {!isLoading && !isError && (
        <div className="space-y-4">
          {filtered.map((visa) => (
            <div
              key={visa.id}
              className="bg-card rounded-xl border border-border overflow-hidden"
            >
              <div
                className="p-6 cursor-pointer"
                onClick={() =>
                  setExpandedId(expandedId === visa.id ? null : visa.id)
                }
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                      <span className="text-sm font-heading font-bold text-primary">
                        {visa.visaType}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-heading font-semibold text-foreground text-lg">
                        {visa.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {visa.description}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {(visa.industryMatch ?? []).map((ind) => (
                          <Badge
                            key={ind}
                            variant="secondary"
                            className="text-xs"
                          >
                            {ind}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right hidden sm:block">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="w-3 h-3" /> {visa.duration}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {visa.category}
                      </div>
                    </div>
                    {expandedId === visa.id ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </div>

              {expandedId === visa.id && (
                <div className="border-t border-border p-6 bg-muted/30">
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-semibold text-foreground mb-2">
                        Eligibility Requirements
                      </h4>
                      <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                        {(visa.eligibility ?? []).map((e, i) => (
                          <li key={i}>{e}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-foreground mb-2">
                        Details
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            Duration:
                          </span>
                          <span className="text-foreground">
                            {visa.duration}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{visa.category}</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-3">
                    <Button size="sm">Learn More</Button>
                    <Button size="sm" variant="outline">
                      Check Eligibility
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!isLoading && !isError && filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Globe className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>No visa programs found matching your criteria.</p>
        </div>
      )}
    </div>
  );
};

export default VisaPrograms;
