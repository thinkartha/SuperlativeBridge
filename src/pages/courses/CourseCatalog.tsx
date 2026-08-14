import { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import CourseCover from "@/components/CourseCover";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Clock,
  Users,
  Globe,
  Star,
  Bookmark,
  BookmarkCheck,
} from "lucide-react";
import { useCourses, useCategories } from "@/hooks/api";
import { useEnrollments, useEnroll } from "@/hooks/api/useEnrollments";
import {
  useSavedCourses,
  useSaveCourse,
  useUnsaveCourse,
} from "@/hooks/api/useSavedCourses";
import { useAuth } from "@/contexts/AuthContext";

const ITEMS_PER_PAGE = 8;

const CourseCatalog = () => {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const search = params.get("q") ?? "";
  const catFilter = params.get("category") ?? "all";
  const langFilter = params.get("language") ?? "all";
  const levelFilter = params.get("level") ?? "all";
  const verticalFilter = params.get("vertical") ?? "all";
  const page = Math.max(1, Number(params.get("page") ?? "1") || 1);

  const updateParams = (
    updates: Record<string, string | null>,
    resetPage = false,
  ) => {
    const next = new URLSearchParams(params);
    Object.entries(updates).forEach(([key, value]) => {
      if (!value || value === "all" || value === "") next.delete(key);
      else next.set(key, value);
    });
    if (resetPage) next.delete("page");
    setParams(next, { replace: false });
  };

  const { data: categories } = useCategories();
  const { data: allPublished } = useCourses({ status: "Published" });
  const {
    data: courses,
    isLoading,
    isError,
    refetch,
  } = useCourses({
    status: "Published",
    search: search || undefined,
    level: levelFilter !== "all" ? levelFilter : undefined,
    language: langFilter !== "all" ? langFilter : undefined,
    category: catFilter !== "all" ? catFilter : undefined,
    vertical: verticalFilter !== "all" ? verticalFilter : undefined,
  });

  const { data: enrollments } = useEnrollments(user?.id);
  const { data: savedCourses } = useSavedCourses(user?.id);
  const enrollMutation = useEnroll(user?.id);
  const saveMutation = useSaveCourse(user?.id);
  const unsaveMutation = useUnsaveCourse(user?.id);

  const enrolledCourseIds = useMemo(
    () => new Set((enrollments ?? []).map((e) => e.courseId)),
    [enrollments],
  );
  const savedCourseIds = useMemo(
    () => new Set((savedCourses ?? []).map((s) => s.courseId)),
    [savedCourses],
  );

  const languages = Array.from(
    new Set((allPublished ?? []).map((c) => c.language).filter(Boolean)),
  ).sort();
  const verticals = Array.from(
    new Set((allPublished ?? []).map((c) => c.vertical).filter(Boolean)),
  ).sort();

  const allCourses = courses ?? [];
  const totalPages = Math.max(1, Math.ceil(allCourses.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const paginated = allCourses.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const resetFilters = () => setParams(new URLSearchParams());

  const hasFilters =
    !!search ||
    levelFilter !== "all" ||
    langFilter !== "all" ||
    catFilter !== "all" ||
    verticalFilter !== "all";

  const goToPage = (p: number) =>
    updateParams({ page: p > 1 ? String(p) : null });

  const toggleSave = (courseId: string) => {
    if (savedCourseIds.has(courseId)) unsaveMutation.mutate(courseId);
    else saveMutation.mutate(courseId);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground">
          Course Catalog
        </h1>
        <p className="text-muted-foreground mt-1">
          {allCourses.length} courses across {categories?.length ?? 0} industry
          verticals
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search courses, instructors..."
            value={search}
            onChange={(e) => updateParams({ q: e.target.value || null }, true)}
            className="pl-9 h-10"
          />
        </div>
        <Select
          value={catFilter}
          onValueChange={(v) => updateParams({ category: v }, true)}
        >
          <SelectTrigger className="w-48 h-10">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {(categories ?? []).map((c) => (
              <SelectItem key={c.id} value={c.name}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={langFilter}
          onValueChange={(v) => updateParams({ language: v }, true)}
        >
          <SelectTrigger className="w-40 h-10">
            <SelectValue placeholder="All Languages" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Languages</SelectItem>
            {languages.map((l) => (
              <SelectItem key={l} value={l}>
                {l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={levelFilter}
          onValueChange={(v) => updateParams({ level: v }, true)}
        >
          <SelectTrigger className="w-36 h-10">
            <SelectValue placeholder="All Levels" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            {["Beginner", "Intermediate", "Advanced"].map((l) => (
              <SelectItem key={l} value={l}>
                {l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={verticalFilter}
          onValueChange={(v) => updateParams({ vertical: v }, true)}
        >
          <SelectTrigger className="w-44 h-10">
            <SelectValue placeholder="All Verticals" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Verticals</SelectItem>
            {verticals.map((v) => (
              <SelectItem key={v} value={v}>
                {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {hasFilters && (
          <Button
            variant="outline"
            size="sm"
            className="h-10"
            onClick={resetFilters}
          >
            Clear Filters
          </Button>
        )}
      </div>

      {isLoading && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-56 w-full" />
          ))}
        </div>
      )}

      {isError && !isLoading && (
        <div className="bg-card border border-border py-16 text-center">
          <p className="text-muted-foreground mb-4">
            Unable to load courses right now.
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Try Again
          </Button>
        </div>
      )}

      {!isLoading && !isError && allCourses.length === 0 && (
        <div className="bg-card border border-border py-16 text-center text-muted-foreground">
          No courses found matching your criteria.
        </div>
      )}

      {!isLoading && !isError && allCourses.length > 0 && (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {paginated.map((c) => {
              const isEnrolled = enrolledCourseIds.has(c.id);
              const isSaved = savedCourseIds.has(c.id);
              return (
                <div
                  key={c.id}
                  className="bg-card border border-border overflow-hidden flex flex-col"
                >
                  <div className="relative">
                    <CourseCover
                      src={c.image}
                      alt={c.title}
                      className="w-full h-32 object-cover"
                    />
                    {user && (
                      <button
                        onClick={() => toggleSave(c.id)}
                        aria-label={
                          isSaved ? "Remove from saved" : "Save course"
                        }
                        className="absolute top-2 right-2 bg-background/90 border border-border p-1.5 hover:bg-background"
                      >
                        {isSaved ? (
                          <BookmarkCheck className="w-4 h-4 text-primary" />
                        ) : (
                          <Bookmark className="w-4 h-4 text-muted-foreground" />
                        )}
                      </button>
                    )}
                  </div>
                  <div className="p-4 flex flex-col flex-1 gap-2">
                    <Badge variant="secondary" className="w-fit text-xs">
                      {c.category}
                    </Badge>
                    <h3 className="font-heading font-semibold text-foreground text-sm line-clamp-2">
                      {c.title}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {c.instructor}
                    </p>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-500" />
                        {c.rating}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {c.students.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {c.duration}
                      </span>
                      <span className="flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        {c.language}
                      </span>
                    </div>
                    <div className="mt-auto pt-3 flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => navigate(`/courses/${c.id}`)}
                      >
                        View
                      </Button>
                      {user ? (
                        isEnrolled ? (
                          <Button
                            size="sm"
                            variant="hero"
                            className="flex-1"
                            onClick={() => navigate(`/courses/${c.id}`)}
                          >
                            Continue
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="hero"
                            className="flex-1"
                            disabled={enrollMutation.isPending}
                            onClick={() => enrollMutation.mutate(c.id)}
                          >
                            Enroll
                          </Button>
                        )
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between px-1 py-3">
            <p className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
              {Math.min(currentPage * ITEMS_PER_PAGE, allCourses.length)} of{" "}
              {allCourses.length}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => goToPage(currentPage - 1)}
                className="h-8 gap-1"
              >
                <ChevronLeft className="w-4 h-4" /> Prev
              </Button>
              {Array.from({ length: totalPages }, (_, i) => (
                <Button
                  key={i}
                  variant={currentPage === i + 1 ? "default" : "outline"}
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => goToPage(i + 1)}
                >
                  {i + 1}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => goToPage(currentPage + 1)}
                className="h-8 gap-1"
              >
                Next <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CourseCatalog;
