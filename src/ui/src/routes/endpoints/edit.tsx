import { createQuery, useQueryClient } from "@tanstack/solid-query";
import { A, useNavigate, useSearchParams } from "@solidjs/router";
import { Show, createEffect, createMemo, createSignal } from "solid-js";
import { EndpointForm } from "../../components/EndpointForm";
import { MessageBanner } from "../../components/MessageBanner";
import { deleteEndpoint, getApplications, getChains, getEndpoint, getEndpointTypeLookups, getEnvironmentLookups, getProviders, getTracingModeLookups, updateEndpoint } from "../../lib/api";
import { queryKeys } from "../../lib/query";
import type { LookupItem, ProviderEditModel, ProviderRateLimitRow } from "../../lib/types";

export default function EditEndpointPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [model, setModel] = createSignal<ProviderEditModel | null>(null);
  const [message, setMessage] = createSignal<string | null>(null);
  const [error, setError] = createSignal<string | null>(null);
  const endpointId = createMemo(() => Array.isArray(searchParams.id) ? searchParams.id[0] : searchParams.id);
  const endpointType = createMemo(() => Array.isArray(searchParams.type) ? searchParams.type[0] : searchParams.type);
  const applicationsQuery = createQuery(() => ({ queryKey: queryKeys.applications, queryFn: getApplications }));
  const chainsQuery = createQuery(() => ({ queryKey: queryKeys.chains, queryFn: getChains }));
  const providersQuery = createQuery(() => ({ queryKey: queryKeys.providers, queryFn: getProviders }));
  const environmentsQuery = createQuery(() => ({ queryKey: queryKeys.environments, queryFn: getEnvironmentLookups }));
  const endpointTypesQuery = createQuery(() => ({ queryKey: queryKeys.endpointTypes, queryFn: getEndpointTypeLookups }));
  const tracingModesQuery = createQuery(() => ({ queryKey: queryKeys.tracingModes, queryFn: getTracingModeLookups }));
  const endpointQuery = createQuery(() => ({
    queryKey: queryKeys.endpoint(endpointType(), endpointId()),
    queryFn: () => {
      if(!endpointId() || !endpointType()) {
        throw new Error("Endpoint id and type are required.");
      }

      return getEndpoint(endpointType()!, endpointId()!);
    },
  }));
  const providers = createMemo<LookupItem[]>(() => (providersQuery.data ?? []).map((item: ProviderRateLimitRow) => ({ id: item.providerId, name: item.provider })));
  const currentError = () => error()
    ?? (applicationsQuery.error instanceof Error ? applicationsQuery.error.message : null)
    ?? (chainsQuery.error instanceof Error ? chainsQuery.error.message : null)
    ?? (providersQuery.error instanceof Error ? providersQuery.error.message : null)
    ?? (environmentsQuery.error instanceof Error ? environmentsQuery.error.message : null)
    ?? (endpointTypesQuery.error instanceof Error ? endpointTypesQuery.error.message : null)
    ?? (tracingModesQuery.error instanceof Error ? tracingModesQuery.error.message : null)
    ?? (endpointQuery.error instanceof Error ? endpointQuery.error.message : null);

  createEffect(() => {
    if(endpointQuery.data) {
      setModel(endpointQuery.data);
    }
  });

  const updateField = <K extends keyof ProviderEditModel>(key: K, value: ProviderEditModel[K]) => {
    setModel((current) => current ? { ...current, [key]: value } : current);
  };

  const save = async (event: SubmitEvent) => {
    event.preventDefault();
    if(!model()) {
      return;
    }

    try {
      await updateEndpoint(model()!);
      setMessage("Endpoint saved.");
      setError(null);
      await queryClient.invalidateQueries({ queryKey: queryKeys.endpoint(endpointType(), endpointId()) });
      await queryClient.invalidateQueries({ queryKey: ["endpoints"] });
    }
    catch(err) {
      setError(err instanceof Error ? err.message : "Failed to save endpoint.");
    }
  };

  const remove = async () => {
    if(!model() || !model()!.id) {
      return;
    }

    if(!window.confirm("Permanently delete this RPC endpoint?")) {
      return;
    }

    try {
      await deleteEndpoint(model()!.type, model()!.id!);
      navigate("/endpoints", { replace: true });
    }
    catch(err) {
      setError(err instanceof Error ? err.message : "Failed to delete endpoint.");
    }
  };

  return (
    <div class="space-y-6">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div class="space-y-2"><h1 class="text-3xl font-semibold tracking-tight text-white">Edit Endpoint</h1><p class="text-sm leading-6 text-slate-400">Update the endpoint shape and provider assignment.</p></div></div>
      <MessageBanner message={message()} tone="success" />
      <MessageBanner message={currentError()} tone="error" />
      <Show when={model()} fallback={<div class="rounded-[1.5rem] border border-white/10 bg-slate-900/80 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.22)] backdrop-blur">Loading endpoint...</div>}>
        {(current) => (
          <form class="space-y-5 rounded-[1.5rem] border border-white/10 bg-slate-900/80 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.22)] backdrop-blur" onSubmit={save}>
            <EndpointForm
              model={current()}
              applications={applicationsQuery.data ?? []}
              chains={chainsQuery.data ?? []}
              providers={providers()}
              environments={environmentsQuery.data ?? []}
              endpointTypes={endpointTypesQuery.data ?? []}
              tracingModes={tracingModesQuery.data ?? []}
              onChange={updateField}
            />
            <div class="flex flex-wrap gap-3">
              <button class="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-blue-50 shadow-lg shadow-blue-950/40 transition hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50 disabled:pointer-events-none disabled:opacity-60" type="submit">Save</button>
              <A class="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50 disabled:pointer-events-none disabled:opacity-60" href="/endpoints">Back</A>
              <button class="inline-flex items-center justify-center rounded-2xl bg-red-700 px-4 py-2.5 text-sm font-semibold text-red-50 transition hover:bg-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50 disabled:pointer-events-none disabled:opacity-60" type="button" onClick={remove}>Delete</button>
            </div>
          </form>
        )}
      </Show>
    </div>
  );
}
