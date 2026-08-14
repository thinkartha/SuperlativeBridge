import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import type { Enrollment, QuizAttempt } from "@/types/api";

export const enrollmentsKeys = {
  all: ["enrollments"] as const,
  byUser: (userId: string) => ["enrollments", "user", userId] as const,
};

export function useEnrollments(userId?: string) {
  return useQuery({
    queryKey: enrollmentsKeys.byUser(userId ?? ""),
    queryFn: () => apiGet<Enrollment[]>(`/api/users/${userId}/enrollments`),
    enabled: !!userId,
  });
}

export function useEnroll(userId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (courseId: string) => apiPost<Enrollment>("/api/enrollments", { courseId }),
    onSuccess: () => {
      if (userId) queryClient.invalidateQueries({ queryKey: enrollmentsKeys.byUser(userId) });
      toast.success("Enrolled in course");
    },
    onError: (error: Error) => toast.error(error.message || "Unable to enroll in course"),
  });
}

export function useUpdateEnrollmentProgress(userId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: string; progress?: number; xp?: number; grade?: string; lastModuleId?: string }) =>
      apiPatch<Enrollment>(`/api/enrollments/${id}`, payload),
    onSuccess: () => {
      if (userId) queryClient.invalidateQueries({ queryKey: enrollmentsKeys.byUser(userId) });
      toast.success("Progress updated");
    },
    onError: (error: Error) => toast.error(error.message || "Unable to update progress"),
  });
}

export function useSubmitQuiz(userId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { quizId: string; answers: number[] }) =>
      apiPost<QuizAttempt>("/api/quiz-attempts", payload),
    onSuccess: (attempt) => {
      if (userId) queryClient.invalidateQueries({ queryKey: enrollmentsKeys.byUser(userId) });
      toast.success(attempt.passed ? `Passed with ${attempt.score}%` : `Scored ${attempt.score}% — try again`);
    },
    onError: (error: Error) => toast.error(error.message || "Unable to submit quiz"),
  });
}

export function useUnenroll(userId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete<void>(`/api/enrollments/${id}`),
    onSuccess: () => {
      if (userId) queryClient.invalidateQueries({ queryKey: enrollmentsKeys.byUser(userId) });
      toast.success("Unenrolled from course");
    },
    onError: (error: Error) => toast.error(error.message || "Unable to unenroll"),
  });
}
