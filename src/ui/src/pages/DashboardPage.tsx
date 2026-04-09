import { A } from "@solidjs/router";
import { createResource, createSignal, For, Show } from "solid-js";
import { useAuth } from "../lib/auth";

type ApplicationSummary = {
  id: string;
  name: string;
  tracingCount: number;
  realtimeCount: number;
  archiveCount: number;
};

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as {
      message?: string;
      errors?: Record<string, string[]>;
    };
    if (data.message && data.message !== "One or more errors occurred!")
      return data.message;
    const first = data.errors && Object.values(data.errors).flat()[0];
    if (first) return first;
  } catch {}
  if (response.status === 409)
    return "An application with this name already exists.";
  return "Failed to create application";
}

export default function DashboardPage() {
  const auth = useAuth();

  const [applications, { refetch }] = createResource(
    () => auth.token,
    async (token) => {
      if (!token) return [] as ApplicationSummary[];
      const response = await fetch("/api/applications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new Error("Failed to load applications");
      }
      return response.json() as Promise<ApplicationSummary[]>;
    },
  );

  const [modalOpen, setModalOpen] = createSignal(false);
  const [newName, setNewName] = createSignal("");
  const [createError, setCreateError] = createSignal<string | null>(null);
  const [createLoading, setCreateLoading] = createSignal(false);

  const openModal = () => {
    setCreateError(null);
    setNewName("");
    setModalOpen(true);
  };

  const closeModal = () => {
    if (createLoading()) return;
    setModalOpen(false);
  };

  const handleCreate = async (e: SubmitEvent) => {
    e.preventDefault();
    const token = auth.token;
    if (!token) return;
    setCreateError(null);
    setCreateLoading(true);
    try {
      const response = await fetch("/api/applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newName() }),
      });
      if (!response.ok) {
        throw new Error(await readErrorMessage(response));
      }
      setModalOpen(false);
      setNewName("");
      await refetch();
    } catch (err) {
      setCreateError(
        err instanceof Error ? err.message : "Failed to create application",
      );
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <main class="flex flex-1 flex-col items-center gap-8 px-6 py-16">
      <div class="w-full max-w-2xl border-4 border-[var(--color-b-ink)] bg-b-field p-10 shadow-[10px_10px_0_0_var(--color-b-ink)]">
        <div class="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p class="mb-3 text-xs font-bold uppercase tracking-[0.4em] text-b-ink">
              Applications
            </p>
            <h2 class="font-['Anton',sans-serif] text-5xl uppercase leading-none text-b-ink">
              Choose one
            </h2>
          </div>
          <button
            type="button"
            onClick={openModal}
            class="shrink-0 border-4 border-[var(--color-b-ink)] bg-b-ink px-4 py-3 text-xs font-bold uppercase tracking-widest text-b-paper shadow-[4px_4px_0_0_var(--color-b-accent)] transition-transform hover:-translate-x-px hover:-translate-y-px hover:shadow-[6px_6px_0_0_var(--color-b-accent)] focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-b-accent"
          >
            New application
          </button>
        </div>
        <div class="mt-6 h-1 w-full bg-b-ink" />

        <Show when={applications.error}>
          <p class="mt-8 border-4 border-[var(--color-b-accent)] bg-b-paper px-3 py-3 text-xs font-bold uppercase leading-snug text-b-accent">
            {applications.error.message}
          </p>
        </Show>

        <Show when={applications.loading}>
          <p class="mt-8 text-sm font-semibold uppercase tracking-wider text-b-ink/80">
            Loading…
          </p>
        </Show>

        <Show
          when={
            !applications.loading &&
            !applications.error &&
            (applications() ?? []).length > 0
          }
        >
          <ul class="mt-8 flex flex-col gap-4">
            <For each={applications()}>
              {(app) => (
                <li>
                  <A
                    href={`/applications/${app.id}`}
                    class="block w-full border-4 border-[var(--color-b-ink)] bg-b-paper px-4 py-4 text-left shadow-[4px_4px_0_0_var(--color-b-ink)] outline-none transition-transform hover:-translate-x-px hover:-translate-y-px hover:shadow-[6px_6px_0_0_var(--color-b-ink)] focus-visible:ring-4 focus-visible:ring-b-accent active:translate-x-0 active:translate-y-0 active:shadow-[2px_2px_0_0_var(--color-b-ink)]"
                  >
                    <span class="font-['Anton',sans-serif] text-2xl uppercase tracking-wide text-b-ink">
                      {app.name}
                    </span>
                    <p class="mt-2 text-xs font-bold uppercase tracking-widest text-b-ink/70">
                      Tracing {app.tracingCount} · Realtime {app.realtimeCount}{" "}
                      · Archive {app.archiveCount}
                    </p>
                  </A>
                </li>
              )}
            </For>
          </ul>
        </Show>

        <Show
          when={
            !applications.loading &&
            !applications.error &&
            (applications() ?? []).length === 0
          }
        >
          <p class="mt-8 text-sm font-semibold uppercase tracking-wider text-b-ink/80">
            No applications available.
          </p>
        </Show>
      </div>

      <Show when={modalOpen()}>
        <div
          class="fixed inset-0 z-50 flex items-center justify-center bg-b-ink/60 px-4 py-8"
          role="presentation"
          onClick={closeModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-application-title"
            class="w-full max-w-md border-4 border-[var(--color-b-ink)] bg-b-field p-8 shadow-[12px_12px_0_0_var(--color-b-ink)]"
            onClick={(e) => e.stopPropagation()}
          >
            <p class="mb-2 text-xs font-bold uppercase tracking-[0.35em] text-b-ink">
              Create
            </p>
            <h3
              id="new-application-title"
              class="mb-8 font-['Anton',sans-serif] text-4xl uppercase leading-none tracking-wide text-b-ink"
            >
              New application
            </h3>

            <form onSubmit={handleCreate} class="flex flex-col gap-6">
              <div class="flex flex-col gap-2">
                <label
                  for="new-app-name"
                  class="text-xs font-bold uppercase tracking-widest text-b-ink"
                >
                  Name
                </label>
                <input
                  id="new-app-name"
                  type="text"
                  required
                  value={newName()}
                  onInput={(e) => setNewName(e.currentTarget.value)}
                  class="border-4 border-[var(--color-b-ink)] bg-b-paper px-3 py-3 text-sm font-semibold text-b-ink placeholder:text-b-ink/40 outline-none focus-visible:ring-4 focus-visible:ring-b-accent"
                  placeholder="MY APPLICATION"
                  autocomplete="off"
                />
              </div>

              <Show when={createError()}>
                <p class="border-4 border-[var(--color-b-accent)] bg-b-paper px-3 py-3 text-xs font-bold uppercase leading-snug text-b-accent">
                  {createError()}
                </p>
              </Show>

              <div class="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={createLoading()}
                  class="border-4 border-[var(--color-b-ink)] bg-b-paper px-4 py-3 text-xs font-bold uppercase tracking-widest text-b-ink shadow-[4px_4px_0_0_var(--color-b-ink)] transition-transform hover:-translate-x-px hover:-translate-y-px hover:shadow-[6px_6px_0_0_var(--color-b-ink)] focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-b-accent disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading()}
                  class="border-4 border-[var(--color-b-ink)] bg-b-ink px-4 py-3 text-xs font-bold uppercase tracking-widest text-b-paper shadow-[4px_4px_0_0_var(--color-b-accent)] transition-transform hover:-translate-x-px hover:-translate-y-px hover:shadow-[6px_6px_0_0_var(--color-b-accent)] focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-b-accent disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
                >
                  {createLoading() ? "Creating…" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Show>
    </main>
  );
}
