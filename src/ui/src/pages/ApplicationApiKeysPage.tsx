import { createEffect, createSignal, For, Show } from "solid-js";
import { useParams } from "@solidjs/router";
import LoadingSpinner from "../components/LoadingSpinner";
import KeyIcon from "../components/icons/KeyIcon";
import CopyIcon from "../components/icons/CopyIcon";
import EmptyStateIcon from "../components/icons/EmptyStateIcon";
import ChevronDownIcon from "../components/icons/ChevronDownIcon";
import { useAuth } from "../lib/auth";
import { useReferenceData } from "../lib/reference-data";
import { useApplicationData, type ConsumerApiKeySummary } from "../lib/application-data";

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
  return fallback;
}

export default function ApplicationApiKeysPage() {
  const auth = useAuth();
  const referenceData = useReferenceData();
  const applicationData = useApplicationData();
  const params = useParams();
  const applicationId = () => params.applicationId;

  const environments = referenceData.hostEnvironments.data;
  const environmentsState = referenceData.hostEnvironments.state;
  const environmentsError = referenceData.hostEnvironments.error;
  const apiKeys = applicationData.apiKeys.data;
  const apiKeysState = applicationData.apiKeys.state;
  const apiKeysError = applicationData.apiKeys.error;

  const [apiKeyToDelete, setApiKeyToDelete] = createSignal<ConsumerApiKeySummary | null>(null);
  const [newKeyEnvironment, setNewKeyEnvironment] = createSignal<string | undefined>(undefined);
  const [createKeyError, setCreateKeyError] = createSignal<string | null>(null);
  const [createKeyLoading, setCreateKeyLoading] = createSignal(false);
  const [deleteKeyError, setDeleteKeyError] = createSignal<string | null>(null);
  const [deleteKeyLoading, setDeleteKeyLoading] = createSignal(false);
  const [createKeyModalOpen, setCreateKeyModalOpen] = createSignal(false);

  createEffect(() => {
    const envs = environments();
    const selected = newKeyEnvironment();
    if (envs.length > 0 && (!selected || !envs.includes(selected))) {
      setNewKeyEnvironment(envs[0]);
    }
  });

  const handleCreateKey = async (e: SubmitEvent) => {
    e.preventDefault();
    const token = auth.token;
    const app = applicationId();
    const env = newKeyEnvironment();
    if (!token || !app || !env) return;
    setCreateKeyError(null);
    setCreateKeyLoading(true);
    try {
      const response = await fetch(`/api/applications/${app}/api-keys`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ environment: env }),
      });
      if (!response.ok) {
        throw new Error(await readErrorMessage(response, "Failed to create API key"));
      }
      await Promise.all([
        applicationData.refreshApiKeys(),
        referenceData.refreshApplications(),
      ]);
      setCreateKeyModalOpen(false);
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
    const app = applicationId();
    const key = apiKeyToDelete();
    if (!token || !app || !key) return;
    setDeleteKeyError(null);
    setDeleteKeyLoading(true);
    try {
      const response = await fetch(
        `/api/applications/${app}/api-keys/${key.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!response.ok) {
        throw new Error(await readErrorMessage(response, "Failed to delete API key"));
      }
      setApiKeyToDelete(null);
      await Promise.all([
        applicationData.refreshApiKeys(),
        referenceData.refreshApplications(),
      ]);
    } catch (err) {
      setDeleteKeyError(
        err instanceof Error ? err.message : "Failed to delete API key",
      );
    } finally {
      setDeleteKeyLoading(false);
    }
  };

  const openCreateKeyModal = () => {
    setCreateKeyError(null);
    setCreateKeyModalOpen(true);
  };

  const closeCreateKeyModal = () => {
    if (createKeyLoading()) return;
    setCreateKeyModalOpen(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <>
      <div class="flex flex-col gap-6">
        <section class="border border-b-border bg-b-field overflow-hidden">
          <div class="border-b border-b-border bg-b-paper/30 px-6 py-4">
            <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div class="flex items-center gap-3">
                <div class="flex size-10 items-center justify-center border border-b-accent/30 bg-b-accent/10">
                  <KeyIcon class="size-5 text-b-accent" />
                </div>
                <div>
                  <h2 class="font-['Anton',sans-serif] text-xl uppercase tracking-wide text-b-ink">
                    API Keys
                  </h2>
                  <p class="text-xs font-bold uppercase tracking-widest text-b-ink/50">
                    Manage access keys per environment
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={openCreateKeyModal}
                disabled={
                  environmentsState() === "pending" ||
                  createKeyLoading() ||
                  deleteKeyLoading()
                }
                class="btn btn-md btn-interactive btn-disabled btn-primary shrink-0"
              >
                Create Key
              </button>
            </div>
          </div>

          <div class="p-6">
            <Show when={apiKeysState() === "pending"}>
              <div class="flex items-center justify-center gap-3 py-8 text-xs font-bold uppercase tracking-widest text-b-ink/80">
                <LoadingSpinner class="size-4" />
                Loading keys…
              </div>
            </Show>

            <Show when={apiKeysState() === "refreshing"}>
              <div class="mb-4 flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-b-ink/80">
                <LoadingSpinner class="size-4" />
                Updating keys…
              </div>
            </Show>

            <Show when={apiKeysError()}>
              <p class="border-4 border-red-500/50 bg-red-500/10 px-3 py-3 text-xs font-bold uppercase leading-snug text-red-400">
                {apiKeysError()!.message}
              </p>
            </Show>

            <Show
              when={
                !apiKeysError() &&
                (apiKeysState() === "ready" || apiKeysState() === "refreshing") &&
                apiKeys().length > 0
              }
            >
              <div class="mb-6">
                <p class="mb-3 text-xs font-bold uppercase tracking-widest text-b-ink/50">
                  Active Keys
                </p>
                <ul class="flex flex-col gap-3">
                  <For each={apiKeys()}>
                    {(k) => (
                      <li class="flex flex-col gap-3 border border-b-border bg-b-paper p-4 sm:flex-row sm:items-center sm:justify-between transition-colors hover:border-b-border-hover">
                        <div class="min-w-0 flex-1">
                          <div class="flex items-center gap-2">
                            <span class="inline-flex items-center border border-b-accent/20 bg-b-accent/10 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-b-accent">
                              {k.environment}
                            </span>
                          </div>
                          <div class="mt-2 flex items-center gap-2">
                            <code class="break-all font-mono text-xs font-semibold text-b-ink/80">
                              {k.key}
                            </code>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(k.key)}
                              class="shrink-0 text-b-ink/30 hover:text-b-accent transition-colors"
                              title="Copy to clipboard"
                            >
                              <CopyIcon class="size-4" />
                            </button>
                          </div>
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
              </div>
            </Show>

            <Show
              when={
                !apiKeysError() &&
                (apiKeysState() === "ready" || apiKeysState() === "refreshing") &&
                apiKeys().length === 0
              }
            >
              <div class="flex flex-col items-center justify-center gap-3 py-8 border border-dashed border-b-border/50 bg-b-paper/20">
                <EmptyStateIcon class="size-10 text-b-ink/20" />
                <p class="text-sm font-semibold uppercase tracking-wider text-b-ink/50">
                  No API keys yet.
                </p>
              </div>
            </Show>
          </div>
        </section>
      </div>

      <Show when={createKeyModalOpen()}>
        <div
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4 py-8"
          role="presentation"
          onClick={closeCreateKeyModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-key-title"
            class="w-full max-w-md border border-b-border bg-b-field p-8 shadow-[0_25px_50px_rgba(0,0,0,0.5)]"
            onClick={(e) => e.stopPropagation()}
          >
            <p class="mb-2 text-xs font-bold uppercase tracking-[0.35em] text-b-accent">
              Create
            </p>
            <h3
              id="create-key-title"
              class="mb-8 font-['Anton',sans-serif] text-4xl uppercase leading-none tracking-wide text-b-ink"
            >
              New API Key
            </h3>

            <form onSubmit={handleCreateKey} class="flex flex-col gap-6">
              <div class="flex flex-col gap-2">
                <label for="new-key-environment" class="text-xs font-bold uppercase tracking-widest text-b-ink/70">
                  Environment
                </label>
                <Show when={environmentsState() === "pending"}>
                  <div class="flex h-11 items-center gap-2 border border-b-border bg-b-field px-3">
                    <LoadingSpinner class="size-4" />
                    <span class="text-xs font-bold uppercase tracking-widest text-b-ink/50">
                      Loading…
                    </span>
                  </div>
                </Show>
                <Show when={environmentsError()}>
                  <p class="border border-red-500/40 bg-red-500/10 px-3 py-3 text-xs font-bold uppercase leading-snug text-red-400">
                    {environmentsError()!.message}
                  </p>
                </Show>
                <Show when={environmentsState() === "ready" && newKeyEnvironment()}>
                  <div class="relative">
                    <select
                      id="new-key-environment"
                      value={newKeyEnvironment()}
                      onChange={(e) => setNewKeyEnvironment(e.currentTarget.value || undefined)}
                      class="h-11 w-full appearance-none border border-b-border bg-b-field px-4 pr-10 text-sm font-bold uppercase tracking-widest text-b-ink outline-none focus-visible:border-b-accent/50 focus-visible:ring-2 focus-visible:ring-b-accent/20 hover:border-b-border-hover transition-all duration-200 cursor-pointer"
                    >
                      <For each={environments()}>
                        {(env) => (
                          <option value={env} class="bg-b-field">
                            {env}
                          </option>
                        )}
                      </For>
                    </select>
                    <div class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                      <ChevronDownIcon class="size-5 text-b-ink/50" />
                    </div>
                  </div>
                </Show>
              </div>

              <Show when={createKeyError()}>
                <p class="border border-red-500/40 bg-red-500/10 px-3 py-3 text-xs font-bold uppercase leading-snug text-red-400">
                  {createKeyError()}
                </p>
              </Show>

              <div class="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeCreateKeyModal}
                  disabled={createKeyLoading()}
                  class="btn btn-md btn-interactive btn-disabled btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createKeyLoading() || !newKeyEnvironment()}
                  class="btn btn-md btn-interactive btn-disabled btn-primary"
                >
                  <Show when={createKeyLoading()}>
                    <LoadingSpinner class="size-3.5 text-b-paper" />
                  </Show>
                  {createKeyLoading() ? "Creating…" : "Create Key"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Show>

      <Show when={apiKeyToDelete()}>
        <div
          class="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4 py-8"
          role="presentation"
          onClick={() => setApiKeyToDelete(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-api-key-title"
            class="w-full max-w-md border border-red-500/30 bg-b-field p-8 shadow-[0_25px_50px_rgba(0,0,0,0.5)]"
            onClick={(e) => e.stopPropagation()}
          >
            <p class="mb-2 text-xs font-bold uppercase tracking-[0.35em] text-red-400">
              Revoke Key
            </p>
            <h3
              id="delete-api-key-title"
              class="mb-4 font-['Anton',sans-serif] text-4xl uppercase leading-none tracking-wide text-b-ink"
            >
              API key
            </h3>
            <p class="mb-4 text-sm font-semibold text-b-ink/70">
              Permanently revoke this key for{" "}
              <span class="font-bold text-red-400">
                {apiKeyToDelete()!.environment}
              </span>
              ?
            </p>
            <p class="mb-8 text-xs text-b-ink/40">
              Clients using this key will stop working immediately.
            </p>

            <Show when={deleteKeyError()}>
              <p class="mb-6 border border-red-500/40 bg-red-500/10 px-3 py-3 text-xs font-bold uppercase leading-snug text-red-400">
                {deleteKeyError()}
              </p>
            </Show>

            <div class="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setApiKeyToDelete(null)}
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
    </>
  );
}