import { A } from "@solidjs/router";
import { createSignal, For, Show } from "solid-js";
import LoadingSpinner from "../components/LoadingSpinner";
import KeyIcon from "../components/icons/KeyIcon";
import RpcIcon from "../components/icons/RpcIcon";
import { useAuth } from "../lib/auth";
import { useReferenceData } from "../lib/reference-data";

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

const applicationNamePattern = "[A-Za-z0-9_-]+";
const applicationNameHint =
  "Use only letters, numbers, underscores, and hyphens.";

export default function DashboardPage() {
  const auth = useAuth();
  const referenceData = useReferenceData();

  const applications = referenceData.applications.data;
  const applicationsState = referenceData.applications.state;
  const applicationsError = referenceData.applications.error;

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
        throw new Error(
          await readErrorMessage(response, "Failed to create application"),
        );
      }
      setModalOpen(false);
      setNewName("");
      await referenceData.refreshApplications();
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
      <div class="w-full max-w-2xl border border-b-border bg-b-field p-10 shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
        <div class="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p class="mb-3 text-xs font-bold uppercase tracking-[0.4em] text-b-accent">
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
        <div class="mt-6 h-px w-full bg-gradient-to-r from-b-accent/50 via-b-accent/20 to-transparent" />

        <Show when={applicationsState() === "refreshing"}>
          <div class="mt-6 flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-b-ink/80">
            <LoadingSpinner class="size-4" />
            Updating…
          </div>
        </Show>

        <Show when={applicationsError()}>
          <p class="mt-8 border-4 border-red-500/50 bg-red-500/10 px-3 py-3 text-xs font-bold uppercase leading-snug text-red-400">
            {applicationsError()!.message}
          </p>
        </Show>

        <Show when={applicationsState() === "pending"}>
          <div class="mt-8 flex items-center gap-3 text-sm font-semibold uppercase tracking-wider text-b-ink/80">
            <LoadingSpinner class="size-5" />
            Loading…
          </div>
        </Show>

        <Show
          when={
            !applicationsError() &&
            (applicationsState() === "ready" ||
              applicationsState() === "refreshing") &&
            (applications() ?? []).length > 0
          }
        >
          <ul class="mt-8 flex flex-col gap-3">
            <For each={applications()}>
              {(app) => (
                <li>
                  <A
                    href={`/applications/${app.id}`}
                    class="group block border border-b-border bg-b-paper p-4 transition-all duration-200 hover:border-b-accent/40 hover:bg-b-field hover:shadow-[0_4px_20px_rgba(255,87,34,0.1)] hover:-translate-y-0.5 outline-none focus-visible:ring-2 focus-visible:ring-b-accent/30"
                  >
                    <span class="font-['Anton',sans-serif] text-2xl uppercase tracking-wide text-b-ink group-hover:text-b-accent transition-colors duration-200">
                      {app.name}
                    </span>
                    <div class="mt-3 flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-b-ink/50">
                      <div class="flex items-center gap-1 group-hover:text-b-accent/70 transition-colors duration-200">
                        <KeyIcon class="size-4" />
                        {app.apiKeyCount}
                      </div>
                      <div class="flex items-center gap-1 group-hover:text-b-accent/70 transition-colors duration-200">
                        <RpcIcon class="size-4" />
                        {app.rpcCount}
                      </div>
                    </div>
                  </A>
                </li>
              )}
            </For>
          </ul>
        </Show>

        <Show
          when={
            !applicationsError() &&
            applicationsState() === "ready" &&
            (applications() ?? []).length === 0
          }
        >
          <div class="mt-8 flex flex-col items-center justify-center gap-3 py-8 border border-dashed border-b-border/50 bg-b-paper/20">
            <p class="text-sm font-semibold uppercase tracking-wider text-b-ink/50">
              No applications available.
            </p>
          </div>
        </Show>
      </div>

      <Show when={modalOpen()}>
        <div
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4 py-8"
          role="presentation"
          onClick={closeModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-application-title"
            class="w-full max-w-md border border-b-border bg-b-field p-8 shadow-[0_25px_50px_rgba(0,0,0,0.5)]"
            onClick={(e) => e.stopPropagation()}
          >
            <p class="mb-2 text-xs font-bold uppercase tracking-[0.35em] text-b-accent">
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
                  class="text-xs font-bold uppercase tracking-widest text-b-ink/70"
                >
                  Name
                </label>
                <input
                  id="new-app-name"
                  type="text"
                  required
                  pattern={applicationNamePattern}
                  value={newName()}
                  onInput={(e) => setNewName(e.currentTarget.value)}
                  class="h-11 w-full border border-b-border bg-b-paper px-4 text-sm font-semibold text-b-ink placeholder:text-b-ink/25 outline-none focus-visible:border-b-accent/50 focus-visible:ring-2 focus-visible:ring-b-accent/20 hover:border-b-border-hover transition-all duration-200"
                  placeholder="MY APPLICATION"
                  title={applicationNameHint}
                  autocomplete="off"
                />
                <p class="text-xs font-semibold uppercase tracking-wider text-b-ink/40">
                  {applicationNameHint}
                </p>
              </div>

              <Show when={createError()}>
                <p class="border border-red-500/40 bg-red-500/10 px-3 py-3 text-xs font-bold uppercase leading-snug text-red-400">
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
    </main>
  );
}
