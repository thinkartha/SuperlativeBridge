import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Clock,
  Users,
  Globe,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useCourses, useCategories, useDeleteCourse } from "@/hooks/api";
import type { Course } from "@/types/api";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const ITEMS_PER_PAGE = 8;

const ManageCourses = () => {
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [sortField, setSortField] = useState<string>("title");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: courses, isLoading, isError, error } = useCourses();
  const { data: categories } = useCategories();
  const deleteCourse = useDeleteCourse();

  const toggleSort = (field: string) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const allCourses = courses ?? [];

  const filtered = allCourses
    .filter((c) => {
      const matchSearch = c.title.toLowerCase().includes(search.toLowerCase());
      const matchCat = catFilter === "all" || c.category === catFilter;
      return matchSearch && matchCat;
    })
    .sort((a, b) => {
      const aVal = a[sortField as keyof Course];
      const bVal = b[sortField as keyof Course];
      const cmp =
        typeof aVal === "number"
          ? (aVal as number) - (bVal as number)
          : String(aVal).localeCompare(String(bVal));
      return sortDir === "asc" ? cmp : -cmp;
    });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE,
  );

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteCourse.mutateAsync(deleteId);
      toast({ title: "Course deleted" });
    } catch (e) {
      toast({
        title: "Failed to delete course",
        description: e instanceof Error ? e.message : undefined,
        variant: "destructive",
      });
    } finally {
      setDeleteId(null);
    }
  };

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
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">
              Courses
            </h1>
            <p className="text-muted-foreground mt-1">
              {allCourses.length} total courses across{" "}
              {(categories ?? []).length} verticals
            </p>
          </div>
          <Button
            variant="hero"
            className="gap-2"
            onClick={() => navigate("/admin/courses/new")}
          >
            <Plus className="w-4 h-4" /> Create Course
          </Button>
        </div>

        <div className="flex gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search courses..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9 h-10"
            />
          </div>
          <Select
            value={catFilter}
            onValueChange={(v) => {
              setCatFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-52 h-10">
              <SelectValue placeholder="All Verticals" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Verticals</SelectItem>
              {(categories ?? []).map((v) => (
                <SelectItem key={v.id} value={v.name}>
                  {v.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isError && (
          <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-xl p-4 text-sm">
            Failed to load courses
            {error instanceof Error ? `: ${error.message}` : "."}
          </div>
        )}

        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <SortHeader field="title">Title</SortHeader>
                  <SortHeader field="category">Vertical</SortHeader>
                  <SortHeader field="level">Level</SortHeader>
                  <SortHeader field="language">Language</SortHeader>
                  <SortHeader field="students">Students</SortHeader>
                  <SortHeader field="duration">Duration</SortHeader>
                  <SortHeader field="status">Status</SortHeader>
                  <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading &&
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td className="p-4" colSpan={8}>
                        <Skeleton className="h-8 w-full" />
                      </td>
                    </tr>
                  ))}
                {!isLoading && paginated.length === 0 && (
                  <tr>
                    <td
                      className="p-8 text-center text-sm text-muted-foreground"
                      colSpan={8}
                    >
                      No courses found.
                    </td>
                  </tr>
                )}
                {!isLoading &&
                  paginated.map((c) => (
                    <tr
                      key={c.id}
                      className="hover:bg-muted/20 transition-colors"
                    >
                      <td className="p-4 font-medium text-foreground text-sm">
                        {c.title}
                      </td>
                      <td className="p-4">
                        <Badge variant="secondary" className="text-xs">
                          {c.category}
                        </Badge>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {c.level}
                      </td>
                      <td className="p-4 text-sm text-muted-foreground flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        {c.language}
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {c.students.toLocaleString()}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {c.duration}
                        </span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-medium ${c.status === "Published" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() =>
                              navigate(`/admin/courses/${c.id}/edit`)
                            }
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            onClick={() => setDeleteId(c.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Showing{" "}
              {filtered.length === 0 ? 0 : (page - 1) * ITEMS_PER_PAGE + 1}–
              {Math.min(page * ITEMS_PER_PAGE, filtered.length)} of{" "}
              {filtered.length}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="h-8 gap-1"
              >
                <ChevronLeft className="w-4 h-4" /> Prev
              </Button>
              {Array.from({ length: totalPages }, (_, i) => (
                <Button
                  key={i}
                  variant={page === i + 1 ? "default" : "outline"}
                  size="sm"
                  className="h-8 w-8 p-0"
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
                className="h-8 gap-1"
              >
                Next <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete course?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ManageCourses;
