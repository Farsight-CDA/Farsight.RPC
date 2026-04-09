import { createQuery, useQueryClient } from "@tanstack/solid-query";
import { A } from "@solidjs/router";
import { For, Show, createMemo, createSignal } from "solid-js";
import { MessageBanner } from "../components/MessageBanner";
import { createEndpoint, deleteEndpoint, getApplications, getChains, getEndpoints, getEndpointTypeLookups, getEnvironmentLookups, getProviders } from "../lib/api";
import { queryKeys } from "../lib/query";
import type { HostEnvironment, LookupItem, ProviderListItem, ProviderRateLimitRow, RpcEndpointType } from "../lib/types";

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const [message, setMessage] = createSignal<string | null>(null);
  const [error, setError] = createSignal<string | null>(null);
  const [applicationId, setApplicationId] = createSignal("");
  const [chainId, setChainId] = createSignal("");
  const [environment, setEnvironment] = createSignal<HostEnvironment>("Development");
  const [type, setType] = createSignal<RpcEndpointType>("RealTime");
  const [providerId, setProviderId] = createSignal("");
  const [address, setAddress] = createSignal("");

  const canQuery = createMemo(() => Boolean(applicationId() && chainId()));
  const applicationsQuery = createQuery(() => ({
    queryKey: queryKeys.applications,
    queryFn: getApplications,
  }));
  const chainsQuery = createQuery(() => ({
    queryKey: queryKeys.chains,
    queryFn: getChains,
  }));
  const providersQuery = createQuery(() => ({
    queryKey: queryKeys.providers,
    queryFn: getProviders,
  }));
  const environmentsQuery = createQuery(() => ({
    queryKey: queryKeys.environments,
    queryFn: getEnvironmentLookups,
  }));
  const endpointTypesQuery = createQuery(() => ({
    queryKey: queryKeys.endpointTypes,
    queryFn: getEndpointTypeLookups,
  }));
  const rowsQuery = createQuery(() => ({
    queryKey: queryKeys.endpoints(applicationId() || undefined, chainId() || undefined, environment()),
    queryFn: () => getEndpoints({ applicationId: applicationId(), chainId: chainId(), environment: environment() }),
    enabled: canQuery(),
  }));
  const rows = () => rowsQuery.data ?? [];
  const currentError = () => error()
    ?? (applicationsQuery.error instanceof Error ? applicationsQuery.error.message : null)
    ?? (chainsQuery.error instanceof Error ? chainsQuery.error.message : null)
    ?? (providersQuery.error instanceof Error ? providersQuery.error.message : null)
    ?? (environmentsQuery.error instanceof Error ? environmentsQuery.error.message : null)
    ?? (endpointTypesQuery.error instanceof Error ? endpointTypesQuery.error.message : null)
    ?? (rowsQuery.error instanceof Error ? rowsQuery.error.message : null);

  const addEndpoint = async (event: SubmitEvent) => {
    event.preventDefault();
    setMessage(null);
    setError(null);

    try {
      await createEndpoint({
        type: type(),
        environment: environment(),
        applicationId: applicationId(),
        chainId: chainId(),
        providerId: providerId(),
        address: address(),
        indexerStepSize: null,
        dexIndexStepSize: null,
        indexBlockOffset: null,
        tracingMode: "Unknown",
      });
      setAddress("");
      setMessage("RPC endpoint added.");
      await queryClient.invalidateQueries({ queryKey: queryKeys.endpoints(applicationId(), chainId(), environment()) });
    }
    catch(err) {
      setError(err instanceof Error ? err.message : "Failed to add endpoint.");
    }
  };

  const removeEndpoint = async (row: ProviderListItem) => {
    if(!window.confirm(`Delete ${row.provider} ${row.type} endpoint?`)) {
      return;
    }

    try {
      await deleteEndpoint(row.type, row.id);
      setMessage("RPC endpoint removed.");
      setError(null);
      await queryClient.invalidateQueries({ queryKey: queryKeys.endpoints(applicationId(), chainId(), environment()) });
    }
    catch(err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    }
  };

  return (
    <div class="stack">
      <div class="page-header">
        <div>
          <h1>Dashboard</h1>
          <p class="muted">Select an application, chain, and environment to manage live endpoint assignments.</p>
        </div>
      </div>

      <MessageBanner message={message()} tone="success" />
      <MessageBanner message={currentError()} tone="error" />

      <section class="panel stack">
        <h2>Selection</h2>
        <div class="form-grid">
          <div class="form-field">
            <label>Application</label>
            <select class="select" value={applicationId()} onInput={(event) => setApplicationId(event.currentTarget.value)}>
              <option value="">Select application</option>
              <For each={applicationsQuery.data ?? []}>{(item) => <option value={item.id}>{item.name}</option>}</For>
            </select>
          </div>
          <div class="form-field">
            <label>Chain</label>
            <select class="select" value={chainId()} onInput={(event) => setChainId(event.currentTarget.value)}>
              <option value="">Select chain</option>
              <For each={chainsQuery.data ?? []}>{(item) => <option value={item.id}>{item.name}</option>}</For>
            </select>
          </div>
          <div class="form-field">
            <label>Environment</label>
            <select class="select" value={environment()} onInput={(event) => setEnvironment(event.currentTarget.value)}>
              <For each={environmentsQuery.data ?? []}>{(item) => <option value={item}>{item}</option>}</For>
            </select>
          </div>
        </div>
      </section>

      <section class="panel stack">
        <div class="page-header">
          <div>
            <h2>Quick Add</h2>
            <p class="muted">Create a new endpoint against the current selection.</p>
          </div>
          <A class="button ghost" href="/endpoints/new">Open full editor</A>
        </div>
        <form class="form-grid" onSubmit={addEndpoint}>
          <div class="form-field">
            <label>Type</label>
            <select class="select" value={type()} onInput={(event) => setType(event.currentTarget.value)}>
              <For each={endpointTypesQuery.data ?? []}>{(item) => <option value={item}>{item}</option>}</For>
            </select>
          </div>
          <div class="form-field">
            <label>Provider</label>
            <select class="select" value={providerId()} onInput={(event) => setProviderId(event.currentTarget.value)}>
              <option value="">Select provider</option>
              <For each={providersQuery.data ?? []}>{(item) => <option value={item.providerId}>{item.provider}</option>}</For>
            </select>
          </div>
          <div class="form-field full">
            <label>Address</label>
            <input class="input mono" value={address()} onInput={(event) => setAddress(event.currentTarget.value)} />
          </div>
          <div class="actions">
            <button class="button" type="submit" disabled={!canQuery()}>Add RPC Endpoint</button>
          </div>
        </form>
      </section>

      <section class="panel stack">
        <div class="page-header">
          <div>
            <h2>Matching Endpoints</h2>
            <p class="muted">Ordered by type, provider, and most recently updated.</p>
          </div>
        </div>
        <Show when={rows().length > 0} fallback={<div class="muted">No endpoints match the current selection.</div>}>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Provider</th>
                  <th>Address</th>
                  <th>Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <For each={rows()}>{(row) => (
                  <tr>
                    <td>{row.type}</td>
                    <td>{row.provider}</td>
                    <td class="mono">{row.address}</td>
                    <td>{new Date(row.updatedUtc).toLocaleString()}</td>
                    <td>
                      <div class="actions">
                        <A class="button secondary" href={`/endpoints/edit?type=${encodeURIComponent(row.type)}&id=${encodeURIComponent(row.id)}`}>Edit</A>
                        <button class="button danger" type="button" onClick={() => removeEndpoint(row)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                )}</For>
              </tbody>
            </table>
          </div>
        </Show>
      </section>
    </div>
  );
}
