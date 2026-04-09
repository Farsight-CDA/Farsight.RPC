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
    <div class="stack">
      <div class="page-header"><div><h1>Applications</h1><p class="muted">Manage application scopes used by endpoint routing and API keys.</p></div></div>
      <MessageBanner message={message()} tone="success" />
      <MessageBanner message={currentError()} tone="error" />
      <section class="panel stack">
        <h2>New Application</h2>
        <form class="row" onSubmit={submit}>
          <input class="input" value={name()} onInput={(event) => setName(event.currentTarget.value)} placeholder="analytics" />
          <button class="button" type="submit">Add Application</button>
        </form>
      </section>
      <section class="panel table-wrap">
        <table>
          <thead><tr><th>Name</th><th>Actions</th></tr></thead>
          <tbody>
            <For each={rowsQuery.data ?? []}>{(row) => (
              <tr>
                <td>{row.name}</td>
                <td><button class="button danger" type="button" onClick={() => remove(row)}>Delete</button></td>
              </tr>
            )}</For>
          </tbody>
        </table>
      </section>
    </div>
  );
}
