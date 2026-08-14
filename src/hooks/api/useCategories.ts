import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api";
import type { Category } from "@/types/api";

export const categoriesKeys = {
  all: ["categories"] as const,
};

export function useCategories() {
  return useQuery({
    queryKey: categoriesKeys.all,
    queryFn: () => apiGet<Category[]>("/api/categories"),
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<Category>) => apiPost<Category>("/api/categories", payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: categoriesKeys.all }),
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: Partial<Category> & { id: string }) =>
      apiPut<Category>(`/api/categories/${id}`, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: categoriesKeys.all }),
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete<void>(`/api/categories/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: categoriesKeys.all }),
  });
}
