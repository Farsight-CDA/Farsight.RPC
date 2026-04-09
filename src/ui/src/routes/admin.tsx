import { For, Show, createSignal, onMount } from "solid-js";
import { MessageBanner } from "../components/MessageBanner";
import { createApiKey, getApiKeys, getApplications, getEnvironmentLookups, toggleApiKey } from "../lib/api";
import type { ApiClientCreateResult, ApiClientListItem, LookupItem } from "../lib/types";

export default function AdminPage() {
  const [applications, setApplications] = createSignal<LookupItem[]>([]);
  const [environments, setEnvironments] = createSignal<string[]>([]);
  const [rows, setRows] = createSignal<ApiClientListItem[]>([]);
  const [applicationId, setApplicationId] = createSignal("");
  const [environment, setEnvironment] = createSignal("Development");
  const [createdKey, setCreatedKey] = createSignal<ApiClientCreateResult | null>(null);
  const [message, setMessage] = createSignal<string | null>(null);
  const [error, setError] = createSignal<string | null>(null);

  const load = async () => {
    const [appItems, environmentItems, keyRows] = await Promise.all([getApplications(), getEnvironmentLookups(), getApiKeys()]);
    setApplications(appItems);
    setEnvironments(environmentItems);
    setRows(keyRows);
  };

  onMount(async () => {
    try {
      await load();
    }
    catch(err) {
      setError(err instanceof Error ? err.message : "Failed to load API keys.");
    }
  });

  const generate = async (event: SubmitEvent) => {
    event.preventDefault();
    try {
      const result = await createApiKey(applicationId(), environment());
      setCreatedKey(result);
      setMessage("API key generated. Copy it now; the backend will not reveal it again.");
      setError(null);
      await load();
    }
    catch(err) {
      setError(err instanceof Error ? err.message : "Failed to create API key.");
    }
  };

  const toggle = async (row: ApiClientListItem) => {
    try {
      await toggleApiKey(row.id);
      setMessage(`${row.apiKey} updated.`);
      setError(null);
      await load();
    }
    catch(err) {
      setError(err instanceof Error ? err.message : "Failed to toggle API key.");
    }
  };

  const copy = async (value: string) => {
    await navigator.clipboard.writeText(value);
    setMessage("Copied to clipboard.");
    setError(null);
  };

  return (
    <div class="stack">
      <div class="page-header"><div><h1>API Keys</h1><p class="muted">Generate and toggle SDK API keys scoped by application and environment.</p></div></div>
      <MessageBanner message={message()} tone="success" />
      <MessageBanner message={error()} tone="error" />
      <section class="panel stack">
        <h2>Generate Key</h2>
        <form class="form-grid" onSubmit={generate}>
          <div class="form-field">
            <label>Application</label>
            <select class="select" value={applicationId()} onInput={(event) => setApplicationId(event.currentTarget.value)}>
              <option value="">Select application</option>
              <For each={applications()}>{(item) => <option value={item.id}>{item.name}</option>}</For>
            </select>
          </div>
          <div class="form-field">
            <label>Environment</label>
            <select class="select" value={environment()} onInput={(event) => setEnvironment(event.currentTarget.value)}>
              <For each={environments()}>{(item) => <option value={item}>{item}</option>}</For>
            </select>
          </div>
          <div class="actions">
            <button class="button" type="submit">Generate API Key</button>
          </div>
        </form>
        <Show when={createdKey()}>
          {(result) => (
            <div class="message success row">
              <span class="mono">{result().apiKey}</span>
              <button class="button secondary" type="button" onClick={() => copy(result().apiKey)}>Copy</button>
            </div>
          )}
        </Show>
      </section>
      <section class="panel table-wrap">
        <table>
          <thead><tr><th>Key</th><th>Application</th><th>Environment</th><th>Enabled</th><th>Created</th><th>Updated</th><th>Actions</th></tr></thead>
          <tbody>
            <For each={rows()}>{(row) => (
              <tr>
                <td class="mono">{row.apiKey}</td>
                <td>{row.application ?? "Unknown"}</td>
                <td>{row.environment ?? "Unknown"}</td>
                <td>{row.isEnabled ? "Yes" : "No"}</td>
                <td>{new Date(row.createdUtc).toLocaleString()}</td>
                <td>{new Date(row.updatedUtc).toLocaleString()}</td>
                <td>
                  <div class="actions">
                    <button class="button secondary" type="button" onClick={() => copy(row.apiKey)}>Copy</button>
                    <button class="button ghost" type="button" onClick={() => toggle(row)}>{row.isEnabled ? "Disable" : "Enable"}</button>
                  </div>
                </td>
              </tr>
            )}</For>
          </tbody>
        </table>
      </section>
    </div>
  );
}
