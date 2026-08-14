import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import type { HealthResponse } from "@/types/api";

export const healthKeys = {
  status: ["health"] as const,
};

export function useHealth(enabled = true) {
  return useQuery({
    queryKey: healthKeys.status,
    queryFn: () => apiGet<HealthResponse>("/api/health"),
    enabled,
    retry: false,
    staleTime: 15_000,
  });
}
