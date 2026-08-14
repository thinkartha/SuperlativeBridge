import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPatch } from "@/lib/api";
import type {
  AdminNotificationList,
  AuditLogFilters,
  AuditLogResponse,
  MentorAnalyticsDetail,
  MentorAnalyticsList,
  UserAnalyticsDetail,
  UserAnalyticsList,
} from "@/types/api";

export const adminAnalyticsKeys = {
  users: ["admin", "user-analytics"] as const,
  mentors: ["admin", "mentor-analytics"] as const,
  notifications: ["admin", "notifications"] as const,
  audit: (filters?: AuditLogFilters) => ["admin", "audit-log", filters] as const,
  userDetail: (id: string) => ["users", id, "analytics"] as const,
  mentorDetail: (id: string) => ["mentors", id, "analytics"] as const,
};

export function useUserAnalyticsList() {
  return useQuery({
    queryKey: adminAnalyticsKeys.users,
    queryFn: () => apiGet<UserAnalyticsList>("/api/admin/user-analytics"),
  });
}

export function useMentorAnalyticsList() {
  return useQuery({
    queryKey: adminAnalyticsKeys.mentors,
    queryFn: () => apiGet<MentorAnalyticsList>("/api/admin/mentor-analytics"),
  });
}

export function useUserAnalytics(id?: string) {
  return useQuery({
    queryKey: adminAnalyticsKeys.userDetail(id ?? ""),
    queryFn: () => apiGet<UserAnalyticsDetail>(`/api/users/${id}/analytics`),
    enabled: !!id,
  });
}

export function useMentorAnalytics(id?: string) {
  return useQuery({
    queryKey: adminAnalyticsKeys.mentorDetail(id ?? ""),
    queryFn: () => apiGet<MentorAnalyticsDetail>(`/api/mentors/${id}/analytics`),
    enabled: !!id,
  });
}

export function useAdminNotifications() {
  return useQuery({
    queryKey: adminAnalyticsKeys.notifications,
    queryFn: () => apiGet<AdminNotificationList>("/api/admin/notifications"),
  });
}

export function useAuditLog(filters?: AuditLogFilters) {
  return useQuery({
    queryKey: adminAnalyticsKeys.audit(filters),
    queryFn: () =>
      apiGet<AuditLogResponse>(
        "/api/admin/audit-log",
        filters as Record<string, unknown>,
      ),
  });
}

export function useMarkNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, read }: { id: string; read: boolean }) =>
      apiPatch<{ id: string; read: boolean }>(`/api/admin/notifications/${id}`, {
        read,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: adminAnalyticsKeys.notifications,
      });
    },
  });
}
