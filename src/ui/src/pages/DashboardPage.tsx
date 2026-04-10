import { A } from "@solidjs/router";
import { createSignal, For, Show, createMemo } from "solid-js";
import LoadingSpinner from "../components/LoadingSpinner";
import KeyIcon from "../components/icons/KeyIcon";
import RpcIcon from "../components/icons/RpcIcon";
import SearchIcon from "../components/icons/SearchIcon";
import { useAuth } from "../lib/auth";
import {
  nameValidationHint,
  nameValidationPattern,
  validateName,
} from "../lib/name-validation";
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
  const [searchQuery, setSearchQuery] = createSignal("");

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

    const name = newName();
    const validationError = validateName(name);
    if (validationError) {
      setCreateError(validationError);
      return;
    }

    setCreateError(null);
    setCreateLoading(true);
    try {
      const response = await fetch("/api/Applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name }),
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

  const filteredApps = createMemo(() => {
    const apps = applications() ?? [];
    const query = searchQuery().toLowerCase().trim();

    if (query) {
      return apps.filter((app) =>
        app.name.toLowerCase().includes(query),
      );
    }

    return apps;
  });

  const appCount = createMemo(() => (applications() ?? []).length);
  const filteredCount = createMemo(() => filteredApps().length);

  return (
    <main class="flex flex-1 flex-col items-center gap-8 px-4 sm:px-6 py-12 sm:py-16">
      <div class="w-full max-w-6xl border border-b-border bg-b-field shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
        {/* Compact Header Section */}
        <div class="p-5 sm:p-8">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 class="font-['Anton',sans-serif] text-3xl sm:text-4xl uppercase leading-none text-b-ink">
              Applications
            </h2>
            <button
              type="button"
              onClick={openModal}
              class="btn btn-md btn-interactive btn-disabled btn-primary shrink-0"
            >
              Create
            </button>
          </div>

          {/* Search Bar */}
          <div class="mt-5 pt-5 border-t border-b-border">
            <div class="relative max-w-md">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon class="size-4 text-b-ink/40" />
              </div>
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery()}
                onInput={(e) => setSearchQuery(e.currentTarget.value)}
                class="w-full h-9 pl-9 pr-3 border border-b-border bg-b-paper text-sm font-semibold text-b-ink placeholder:text-b-ink/30 outline-none focus-visible:border-b-accent/50 focus-visible:ring-2 focus-visible:ring-b-accent/20 hover:border-b-border-hover transition-all duration-200"
              />
            </div>

            {/* Filter Status */}
            <div class="mt-3 text-xs font-semibold uppercase tracking-wider text-b-ink/40">
              <span>Showing {filteredCount()} of {appCount()}</span>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div class="px-5 pb-5 sm:px-8 sm:pb-8 pt-2">
          <Show when={applicationsState() === "refreshing"}>
            <div class="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-b-ink/80 py-4">
              <LoadingSpinner class="size-4" />
              Updating…
            </div>
          </Show>

          <Show when={applicationsError()}>
            <p class="border-4 border-red-500/50 bg-red-500/10 px-3 py-3 text-xs font-bold uppercase leading-snug text-red-400">
              {applicationsError()!.message}
            </p>
          </Show>

          <Show when={applicationsState() === "pending"}>
            <div class="flex items-center justify-center gap-3 py-16 text-sm font-semibold uppercase tracking-wider text-b-ink/80">
              <LoadingSpinner class="size-5" />
              Loading…
            </div>
          </Show>

          {/* Applications Grid */}
          <Show
            when={
              !applicationsError() &&
              (applicationsState() === "ready" ||
                applicationsState() === "refreshing") &&
              filteredApps().length > 0
            }
          >
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <For each={filteredApps()}>
                {(app) => (
                  <A
                    href={`/applications/${app.id}`}
                    class="group relative border border-b-border bg-b-paper p-5 transition-all duration-200 hover:border-b-accent/40 hover:bg-b-field hover:shadow-[0_4px_20px_rgba(255,87,34,0.12)] hover:-translate-y-0.5 outline-none focus-visible:ring-2 focus-visible:ring-b-accent/30 overflow-hidden"
                  >
                    {/* Decorative Corner Accent */}
                    <div class="absolute top-0 right-0 w-12 h-12 bg-gradient-to-bl from-b-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

                    {/* App Name */}
                    <h3 class="font-['Anton',sans-serif] text-xl uppercase tracking-wide text-b-ink group-hover:text-b-accent transition-colors duration-200 line-clamp-1" title={app.name}>
                      {app.name}
                    </h3>

                    {/* Stats Row */}
                    <div class="mt-4 flex items-center gap-4">
                      <div class="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-b-ink/40 group-hover:text-b-accent/60 transition-colors duration-200">
                        <KeyIcon class="size-3.5" />
                        <span>{app.apiKeyCount ?? 0}</span>
                      </div>
                      <div class="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-b-ink/40 group-hover:text-b-accent/60 transition-colors duration-200">
                        <RpcIcon class="size-3.5" />
                        <span>{app.rpcCount ?? 0}</span>
                      </div>
                    </div>

                    {/* Arrow Indicator */}
                    <div class="absolute bottom-5 right-5 opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-x-2 group-hover:translate-x-0">
                      <svg
                        class="size-5 text-b-accent"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        stroke-width="2"
                      >
                        <path stroke-linecap="round" stroke-linejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </div>
                  </A>
                )}
              </For>
            </div>
          </Show>

          {/* Empty States */}
          <Show
            when={
              !applicationsError() &&
              applicationsState() === "ready" &&
              (applications() ?? []).length === 0
            }
          >
            <div class="flex flex-col items-center justify-center gap-3 py-12 border border-dashed border-b-border/50 bg-b-paper/20">
              <svg class="size-6 text-b-ink/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <p class="text-sm font-semibold uppercase tracking-wider text-b-ink/50">
                No applications yet
              </p>
              <button
                type="button"
                onClick={openModal}
                class="btn btn-sm btn-interactive btn-primary"
              >
Create
              </button>
            </div>
          </Show>

          {/* No Search Results */}
          <Show
            when={
              !applicationsError() &&
              applicationsState() === "ready" &&
              (applications() ?? []).length > 0 &&
              filteredApps().length === 0
            }
          >
            <div class="flex flex-col items-center justify-center gap-2 py-12 border border-dashed border-b-border/50 bg-b-paper/20">
              <SearchIcon class="size-5 text-b-ink/30 mb-1" />
              <p class="text-sm font-semibold uppercase tracking-wider text-b-ink/50">
                No matches for "{searchQuery()}"
              </p>
              <button
                onClick={() => setSearchQuery("")}
                class="text-xs font-bold uppercase tracking-wider text-b-accent hover:underline"
              >
                Clear
              </button>
            </div>
          </Show>
        </div>
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
                  pattern={nameValidationPattern}
                  value={newName()}
                  onInput={(e) => {
                    setNewName(e.currentTarget.value);
                    setCreateError(null);
                  }}
                  class="h-11 w-full border border-b-border bg-b-paper px-4 text-sm font-semibold text-b-ink placeholder:text-b-ink/25 outline-none focus-visible:border-b-accent/50 focus-visible:ring-2 focus-visible:ring-b-accent/20 hover:border-b-border-hover transition-all duration-200"
                  placeholder="MY APPLICATION"
                  title={nameValidationHint}
                  autocomplete="off"
                />
                <p class="text-xs font-semibold uppercase tracking-wider text-b-ink/40">
                  {nameValidationHint}
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
