import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiGet, apiPatch, apiPost } from "@/lib/api";
import type { MentorAvailability, MentorBooking, MentorBookingStatus } from "@/types/api";

export const mentorBookingsKeys = {
  all: ["mentor-bookings"] as const,
  byUser: (userId: string) => ["mentor-bookings", "user", userId] as const,
  availability: (mentorId: string) => ["mentor-bookings", "availability", mentorId] as const,
};

export function useMentorBookings(userId?: string) {
  return useQuery({
    queryKey: mentorBookingsKeys.byUser(userId ?? ""),
    queryFn: () => apiGet<MentorBooking[]>(`/api/users/${userId}/mentor-bookings`),
    enabled: !!userId,
  });
}

export function useMentorSessionBookings(mentorId: string = "me") {
  return useQuery({
    queryKey: [...mentorBookingsKeys.all, "mentor", mentorId] as const,
    queryFn: () => apiGet<MentorBooking[]>(`/api/mentors/${mentorId}/bookings`),
  });
}

export function useMentorAvailability(mentorId?: string) {
  return useQuery({
    queryKey: mentorBookingsKeys.availability(mentorId ?? ""),
    queryFn: () => apiGet<MentorAvailability>(`/api/mentors/${mentorId}/availability`),
    enabled: !!mentorId,
  });
}

export interface CreateMentorBookingPayload {
  mentorId: string;
  scheduledAt: string;
  durationMinutes: 30 | 45 | 60;
  topic: string;
  notes?: string;
}

export function useCreateMentorBooking(userId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateMentorBookingPayload) => apiPost<MentorBooking>("/api/mentor-bookings", payload),
    onSuccess: () => {
      if (userId) queryClient.invalidateQueries({ queryKey: mentorBookingsKeys.byUser(userId) });
      toast.success("Booking requested");
    },
    onError: (error: Error) => toast.error(error.message || "Unable to book mentor session"),
  });
}

export function useUpdateMentorBookingStatus(userId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, scheduledAt }: { id: string; status: MentorBookingStatus; scheduledAt?: string }) =>
      apiPatch<MentorBooking>(`/api/mentor-bookings/${id}`, { status, scheduledAt }),
    onSuccess: () => {
      if (userId) queryClient.invalidateQueries({ queryKey: mentorBookingsKeys.byUser(userId) });
      queryClient.invalidateQueries({ queryKey: mentorBookingsKeys.all });
      toast.success("Booking updated");
    },
    onError: (error: Error) => toast.error(error.message || "Unable to update booking"),
  });
}
