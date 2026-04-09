import { For, createSignal, onMount } from "solid-js";
import { MessageBanner } from "../components/MessageBanner";
import { createApplication, deleteApplication, getApplications } from "../lib/api";
import type { LookupItem } from "../lib/types";

export default function ApplicationsPage() {
  const [rows, setRows] = createSignal<LookupItem[]>([]);
  const [name, setName] = createSignal("");
  const [message, setMessage] = createSignal<string | null>(null);
  const [error, setError] = createSignal<string | null>(null);

  const load = async () => setRows(await getApplications());

  onMount(async () => {
    try {
      await load();
    }
    catch(err) {
      setError(err instanceof Error ? err.message : "Failed to load applications.");
    }
  });

  const submit = async (event: SubmitEvent) => {
    event.preventDefault();
    try {
      await createApplication(name());
      setName("");
      setMessage("Application created.");
      setError(null);
      await load();
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
      await load();
    }
    catch(err) {
      setError(err instanceof Error ? err.message : "Failed to delete application.");
    }
  };

  return (
    <div class="stack">
      <div class="page-header"><div><h1>Applications</h1><p class="muted">Manage application scopes used by endpoint routing and API keys.</p></div></div>
      <MessageBanner message={message()} tone="success" />
      <MessageBanner message={error()} tone="error" />
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
            <For each={rows()}>{(row) => (
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
