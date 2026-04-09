import { createQuery, useQueryClient } from "@tanstack/solid-query";
import { For, createSignal } from "solid-js";
import { MessageBanner } from "../components/MessageBanner";
import { createChain, deleteChain, getChains } from "../lib/api";
import { queryKeys } from "../lib/query";
import type { LookupItem } from "../lib/types";

export default function ChainsPage() {
  const queryClient = useQueryClient();
  const [name, setName] = createSignal("");
  const [message, setMessage] = createSignal<string | null>(null);
  const [error, setError] = createSignal<string | null>(null);
  const rowsQuery = createQuery(() => ({
    queryKey: queryKeys.chains,
    queryFn: getChains,
  }));

  const currentError = () => error() ?? (rowsQuery.error instanceof Error ? rowsQuery.error.message : null);

  const submit = async (event: SubmitEvent) => {
    event.preventDefault();
    try {
      await createChain(name());
      setName("");
      setMessage("Chain created.");
      setError(null);
      await queryClient.invalidateQueries({ queryKey: queryKeys.chains });
    }
    catch(err) {
      setError(err instanceof Error ? err.message : "Failed to create chain.");
    }
  };

  const remove = async (row: LookupItem) => {
    if(!window.confirm(`Delete chain ${row.name}?`)) {
      return;
    }

    try {
      await deleteChain(row.id);
      setMessage("Chain deleted.");
      setError(null);
      await queryClient.invalidateQueries({ queryKey: queryKeys.chains });
    }
    catch(err) {
      setError(err instanceof Error ? err.message : "Failed to delete chain.");
    }
  };

  return (
    <div class="stack">
      <div class="page-header"><div><h1>Chains</h1><p class="muted">Manage the chain identifiers used in the discovery API.</p></div></div>
      <MessageBanner message={message()} tone="success" />
      <MessageBanner message={currentError()} tone="error" />
      <section class="panel stack">
        <h2>New Chain</h2>
        <form class="row" onSubmit={submit}>
          <input class="input" value={name()} onInput={(event) => setName(event.currentTarget.value)} placeholder="ethereum" />
          <button class="button" type="submit">Add Chain</button>
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
