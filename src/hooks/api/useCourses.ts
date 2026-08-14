import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api";
import type { Course, CoursesFilters } from "@/types/api";

export const coursesKeys = {
  all: ["courses"] as const,
  list: (filters?: CoursesFilters) => ["courses", "list", filters] as const,
  detail: (id: string) => ["courses", "detail", id] as const,
};

export function useCourses(filters?: CoursesFilters) {
  return useQuery({
    queryKey: coursesKeys.list(filters),
    queryFn: () => apiGet<Course[]>("/api/courses", filters as Record<string, unknown>),
  });
}

export function useCourse(id?: string) {
  return useQuery({
    queryKey: coursesKeys.detail(id ?? ""),
    queryFn: () => apiGet<Course>(`/api/courses/${id}`),
    enabled: !!id,
  });
}

export function useCreateCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<Course>) => apiPost<Course>("/api/courses", payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: coursesKeys.all }),
  });
}

export function useUpdateCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: Partial<Course> & { id: string }) =>
      apiPut<Course>(`/api/courses/${id}`, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: coursesKeys.all });
      queryClient.invalidateQueries({ queryKey: coursesKeys.detail(variables.id) });
    },
  });
}

export function useDeleteCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete<void>(`/api/courses/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: coursesKeys.all }),
  });
}
