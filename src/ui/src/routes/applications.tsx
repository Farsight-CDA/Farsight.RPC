import { createQuery, useQueryClient } from "@tanstack/solid-query";
import { For, createSignal } from "solid-js";
import { MessageBanner } from "../components/MessageBanner";
import { createApplication, deleteApplication, getApplications } from "../lib/api";
import { queryKeys } from "../lib/query";
import type { LookupItem } from "../lib/types";

export default function ApplicationsPage() {
  const queryClient = useQueryClient();
  const [name, setName] = createSignal("");
  const [message, setMessage] = createSignal<string | null>(null);
  const [error, setError] = createSignal<string | null>(null);
  const rowsQuery = createQuery(() => ({
    queryKey: queryKeys.applications,
    queryFn: getApplications,
  }));

  const currentError = () => error() ?? (rowsQuery.error instanceof Error ? rowsQuery.error.message : null);

  const submit = async (event: SubmitEvent) => {
    event.preventDefault();
    try {
      await createApplication(name());
      setName("");
      setMessage("Application created.");
      setError(null);
      await queryClient.invalidateQueries({ queryKey: queryKeys.applications });
    }
    catch(err) {
      setError(err instanceof Error ? err.message : "Failed to create application.");
    }
  };

  const remove = async (row: LookupItem) => {
    if(!window.confirm(`Delete application ${row.name}?`)) {
      return;
    }

    try {
      await deleteApplication(row.id);
      setMessage("Application deleted.");
      setError(null);
      await queryClient.invalidateQueries({ queryKey: queryKeys.applications });
    }
    catch(err) {
      setError(err instanceof Error ? err.message : "Failed to delete application.");
    }
  };

  return (
    <div class="space-y-6">
      <div>
        <h1 class="text-2xl text-white">Applications</h1>
        <p class="text-sm text-slate-400">Manage application scopes used by endpoint routing and API keys.</p>
      </div>
      <MessageBanner message={message()} tone="success" />
      <MessageBanner message={currentError()} tone="error" />
      <section class="rounded border border-white/10 bg-slate-900 p-5">
        <h2 class="text-lg text-white mb-4">New Application</h2>
        <form class="flex gap-3" onSubmit={submit}>
          <input class="w-full max-w-sm rounded border border-white/10 bg-slate-950 px-3 py-2 text-sm" value={name()} onInput={(event) => setName(event.currentTarget.value)} placeholder="analytics" />
          <button class="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-500" type="submit">Add Application</button>
        </form>
      </section>
      <section class="rounded border border-white/10 bg-slate-900 p-5">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-white/10">
                <th class="px-4 py-2 text-left text-xs text-slate-400">Name</th>
                <th class="px-4 py-2 text-left text-xs text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              <For each={rowsQuery.data ?? []}>{(row) => (
                <tr class="border-b border-white/5">
                  <td class="px-4 py-3 text-slate-200">{row.name}</td>
                  <td class="px-4 py-3"><button class="rounded bg-red-700 px-3 py-1 text-sm text-white hover:bg-red-600" type="button" onClick={() => remove(row)}>Delete</button></td>
                </tr>
              )}</For>
            </tbody>
          </table>
          {!rowsQuery.data?.length && <div class="rounded border border-dashed border-white/10 px-4 py-6 text-sm text-slate-400">No applications created yet.</div>}
        </div>
      </section>
    </div>
  );
}
