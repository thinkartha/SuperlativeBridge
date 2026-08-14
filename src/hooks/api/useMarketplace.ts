import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import type { MarketplaceEntry, MarketplaceFilters } from "@/types/api";

export const marketplaceKeys = {
  list: (filters?: MarketplaceFilters) => ["marketplace", "list", filters] as const,
};

export function useMarketplace(filters?: MarketplaceFilters) {
  return useQuery({
    queryKey: marketplaceKeys.list(filters),
    queryFn: () => apiGet<MarketplaceEntry[]>("/api/marketplace", filters as Record<string, unknown>),
  });
}
