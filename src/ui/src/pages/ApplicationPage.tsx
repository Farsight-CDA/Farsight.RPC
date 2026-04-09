import { useNavigate, useParams } from "@solidjs/router";
import { createEffect, createMemo, createResource, createSignal, For, Show } from "solid-js";
import LoadingSpinner from "../components/LoadingSpinner";
import { useAuth } from "../lib/auth";

type Application = {
  id: string;
  name: string;
  apiKeyCount: number;
  tracingCount: number;
  realtimeCount: number;
  archiveCount: number;
};

type ConsumerApiKeySummary = {
  id: string;
  environment: string;
  key: string;
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

export default function ApplicationPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const params = useParams();
  const applicationId = () => params.applicationId;

  const [selectedEnvironment, setSelectedEnvironment] = createSignal<
    string | undefined
  >(undefined);
  const [filterText, setFilterText] = createSignal("");

  const [renameOpen, setRenameOpen] = createSignal(false);
  const [renameName, setRenameName] = createSignal("");
  const [renameError, setRenameError] = createSignal<string | null>(null);
  const [renameLoading, setRenameLoading] = createSignal(false);

  const [deleteOpen, setDeleteOpen] = createSignal(false);
  const [deleteError, setDeleteError] = createSignal<string | null>(null);
  const [deleteLoading, setDeleteLoading] = createSignal(false);

  const [keysModalOpen, setKeysModalOpen] = createSignal(false);
  const [apiKeyToDelete, setApiKeyToDelete] =
    createSignal<ConsumerApiKeySummary | null>(null);
  const [newKeyEnvironment, setNewKeyEnvironment] = createSignal<
    string | undefined
  >(undefined);
  const [createKeyError, setCreateKeyError] = createSignal<string | null>(null);
  const [createKeyLoading, setCreateKeyLoading] = createSignal(false);
  const [deleteKeyError, setDeleteKeyError] = createSignal<string | null>(null);
  const [deleteKeyLoading, setDeleteKeyLoading] = createSignal(false);

  const [application, { refetch: refetchApplication }] = createResource(
    () => ({ token: auth.token, id: applicationId() }),
    async ({ token, id }) => {
      if (!token || !id) return null;
      const response = await fetch("/api/applications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new Error("Failed to load application");
      }
      const apps = (await response.json()) as Application[];
      return apps.find((a) => a.id === id) || null;
    },
  );

  const [chains] = createResource(
    () => auth.token,
    async (token) => {
      if (!token) return [] as string[];
      const response = await fetch("/api/chains", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new Error("Failed to load chains");
      }
      return response.json() as Promise<string[]>;
    },
  );

  const [environments] = createResource(
    () => auth.token,
    async (token) => {
      if (!token) return [] as string[];
      const response = await fetch("/api/host-environments", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new Error("Failed to load environments");
      }
      return response.json() as Promise<string[]>;
    },
  );

  const [apiKeys, { refetch: refetchApiKeys }] = createResource(
    () => {
      if (!keysModalOpen()) return undefined;
      const id = applicationId();
      const token = auth.token;
      if (!id || !token) return undefined;
      return { token, applicationId: id };
    },
    async (src) => {
      if (!src) return [] as ConsumerApiKeySummary[];
      const response = await fetch(
        `/api/applications/${src.applicationId}/api-keys`,
        { headers: { Authorization: `Bearer ${src.token}` } },
      );
      if (!response.ok) {
        throw new Error("Failed to load API keys");
      }
      return response.json() as Promise<ConsumerApiKeySummary[]>;
    },
  );

  createEffect(() => {
    const envs = environments();
    if (envs && envs.length > 0 && !selectedEnvironment()) {
      setSelectedEnvironment(envs[0]);
    }
  });

  createEffect(() => {
    if (!keysModalOpen()) return;
    const envs = environments();
    if (envs && envs.length > 0 && !newKeyEnvironment()) {
      setNewKeyEnvironment(envs[0]);
    }
  });

  const filteredChains = createMemo(() => {
    const allChains = chains() ?? [];
    const filter = filterText().trim().toLowerCase();
    if (!filter) return allChains;
    return allChains.filter((chain) => chain.toLowerCase().includes(filter));
  });

  const openRenameModal = () => {
    const app = application();
    if (!app) return;
    setRenameError(null);
    setRenameName(app.name);
    setRenameOpen(true);
  };

  const closeRenameModal = () => {
    if (renameLoading()) return;
    setRenameOpen(false);
  };

  const openDeleteModal = () => {
    setDeleteError(null);
    setDeleteOpen(true);
  };

  const closeDeleteModal = () => {
    if (deleteLoading()) return;
    setDeleteOpen(false);
  };

  const openKeysModal = () => {
    setCreateKeyError(null);
    setDeleteKeyError(null);
    setApiKeyToDelete(null);
    setNewKeyEnvironment(undefined);
    setKeysModalOpen(true);
  };

  const closeKeysModal = () => {
    if (createKeyLoading() || deleteKeyLoading()) return;
    setKeysModalOpen(false);
    setApiKeyToDelete(null);
    setCreateKeyError(null);
    setDeleteKeyError(null);
  };

  const closeDeleteKeyModal = () => {
    if (deleteKeyLoading()) return;
    setApiKeyToDelete(null);
    setDeleteKeyError(null);
  };

  const handleRename = async (e: SubmitEvent) => {
    e.preventDefault();
    const token = auth.token;
    const app = application();
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
      setRenameOpen(false);
      await refetchApplication();
    } catch (err) {
      setRenameError(
        err instanceof Error ? err.message : "Failed to rename application",
      );
    } finally {
      setRenameLoading(false);
    }
  };

  const handleDeleteApplication = async () => {
    const token = auth.token;
    const app = application();
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
      setDeleteOpen(false);
      navigate("/", { replace: true });
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : "Failed to delete application",
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCreateKey = async (e: SubmitEvent) => {
    e.preventDefault();
    const token = auth.token;
    const app = application();
    const env = newKeyEnvironment();
    if (!token || !app || !env) return;
    setCreateKeyError(null);
    setCreateKeyLoading(true);
    try {
      const response = await fetch(`/api/applications/${app.id}/api-keys`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ environment: env }),
      });
      if (!response.ok) {
        throw new Error(
          await readErrorMessage(response, "Failed to create API key"),
        );
      }
      await refetchApiKeys();
      await refetchApplication();
    } catch (err) {
      setCreateKeyError(
        err instanceof Error ? err.message : "Failed to create API key",
      );
    } finally {
      setCreateKeyLoading(false);
    }
  };

  const handleDeleteKey = async () => {
    const token = auth.token;
    const app = application();
    const key = apiKeyToDelete();
    if (!token || !app || !key) return;
    setDeleteKeyError(null);
    setDeleteKeyLoading(true);
    try {
      const response = await fetch(
        `/api/applications/${app.id}/api-keys/${key.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!response.ok) {
        throw new Error(
          await readErrorMessage(response, "Failed to delete API key"),
        );
      }
      setApiKeyToDelete(null);
      await refetchApiKeys();
      await refetchApplication();
    } catch (err) {
      setDeleteKeyError(
        err instanceof Error ? err.message : "Failed to delete API key",
      );
    } finally {
      setDeleteKeyLoading(false);
    }
  };

  return (
    <main class="flex flex-1 flex-col">
      <div class="border-b-4 border-[var(--color-b-ink)] bg-b-field px-6 py-8">
        <div class="mx-auto max-w-7xl">
          <Show when={application.state === "pending"}>
            <div class="flex items-center gap-3 text-sm font-semibold uppercase tracking-wider text-b-ink/70">
              <LoadingSpinner class="size-5" />
              Loading application…
            </div>
          </Show>

          <Show when={application.error}>
            <p class="border-4 border-red-500/50 bg-red-500/10 px-3 py-3 text-xs font-bold uppercase leading-snug text-red-400">
              {application.error.message}
            </p>
          </Show>

          <Show when={application() && application.state === "ready"}>
            <div class="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div class="flex min-w-0 flex-1 flex-col gap-4">
                <div>
                  <p class="mb-2 text-xs font-bold uppercase tracking-[0.4em] text-b-accent">
                    Application
                  </p>
                  <h1 class="font-['Anton',sans-serif] text-4xl uppercase leading-none tracking-wide text-b-ink sm:text-5xl">
                    {application()?.name}
                  </h1>
                </div>
                <div class="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={openKeysModal}
                    class="btn btn-sm btn-interactive btn-disabled btn-primary"
                  >
                    Keys
                  </button>
                  <button
                    type="button"
                    onClick={openRenameModal}
                    class="btn btn-sm btn-interactive btn-disabled btn-secondary"
                  >
                    Rename
                  </button>
                  <button
                    type="button"
                    onClick={openDeleteModal}
                    class="btn btn-sm btn-interactive btn-disabled btn-danger"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div class="flex flex-col gap-2">
                <label
                  for="environment-select"
                  class="text-xs font-bold uppercase tracking-widest text-b-ink/80"
                >
                  Environment
                </label>
                <Show when={environments.state === "pending" || !selectedEnvironment()}>
                  <div class="flex h-12 items-center gap-2 border-4 border-[var(--color-b-ink)] bg-b-paper px-3 sm:w-48">
                    <LoadingSpinner class="size-4" />
                    <span class="text-xs font-bold uppercase tracking-widest text-b-ink/50">
                      Loading…
                    </span>
                  </div>
                </Show>
                <Show when={environments() && environments.state === "ready" && selectedEnvironment()}>
                  <div class="relative">
                    <select
                      id="environment-select"
                      value={selectedEnvironment()}
                      onChange={(e) =>
                        setSelectedEnvironment(e.currentTarget.value || undefined)
                      }
                      class="h-12 w-full appearance-none border-4 border-[var(--color-b-ink)] bg-b-paper px-3 pr-10 text-sm font-bold uppercase tracking-widest text-b-ink outline-none focus-visible:ring-4 focus-visible:ring-b-accent/50 hover:border-b-accent/50 transition-colors duration-200 cursor-pointer sm:w-48"
                    >
                      <For each={environments()}>
                        {(env) => <option value={env} class="bg-b-paper">{env}</option>}
                      </For>
                    </select>
                    <div class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                      <svg
                        class="size-5 text-b-ink/70"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="3"
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </div>
                </Show>
              </div>
            </div>
          </Show>
        </div>
      </div>

      <div class="flex-1 px-6 py-8">
        <div class="mx-auto max-w-7xl">
          <Show when={chains.state === "pending"}>
            <div class="flex flex-col items-center justify-center gap-4 py-16">
              <LoadingSpinner class="size-8" />
              <p class="text-sm font-bold uppercase tracking-widest text-b-ink/80">
                Loading chains…
              </p>
            </div>
          </Show>

          <Show when={chains.error}>
            <div class="mx-auto max-w-md">
              <p class="border-4 border-red-500/50 bg-red-500/10 px-4 py-4 text-center text-xs font-bold uppercase leading-snug text-red-400">
                {chains.error.message}
              </p>
            </div>
          </Show>

          <Show when={chains() && chains.state === "ready"}>
            <div class="mb-6 flex items-center justify-between">
              <p class="text-xs font-bold uppercase tracking-[0.4em] text-b-accent">
                Select a Chain
              </p>
              <span class="text-xs font-bold uppercase tracking-widest text-b-ink/50">
                {filteredChains().length} / {chains()?.length} chains
              </span>
            </div>

            <div class="mb-6">
              <div class="relative">
                <input
                  type="text"
                  value={filterText()}
                  onInput={(e) => setFilterText(e.currentTarget.value)}
                  placeholder="Filter chains..."
                  class="h-12 w-full border-4 border-[var(--color-b-ink)] bg-b-paper px-4 pr-12 text-sm font-semibold text-b-ink placeholder:text-b-ink/30 outline-none focus-visible:ring-4 focus-visible:ring-b-accent/50 hover:border-b-accent/50 transition-colors duration-200"
                />
                <div class="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
                  <svg
                    class="size-5 text-b-ink/30"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              <For each={filteredChains()}>
                {(chain) => (
                  <button
                    type="button"
                    class="group relative flex flex-col items-start gap-3 border-4 border-[var(--color-b-ink)] bg-b-paper p-5 shadow-[6px_6px_0_0_rgba(232,228,220,0.08)] transition-all duration-200 hover:translate-x-1 hover:translate-y-1 hover:shadow-[3px_3px_0_0_rgba(255,87,34,0.2)] hover:border-b-accent/60 hover:bg-b-field focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-b-accent/50 active:translate-x-1.5 active:translate-y-1.5 active:shadow-none"
                  >
                    <div class="flex w-full items-center justify-between">
                      <span class="font-['Anton',sans-serif] text-xl uppercase tracking-wide text-b-ink group-hover:text-b-accent transition-colors duration-200">
                        {chain}
                      </span>
                      <div class="flex size-8 items-center justify-center border-2 border-[var(--color-b-ink)] bg-b-field transition-all duration-200 group-hover:bg-b-accent group-hover:border-b-accent group-hover:shadow-[0_0_12px_rgba(255,87,34,0.4)]">
                        <svg
                          class="size-4 text-b-ink transition-colors duration-200 group-hover:text-b-paper"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="3"
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </div>
                    <div class="h-1 w-12 bg-b-ink/60 transition-all duration-200 group-hover:w-full group-hover:bg-b-accent" />
                  </button>
                )}
              </For>
            </div>
          </Show>

          <Show when={chains() && chains.state === "ready" && chains()!.length === 0}>
            <div class="flex flex-col items-center justify-center gap-4 py-16">
              <p class="text-center text-sm font-semibold uppercase tracking-wider text-b-ink/60">
                No chains available.
              </p>
            </div>
          </Show>

          <Show when={chains() && chains.state === "ready" && chains()!.length > 0 && filteredChains().length === 0}>
            <div class="flex flex-col items-center justify-center gap-4 py-16">
              <p class="text-center text-sm font-semibold uppercase tracking-wider text-b-ink/60">
                No chains match your filter.
              </p>
            </div>
          </Show>
        </div>
      </div>

      <Show when={renameOpen()}>
        <div
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4 py-8"
          role="presentation"
          onClick={closeRenameModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="rename-application-title"
            class="w-full max-w-md border-4 border-[var(--color-b-ink)] bg-b-field p-8 shadow-[12px_12px_0_0_rgba(255,87,34,0.15)]"
            onClick={(e) => e.stopPropagation()}
          >
            <p class="mb-2 text-xs font-bold uppercase tracking-[0.35em] text-b-accent">
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
                  class="text-xs font-bold uppercase tracking-widest text-b-ink/80"
                >
                  Name
                </label>
                <input
                  id="rename-app-name"
                  type="text"
                  required
                  value={renameName()}
                  onInput={(e) => setRenameName(e.currentTarget.value)}
                  class="border-4 border-[var(--color-b-ink)] bg-b-paper px-3 py-3 text-sm font-semibold text-b-ink placeholder:text-b-ink/30 outline-none focus-visible:ring-4 focus-visible:ring-b-accent/50 hover:border-b-accent/50 transition-colors duration-200"
                  placeholder="MY APPLICATION"
                  autocomplete="off"
                />
              </div>

              <Show when={renameError()}>
                <p class="border-4 border-red-500/50 bg-red-500/10 px-3 py-3 text-xs font-bold uppercase leading-snug text-red-400">
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

      <Show when={keysModalOpen()}>
        <div
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4 py-8"
          role="presentation"
          onClick={closeKeysModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="api-keys-title"
            class="max-h-[90vh] w-full max-w-lg overflow-y-auto border-4 border-[var(--color-b-ink)] bg-b-field p-8 shadow-[12px_12px_0_0_rgba(255,87,34,0.15)]"
            onClick={(e) => e.stopPropagation()}
          >
            <p class="mb-2 text-xs font-bold uppercase tracking-[0.35em] text-b-accent">
              API keys
            </p>
            <h3
              id="api-keys-title"
              class="mb-2 font-['Anton',sans-serif] text-4xl uppercase leading-none tracking-wide text-b-ink"
            >
              {application()?.name}
            </h3>
            <p class="mb-8 text-xs font-bold uppercase tracking-widest text-b-ink/60">
              Create and revoke keys per host environment.
            </p>

            <Show when={apiKeys.state === "pending"}>
              <div class="mb-6 flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-b-ink/80">
                <LoadingSpinner class="size-4" />
                Loading keys…
              </div>
            </Show>

            <Show when={apiKeys.error}>
              <p class="mb-6 border-4 border-red-500/50 bg-red-500/10 px-3 py-3 text-xs font-bold uppercase leading-snug text-red-400">
                {apiKeys.error.message}
              </p>
            </Show>

            <Show
              when={
                apiKeys() &&
                apiKeys.state === "ready" &&
                (apiKeys() ?? []).length > 0
              }
            >
              <ul class="mb-8 flex flex-col gap-3">
                <For each={apiKeys()}>
                  {(k) => (
                    <li class="flex flex-col gap-2 border-4 border-[var(--color-b-ink)] bg-b-paper p-3 sm:flex-row sm:items-center sm:justify-between">
                      <div class="min-w-0 flex-1">
                        <p class="text-xs font-bold uppercase tracking-widest text-b-accent">
                          {k.environment}
                        </p>
                        <p class="mt-1 break-all font-mono text-xs font-semibold text-b-ink">
                          {k.key}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteKeyError(null);
                          setApiKeyToDelete(k);
                        }}
                        disabled={createKeyLoading() || deleteKeyLoading()}
                        class="btn btn-sm btn-interactive btn-disabled btn-danger shrink-0"
                      >
                        Revoke
                      </button>
                    </li>
                  )}
                </For>
              </ul>
            </Show>

            <Show
              when={
                apiKeys() &&
                apiKeys.state === "ready" &&
                (apiKeys() ?? []).length === 0
              }
            >
              <p class="mb-8 text-sm font-semibold uppercase tracking-wider text-b-ink/60">
                No API keys yet.
              </p>
            </Show>

            <form onSubmit={handleCreateKey} class="flex flex-col gap-6 border-t-4 border-[var(--color-b-ink)]/20 pt-8">
              <div class="flex flex-col gap-2">
                <label
                  for="new-key-environment"
                  class="text-xs font-bold uppercase tracking-widest text-b-ink/80"
                >
                  Environment
                </label>
                <Show when={environments.state === "pending" || !newKeyEnvironment()}>
                  <div class="flex h-12 items-center gap-2 border-4 border-[var(--color-b-ink)] bg-b-paper px-3">
                    <LoadingSpinner class="size-4" />
                    <span class="text-xs font-bold uppercase tracking-widest text-b-ink/50">
                      Loading…
                    </span>
                  </div>
                </Show>
                <Show when={environments() && environments.state === "ready" && newKeyEnvironment()}>
                  <select
                    id="new-key-environment"
                    value={newKeyEnvironment()}
                    onChange={(e) =>
                      setNewKeyEnvironment(e.currentTarget.value || undefined)
                    }
                    class="h-12 w-full appearance-none border-4 border-[var(--color-b-ink)] bg-b-paper px-3 pr-10 text-sm font-bold uppercase tracking-widest text-b-ink outline-none focus-visible:ring-4 focus-visible:ring-b-accent/50 hover:border-b-accent/50 transition-colors duration-200 cursor-pointer"
                  >
                    <For each={environments()}>
                      {(env) => (
                        <option value={env} class="bg-b-paper">
                          {env}
                        </option>
                      )}
                    </For>
                  </select>
                </Show>
              </div>

              <Show when={createKeyError()}>
                <p class="border-4 border-red-500/50 bg-red-500/10 px-3 py-3 text-xs font-bold uppercase leading-snug text-red-400">
                  {createKeyError()}
                </p>
              </Show>

              <div class="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeKeysModal}
                  disabled={createKeyLoading() || deleteKeyLoading()}
                  class="btn btn-md btn-interactive btn-disabled btn-secondary"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={
                    createKeyLoading() ||
                    deleteKeyLoading() ||
                    !newKeyEnvironment()
                  }
                  class="btn btn-md btn-interactive btn-disabled btn-primary"
                >
                  <Show when={createKeyLoading()}>
                    <LoadingSpinner class="size-3.5 text-b-paper" />
                  </Show>
                  {createKeyLoading() ? "Creating…" : "Create key"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Show>

      <Show when={apiKeyToDelete()}>
        <div
          class="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4 py-8"
          role="presentation"
          onClick={closeDeleteKeyModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-api-key-title"
            class="w-full max-w-md border-4 border-red-500/50 bg-b-field p-8 shadow-[12px_12px_0_0_rgba(239,68,68,0.15)]"
            onClick={(e) => e.stopPropagation()}
          >
            <p class="mb-2 text-xs font-bold uppercase tracking-[0.35em] text-red-400">
              Revoke
            </p>
            <h3
              id="delete-api-key-title"
              class="mb-4 font-['Anton',sans-serif] text-4xl uppercase leading-none tracking-wide text-b-ink"
            >
              API key
            </h3>
            <p class="mb-8 text-sm font-semibold text-b-ink/80">
              Permanently revoke this key for{" "}
              <span class="font-bold text-red-400">
                {apiKeyToDelete()!.environment}
              </span>
              ? Clients using it will stop working.
            </p>

            <Show when={deleteKeyError()}>
              <p class="mb-6 border-4 border-red-500/50 bg-red-500/10 px-3 py-3 text-xs font-bold uppercase leading-snug text-red-400">
                {deleteKeyError()}
              </p>
            </Show>

            <div class="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeDeleteKeyModal}
                disabled={deleteKeyLoading()}
                class="btn btn-md btn-interactive btn-disabled btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteKey}
                disabled={deleteKeyLoading()}
                class="btn btn-md btn-interactive btn-disabled btn-danger"
              >
                <Show when={deleteKeyLoading()}>
                  <LoadingSpinner class="size-3.5" />
                </Show>
                {deleteKeyLoading() ? "Revoking…" : "Revoke key"}
              </button>
            </div>
          </div>
        </div>
      </Show>

      <Show when={deleteOpen()}>
        <div
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4 py-8"
          role="presentation"
          onClick={closeDeleteModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-application-title"
            class="w-full max-w-md border-4 border-red-500/50 bg-b-field p-8 shadow-[12px_12px_0_0_rgba(239,68,68,0.15)]"
            onClick={(e) => e.stopPropagation()}
          >
            <p class="mb-2 text-xs font-bold uppercase tracking-[0.35em] text-red-400">
              Delete
            </p>
            <h3
              id="delete-application-title"
              class="mb-4 font-['Anton',sans-serif] text-4xl uppercase leading-none tracking-wide text-b-ink"
            >
              Application
            </h3>
            <p class="mb-8 text-sm font-semibold text-b-ink/80">
              Permanently delete{" "}
              <span class="font-bold text-red-400">{application()?.name}</span>? This
              cannot be undone.
            </p>

            <Show when={deleteError()}>
              <p class="mb-6 border-4 border-red-500/50 bg-red-500/10 px-3 py-3 text-xs font-bold uppercase leading-snug text-red-400">
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
                onClick={handleDeleteApplication}
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
