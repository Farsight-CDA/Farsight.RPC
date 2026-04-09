import { createQuery } from "@tanstack/solid-query";
import { A, useNavigate, useSearchParams } from "@solidjs/router";
import { createMemo, createSignal } from "solid-js";
import { EndpointForm } from "../../components/EndpointForm";
import { MessageBanner } from "../../components/MessageBanner";
import { createRpc, getApplications, getChains, getEndpointTypeLookups, getEnvironmentLookups, getProviders, getTracingModeLookups } from "../../lib/api";
import { queryKeys } from "../../lib/query";
import type { LookupItem, ProviderEditModel, ProviderRateLimitRow } from "../../lib/types";

const defaultModel = (type = "RealTime"): ProviderEditModel => ({
  type,
  environment: "Development",
  applicationId: "",
  chainId: "",
  providerId: "",
  address: "",
  indexerStepSize: null,
  dexIndexStepSize: null,
  indexBlockOffset: null,
  tracingMode: "Unknown",
});

export default function NewEndpointPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialType = Array.isArray(searchParams.type) ? searchParams.type[0] : searchParams.type;
  const [model, setModel] = createSignal<ProviderEditModel>(defaultModel(initialType || "RealTime"));
  const [message, setMessage] = createSignal<string | null>(null);
  const [error, setError] = createSignal<string | null>(null);
  const applicationsQuery = createQuery(() => ({ queryKey: queryKeys.applications, queryFn: getApplications }));
  const chainsQuery = createQuery(() => ({ queryKey: queryKeys.chains, queryFn: getChains }));
  const providersQuery = createQuery(() => ({ queryKey: queryKeys.providers, queryFn: getProviders }));
  const environmentsQuery = createQuery(() => ({ queryKey: queryKeys.environments, queryFn: getEnvironmentLookups }));
  const endpointTypesQuery = createQuery(() => ({ queryKey: queryKeys.endpointTypes, queryFn: getEndpointTypeLookups }));
  const tracingModesQuery = createQuery(() => ({ queryKey: queryKeys.tracingModes, queryFn: getTracingModeLookups }));
  const providers = createMemo<LookupItem[]>(() => (providersQuery.data ?? []).map((item: ProviderRateLimitRow) => ({ id: item.providerId, name: item.provider })));
  const currentError = () => error()
    ?? (applicationsQuery.error instanceof Error ? applicationsQuery.error.message : null)
    ?? (chainsQuery.error instanceof Error ? chainsQuery.error.message : null)
    ?? (providersQuery.error instanceof Error ? providersQuery.error.message : null)
    ?? (environmentsQuery.error instanceof Error ? environmentsQuery.error.message : null)
    ?? (endpointTypesQuery.error instanceof Error ? endpointTypesQuery.error.message : null)
    ?? (tracingModesQuery.error instanceof Error ? tracingModesQuery.error.message : null);

  const updateField = <K extends keyof ProviderEditModel>(key: K, value: ProviderEditModel[K]) => {
    setModel((current) => ({ ...current, [key]: value }));
  };

  const save = async (event: SubmitEvent) => {
    event.preventDefault();
    try {
      await createRpc(model());
      navigate("/endpoints", { replace: true });
    }
    catch(err) {
      setError(err instanceof Error ? err.message : "Failed to save endpoint.");
    }
  };

  return (
    <div class="space-y-6">
      <div>
        <h1 class="text-2xl text-white">New Endpoint</h1>
        <p class="text-sm text-slate-400">Create a new RPC endpoint with the full schema editor.</p>
      </div>
      <MessageBanner message={message()} tone="success" />
      <MessageBanner message={currentError()} tone="error" />
      <form class="space-y-5 rounded border border-white/10 bg-slate-900 p-5" onSubmit={save}>
        <EndpointForm
          model={model()}
          applications={applicationsQuery.data ?? []}
          chains={chainsQuery.data ?? []}
          providers={providers()}
          environments={environmentsQuery.data ?? []}
          endpointTypes={endpointTypesQuery.data ?? []}
          tracingModes={tracingModesQuery.data ?? []}
          onChange={updateField}
        />
        <div class="flex gap-3">
          <button class="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-500" type="submit">Save</button>
          <A class="rounded border border-white/10 px-4 py-2 text-sm hover:bg-white/10" href="/endpoints">Cancel</A>
        </div>
      </form>
    </div>
  );
}
