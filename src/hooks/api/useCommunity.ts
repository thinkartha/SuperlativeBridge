import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiGet, apiPost } from "@/lib/api";
import type { CommunityData, CommunityEvent } from "@/types/api";

export const communityKeys = {
  all: ["community"] as const,
};

export function useCommunity() {
  return useQuery({
    queryKey: communityKeys.all,
    queryFn: () => apiGet<CommunityData>("/api/community"),
  });
}

export function useRsvpEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (eventId: string) =>
      apiPost<{ event: CommunityEvent; message: string }>(
        `/api/community/events/${eventId}/rsvp`,
        {},
      ),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: communityKeys.all });
      toast.success(data.message || "RSVP confirmed");
    },
    onError: (error: Error) =>
      toast.error(error.message || "Unable to RSVP — sign in and try again"),
  });
}
