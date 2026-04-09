import { createQuery, useQueryClient } from "@tanstack/solid-query";
import { For, Show, createSignal } from "solid-js";
import { MessageBanner } from "../components/MessageBanner";
import { createApiKey, getApiKeys, getApplications, getEnvironmentLookups, toggleApiKey } from "../lib/api";
import { queryKeys } from "../lib/query";
import type { ApiClientCreateResult, ApiClientListItem } from "../lib/types";

export default function AdminPage() {
  const queryClient = useQueryClient();
  const [applicationId, setApplicationId] = createSignal("");
  const [environment, setEnvironment] = createSignal("Development");
  const [createdKey, setCreatedKey] = createSignal<ApiClientCreateResult | null>(null);
  const [message, setMessage] = createSignal<string | null>(null);
  const [error, setError] = createSignal<string | null>(null);
  const applicationsQuery = createQuery(() => ({
    queryKey: queryKeys.applications,
    queryFn: getApplications,
  }));
  const environmentsQuery = createQuery(() => ({
    queryKey: queryKeys.environments,
    queryFn: getEnvironmentLookups,
  }));
  const rowsQuery = createQuery(() => ({
    queryKey: queryKeys.apiKeys,
    queryFn: getApiKeys,
  }));

  const currentError = () => error()
    ?? (applicationsQuery.error instanceof Error ? applicationsQuery.error.message : null)
    ?? (environmentsQuery.error instanceof Error ? environmentsQuery.error.message : null)
    ?? (rowsQuery.error instanceof Error ? rowsQuery.error.message : null);

  const generate = async (event: SubmitEvent) => {
    event.preventDefault();
    try {
      const result = await createApiKey(applicationId(), environment());
      setCreatedKey(result);
      setMessage("API key generated. Copy it now; the backend will not reveal it again.");
      setError(null);
      await queryClient.invalidateQueries({ queryKey: queryKeys.apiKeys });
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
      await queryClient.invalidateQueries({ queryKey: queryKeys.apiKeys });
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
    <div class="space-y-6">
      <div>
        <h1 class="text-2xl text-white">API Keys</h1>
        <p class="text-sm text-slate-400">Generate and toggle SDK API keys scoped by application and environment.</p>
      </div>
      <MessageBanner message={message()} tone="success" />
      <MessageBanner message={currentError()} tone="error" />
      <section class="rounded border border-white/10 bg-slate-900 p-5">
        <h2 class="text-lg text-white mb-4">Generate Key</h2>
        <form class="grid gap-4 lg:grid-cols-3" onSubmit={generate}>
          <div class="grid gap-2">
            <label class="text-sm text-slate-300">Application</label>
            <select class="w-full rounded border border-white/10 bg-slate-950 px-3 py-2 text-sm" value={applicationId()} onInput={(event) => setApplicationId(event.currentTarget.value)}>
              <option value="">Select application</option>
              <For each={applicationsQuery.data ?? []}>{(item) => <option value={item.id}>{item.name}</option>}</For>
            </select>
          </div>
          <div class="grid gap-2">
            <label class="text-sm text-slate-300">Environment</label>
            <select class="w-full rounded border border-white/10 bg-slate-950 px-3 py-2 text-sm" value={environment()} onInput={(event) => setEnvironment(event.currentTarget.value)}>
              <For each={environmentsQuery.data ?? []}>{(item) => <option value={item}>{item}</option>}</For>
            </select>
          </div>
          <div class="lg:col-span-3">
            <button class="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-500 disabled:opacity-50" type="submit">Generate API Key</button>
          </div>
        </form>
        <Show when={createdKey()}>
          {(result) => (
            <div class="mt-4 flex items-center justify-between gap-3 rounded border border-emerald-500/30 bg-emerald-950 px-4 py-3 text-emerald-200">
              <span class="break-all font-mono text-xs">{result().apiKey}</span>
              <button class="rounded border border-white/10 px-3 py-1 text-sm hover:bg-white/10" type="button" onClick={() => copy(result().apiKey)}>Copy</button>
            </div>
          )}
        </Show>
      </section>
      <section class="rounded border border-white/10 bg-slate-900 p-5">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-white/10">
                <th class="px-4 py-2 text-left text-xs text-slate-400">Key</th>
                <th class="px-4 py-2 text-left text-xs text-slate-400">Application</th>
                <th class="px-4 py-2 text-left text-xs text-slate-400">Environment</th>
                <th class="px-4 py-2 text-left text-xs text-slate-400">Enabled</th>
                <th class="px-4 py-2 text-left text-xs text-slate-400">Created</th>
                <th class="px-4 py-2 text-left text-xs text-slate-400">Updated</th>
                <th class="px-4 py-2 text-left text-xs text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              <For each={rowsQuery.data ?? []}>{(row) => (
                <tr class="border-b border-white/5">
                  <td class="px-4 py-3 break-all font-mono text-xs text-slate-200">{row.apiKey}</td>
                  <td class="px-4 py-3 text-slate-200">{row.application ?? "Unknown"}</td>
                  <td class="px-4 py-3 text-slate-200">{row.environment ?? "Unknown"}</td>
                  <td class="px-4 py-3 text-slate-200">{row.isEnabled ? "Yes" : "No"}</td>
                  <td class="px-4 py-3 text-slate-200">{new Date(row.createdUtc).toLocaleString()}</td>
                  <td class="px-4 py-3 text-slate-200">{new Date(row.updatedUtc).toLocaleString()}</td>
                  <td class="px-4 py-3">
                    <div class="flex gap-2">
                      <button class="rounded border border-white/10 px-3 py-1 text-sm hover:bg-white/10" type="button" onClick={() => copy(row.apiKey)}>Copy</button>
                      <button class="rounded border border-white/10 px-3 py-1 text-sm hover:bg-white/10" type="button" onClick={() => toggle(row)}>{row.isEnabled ? "Disable" : "Enable"}</button>
                    </div>
                  </td>
                </tr>
              )}</For>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
