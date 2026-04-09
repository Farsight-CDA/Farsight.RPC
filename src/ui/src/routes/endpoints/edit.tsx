import { createQuery, useQueryClient } from "@tanstack/solid-query";
import { useNavigate, useSearchParams } from "@solidjs/router";
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
    <div class="stack">
      <div class="page-header"><div><h1>Edit Endpoint</h1><p class="muted">Update the endpoint shape and provider assignment.</p></div></div>
      <MessageBanner message={message()} tone="success" />
      <MessageBanner message={currentError()} tone="error" />
      <Show when={model()} fallback={<div class="panel">Loading endpoint...</div>}>
        {(current) => (
          <form class="panel stack" onSubmit={save}>
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
            <div class="actions">
              <button class="button" type="submit">Save</button>
              <button class="button danger" type="button" onClick={remove}>Delete</button>
            </div>
          </form>
        )}
      </Show>
    </div>
  );
}
