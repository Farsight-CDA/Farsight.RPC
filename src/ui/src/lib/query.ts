import { QueryClient } from "@tanstack/solid-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});

export const queryKeys = {
  applications: ["applications"] as const,
  chains: ["chains"] as const,
  providers: ["providers"] as const,
  environments: ["lookups", "environments"] as const,
  endpointTypes: ["lookups", "endpoint-types"] as const,
  tracingModes: ["lookups", "tracing-modes"] as const,
  apiKeys: ["api-keys"] as const,
  dashboardLookups: ["dashboard", "lookups"] as const,
  endpointEditorLookups: ["endpoint-editor", "lookups"] as const,
  endpoints: (applicationId: string | undefined, chainId: string | undefined, environment: string) => ["endpoints", applicationId ?? "", chainId ?? "", environment] as const,
  endpoint: (type: string | undefined, id: string | undefined) => ["endpoint", type ?? "", id ?? ""] as const,
};
