import { createQuery, useQueryClient } from "@tanstack/solid-query";
import { For, createSignal } from "solid-js";
import { MessageBanner } from "../components/MessageBanner";
import { createProvider, deleteProvider, getProviders, updateProvider } from "../lib/api";
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

      await updateProvider(row.providerId, parsedRateLimit);
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
      <div>
        <h1 class="text-2xl text-white">Providers</h1>
        <p class="text-sm text-slate-400">Manage provider definitions and shared request budgets.</p>
      </div>
      <MessageBanner message={message()} tone="success" />
      <MessageBanner message={currentError()} tone="error" />
      <section class="rounded border border-white/10 bg-slate-900 p-5">
        <h2 class="text-lg text-white mb-4">New Provider</h2>
        <form class="flex gap-3" onSubmit={submit}>
          <input class="w-full rounded border border-white/10 bg-slate-950 px-3 py-2 text-sm" value={name()} onInput={(event) => setName(event.currentTarget.value)} placeholder="Alchemy" />
          <input class="w-32 rounded border border-white/10 bg-slate-950 px-3 py-2 text-sm" type="number" min="1" required value={rateLimit()} onInput={(event) => setRateLimit(event.currentTarget.value)} placeholder="Rate limit" />
          <button class="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-500" type="submit">Add Provider</button>
        </form>
      </section>
      <section class="rounded border border-white/10 bg-slate-900 p-5">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-white/10">
                <th class="px-4 py-2 text-left text-xs text-slate-400">Name</th>
                <th class="px-4 py-2 text-left text-xs text-slate-400">Rate Limit</th>
                <th class="px-4 py-2 text-left text-xs text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              <For each={rowsQuery.data ?? []}>{(row) => {
                const [currentRateLimit, setCurrentRateLimit] = createSignal(row.rateLimit.toString());
                return (
                  <tr class="border-b border-white/5">
                    <td class="px-4 py-3 text-slate-200">{row.provider}</td>
                    <td class="px-4 py-3"><input class="w-24 rounded border border-white/10 bg-slate-950 px-3 py-2 text-sm" type="number" min="1" required value={currentRateLimit()} onInput={(event) => setCurrentRateLimit(event.currentTarget.value)} /></td>
                    <td class="px-4 py-3">
                      <div class="flex gap-2">
                        <button class="rounded border border-white/10 px-3 py-1 text-sm hover:bg-white/10" type="button" onClick={() => saveRateLimit(row, currentRateLimit())}>Save</button>
                        <button class="rounded bg-red-700 px-3 py-1 text-sm text-white hover:bg-red-600" type="button" onClick={() => remove(row)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              }}</For>
            </tbody>
          </table>
          {!rowsQuery.data?.length && <div class="rounded border border-dashed border-white/10 px-4 py-6 text-sm text-slate-400">No providers created yet.</div>}
        </div>
      </section>
    </div>
  );
}
