import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import type { Program, ProgramsFilters, VisaProgram, VisaProgramsFilters } from "@/types/api";

export const programsKeys = {
  all: ["programs"] as const,
  list: (filters?: ProgramsFilters) => ["programs", "list", filters] as const,
  detail: (id: string) => ["programs", "detail", id] as const,
};

export function usePrograms(filters?: ProgramsFilters) {
  return useQuery({
    queryKey: programsKeys.list(filters),
    queryFn: () => apiGet<Program[]>("/api/programs", filters as Record<string, unknown>),
  });
}

export function useProgram(id?: string) {
  return useQuery({
    queryKey: programsKeys.detail(id ?? ""),
    queryFn: () => apiGet<Program>(`/api/programs/${id}`),
    enabled: !!id,
  });
}

export const visaProgramsKeys = {
  list: (filters?: VisaProgramsFilters) => ["visa-programs", "list", filters] as const,
};

export function useVisaPrograms(filters?: VisaProgramsFilters) {
  return useQuery({
    queryKey: visaProgramsKeys.list(filters),
    queryFn: () => apiGet<VisaProgram[]>("/api/visa-programs", filters as Record<string, unknown>),
  });
}
