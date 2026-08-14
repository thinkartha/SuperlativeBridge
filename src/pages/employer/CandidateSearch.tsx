import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  MapPin,
  Star,
  Briefcase,
  Filter,
  X,
  Mail,
  ArrowUpDown,
  GraduationCap,
  DollarSign,
  BadgeCheck,
  FileText,
  Shield,
} from "lucide-react";
import { useCandidates, useCategories } from "@/hooks/api";
import type { Candidate } from "@/types/api";
import GigWorkerMap from "@/components/employer/GigWorkerMap";

const ITEMS_PER_PAGE = 8;

const AVAILABILITY = [
  { value: "all", label: "Any availability" },
  { value: "open", label: "Open to work" },
  { value: "hiring", label: "Actively interviewing" },
  { value: "passive", label: "Open to offers" },
];

const VISA_OPTIONS = [
  "US Citizen",
  "Green Card",
  "H-1B",
  "OPT",
  "TN",
  "Asylum/Refugee",
  "Work Authorization",
];

const EXPERIENCE_OPTIONS = ["1 year", "2 years", "3 years", "4 years", "5 years", "6 years", "7 years", "8 years", "9 years", "10 years", "12 years", "15 years"];

const CandidateSearch = () => {
  const [search, setSearch] = useState("");
  const [verticalFilter, setVerticalFilter] = useState("all");
  const [location, setLocation] = useState("");
  const [availability, setAvailability] = useState("all");
  const [visa, setVisa] = useState("all");
  const [education, setEducation] = useState("");
  const [experience, setExperience] = useState("all");
  const [program, setProgram] = useState("all");
  const [minRating, setMinRating] = useState("all");
  const [maxRate, setMaxRate] = useState("");
  const [openToRelocate, setOpenToRelocate] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [sort, setSort] = useState("name");
  const [page, setPage] = useState(1);

  const { data: categories } = useCategories();
  const {
    data: candidates,
    isLoading,
    isError,
    error,
  } = useCandidates({
    search: search || undefined,
    vertical: verticalFilter !== "all" ? verticalFilter : undefined,
    skill: selectedSkills[0] || undefined,
    location: location || undefined,
    availability: availability !== "all" ? availability : undefined,
    visa: visa !== "all" ? visa : undefined,
    education: education || undefined,
    experience: experience !== "all" ? experience : undefined,
    program: program !== "all" ? program : undefined,
    minRating: minRating !== "all" ? minRating : undefined,
    maxRate: maxRate || undefined,
    openToRelocate: openToRelocate ? "true" : undefined,
    sort,
  });

  const allCandidates = candidates ?? [];
  const verticals = categories ?? [];

  const skillOptions = useMemo(
    () => [...new Set(allCandidates.flatMap((c) => c.skills ?? []))].sort(),
    [allCandidates],
  );
  const programOptions = useMemo(
    () => [...new Set(allCandidates.flatMap((c) => c.programs ?? []))].sort(),
    [allCandidates],
  );

  const toggleSkill = (val: string) => {
    setSelectedSkills((arr) =>
      arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val],
    );
    setPage(1);
  };

  const filtered = allCandidates.filter(
    (c) =>
      selectedSkills.length === 0 ||
      selectedSkills.every((s) => (c.skills ?? []).includes(s)),
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE,
  );

  const clearAll = () => {
    setSearch("");
    setVerticalFilter("all");
    setLocation("");
    setAvailability("all");
    setVisa("all");
    setEducation("");
    setExperience("all");
    setProgram("all");
    setMinRating("all");
    setMaxRate("");
    setOpenToRelocate(false);
    setSelectedSkills([]);
    setPage(1);
  };

  const hasFilters =
    !!search ||
    verticalFilter !== "all" ||
    !!location ||
    availability !== "all" ||
    visa !== "all" ||
    !!education ||
    experience !== "all" ||
    program !== "all" ||
    minRating !== "all" ||
    !!maxRate ||
    openToRelocate ||
    selectedSkills.length > 0;

  const availabilityLabel = (a?: string) => {
    if (a === "hiring") return "Actively interviewing";
    if (a === "passive") return "Open to offers";
    return "Open to work";
  };

  const FilterPanel = () => (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Keywords
        </Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Name, title, company…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9 h-9 text-sm"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Location
        </Label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="City, state, or Remote"
            value={location}
            onChange={(e) => {
              setLocation(e.target.value);
              setPage(1);
            }}
            className="pl-9 h-9 text-sm"
          />
        </div>
        <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer pt-1">
          <Checkbox
            checked={openToRelocate}
            onCheckedChange={(v) => {
              setOpenToRelocate(!!v);
              setPage(1);
            }}
          />
          Open to relocate
        </label>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Industry / vertical
        </Label>
        <Select
          value={verticalFilter}
          onValueChange={(v) => {
            setVerticalFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="h-9 text-sm">
            <SelectValue placeholder="All industries" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All industries</SelectItem>
            {verticals.map((v) => (
              <SelectItem key={v.id} value={v.name}>
                {v.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Availability
        </Label>
        <Select
          value={availability}
          onValueChange={(v) => {
            setAvailability(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {AVAILABILITY.map((a) => (
              <SelectItem key={a.value} value={a.value}>
                {a.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Visa / work authorization
        </Label>
        <Select
          value={visa}
          onValueChange={(v) => {
            setVisa(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any visa status</SelectItem>
            {VISA_OPTIONS.map((v) => (
              <SelectItem key={v} value={v}>
                {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Experience
        </Label>
        <Select
          value={experience}
          onValueChange={(v) => {
            setExperience(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="h-9 text-sm">
            <SelectValue placeholder="Any" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any experience</SelectItem>
            {EXPERIENCE_OPTIONS.map((e) => (
              <SelectItem key={e} value={e}>
                {e}+
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Education contains
        </Label>
        <Input
          placeholder="BS, MS, MBA, Certificate…"
          value={education}
          onChange={(e) => {
            setEducation(e.target.value);
            setPage(1);
          }}
          className="h-9 text-sm"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Government program
        </Label>
        <Select
          value={program}
          onValueChange={(v) => {
            setProgram(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any program</SelectItem>
            {programOptions.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Min rating
          </Label>
          <Select
            value={minRating}
            onValueChange={(v) => {
              setMinRating(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any</SelectItem>
              <SelectItem value="4">4.0+</SelectItem>
              <SelectItem value="4.5">4.5+</SelectItem>
              <SelectItem value="4.8">4.8+</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Max $/hr
          </Label>
          <Input
            type="number"
            placeholder="e.g. 100"
            value={maxRate}
            onChange={(e) => {
              setMaxRate(e.target.value);
              setPage(1);
            }}
            className="h-9 text-sm"
          />
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Skills (must have all)
        </Label>
        <div className="space-y-2 max-h-36 overflow-y-auto">
          {skillOptions.length === 0 && (
            <p className="text-xs text-muted-foreground">No skills yet.</p>
          )}
          {skillOptions.map((s) => (
            <label
              key={s}
              className="flex items-center gap-2 text-sm text-foreground cursor-pointer"
            >
              <Checkbox
                checked={selectedSkills.includes(s)}
                onCheckedChange={() => toggleSkill(s)}
              />
              {s}
            </label>
          ))}
        </div>
      </div>

      {hasFilters && (
        <Button
          variant="outline"
          size="sm"
          onClick={clearAll}
          className="w-full text-xs gap-1"
        >
          <X className="w-3 h-3" /> Clear all filters
        </Button>
      )}
    </div>
  );

  return (
    <div className="flex w-full -mx-6 lg:-mx-8 -my-6 lg:-my-8 min-h-[calc(100vh-3.5rem)]">
      <aside className="hidden lg:block w-80 shrink-0 border-r border-border bg-card min-h-full overflow-y-auto sticky top-0 p-6">
        <h2 className="font-heading font-semibold text-foreground mb-5 flex items-center gap-2">
          <Filter className="w-4 h-4 text-primary" /> Filters
        </h2>
        <FilterPanel />
      </aside>

      <main className="flex-1 min-w-0 p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground">
              People
            </h1>
            <p className="text-sm text-muted-foreground">
              {filtered.length} candidate{filtered.length === 1 ? "" : "s"} ·
              LinkedIn-style talent search
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={sort}
              onValueChange={(v) => {
                setSort(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-9 w-44 text-sm">
                <ArrowUpDown className="w-3.5 h-3.5 mr-1.5" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Sort: Name</SelectItem>
                <SelectItem value="rating">Sort: Rating</SelectItem>
                <SelectItem value="rate">Sort: Rate (low–high)</SelectItem>
                <SelectItem value="experience">Sort: Experience</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="lg:hidden mb-6 border border-border bg-card p-4">
          <FilterPanel />
        </div>

        {!isLoading && !isError && filtered.length > 0 && (
          <div className="mb-6">
            <GigWorkerMap candidates={filtered} />
          </div>
        )}

        {hasFilters && (
          <div className="flex flex-wrap gap-2 mb-4">
            {selectedSkills.map((s) => (
              <Badge key={s} variant="secondary" className="text-xs gap-1">
                {s}
                <X
                  className="w-2.5 h-2.5 cursor-pointer"
                  onClick={() => toggleSkill(s)}
                />
              </Badge>
            ))}
          </div>
        )}

        {isError && (
          <div className="border border-destructive/30 bg-destructive/10 text-destructive p-4 text-sm mb-6">
            Failed to load candidates
            {error instanceof Error ? `: ${error.message}` : "."}
          </div>
        )}

        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full" />
            ))}
          </div>
        )}

        {!isLoading && !isError && (
          <div className="space-y-3">
            {paginated.map((c: Candidate) => (
              <div
                key={c.id}
                className="border border-border bg-card p-5 hover:border-primary/40 transition-colors"
              >
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="w-16 h-16 shrink-0 bg-primary/10 flex items-center justify-center font-heading font-bold text-primary text-lg">
                    {c.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <Link
                          to={`/employer/candidate/${c.id}`}
                          className="font-heading font-semibold text-foreground text-lg hover:text-primary"
                        >
                          {c.name}
                        </Link>
                        <p className="text-sm text-foreground/80">{c.title}</p>
                      </div>
                      <span className="text-xs px-2 py-1 bg-emerald-100 text-emerald-800">
                        {availabilityLabel(c.availability)}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-2">
                      {c.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {c.location}
                          {c.openToRelocate ? " · relocates" : ""}
                        </span>
                      )}
                      {c.vertical && (
                        <span className="flex items-center gap-1">
                          <Briefcase className="w-3 h-3" />
                          {c.vertical}
                        </span>
                      )}
                      {c.experience && (
                        <span className="flex items-center gap-1">
                          <BadgeCheck className="w-3 h-3" />
                          {c.experience}
                        </span>
                      )}
                      {c.visaStatus && (
                        <span className="flex items-center gap-1">
                          <Shield className="w-3 h-3" />
                          {c.visaStatus}
                        </span>
                      )}
                      {c.education && (
                        <span className="flex items-center gap-1">
                          <GraduationCap className="w-3 h-3" />
                          {c.education}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        {c.rating}
                      </span>
                      {c.billingRate > 0 && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />${c.billingRate}/hr
                        </span>
                      )}
                    </div>

                    {c.bio && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {c.bio}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {(c.skills ?? []).slice(0, 8).map((s) => (
                        <Badge key={s} variant="secondary" className="text-xs">
                          {s}
                        </Badge>
                      ))}
                      {(c.programs ?? []).map((p) => (
                        <Badge
                          key={p}
                          variant="outline"
                          className="text-xs border-primary/40 text-primary"
                        >
                          {p}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex md:flex-col gap-2 shrink-0">
                    <Button variant="hero" size="sm" className="gap-1 text-xs" asChild>
                      <a href={c.email ? `mailto:${c.email}` : undefined}>
                        <Mail className="w-3 h-3" /> Message
                      </a>
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs gap-1" asChild>
                      <Link to={`/employer/candidate/${c.id}`}>
                        <FileText className="w-3 h-3" /> View resume
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs" asChild>
                      <Link to={`/employer/candidate/${c.id}`}>View profile</Link>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && !isError && filtered.length === 0 && (
          <div className="text-center py-16 border border-border">
            <Search className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-heading font-semibold text-foreground mb-1">
              No people match
            </h3>
            <p className="text-sm text-muted-foreground">
              Try clearing filters or broadening location.
            </p>
          </div>
        )}

        {!isLoading && !isError && filtered.length > 0 && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-muted-foreground">
              {(page - 1) * ITEMS_PER_PAGE + 1}–
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
                Prev
              </Button>
              {Array.from({ length: Math.min(totalPages, 8) }, (_, i) => (
                <Button
                  key={i}
                  variant={page === i + 1 ? "default" : "outline"}
                  size="sm"
                  className="w-8 p-0"
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
                Next
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default CandidateSearch;
