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
  rpcEditorLookups: ["rpc-editor", "lookups"] as const,
  rpcs: (applicationId: string | undefined, chain: string | undefined, environment: string) => ["rpcs", applicationId ?? "", chain ?? "", environment] as const,
  rpc: (type: string | undefined, id: string | undefined) => ["rpc", type ?? "", id ?? ""] as const,
};
