import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import type { EntrepreneurshipData } from "@/types/api";

export const entrepreneurshipKeys = {
  all: ["entrepreneurship"] as const,
};

export function useEntrepreneurship() {
  return useQuery({
    queryKey: entrepreneurshipKeys.all,
    queryFn: () => apiGet<EntrepreneurshipData>("/api/entrepreneurship"),
  });
}
