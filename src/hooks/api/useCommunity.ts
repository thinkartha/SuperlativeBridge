import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import type { CommunityData } from "@/types/api";

export const communityKeys = {
  all: ["community"] as const,
};

export function useCommunity() {
  return useQuery({
    queryKey: communityKeys.all,
    queryFn: () => apiGet<CommunityData>("/api/community"),
  });
}
