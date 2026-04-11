import { createEffect, createSignal, For, Show } from "solid-js";
import { useParams } from "@solidjs/router";
import LoadingSpinner from "../components/LoadingSpinner";
import KeyIcon from "../components/icons/KeyIcon";
import CopyIcon from "../components/icons/CopyIcon";
import EmptyStateIcon from "../components/icons/EmptyStateIcon";
import ChevronDownIcon from "../components/icons/ChevronDownIcon";
import { useAuth } from "../lib/auth";
import { useReferenceData } from "../lib/reference-data";
import {
  useApplicationData,
  type ConsumerApiKeySummary,
} from "../lib/application-data";

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

  const environments = applicationData.environments.data;
  const environmentsState = applicationData.environments.state;
  const environmentsError = applicationData.environments.error;
  const apiKeys = applicationData.apiKeys.data;
  const apiKeysState = applicationData.apiKeys.state;
  const apiKeysError = applicationData.apiKeys.error;

  const [apiKeyToDelete, setApiKeyToDelete] =
    createSignal<ConsumerApiKeySummary | null>(null);
  const [newKeyEnvironmentId, setNewKeyEnvironmentId] = createSignal<
    string | undefined
  >(undefined);
  const [createKeyError, setCreateKeyError] = createSignal<string | null>(null);
  const [createKeyLoading, setCreateKeyLoading] = createSignal(false);
  const [deleteKeyError, setDeleteKeyError] = createSignal<string | null>(null);
  const [deleteKeyLoading, setDeleteKeyLoading] = createSignal(false);
  const [createKeyModalOpen, setCreateKeyModalOpen] = createSignal(false);
  const [copiedKeyId, setCopiedKeyId] = createSignal<string | null>(null);
  let copyFeedbackTimer: ReturnType<typeof setTimeout> | undefined;

  createEffect(() => {
    const envs = environments();
    const selected = newKeyEnvironmentId();
    if (
      envs.length > 0 &&
      !envs.some((environment) => environment.id === selected)
    ) {
      setNewKeyEnvironmentId(envs[0].id);
      return;
    }

    if (envs.length === 0 && selected) {
      setNewKeyEnvironmentId(undefined);
    }
  });

  const handleCreateKey = async (e: SubmitEvent) => {
    e.preventDefault();
    const token = auth.token;
    const app = applicationId();
    const environmentId = newKeyEnvironmentId();
    if (!token || !app || !environmentId) return;
    setCreateKeyError(null);
    setCreateKeyLoading(true);
    try {
      const response = await fetch(`/api/Applications/${app}/ApiKeys`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ environmentId }),
      });
      if (!response.ok) {
        throw new Error(
          await readErrorMessage(response, "Failed to create API key"),
        );
      }
      await Promise.all([
        applicationData.refreshApplication(),
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
        `/api/Applications/${app}/ApiKeys/${key.id}`,
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
      await Promise.all([
        applicationData.refreshApplication(),
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

  const handleCopyApiKey = (key: ConsumerApiKeySummary) => {
    void navigator.clipboard.writeText(key.key);
    if (copyFeedbackTimer !== undefined) {
      clearTimeout(copyFeedbackTimer);
    }
    setCopiedKeyId(key.id);
    copyFeedbackTimer = setTimeout(() => {
      setCopiedKeyId(null);
      copyFeedbackTimer = undefined;
    }, 2000);
  };

  const formatLastUsed = (iso?: string) => {
    if (!iso) return "Never used";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "Unknown";
    return d.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const formatKeyPreview = (key: string) =>
    key.length <= 6 ? key : `${key.slice(0, 6)}…`;

  const getEnvironmentName = (environmentId: string) =>
    environments().find((environment) => environment.id === environmentId)
      ?.name ?? "Unknown";

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
                  deleteKeyLoading() ||
                  environments().length === 0
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
                environmentsState() === "ready" &&
                environments().length === 0
              }
            >
              <div class="mb-6 flex flex-col items-center justify-center gap-3 border border-dashed border-b-border/50 bg-b-paper/20 py-8">
                <EmptyStateIcon class="size-10 text-b-ink/20" />
                <p class="text-sm font-semibold uppercase tracking-wider text-b-ink/50">
                  Add an environment before creating API keys.
                </p>
              </div>
            </Show>

            <Show
              when={
                !apiKeysError() &&
                (apiKeysState() === "ready" ||
                  apiKeysState() === "refreshing") &&
                apiKeys().length > 0
              }
            >
              <div class="mb-6">
                <ul class="flex flex-col gap-4">
                  <For each={apiKeys()}>
                    {(k) => (
                      <li class="border border-b-border bg-b-paper/40 shadow-[0_1px_0_rgba(0,0,0,0.35)] transition-colors hover:border-b-border-hover">
                        <div class="flex flex-col gap-4 p-4 sm:flex-row sm:items-stretch sm:justify-between sm:gap-6">
                          <div class="min-w-0 flex-1 flex flex-col gap-3">
                            <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                              <span class="inline-flex items-center border border-b-accent/25 bg-b-accent/10 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-b-accent">
                                {getEnvironmentName(k.environmentId)}
                              </span>
                              <p class="text-xs font-semibold uppercase tracking-wider text-b-ink/40">
                                Last used{" "}
                                <span class="font-bold normal-case tracking-normal text-b-ink/70">
                                  {formatLastUsed(k.lastUsedAt)}
                                </span>
                              </p>
                            </div>
                            <div class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-2">
                              <code class="select-all font-mono text-xs font-semibold tracking-wide text-b-ink/85">
                                {formatKeyPreview(k.key)}
                              </code>
                              <button
                                type="button"
                                onClick={() => handleCopyApiKey(k)}
                                disabled={
                                  createKeyLoading() || deleteKeyLoading()
                                }
                                class="btn btn-sm btn-interactive btn-disabled btn-secondary inline-flex shrink-0 items-center justify-center gap-2"
                              >
                                <CopyIcon class="size-3.5 opacity-80" />
                                {copiedKeyId() === k.id
                                  ? "Copied"
                                  : "Copy full key"}
                              </button>
                            </div>
                          </div>
                          <div class="flex shrink-0 flex-col justify-center border-t border-b-border/60 pt-3 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
                            <button
                              type="button"
                              onClick={() => {
                                setDeleteKeyError(null);
                                setApiKeyToDelete(k);
                              }}
                              disabled={
                                createKeyLoading() || deleteKeyLoading()
                              }
                              class="btn btn-sm btn-interactive btn-disabled btn-danger w-full sm:w-auto"
                            >
                              Revoke
                            </button>
                          </div>
                        </div>
                      </li>
                    )}
                  </For>
                </ul>
              </div>
            </Show>

            <Show
              when={
                !apiKeysError() &&
                environments().length > 0 &&
                (apiKeysState() === "ready" ||
                  apiKeysState() === "refreshing") &&
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
                <label
                  for="new-key-environment"
                  class="text-xs font-bold uppercase tracking-widest text-b-ink/70"
                >
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
                <Show
                  when={
                    environmentsState() === "ready" && newKeyEnvironmentId()
                  }
                >
                  <div class="relative">
                    <select
                      id="new-key-environment"
                      value={newKeyEnvironmentId()}
                      onChange={(e) =>
                        setNewKeyEnvironmentId(
                          e.currentTarget.value || undefined,
                        )
                      }
                      class="h-11 w-full appearance-none border border-b-border bg-b-field px-4 pr-10 text-sm font-bold uppercase tracking-widest text-b-ink outline-none focus-visible:border-b-accent/50 focus-visible:ring-2 focus-visible:ring-b-accent/20 hover:border-b-border-hover transition-all duration-200 cursor-pointer"
                    >
                      <For each={environments()}>
                        {(env) => (
                          <option value={env.id} class="bg-b-field">
                            {env.name}
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
                  disabled={createKeyLoading() || !newKeyEnvironmentId()}
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
                {getEnvironmentName(apiKeyToDelete()!.environmentId)}
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
