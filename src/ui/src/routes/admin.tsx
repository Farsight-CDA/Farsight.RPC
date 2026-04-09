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
      <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div class="space-y-2"><h1 class="text-3xl font-semibold tracking-tight text-white">API Keys</h1><p class="text-sm leading-6 text-slate-400">Generate and toggle SDK API keys scoped by application and environment.</p></div></div>
      <MessageBanner message={message()} tone="success" />
      <MessageBanner message={currentError()} tone="error" />
      <section class="space-y-5 rounded-[1.5rem] border border-white/10 bg-slate-900/80 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.22)] backdrop-blur">
        <h2 class="text-xl font-semibold tracking-tight text-white">Generate Key</h2>
        <form class="grid gap-4 lg:grid-cols-3" onSubmit={generate}>
          <div class="grid gap-2">
            <label class="text-sm font-medium text-slate-300">Application</label>
            <select class="w-full appearance-none rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-slate-50 outline-none transition placeholder:text-slate-500 focus:border-blue-400/70 focus:ring-2 focus:ring-blue-500/30" value={applicationId()} onInput={(event) => setApplicationId(event.currentTarget.value)}>
              <option value="">Select application</option>
              <For each={applicationsQuery.data ?? []}>{(item) => <option value={item.id}>{item.name}</option>}</For>
            </select>
          </div>
          <div class="grid gap-2">
            <label class="text-sm font-medium text-slate-300">Environment</label>
            <select class="w-full appearance-none rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-slate-50 outline-none transition placeholder:text-slate-500 focus:border-blue-400/70 focus:ring-2 focus:ring-blue-500/30" value={environment()} onInput={(event) => setEnvironment(event.currentTarget.value)}>
              <For each={environmentsQuery.data ?? []}>{(item) => <option value={item}>{item}</option>}</For>
            </select>
          </div>
          <div class="flex flex-wrap gap-3 lg:col-span-3">
            <button class="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-blue-50 shadow-lg shadow-blue-950/40 transition hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50 disabled:pointer-events-none disabled:opacity-60" type="submit">Generate API Key</button>
          </div>
        </form>
        <Show when={createdKey()}>
          {(result) => (
            <div class="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-950/40 px-4 py-4 text-emerald-100">
              <span class="break-all font-mono text-[0.95em]">{result().apiKey}</span>
              <button class="inline-flex items-center justify-center rounded-2xl bg-slate-700/80 px-4 py-2.5 text-sm font-semibold text-slate-50 transition hover:bg-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50 disabled:pointer-events-none disabled:opacity-60" type="button" onClick={() => copy(result().apiKey)}>Copy</button>
            </div>
          )}
        </Show>
      </section>
      <section class="overflow-hidden rounded-[1.5rem] border border-white/10 bg-slate-900/80 shadow-[0_24px_80px_rgba(0,0,0,0.22)] backdrop-blur">
        <div class="overflow-x-auto">
          <table class="min-w-full border-collapse text-sm">
            <thead class="bg-white/5"><tr><th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Key</th><th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Application</th><th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Environment</th><th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Enabled</th><th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Created</th><th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Updated</th><th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Actions</th></tr></thead>
            <tbody>
              <For each={rowsQuery.data ?? []}>{(row) => (
                <tr>
                  <td class="border-t border-white/10 px-4 py-4 align-top break-all font-mono text-[0.95em] text-slate-200">{row.apiKey}</td>
                  <td class="border-t border-white/10 px-4 py-4 align-top text-slate-200">{row.application ?? "Unknown"}</td>
                  <td class="border-t border-white/10 px-4 py-4 align-top text-slate-200">{row.environment ?? "Unknown"}</td>
                  <td class="border-t border-white/10 px-4 py-4 align-top text-slate-200">{row.isEnabled ? "Yes" : "No"}</td>
                  <td class="border-t border-white/10 px-4 py-4 align-top text-slate-200">{new Date(row.createdUtc).toLocaleString()}</td>
                  <td class="border-t border-white/10 px-4 py-4 align-top text-slate-200">{new Date(row.updatedUtc).toLocaleString()}</td>
                  <td class="border-t border-white/10 px-4 py-4 align-top text-slate-200">
                    <div class="flex flex-wrap gap-3">
                      <button class="inline-flex items-center justify-center rounded-2xl bg-slate-700/80 px-4 py-2.5 text-sm font-semibold text-slate-50 transition hover:bg-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50 disabled:pointer-events-none disabled:opacity-60" type="button" onClick={() => copy(row.apiKey)}>Copy</button>
                      <button class="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50 disabled:pointer-events-none disabled:opacity-60" type="button" onClick={() => toggle(row)}>{row.isEnabled ? "Disable" : "Enable"}</button>
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
