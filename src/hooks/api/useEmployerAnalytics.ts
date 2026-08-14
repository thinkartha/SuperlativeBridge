import { useQuery } from "@tanstack/react-query";
import { apiGet, API_BASE_URL } from "@/lib/api";
import type { EmployerAnalyticsFilters, EmployerAnalyticsResponse, EmployerAnalyticsExportDataset } from "@/types/api";

const AUTH_STORAGE_KEY = "sb_auth";

function getToken(): string | undefined {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as { token?: string };
    return parsed.token;
  } catch {
    return undefined;
  }
}

export const employerAnalyticsKeys = {
  all: ["employer-analytics"] as const,
  detail: (filters?: EmployerAnalyticsFilters) => ["employer-analytics", "detail", filters] as const,
};

export function useEmployerAnalytics(filters?: EmployerAnalyticsFilters) {
  return useQuery({
    queryKey: employerAnalyticsKeys.detail(filters),
    queryFn: () =>
      apiGet<EmployerAnalyticsResponse>("/api/employer/analytics", filters as Record<string, unknown>),
  });
}

export async function exportEmployerAnalytics(
  dataset: EmployerAnalyticsExportDataset,
  filters?: EmployerAnalyticsFilters
): Promise<void> {
  const params = new URLSearchParams();
  params.set("dataset", dataset);
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") params.set(key, String(value));
    });
  }

  const path = `/api/employer/analytics/export?${params.toString()}`;
  const url = /^https?:\/\//.test(API_BASE_URL) ? `${API_BASE_URL}${path}` : path;
  const token = getToken();

  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  if (!res.ok) {
    throw new Error(`Export failed with status ${res.status}`);
  }

  const blob = await res.blob();
  const objectUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = `employer-analytics-${dataset}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(objectUrl);
}
