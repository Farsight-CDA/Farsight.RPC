import { For, createSignal, onMount } from "solid-js";
import { MessageBanner } from "../components/MessageBanner";
import { createProvider, deleteProvider, getProviders, saveProviderRateLimit } from "../lib/api";
import type { ProviderRateLimitRow } from "../lib/types";

export default function ProvidersAdminPage() {
  const [rows, setRows] = createSignal<ProviderRateLimitRow[]>([]);
  const [name, setName] = createSignal("");
  const [rateLimit, setRateLimit] = createSignal("");
  const [message, setMessage] = createSignal<string | null>(null);
  const [error, setError] = createSignal<string | null>(null);

  const load = async () => setRows(await getProviders());

  onMount(async () => {
    try {
      await load();
    }
    catch(err) {
      setError(err instanceof Error ? err.message : "Failed to load providers.");
    }
  });

  const submit = async (event: SubmitEvent) => {
    event.preventDefault();
    try {
      await createProvider(name(), rateLimit() ? Number(rateLimit()) : null);
      setName("");
      setRateLimit("");
      setMessage("Provider created.");
      setError(null);
      await load();
    }
    catch(err) {
      setError(err instanceof Error ? err.message : "Failed to create provider.");
    }
  };

  const saveRateLimit = async (row: ProviderRateLimitRow, value: string) => {
    try {
      await saveProviderRateLimit(row.providerId, value ? Number(value) : null);
      setMessage(`Updated rate limit for ${row.provider}.`);
      setError(null);
      await load();
    }
    catch(err) {
      setError(err instanceof Error ? err.message : "Failed to save rate limit.");
    }
  };

  const remove = async (row: ProviderRateLimitRow) => {
    if(!window.confirm(`Delete provider ${row.provider}?`)) {
      return;
    }

    try {
      await deleteProvider(row.providerId);
      setMessage("Provider deleted.");
      setError(null);
      await load();
    }
    catch(err) {
      setError(err instanceof Error ? err.message : "Failed to delete provider.");
    }
  };

  return (
    <div class="stack">
      <div class="page-header"><div><h1>Providers</h1><p class="muted">Manage provider definitions and shared request budgets.</p></div></div>
      <MessageBanner message={message()} tone="success" />
      <MessageBanner message={error()} tone="error" />
      <section class="panel stack">
        <h2>New Provider</h2>
        <form class="row" onSubmit={submit}>
          <input class="input" value={name()} onInput={(event) => setName(event.currentTarget.value)} placeholder="Alchemy" />
          <input class="input" type="number" value={rateLimit()} onInput={(event) => setRateLimit(event.currentTarget.value)} placeholder="Rate limit" />
          <button class="button" type="submit">Add Provider</button>
        </form>
      </section>
      <section class="panel table-wrap">
        <table>
          <thead><tr><th>Name</th><th>Rate Limit</th><th>Actions</th></tr></thead>
          <tbody>
            <For each={rows()}>{(row) => {
              const [currentRateLimit, setCurrentRateLimit] = createSignal(row.rateLimit?.toString() ?? "");
              return (
                <tr>
                  <td>{row.provider}</td>
                  <td><input class="input" type="number" value={currentRateLimit()} onInput={(event) => setCurrentRateLimit(event.currentTarget.value)} /></td>
                  <td>
                    <div class="actions">
                      <button class="button secondary" type="button" onClick={() => saveRateLimit(row, currentRateLimit())}>Save</button>
                      <button class="button danger" type="button" onClick={() => remove(row)}>Delete</button>
                    </div>
                  </td>
                </tr>
              );
            }}</For>
          </tbody>
        </table>
      </section>
    </div>
  );
}
