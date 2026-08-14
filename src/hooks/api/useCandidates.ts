import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import type { Candidate, CandidatesFilters } from "@/types/api";

export const candidatesKeys = {
  all: ["candidates"] as const,
  list: (filters?: CandidatesFilters) => ["candidates", "list", filters] as const,
  detail: (id: string) => ["candidates", "detail", id] as const,
};

export function useCandidates(filters?: CandidatesFilters) {
  return useQuery({
    queryKey: candidatesKeys.list(filters),
    queryFn: () =>
      apiGet<Candidate[]>("/api/candidates", filters as Record<string, unknown>),
  });
}

export function useCandidate(id?: string) {
  return useQuery({
    queryKey: candidatesKeys.detail(id ?? ""),
    queryFn: () => apiGet<Candidate>(`/api/candidates/${id}`),
    enabled: !!id,
  });
}
