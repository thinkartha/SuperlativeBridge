import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiGet, apiPost, apiPut } from "@/lib/api";
import type {
  Integration,
  IntegrationPipeline,
  IntegrationsResponse,
  PipelineRun,
} from "@/types/api";

export const integrationsKeys = {
  all: ["integrations"] as const,
  detail: (id: string) => ["integrations", id] as const,
};

export function useIntegrations() {
  return useQuery({
    queryKey: integrationsKeys.all,
    queryFn: () => apiGet<IntegrationsResponse>("/api/integrations"),
  });
}

export function useIntegration(id?: string) {
  return useQuery({
    queryKey: integrationsKeys.detail(id ?? ""),
    queryFn: () => apiGet<Integration>(`/api/integrations/${id}`),
    enabled: !!id,
  });
}

export function useRunPipeline() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (pipelineId: string) =>
      apiPost<PipelineRun>(`/api/integrations/pipelines/${pipelineId}/run`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: integrationsKeys.all });
      toast.success("Pipeline run queued");
    },
    onError: (error: Error) =>
      toast.error(error.message || "Unable to run pipeline"),
  });
}

export function useUpdateIntegrationSettings(id?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      config?: Record<string, unknown>;
      status?: string;
      description?: string;
    }) => apiPut<Integration>(`/api/integrations/${id}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: integrationsKeys.all });
      if (id) {
        queryClient.invalidateQueries({ queryKey: integrationsKeys.detail(id) });
      }
      toast.success("Integration settings saved");
    },
    onError: (error: Error) =>
      toast.error(error.message || "Unable to save settings"),
  });
}

export function useUpdatePipelineSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      pipelineId,
      ...body
    }: {
      pipelineId: string;
      settings?: Record<string, unknown>;
      schedule?: string;
      description?: string;
      status?: string;
    }) =>
      apiPut<IntegrationPipeline>(
        `/api/integrations/pipelines/${pipelineId}`,
        body,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: integrationsKeys.all });
      toast.success("Pipeline settings saved");
    },
    onError: (error: Error) =>
      toast.error(error.message || "Unable to save pipeline settings"),
  });
}
