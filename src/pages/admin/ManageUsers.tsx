import { useState } from "react";
import { Link } from "react-router-dom";
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
  MoreHorizontal,
  UserPlus,
  Mail,
  Shield,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useUsers, useDeleteUser, useUserAnalyticsList } from "@/hooks/api";
import type { User } from "@/types/api";
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

const ManageUsers = () => {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [sortField, setSortField] = useState<string>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: users, isLoading, isError, error } = useUsers();
  const { data: analytics } = useUserAnalyticsList();
  const deleteUser = useDeleteUser();
  const metrics = Object.fromEntries(
    (analytics?.users ?? []).map((u) => [u.id, u]),
  );
  const summary = analytics?.summary;

  const allUsers = users ?? [];

  const toggleSort = (field: string) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const filtered = allUsers
    .filter((u) => {
      const matchSearch =
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase());
      const matchRole =
        roleFilter === "all" || u.role.toLowerCase() === roleFilter;
      return matchSearch && matchRole;
    })
    .sort((a, b) => {
      const aVal = a[sortField as keyof User];
      const bVal = b[sortField as keyof User];
      const cmp =
        typeof aVal === "number" && typeof bVal === "number"
          ? aVal - bVal
          : String(aVal ?? "").localeCompare(String(bVal ?? ""));
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
      await deleteUser.mutateAsync(deleteId);
      toast({ title: "User removed" });
    } catch (e) {
      toast({
        title: "Failed to remove user",
        description: e instanceof Error ? e.message : undefined,
        variant: "destructive",
      });
    } finally {
      setDeleteId(null);
    }
  };

  const statusColor = (s: string) => {
    if (s === "Active") return "bg-green-100 text-green-700";
    if (s === "Suspended") return "bg-red-100 text-red-700";
    return "bg-yellow-100 text-yellow-700";
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
              Users
            </h1>
            <p className="text-muted-foreground mt-1">
              {allUsers.length} total users — click a name for analytics
            </p>
          </div>
          <Button variant="hero" className="gap-2">
            <UserPlus className="w-4 h-4" /> Add User
          </Button>
        </div>

        {summary && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Active users", value: summary.active },
              { label: "New this month", value: summary.newThisMonth },
              { label: "Avg enrollments", value: summary.avgEnrollments },
              { label: "Completion rate", value: `${summary.completionRate}%` },
            ].map((card) => (
              <div key={card.label} className="bg-card border border-border p-4">
                <div className="text-2xl font-heading font-bold text-foreground">
                  {card.value}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {card.label}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9 h-10"
            />
          </div>
          <Select
            value={roleFilter}
            onValueChange={(v) => {
              setRoleFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-40 h-10">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="worker">Worker</SelectItem>
              <SelectItem value="mentor">Mentor</SelectItem>
              <SelectItem value="employer">Employer</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isError && (
          <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-xl p-4 text-sm">
            Failed to load users
            {error instanceof Error ? `: ${error.message}` : "."}
          </div>
        )}

        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <SortHeader field="name">User</SortHeader>
                  <SortHeader field="role">Role</SortHeader>
                  <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Enrolled
                  </th>
                  <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    XP
                  </th>
                  <SortHeader field="status">Status</SortHeader>
                  <SortHeader field="createdAt">Joined</SortHeader>
                  <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading &&
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td className="p-4" colSpan={7}>
                        <Skeleton className="h-8 w-full" />
                      </td>
                    </tr>
                  ))}
                {!isLoading && paginated.length === 0 && (
                  <tr>
                    <td
                      className="p-8 text-center text-sm text-muted-foreground"
                      colSpan={7}
                    >
                      No users found.
                    </td>
                  </tr>
                )}
                {!isLoading &&
                  paginated.map((u) => (
                    <tr
                      key={u.id}
                      className="hover:bg-muted/20 transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary text-xs">
                            {u.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </div>
                          <div>
                            <Link
                              to={`/admin/users/${u.id}`}
                              className="font-medium text-foreground text-sm hover:text-primary"
                            >
                              {u.name}
                            </Link>
                            <div className="text-xs text-muted-foreground">
                              {u.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant="secondary" className="text-xs">
                          {u.role}
                        </Badge>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {metrics[u.id]?.enrollments ?? "—"}
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {metrics[u.id]?.totalXP ?? "—"}
                      </td>
                      <td className="p-4">
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColor(u.status)}`}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {u.createdAt}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <button className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors">
                            <Mail className="w-3.5 h-3.5" />
                          </button>
                          <button className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors">
                            <Shield className="w-3.5 h-3.5" />
                          </button>
                          <button
                            className="p-1.5 rounded-lg hover:bg-muted/50 text-destructive hover:text-destructive transition-colors"
                            onClick={() => setDeleteId(u.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <button className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors">
                            <MoreHorizontal className="w-3.5 h-3.5" />
                          </button>
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
            <AlertDialogTitle>Remove user?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ManageUsers;
