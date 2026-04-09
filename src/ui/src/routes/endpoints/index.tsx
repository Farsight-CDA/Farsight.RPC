import { A } from "@solidjs/router";
import { For, createSignal, onMount } from "solid-js";
import { MessageBanner } from "../../components/MessageBanner";
import { getApplications, getChains, getEndpoints, getEnvironmentLookups } from "../../lib/api";
import type { HostEnvironment, LookupItem, ProviderListItem } from "../../lib/types";

export default function EndpointsPage() {
  const [applications, setApplications] = createSignal<LookupItem[]>([]);
  const [chains, setChains] = createSignal<LookupItem[]>([]);
  const [environments, setEnvironments] = createSignal<string[]>([]);
  const [rows, setRows] = createSignal<ProviderListItem[]>([]);
  const [applicationId, setApplicationId] = createSignal("");
  const [chainId, setChainId] = createSignal("");
  const [environment, setEnvironment] = createSignal<HostEnvironment>("Development");
  const [error, setError] = createSignal<string | null>(null);

  const loadLookups = async () => {
    const [apps, chainItems, environmentItems] = await Promise.all([getApplications(), getChains(), getEnvironmentLookups()]);
    setApplications(apps);
    setChains(chainItems);
    setEnvironments(environmentItems);
  };

  const loadRows = async () => {
    try {
      setRows(await getEndpoints({ applicationId: applicationId() || undefined, chainId: chainId() || undefined, environment: environment() }));
      setError(null);
    }
    catch(err) {
      setError(err instanceof Error ? err.message : "Failed to load endpoints.");
    }
  };

  onMount(async () => {
    await loadLookups();
    await loadRows();
  });

  return (
    <div class="stack">
      <div class="page-header">
        <div>
          <h1>Endpoints</h1>
          <p class="muted">Browse the full endpoint inventory and jump into the focused editor for each record.</p>
        </div>
        <A class="button" href="/endpoints/new">New Endpoint</A>
      </div>

      <MessageBanner message={error()} tone="error" />

      <section class="panel stack">
        <h2>Filters</h2>
        <div class="form-grid">
          <div class="form-field">
            <label>Application</label>
            <select class="select" value={applicationId()} onInput={(event) => setApplicationId(event.currentTarget.value)}>
              <option value="">All available</option>
              <For each={applications()}>{(item) => <option value={item.id}>{item.name}</option>}</For>
            </select>
          </div>
          <div class="form-field">
            <label>Chain</label>
            <select class="select" value={chainId()} onInput={(event) => setChainId(event.currentTarget.value)}>
              <option value="">All available</option>
              <For each={chains()}>{(item) => <option value={item.id}>{item.name}</option>}</For>
            </select>
          </div>
          <div class="form-field">
            <label>Environment</label>
            <select class="select" value={environment()} onInput={(event) => setEnvironment(event.currentTarget.value)}>
              <For each={environments()}>{(item) => <option value={item}>{item}</option>}</For>
            </select>
          </div>
        </div>
        <div class="actions">
          <button class="button" type="button" onClick={loadRows}>Apply Filters</button>
        </div>
      </section>

      <section class="panel table-wrap">
        <table>
          <thead><tr><th>Application</th><th>Chain</th><th>Type</th><th>Provider</th><th>Address</th><th>Updated</th><th>Actions</th></tr></thead>
          <tbody>
            <For each={rows()}>{(row) => (
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
