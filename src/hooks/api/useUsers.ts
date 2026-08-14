import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api";
import type { Certification, Notification, StudentDashboard, User, UsersFilters } from "@/types/api";

export const usersKeys = {
  all: ["users"] as const,
  list: (filters?: UsersFilters) => ["users", "list", filters] as const,
  detail: (id: string) => ["users", "detail", id] as const,
  enrollments: (id: string) => ["users", id, "enrollments"] as const,
  certifications: (id: string) => ["users", id, "certifications"] as const,
  notifications: (id: string) => ["users", id, "notifications"] as const,
  dashboard: (id: string) => ["users", id, "dashboard"] as const,
};

export function useUsers(filters?: UsersFilters) {
  return useQuery({
    queryKey: usersKeys.list(filters),
    queryFn: () => apiGet<User[]>("/api/users", filters as Record<string, unknown>),
  });
}

export function useUser(id?: string) {
  return useQuery({
    queryKey: usersKeys.detail(id ?? ""),
    queryFn: () => apiGet<User>(`/api/users/${id}`),
    enabled: !!id,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<User>) => apiPost<User>("/api/users", payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: usersKeys.all }),
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: Partial<User> & { id: string }) =>
      apiPut<User>(`/api/users/${id}`, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: usersKeys.all });
      queryClient.invalidateQueries({ queryKey: usersKeys.detail(variables.id) });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete<void>(`/api/users/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: usersKeys.all }),
  });
}

export function useCertifications(userId?: string) {
  return useQuery({
    queryKey: usersKeys.certifications(userId ?? ""),
    queryFn: () => apiGet<Certification[]>(`/api/users/${userId}/certifications`),
    enabled: !!userId,
  });
}

export function useNotifications(userId?: string) {
  return useQuery({
    queryKey: usersKeys.notifications(userId ?? ""),
    queryFn: () => apiGet<Notification[]>(`/api/users/${userId}/notifications`),
    enabled: !!userId,
  });
}

export function useStudentDashboard(userId?: string) {
  return useQuery({
    queryKey: usersKeys.dashboard(userId ?? ""),
    queryFn: () => apiGet<StudentDashboard>(`/api/users/${userId}/dashboard`),
    enabled: !!userId,
  });
}
