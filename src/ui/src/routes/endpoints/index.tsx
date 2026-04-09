import { createQuery } from "@tanstack/solid-query";
import { A } from "@solidjs/router";
import { For, createSignal } from "solid-js";
import { MessageBanner } from "../../components/MessageBanner";
import { getApplications, getChains, getEndpoints, getEnvironmentLookups } from "../../lib/api";
import { queryKeys } from "../../lib/query";
import type { HostEnvironment, LookupItem, ProviderListItem } from "../../lib/types";

export default function EndpointsPage() {
  const [applicationId, setApplicationId] = createSignal("");
  const [chainId, setChainId] = createSignal("");
  const [environment, setEnvironment] = createSignal<HostEnvironment>("Development");
  const applicationsQuery = createQuery(() => ({
    queryKey: queryKeys.applications,
    queryFn: getApplications,
  }));
  const chainsQuery = createQuery(() => ({
    queryKey: queryKeys.chains,
    queryFn: getChains,
  }));
  const environmentsQuery = createQuery(() => ({
    queryKey: queryKeys.environments,
    queryFn: getEnvironmentLookups,
  }));
  const rowsQuery = createQuery(() => ({
    queryKey: queryKeys.endpoints(applicationId() || undefined, chainId() || undefined, environment()),
    queryFn: () => getEndpoints({ applicationId: applicationId() || undefined, chainId: chainId() || undefined, environment: environment() }),
  }));
  const currentError = () => (applicationsQuery.error instanceof Error ? applicationsQuery.error.message : null)
    ?? (chainsQuery.error instanceof Error ? chainsQuery.error.message : null)
    ?? (environmentsQuery.error instanceof Error ? environmentsQuery.error.message : null)
    ?? (rowsQuery.error instanceof Error ? rowsQuery.error.message : null);

  return (
    <div class="stack">
      <div class="page-header">
        <div>
          <h1>Endpoints</h1>
          <p class="muted">Browse the full endpoint inventory and jump into the focused editor for each record.</p>
        </div>
        <A class="button" href="/endpoints/new">New Endpoint</A>
      </div>

      <MessageBanner message={currentError()} tone="error" />

      <section class="panel stack">
        <h2>Filters</h2>
        <div class="form-grid">
          <div class="form-field">
            <label>Application</label>
            <select class="select" value={applicationId()} onInput={(event) => setApplicationId(event.currentTarget.value)}>
              <option value="">All available</option>
              <For each={applicationsQuery.data ?? []}>{(item) => <option value={item.id}>{item.name}</option>}</For>
            </select>
          </div>
          <div class="form-field">
            <label>Chain</label>
            <select class="select" value={chainId()} onInput={(event) => setChainId(event.currentTarget.value)}>
              <option value="">All available</option>
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

      <section class="panel table-wrap">
        <table>
          <thead><tr><th>Application</th><th>Chain</th><th>Type</th><th>Provider</th><th>Address</th><th>Updated</th><th>Actions</th></tr></thead>
          <tbody>
            <For each={rowsQuery.data ?? []}>{(row) => (
              <tr>
                <td>{row.application}</td>
                <td>{row.chain}</td>
                <td>{row.type}</td>
                <td>{row.provider}</td>
                <td class="mono">{row.address}</td>
                <td>{new Date(row.updatedUtc).toLocaleString()}</td>
                <td><A class="button secondary" href={`/endpoints/edit?type=${encodeURIComponent(row.type)}&id=${encodeURIComponent(row.id)}`}>Edit</A></td>
              </tr>
            )}</For>
          </tbody>
        </table>
      </section>
    </div>
  );
}
