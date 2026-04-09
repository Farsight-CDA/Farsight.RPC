import { A } from "@solidjs/router";
import { createResource, createSignal, For, Show } from "solid-js";
import LoadingSpinner from "../components/LoadingSpinner";
import KeyIcon from "../components/icons/KeyIcon";
import RpcIcon from "../components/icons/RpcIcon";
import { useAuth } from "../lib/auth";

type ApplicationSummary = {
  id: string;
  name: string;
  apiKeyCount: number;
  tracingCount: number;
  realtimeCount: number;
  archiveCount: number;
};

async function readErrorMessage(
  response: Response,
  fallback: string,
): Promise<string> {
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
  return fallback;
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

  const [renameApp, setRenameApp] = createSignal<ApplicationSummary | null>(
    null,
  );
  const [renameName, setRenameName] = createSignal("");
  const [renameError, setRenameError] = createSignal<string | null>(null);
  const [renameLoading, setRenameLoading] = createSignal(false);

  const [deleteApp, setDeleteApp] = createSignal<ApplicationSummary | null>(
    null,
  );
  const [deleteError, setDeleteError] = createSignal<string | null>(null);
  const [deleteLoading, setDeleteLoading] = createSignal(false);

  const openModal = () => {
    setCreateError(null);
    setNewName("");
    setModalOpen(true);
  };

  const closeModal = () => {
    if (createLoading()) return;
    setModalOpen(false);
  };

  const openRename = (app: ApplicationSummary) => {
    setRenameError(null);
    setRenameName(app.name);
    setRenameApp(app);
  };

  const closeRenameModal = () => {
    if (renameLoading()) return;
    setRenameApp(null);
  };

  const openDelete = (app: ApplicationSummary) => {
    setDeleteError(null);
    setDeleteApp(app);
  };

  const closeDeleteModal = () => {
    if (deleteLoading()) return;
    setDeleteApp(null);
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
        throw new Error(
          await readErrorMessage(response, "Failed to create application"),
        );
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

  const handleRename = async (e: SubmitEvent) => {
    e.preventDefault();
    const token = auth.token;
    const app = renameApp();
    if (!token || !app) return;
    setRenameError(null);
    setRenameLoading(true);
    try {
      const response = await fetch(`/api/applications/${app.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: renameName() }),
      });
      if (!response.ok) {
        throw new Error(
          await readErrorMessage(response, "Failed to rename application"),
        );
      }
      setRenameApp(null);
      await refetch();
    } catch (err) {
      setRenameError(
        err instanceof Error ? err.message : "Failed to rename application",
      );
    } finally {
      setRenameLoading(false);
    }
  };

  const handleDelete = async () => {
    const token = auth.token;
    const app = deleteApp();
    if (!token || !app) return;
    setDeleteError(null);
    setDeleteLoading(true);
    try {
      const response = await fetch(`/api/applications/${app.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new Error(
          await readErrorMessage(response, "Failed to delete application"),
        );
      }
      setDeleteApp(null);
      await refetch();
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : "Failed to delete application",
      );
    } finally {
      setDeleteLoading(false);
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
            class="btn btn-md btn-interactive btn-disabled btn-primary shrink-0"
          >
            New application
          </button>
        </div>
        <div class="mt-6 h-1 w-full bg-b-ink" />

        <Show when={applications.state === "refreshing"}>
          <div class="mt-6 flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-b-ink/80">
            <LoadingSpinner class="size-4" />
            Updating…
          </div>
        </Show>

        <Show when={applications.error}>
          <p class="mt-8 border-4 border-[var(--color-b-accent)] bg-b-paper px-3 py-3 text-xs font-bold uppercase leading-snug text-b-accent">
            {applications.error.message}
          </p>
        </Show>

        <Show when={applications.state === "pending"}>
          <div class="mt-8 flex items-center gap-3 text-sm font-semibold uppercase tracking-wider text-b-ink/80">
            <LoadingSpinner class="size-5" />
            Loading…
          </div>
        </Show>

        <Show
          when={
            !applications.error &&
            (applications.state === "ready" ||
              applications.state === "refreshing") &&
            (applications() ?? []).length > 0
          }
        >
          <ul class="mt-8 flex flex-col gap-4">
            <For each={applications()}>
              {(app) => (
                <li>
                  <div class="flex flex-col gap-3 border-4 border-[var(--color-b-ink)] bg-b-paper p-4 shadow-[4px_4px_0_0_var(--color-b-ink)] sm:flex-row sm:items-stretch sm:gap-4">
                    <div class="flex min-w-0 flex-1 flex-col justify-between">
                      <A
                        href={`/applications/${app.id}`}
                        class="block text-left outline-none transition hover:translate-x-px hover:translate-y-px focus-visible:ring-4 focus-visible:ring-b-accent"
                      >
                        <span class="font-['Anton',sans-serif] text-2xl uppercase tracking-wide text-b-ink">
                          {app.name}
                        </span>
                      </A>
                      <div class="mt-3 flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-b-ink/70">
                        <div class="flex items-center gap-1">
                          <KeyIcon class="size-4" />
                          {app.apiKeyCount}
                        </div>
                        <div class="flex items-center gap-1">
                          <RpcIcon class="size-4" />
                          {app.tracingCount + app.realtimeCount + app.archiveCount}
                        </div>
                      </div>
                    </div>
                    <div class="flex shrink-0 flex-row gap-2 sm:flex-col sm:justify-center">
                      <button
                        type="button"
                        onClick={() => openRename(app)}
                        class="btn btn-sm btn-interactive btn-disabled btn-secondary flex-1 sm:flex-none"
                      >
                        Rename
                      </button>
                      <button
                        type="button"
                        onClick={() => openDelete(app)}
                        class="btn btn-sm btn-interactive btn-disabled btn-danger flex-1 sm:flex-none"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </li>
              )}
            </For>
          </ul>
        </Show>

        <Show
          when={
            !applications.error &&
            applications.state === "ready" &&
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
                  class="btn btn-md btn-interactive btn-disabled btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading()}
                  class="btn btn-md btn-interactive btn-disabled btn-primary"
                >
                  <Show when={createLoading()}>
                    <LoadingSpinner class="size-3.5 text-b-paper" />
                  </Show>
                  {createLoading() ? "Creating…" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Show>

      <Show when={renameApp()}>
        <div
          class="fixed inset-0 z-50 flex items-center justify-center bg-b-ink/60 px-4 py-8"
          role="presentation"
          onClick={closeRenameModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="rename-application-title"
            class="w-full max-w-md border-4 border-[var(--color-b-ink)] bg-b-field p-8 shadow-[12px_12px_0_0_var(--color-b-ink)]"
            onClick={(e) => e.stopPropagation()}
          >
            <p class="mb-2 text-xs font-bold uppercase tracking-[0.35em] text-b-ink">
              Rename
            </p>
            <h3
              id="rename-application-title"
              class="mb-8 font-['Anton',sans-serif] text-4xl uppercase leading-none tracking-wide text-b-ink"
            >
              Application
            </h3>

            <form onSubmit={handleRename} class="flex flex-col gap-6">
              <div class="flex flex-col gap-2">
                <label
                  for="rename-app-name"
                  class="text-xs font-bold uppercase tracking-widest text-b-ink"
                >
                  Name
                </label>
                <input
                  id="rename-app-name"
                  type="text"
                  required
                  value={renameName()}
                  onInput={(e) => setRenameName(e.currentTarget.value)}
                  class="border-4 border-[var(--color-b-ink)] bg-b-paper px-3 py-3 text-sm font-semibold text-b-ink placeholder:text-b-ink/40 outline-none focus-visible:ring-4 focus-visible:ring-b-accent"
                  placeholder="MY APPLICATION"
                  autocomplete="off"
                />
              </div>

              <Show when={renameError()}>
                <p class="border-4 border-[var(--color-b-accent)] bg-b-paper px-3 py-3 text-xs font-bold uppercase leading-snug text-b-accent">
                  {renameError()}
                </p>
              </Show>

              <div class="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeRenameModal}
                  disabled={renameLoading()}
                  class="btn btn-md btn-interactive btn-disabled btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={renameLoading()}
                  class="btn btn-md btn-interactive btn-disabled btn-primary"
                >
                  <Show when={renameLoading()}>
                    <LoadingSpinner class="size-3.5 text-b-paper" />
                  </Show>
                  {renameLoading() ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Show>

      <Show when={deleteApp()}>
        <div
          class="fixed inset-0 z-50 flex items-center justify-center bg-b-ink/60 px-4 py-8"
          role="presentation"
          onClick={closeDeleteModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-application-title"
            class="w-full max-w-md border-4 border-[var(--color-b-ink)] bg-b-field p-8 shadow-[12px_12px_0_0_var(--color-b-ink)]"
            onClick={(e) => e.stopPropagation()}
          >
            <p class="mb-2 text-xs font-bold uppercase tracking-[0.35em] text-b-accent">
              Delete
            </p>
            <h3
              id="delete-application-title"
              class="mb-4 font-['Anton',sans-serif] text-4xl uppercase leading-none tracking-wide text-b-ink"
            >
              Application
            </h3>
            <p class="mb-8 text-sm font-semibold text-b-ink/90">
              Permanently delete{" "}
              <span class="font-bold text-b-ink">{deleteApp()!.name}</span>? This
              cannot be undone.
            </p>

            <Show when={deleteError()}>
              <p class="mb-6 border-4 border-[var(--color-b-accent)] bg-b-paper px-3 py-3 text-xs font-bold uppercase leading-snug text-b-accent">
                {deleteError()}
              </p>
            </Show>

            <div class="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={deleteLoading()}
                class="btn btn-md btn-interactive btn-disabled btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteLoading()}
                class="btn btn-md btn-interactive btn-disabled btn-danger"
              >
                <Show when={deleteLoading()}>
                  <LoadingSpinner class="size-3.5" />
                </Show>
                {deleteLoading() ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      </Show>
    </main>
  );
}
