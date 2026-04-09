import { createQuery, useQueryClient } from "@tanstack/solid-query";
import { For, createSignal } from "solid-js";
import { MessageBanner } from "../components/MessageBanner";
import { createProvider, deleteProvider, getProviders, saveProviderRateLimit } from "../lib/api";
import { queryKeys } from "../lib/query";
import type { ProviderRateLimitRow } from "../lib/types";

export default function ProvidersAdminPage() {
  const queryClient = useQueryClient();
  const [name, setName] = createSignal("");
  const [rateLimit, setRateLimit] = createSignal("");
  const [message, setMessage] = createSignal<string | null>(null);
  const [error, setError] = createSignal<string | null>(null);
  const rowsQuery = createQuery(() => ({
    queryKey: queryKeys.providers,
    queryFn: getProviders,
  }));

  const currentError = () => error() ?? (rowsQuery.error instanceof Error ? rowsQuery.error.message : null);

  const submit = async (event: SubmitEvent) => {
    event.preventDefault();
    try {
      const parsedRateLimit = Number(rateLimit());
      if(!Number.isInteger(parsedRateLimit) || parsedRateLimit <= 0) {
        throw new Error("Rate limit must be greater than 0.");
      }

      await createProvider(name(), parsedRateLimit);
      setName("");
      setRateLimit("");
      setMessage("Provider created.");
      setError(null);
      await queryClient.invalidateQueries({ queryKey: queryKeys.providers });
    }
    catch(err) {
      setError(err instanceof Error ? err.message : "Failed to create provider.");
    }
  };

  const saveRateLimit = async (row: ProviderRateLimitRow, value: string) => {
    try {
      const parsedRateLimit = Number(value);
      if(!Number.isInteger(parsedRateLimit) || parsedRateLimit <= 0) {
        throw new Error("Rate limit must be greater than 0.");
      }

      await saveProviderRateLimit(row.providerId, parsedRateLimit);
      setMessage(`Updated rate limit for ${row.provider}.`);
      setError(null);
      await queryClient.invalidateQueries({ queryKey: queryKeys.providers });
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
      await queryClient.invalidateQueries({ queryKey: queryKeys.providers });
    }
    catch(err) {
      setError(err instanceof Error ? err.message : "Failed to delete provider.");
    }
  };

  return (
    <div class="space-y-6">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div class="space-y-2"><h1 class="text-3xl font-semibold tracking-tight text-white">Providers</h1><p class="text-sm leading-6 text-slate-400">Manage provider definitions and shared request budgets.</p></div></div>
      <MessageBanner message={message()} tone="success" />
      <MessageBanner message={currentError()} tone="error" />
      <section class="space-y-5 rounded-[1.5rem] border border-white/10 bg-slate-900/80 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.22)] backdrop-blur">
        <h2 class="text-xl font-semibold tracking-tight text-white">New Provider</h2>
        <form class="grid gap-3 sm:grid-cols-[minmax(0,1fr)_12rem_auto]" onSubmit={submit}>
          <input class="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-slate-50 outline-none transition placeholder:text-slate-500 focus:border-blue-400/70 focus:ring-2 focus:ring-blue-500/30" value={name()} onInput={(event) => setName(event.currentTarget.value)} placeholder="Alchemy" />
          <input class="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-slate-50 outline-none transition placeholder:text-slate-500 focus:border-blue-400/70 focus:ring-2 focus:ring-blue-500/30" type="number" min="1" required value={rateLimit()} onInput={(event) => setRateLimit(event.currentTarget.value)} placeholder="Rate limit" />
          <button class="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-blue-50 shadow-lg shadow-blue-950/40 transition hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50 disabled:pointer-events-none disabled:opacity-60 sm:self-start" type="submit">Add Provider</button>
        </form>
      </section>
      <section class="overflow-hidden rounded-[1.5rem] border border-white/10 bg-slate-900/80 shadow-[0_24px_80px_rgba(0,0,0,0.22)] backdrop-blur">
        <div class="overflow-x-auto">
          <table class="min-w-full border-collapse text-sm">
            <thead class="bg-white/5"><tr><th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Name</th><th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Rate Limit</th><th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Actions</th></tr></thead>
            <tbody>
              <For each={rowsQuery.data ?? []}>{(row) => {
                const [currentRateLimit, setCurrentRateLimit] = createSignal(row.rateLimit.toString());
                return (
                  <tr>
                    <td class="border-t border-white/10 px-4 py-4 align-top text-slate-200">{row.provider}</td>
                    <td class="border-t border-white/10 px-4 py-4 align-top text-slate-200"><input class="max-w-40 rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-slate-50 outline-none transition placeholder:text-slate-500 focus:border-blue-400/70 focus:ring-2 focus:ring-blue-500/30" type="number" min="1" required value={currentRateLimit()} onInput={(event) => setCurrentRateLimit(event.currentTarget.value)} /></td>
                    <td class="border-t border-white/10 px-4 py-4 align-top text-slate-200">
                      <div class="flex flex-wrap gap-3">
                        <button class="inline-flex items-center justify-center rounded-2xl bg-slate-700/80 px-4 py-2.5 text-sm font-semibold text-slate-50 transition hover:bg-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50 disabled:pointer-events-none disabled:opacity-60" type="button" onClick={() => saveRateLimit(row, currentRateLimit())}>Save</button>
                        <button class="inline-flex items-center justify-center rounded-2xl bg-red-700 px-4 py-2.5 text-sm font-semibold text-red-50 transition hover:bg-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50 disabled:pointer-events-none disabled:opacity-60" type="button" onClick={() => remove(row)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              }}</For>
            </tbody>
          </table>
          {!rowsQuery.data?.length && <div class="rounded-2xl border border-dashed border-white/10 bg-white/5 px-4 py-6 text-sm text-slate-400">No providers created yet.</div>}
        </div>
      </section>
    </div>
  );
}
