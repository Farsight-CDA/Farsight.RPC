import { createSignal, For, Show } from "solid-js";
import LoadingSpinner from "../components/LoadingSpinner";
import ProviderIcon from "../components/icons/ProviderIcon";
import LightningIcon from "../components/icons/LightningIcon";
import EmptyStateIcon from "../components/icons/EmptyStateIcon";
import RpcIcon from "../components/icons/RpcIcon";
import { useAuth } from "../lib/auth";
import {
  nameValidationHint,
  nameValidationPattern,
  validateName,
} from "../lib/name-validation";
import {
  useReferenceData,
  type RpcProviderSummary,
} from "../lib/reference-data";
import { useApplicationData } from "../lib/application-data";

async function readErrorMessage(
  response: Response,
  fallback: string,
  conflictHint?: string,
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
    return conflictHint ?? "An RPC provider with this name already exists.";
  return fallback;
}

export default function ApplicationProvidersPage() {
  const auth = useAuth();
  const referenceData = useReferenceData();
  const applicationData = useApplicationData();

  const providers = referenceData.rpcProviders.data;
  const providersState = referenceData.rpcProviders.state;
  const providersError = referenceData.rpcProviders.error;

  const [providerModalOpen, setProviderModalOpen] = createSignal(false);
  const [newProviderName, setNewProviderName] = createSignal("");
  const [newProviderRateLimit, setNewProviderRateLimit] = createSignal("100");
  const [createProviderError, setCreateProviderError] = createSignal<
    string | null
  >(null);
  const [createProviderLoading, setCreateProviderLoading] = createSignal(false);

  const [providerToDelete, setProviderToDelete] =
    createSignal<RpcProviderSummary | null>(null);
  const [deleteProviderError, setDeleteProviderError] = createSignal<
    string | null
  >(null);
  const [deleteProviderLoading, setDeleteProviderLoading] = createSignal(false);

  const [editingProviderId, setEditingProviderId] = createSignal<string | null>(
    null,
  );
  const [editingProviderName, setEditingProviderName] = createSignal("");
  const [editProviderError, setEditProviderError] = createSignal<string | null>(
    null,
  );
  const [editProviderLoading, setEditProviderLoading] = createSignal(false);

  const openProviderModal = () => {
    setCreateProviderError(null);
    setNewProviderName("");
    setNewProviderRateLimit("100");
    setProviderModalOpen(true);
  };

  const closeProviderModal = () => {
    if (createProviderLoading()) return;
    setProviderModalOpen(false);
  };

  const handleCreateProvider = async (e: SubmitEvent) => {
    e.preventDefault();
    const token = auth.token;
    if (!token) return;
    setCreateProviderError(null);
    setCreateProviderLoading(true);
    try {
      const rateLimit = Number(newProviderRateLimit());
      if (!Number.isFinite(rateLimit) || rateLimit <= 0) {
        throw new Error("Rate limit must be a positive number.");
      }
      const response = await fetch("/api/RpcProviders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newProviderName(),
          rateLimit,
        }),
      });
      if (!response.ok) {
        throw new Error(
          await readErrorMessage(
            response,
            "Failed to create RPC provider",
            "An RPC provider with this name already exists.",
          ),
        );
      }
      setProviderModalOpen(false);
      setNewProviderName("");
      setNewProviderRateLimit("100");
      await referenceData.refreshRpcProviders();
    } catch (err) {
      setCreateProviderError(
        err instanceof Error ? err.message : "Failed to create RPC provider",
      );
    } finally {
      setCreateProviderLoading(false);
    }
  };

  const handleDeleteRpcProvider = async () => {
    const token = auth.token;
    const provider = providerToDelete();
    if (!token || !provider) return;
    setDeleteProviderError(null);
    setDeleteProviderLoading(true);
    try {
      const response = await fetch(`/api/RpcProviders/${provider.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new Error(
          await readErrorMessage(response, "Failed to delete RPC provider"),
        );
      }
      setProviderToDelete(null);
      if (editingProviderId() === provider.id) {
        cancelEditingProvider();
      }
      await referenceData.refreshRpcProviders();
      // Refresh RPCs since deleting a provider also deletes its dependent RPCs
      await applicationData.refreshRpcs();
    } catch (err) {
      setDeleteProviderError(
        err instanceof Error ? err.message : "Failed to delete RPC provider",
      );
    } finally {
      setDeleteProviderLoading(false);
    }
  };

  const startEditingProvider = (provider: RpcProviderSummary) => {
    setEditProviderError(null);
    setEditingProviderId(provider.id);
    setEditingProviderName(provider.name);
  };

  const cancelEditingProvider = () => {
    if (editProviderLoading()) return;
    setEditingProviderId(null);
    setEditingProviderName("");
    setEditProviderError(null);
  };

  const handleRenameProvider = async (providerId: string) => {
    const token = auth.token;
    if (!token) return;

    const name = editingProviderName();
    const validationError = validateName(name);
    if (validationError) {
      setEditProviderError(validationError);
      return;
    }

    // Skip API call if name hasn't changed
    const provider = providers().find((p) => p.id === providerId);
    if (provider && provider.name === name) {
      setEditingProviderId(null);
      setEditingProviderName("");
      return;
    }

    setEditProviderError(null);
    setEditProviderLoading(true);
    try {
      const response = await fetch(`/api/RpcProviders/${providerId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name }),
      });
      if (!response.ok) {
        throw new Error(
          await readErrorMessage(
            response,
            "Failed to rename provider",
            "An RPC provider with this name already exists.",
          ),
        );
      }
      setEditingProviderId(null);
      setEditingProviderName("");
      await referenceData.refreshRpcProviders();
    } catch (err) {
      setEditProviderError(
        err instanceof Error ? err.message : "Failed to rename provider",
      );
    } finally {
      setEditProviderLoading(false);
    }
  };

  return (
    <>
      <div class="flex flex-col gap-6">
        <section class="border border-b-border bg-b-field overflow-hidden">
          <div class="border-b border-b-border bg-b-paper/30 px-6 py-4">
            <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div class="flex items-center gap-3">
                <div class="flex size-10 items-center justify-center border border-b-accent/30 bg-b-accent/10">
                  <ProviderIcon class="size-5 text-b-accent" />
                </div>
                <div>
                  <h2 class="font-['Anton',sans-serif] text-xl uppercase tracking-wide text-b-ink">
                    Global Providers
                  </h2>
                  <p class="text-xs font-bold uppercase tracking-widest text-b-ink/50">
                    Available RPC providers across all applications
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={openProviderModal}
                disabled={
                  providersState() === "pending" ||
                  createProviderLoading() ||
                  deleteProviderLoading() ||
                  editProviderLoading()
                }
                class="btn btn-md btn-interactive btn-disabled btn-primary shrink-0"
              >
                New provider
              </button>
            </div>
          </div>

          <div class="p-6">
            <Show when={providersState() === "pending"}>
              <div class="flex items-center justify-center gap-3 py-8 text-xs font-bold uppercase tracking-widest text-b-ink/80">
                <LoadingSpinner class="size-4" />
                Loading providers…
              </div>
            </Show>

            <Show when={providersState() === "refreshing"}>
              <div class="mb-4 flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-b-ink/80">
                <LoadingSpinner class="size-4" />
                Updating providers…
              </div>
            </Show>

            <Show when={providersError()}>
              <p class="border border-red-500/40 bg-red-500/10 px-3 py-3 text-xs font-bold uppercase leading-snug text-red-400">
                {providersError()!.message}
              </p>
            </Show>

            <Show
              when={
                !providersError() &&
                (providersState() === "ready" ||
                  providersState() === "refreshing") &&
                providers().length > 0
              }
            >
              <div class="flex flex-col gap-3">
                <For each={providers()}>
                  {(provider) => {
                    const isEditing = () => editingProviderId() === provider.id;
                    const isDeleting = () =>
                      providerToDelete()?.id === provider.id;
                    return (
                      <div class="flex flex-col gap-3 border border-b-border bg-b-paper p-4 sm:flex-row sm:items-center sm:justify-between transition-colors hover:border-b-border-hover">
                        <Show
                          when={!isEditing()}
                          fallback={
                            <div class="flex w-full flex-col gap-3">
                              <input
                                type="text"
                                required
                                pattern={nameValidationPattern}
                                value={editingProviderName()}
                                onInput={(e) => {
                                  setEditingProviderName(e.currentTarget.value);
                                  setEditProviderError(null);
                                }}
                                class="h-11 w-full border border-b-border bg-b-paper px-4 text-sm font-semibold text-b-ink placeholder:text-b-ink/25 outline-none focus-visible:border-b-accent/50 focus-visible:ring-2 focus-visible:ring-b-accent/20 hover:border-b-border-hover transition-all duration-200"
                                title={nameValidationHint}
                                autocomplete="off"
                              />
                              <Show when={editProviderError()}>
                                <p class="border border-red-500/40 bg-red-500/10 px-3 py-3 text-xs font-bold uppercase leading-snug text-red-400">
                                  {editProviderError()}
                                </p>
                              </Show>
                              <div class="flex flex-col gap-3 sm:flex-row sm:justify-end">
                                <button
                                  type="button"
                                  onClick={() =>
                                    void handleRenameProvider(provider.id)
                                  }
                                  disabled={editProviderLoading()}
                                  class="btn btn-md btn-interactive btn-disabled btn-primary"
                                >
                                  <Show when={editProviderLoading()}>
                                    <LoadingSpinner class="size-3.5 text-b-paper" />
                                  </Show>
                                  {editProviderLoading()
                                    ? "Saving…"
                                    : provider.name === editingProviderName()
                                      ? "Cancel"
                                      : "Save"}
                                </button>
                              </div>
                            </div>
                          }
                        >
                          <div class="min-w-0 flex-1">
                            <div class="flex items-center gap-2">
                              <span class="font-['Anton',sans-serif] text-lg uppercase tracking-wide text-b-ink">
                                {provider.name}
                              </span>
                            </div>
                            <div class="mt-2 flex items-center gap-4 text-xs font-semibold uppercase tracking-wider text-b-ink/50">
                              <span class="inline-flex items-center gap-1">
                                <LightningIcon class="size-3.5" />
                                {provider.rateLimit} req/s
                              </span>
                              <span class="inline-flex items-center gap-1">
                                <RpcIcon class="size-3.5" />
                                {provider.rpcCount} RPCs
                              </span>
                            </div>
                          </div>
                          <div class="flex flex-col gap-3 sm:flex-row">
                            <button
                              type="button"
                              onClick={() => startEditingProvider(provider)}
                              disabled={
                                createProviderLoading() ||
                                deleteProviderLoading() ||
                                isDeleting()
                              }
                              class="btn btn-sm btn-interactive btn-disabled btn-secondary shrink-0"
                            >
                              Rename
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setDeleteProviderError(null);
                                setProviderToDelete(provider);
                              }}
                              disabled={
                                createProviderLoading() ||
                                deleteProviderLoading() ||
                                isEditing()
                              }
                              class="btn btn-sm btn-interactive btn-disabled btn-danger shrink-0"
                            >
                              <Show when={isDeleting()}>
                                <LoadingSpinner class="size-3.5" />
                              </Show>
                              {isDeleting() ? "Deleting…" : "Delete"}
                            </button>
                          </div>
                        </Show>
                      </div>
                    );
                  }}
                </For>
              </div>
            </Show>

            <Show
              when={
                !providersError() &&
                (providersState() === "ready" ||
                  providersState() === "refreshing") &&
                providers().length === 0
              }
            >
              <div class="flex flex-col items-center justify-center gap-3 py-8 border border-dashed border-b-border/50 bg-b-paper/20">
                <EmptyStateIcon class="size-10 text-b-ink/20" />
                <p class="text-sm font-semibold uppercase tracking-wider text-b-ink/50">
                  No providers available.
                </p>
              </div>
            </Show>
          </div>
        </section>
      </div>

      <Show when={providerModalOpen()}>
        <div
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4 py-8"
          role="presentation"
          onClick={closeProviderModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-provider-title"
            class="w-full max-w-md border border-b-border bg-b-field p-8 shadow-[0_25px_50px_rgba(0,0,0,0.5)]"
            onClick={(e) => e.stopPropagation()}
          >
            <p class="mb-2 text-xs font-bold uppercase tracking-[0.35em] text-b-accent">
              Create
            </p>
            <h3
              id="new-provider-title"
              class="mb-8 font-['Anton',sans-serif] text-4xl uppercase leading-none tracking-wide text-b-ink"
            >
              New provider
            </h3>

            <form onSubmit={handleCreateProvider} class="flex flex-col gap-6">
              <div class="flex flex-col gap-2">
                <label
                  for="new-provider-name"
                  class="text-xs font-bold uppercase tracking-widest text-b-ink/70"
                >
                  Name
                </label>
                <input
                  id="new-provider-name"
                  type="text"
                  required
                  pattern={nameValidationPattern}
                  value={newProviderName()}
                  onInput={(e) => setNewProviderName(e.currentTarget.value)}
                  class="h-11 w-full border border-b-border bg-b-paper px-4 text-sm font-semibold text-b-ink placeholder:text-b-ink/25 outline-none focus-visible:border-b-accent/50 focus-visible:ring-2 focus-visible:ring-b-accent/20 hover:border-b-border-hover transition-all duration-200"
                  placeholder="MY_PROVIDER"
                  title={nameValidationHint}
                  autocomplete="off"
                />
                <p class="text-xs font-semibold uppercase tracking-wider text-b-ink/40">
                  {nameValidationHint}
                </p>
              </div>

              <div class="flex flex-col gap-2">
                <label
                  for="new-provider-rate-limit"
                  class="text-xs font-bold uppercase tracking-widest text-b-ink/70"
                >
                  Rate limit (req/s)
                </label>
                <input
                  id="new-provider-rate-limit"
                  type="number"
                  required
                  min={1}
                  step={1}
                  value={newProviderRateLimit()}
                  onInput={(e) =>
                    setNewProviderRateLimit(e.currentTarget.value)
                  }
                  class="h-11 w-full border border-b-border bg-b-paper px-4 text-sm font-semibold text-b-ink outline-none focus-visible:border-b-accent/50 focus-visible:ring-2 focus-visible:ring-b-accent/20 hover:border-b-border-hover transition-all duration-200"
                />
              </div>

              <Show when={createProviderError()}>
                <p class="border border-red-500/40 bg-red-500/10 px-3 py-3 text-xs font-bold uppercase leading-snug text-red-400">
                  {createProviderError()}
                </p>
              </Show>

              <div class="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeProviderModal}
                  disabled={createProviderLoading()}
                  class="btn btn-md btn-interactive btn-disabled btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createProviderLoading()}
                  class="btn btn-md btn-interactive btn-disabled btn-primary"
                >
                  <Show when={createProviderLoading()}>
                    <LoadingSpinner class="size-3.5 text-b-paper" />
                  </Show>
                  {createProviderLoading() ? "Creating…" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Show>

      <Show when={providerToDelete()}>
        <div
          class="fixed inset-0 z-[55] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4 py-8"
          role="presentation"
          onClick={() => !deleteProviderLoading() && setProviderToDelete(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-provider-title"
            class="w-full max-w-md border border-red-500/30 bg-b-field p-8 shadow-[0_25px_50px_rgba(0,0,0,0.5)]"
            onClick={(e) => e.stopPropagation()}
          >
            <p class="mb-2 text-xs font-bold uppercase tracking-[0.35em] text-red-400">
              Confirm Deletion
            </p>
            <h3
              id="delete-provider-title"
              class="mb-4 font-['Anton',sans-serif] text-4xl uppercase leading-none tracking-wide text-b-ink"
            >
              Delete provider
            </h3>
            <p class="mb-8 text-sm font-semibold text-b-ink/70">
              Permanently delete{" "}
              <span class="font-bold text-red-400">
                {providerToDelete()!.name}
              </span>
              ?
              {providerToDelete()!.rpcCount > 0 && (
                <>
                  {" "}
                  This will also delete{" "}
                  <span class="font-bold text-b-ink">
                    {providerToDelete()!.rpcCount} endpoint
                    {providerToDelete()!.rpcCount === 1 ? "" : "s"}
                  </span>{" "}
                  depending on this provider.
                </>
              )}{" "}
              This cannot be undone.
            </p>

            <Show when={deleteProviderError()}>
              <p class="mb-6 border border-red-500/40 bg-red-500/10 px-3 py-3 text-xs font-bold uppercase leading-snug text-red-400">
                {deleteProviderError()}
              </p>
            </Show>

            <div class="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setProviderToDelete(null)}
                disabled={deleteProviderLoading()}
                class="btn btn-md btn-interactive btn-disabled btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteRpcProvider}
                disabled={deleteProviderLoading()}
                class="btn btn-md btn-interactive btn-disabled btn-danger"
              >
                <Show when={deleteProviderLoading()}>
                  <LoadingSpinner class="size-3.5" />
                </Show>
                {deleteProviderLoading() ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      </Show>
    </>
  );
}
