import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiDelete, apiGet, apiPost } from "@/lib/api";
import type { SavedCourse } from "@/types/api";

export const savedCoursesKeys = {
  all: ["saved-courses"] as const,
  byUser: (userId: string) => ["saved-courses", "user", userId] as const,
};

export function useSavedCourses(userId?: string) {
  return useQuery({
    queryKey: savedCoursesKeys.byUser(userId ?? ""),
    queryFn: () => apiGet<SavedCourse[]>(`/api/users/${userId}/saved-courses`),
    enabled: !!userId,
  });
}

export function useSaveCourse(userId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (courseId: string) => apiPost<SavedCourse>("/api/saved-courses", { courseId }),
    onSuccess: () => {
      if (userId) queryClient.invalidateQueries({ queryKey: savedCoursesKeys.byUser(userId) });
      toast.success("Course saved");
    },
    onError: (error: Error) => toast.error(error.message || "Unable to save course"),
  });
}

export function useUnsaveCourse(userId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (courseId: string) => apiDelete<void>(`/api/saved-courses/${courseId}`),
    onSuccess: () => {
      if (userId) queryClient.invalidateQueries({ queryKey: savedCoursesKeys.byUser(userId) });
      toast.success("Removed from saved courses");
    },
    onError: (error: Error) => toast.error(error.message || "Unable to remove saved course"),
  });
}
