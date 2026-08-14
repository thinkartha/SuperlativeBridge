import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import type { AdminStats } from "@/types/api";

export const adminStatsKeys = {
  all: ["admin-stats"] as const,
};

export function useAdminStats() {
  return useQuery({
    queryKey: adminStatsKeys.all,
    queryFn: () => apiGet<AdminStats>("/api/admin/stats"),
  });
}
