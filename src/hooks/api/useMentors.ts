import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api";
import type { Mentor, MentorsFilters } from "@/types/api";

export const mentorsKeys = {
  all: ["mentors"] as const,
  list: (filters?: MentorsFilters) => ["mentors", "list", filters] as const,
  detail: (id: string) => ["mentors", "detail", id] as const,
};

export function useMentors(filters?: MentorsFilters) {
  return useQuery({
    queryKey: mentorsKeys.list(filters),
    queryFn: () => apiGet<Mentor[]>("/api/mentors", filters as Record<string, unknown>),
  });
}

export function useMentor(id?: string) {
  return useQuery({
    queryKey: mentorsKeys.detail(id ?? ""),
    queryFn: () => apiGet<Mentor>(`/api/mentors/${id}`),
    enabled: !!id,
  });
}

export function useCreateMentor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<Mentor>) => apiPost<Mentor>("/api/mentors", payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: mentorsKeys.all }),
  });
}

export function useUpdateMentor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: Partial<Mentor> & { id: string }) =>
      apiPut<Mentor>(`/api/mentors/${id}`, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: mentorsKeys.all });
      queryClient.invalidateQueries({ queryKey: mentorsKeys.detail(variables.id) });
    },
  });
}

export function useDeleteMentor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete<void>(`/api/mentors/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: mentorsKeys.all }),
  });
}
