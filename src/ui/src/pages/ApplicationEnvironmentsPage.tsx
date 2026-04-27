import { For, createMemo, createSignal, Show } from "solid-js";
import { useParams } from "@solidjs/router";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyStateIcon from "../components/icons/EmptyStateIcon";
import EnvironmentIcon from "../components/icons/EnvironmentIcon";
import RpcIcon from "../components/icons/RpcIcon";

import { createModalBackdropHandlers } from "../lib/createModalBackdropHandlers";
import { useAuth } from "../lib/auth";
import {
  nameValidationHint,
  nameValidationPattern,
  validateName,
} from "../lib/name-validation";
import { useReferenceData } from "../lib/reference-data";
import {
  useApplicationData,
  type ApplicationEnvironmentSummary,
} from "../lib/application-data";
import { useEscapeKey } from "../lib/useEscapeKey";

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
    return conflictHint ?? "An application with this name already exists.";
  return fallback;
}

export default function ApplicationEnvironmentsPage() {
  const auth = useAuth();
  const referenceData = useReferenceData();
  const applicationData = useApplicationData();
  const params = useParams();
  const applicationId = () => params.applicationId;

  const applications = referenceData.applications.data;
  const application = createMemo(
    () => applications().find((app) => app.id === applicationId()) ?? null,
  );

  const environments = applicationData.environments.data;
  const environmentsState = applicationData.environments.state;
  const rpcsByEnvironment = applicationData.rpcsByEnvironment;
  const rpcsState = applicationData.rpcs.state;
  const rpcsError = applicationData.rpcs.error;

  const isInitialEnvironmentLoadPending = createMemo(
    () => environmentsState() === "pending" || rpcsState() === "pending",
  );

  const getEnvironmentRpcCount = (environmentId: string) =>
    rpcsByEnvironment()[environmentId]?.length ?? 0;

  const getActiveChainCount = (environment: ApplicationEnvironmentSummary) =>
    new Set(environment.chains ?? []).size;

  const [environmentModalOpen, setEnvironmentModalOpen] = createSignal(false);
  const [newEnvironmentName, setNewEnvironmentName] = createSignal("");
  const [createEnvironmentError, setCreateEnvironmentError] = createSignal<
    string | null
  >(null);
  const [createEnvironmentLoading, setCreateEnvironmentLoading] =
    createSignal(false);

  const [editingEnvironmentId, setEditingEnvironmentId] = createSignal<
    string | null
  >(null);
  const [editingEnvironmentName, setEditingEnvironmentName] = createSignal("");
  const [editEnvironmentError, setEditEnvironmentError] = createSignal<
    string | null
  >(null);
  const [editEnvironmentLoading, setEditEnvironmentLoading] =
    createSignal(false);

  const [deleteEnvironmentError, setDeleteEnvironmentError] = createSignal<
    string | null
  >(null);
  const [deleteEnvironmentLoadingId, setDeleteEnvironmentLoadingId] =
    createSignal<string | null>(null);

  const openEnvironmentModal = () => {
    setCreateEnvironmentError(null);
    setNewEnvironmentName("");
    setEnvironmentModalOpen(true);
  };

  const closeEnvironmentModal = () => {
    if (createEnvironmentLoading()) return;
    setEnvironmentModalOpen(false);
  };

  useEscapeKey(environmentModalOpen, closeEnvironmentModal);

  const environmentModalBackdropHandlers =
    createModalBackdropHandlers(closeEnvironmentModal);

  const handleCreateEnvironment = async (e: SubmitEvent) => {
    e.preventDefault();
    const token = auth.token;
    const app = application();
    if (!token || !app) return;

    const name = newEnvironmentName();
    const validationError = validateName(name);
    if (validationError) {
      setCreateEnvironmentError(validationError);
      return;
    }

    setCreateEnvironmentError(null);
    setCreateEnvironmentLoading(true);
    try {
      const response = await fetch(`/api/Applications/${app.id}/Environments`, {
        method: "POST",
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
            "Failed to create environment",
            "An environment with this name already exists.",
          ),
        );
      }
      setEnvironmentModalOpen(false);
      setNewEnvironmentName("");
      await applicationData.refreshApplication();
    } catch (err) {
      setCreateEnvironmentError(
        err instanceof Error ? err.message : "Failed to create environment",
      );
    } finally {
      setCreateEnvironmentLoading(false);
    }
  };

  const startEditingEnvironment = (
    environment: ApplicationEnvironmentSummary,
  ) => {
    setEditEnvironmentError(null);
    setEditingEnvironmentId(environment.id);
    setEditingEnvironmentName(environment.name);
  };

  const cancelEditingEnvironment = () => {
    if (editEnvironmentLoading()) return;
    setEditingEnvironmentId(null);
    setEditingEnvironmentName("");
    setEditEnvironmentError(null);
  };

  const handleRenameEnvironment = async (environmentId: string) => {
    const token = auth.token;
    const app = application();
    if (!token || !app) return;

    const name = editingEnvironmentName();
    const validationError = validateName(name);
    if (validationError) {
      setEditEnvironmentError(validationError);
      return;
    }

    // Skip API call if name hasn't changed
    const environment = environments().find((e) => e.id === environmentId);
    if (environment && environment.name === name) {
      setEditingEnvironmentId(null);
      setEditingEnvironmentName("");
      return;
    }

    setEditEnvironmentError(null);
    setEditEnvironmentLoading(true);
    try {
      const response = await fetch(
        `/api/Applications/${app.id}/Environments/${environmentId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ name }),
        },
      );
      if (!response.ok) {
        throw new Error(
          await readErrorMessage(
            response,
            "Failed to rename environment",
            "An environment with this name already exists.",
          ),
        );
      }
      setEditingEnvironmentId(null);
      setEditingEnvironmentName("");
      await applicationData.refreshApplication();
    } catch (err) {
      setEditEnvironmentError(
        err instanceof Error ? err.message : "Failed to rename environment",
      );
    } finally {
      setEditEnvironmentLoading(false);
    }
  };

  const handleDeleteEnvironment = async (
    environment: ApplicationEnvironmentSummary,
  ) => {
    const token = auth.token;
    const app = application();
    if (!token || !app) return;
    if (
      !globalThis.confirm(
        `Delete environment '${environment.name}'? Its RPCs and API keys will be removed.`,
      )
    ) {
      return;
    }

    setDeleteEnvironmentError(null);
    setDeleteEnvironmentLoadingId(environment.id);
    try {
      const response = await fetch(
        `/api/Applications/${app.id}/Environments/${environment.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!response.ok) {
        throw new Error(
          await readErrorMessage(response, "Failed to delete environment"),
        );
      }
      if (editingEnvironmentId() === environment.id) {
        cancelEditingEnvironment();
      }
      await Promise.all([
        applicationData.refreshApplication(),
        referenceData.refreshApplications(),
      ]);
    } catch (err) {
      setDeleteEnvironmentError(
        err instanceof Error ? err.message : "Failed to delete environment",
      );
    } finally {
      setDeleteEnvironmentLoadingId(null);
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
                  <EnvironmentIcon class="size-5 text-b-accent" />
                </div>
                <div>
                  <h2 class="font-['Anton',sans-serif] text-xl uppercase tracking-wide text-b-ink">
                    Environments
                  </h2>
                  <p class="text-xs font-bold uppercase tracking-widest text-b-ink/50">
                    Add, rename, or remove application environments
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={openEnvironmentModal}
                disabled={
                  environmentsState() === "pending" ||
                  createEnvironmentLoading() ||
                  editEnvironmentLoading()
                }
                class="btn btn-md btn-interactive btn-disabled btn-primary shrink-0"
              >
                New environment
              </button>
            </div>
          </div>

          <div class="p-6">
            <Show when={isInitialEnvironmentLoadPending()}>
              <div class="flex items-center justify-center gap-3 py-8 text-xs font-bold uppercase tracking-widest text-b-ink/80">
                <LoadingSpinner class="size-4" />
                Loading environments…
              </div>
            </Show>

            <Show when={rpcsError()}>
              <p class="mb-4 border border-red-500/40 bg-red-500/10 px-3 py-3 text-xs font-bold uppercase leading-snug text-red-400">
                {rpcsError()!.message}
              </p>
            </Show>

            <Show when={environmentsState() === "refreshing"}>
              <div class="mb-4 flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-b-ink/80">
                <LoadingSpinner class="size-4" />
                Updating environments…
              </div>
            </Show>

            <Show when={deleteEnvironmentError()}>
              <p class="mb-4 border border-red-500/40 bg-red-500/10 px-3 py-3 text-xs font-bold uppercase leading-snug text-red-400">
                {deleteEnvironmentError()}
              </p>
            </Show>

            <Show
              when={
                !isInitialEnvironmentLoadPending() &&
                (environmentsState() === "ready" ||
                  environmentsState() === "refreshing") &&
                environments().length > 0
              }
            >
              <div class="flex flex-col gap-3">
                <For each={environments()}>
                  {(environment) => {
                    const isEditing = () =>
                      editingEnvironmentId() === environment.id;
                    const isDeleting = () =>
                      deleteEnvironmentLoadingId() === environment.id;
                    return (
                      <div class="border border-b-border bg-b-paper/40 p-4 shadow-[0_1px_0_rgba(0,0,0,0.35)] transition-colors hover:border-b-border-hover">
                        <Show
                          when={!isEditing()}
                          fallback={
                            <div class="flex flex-col gap-3">
                              <input
                                type="text"
                                required
                                pattern={nameValidationPattern}
                                value={editingEnvironmentName()}
                                onInput={(e) => {
                                  setEditingEnvironmentName(
                                    e.currentTarget.value,
                                  );
                                  setEditEnvironmentError(null);
                                }}
                                class="h-11 w-full border border-b-border bg-b-paper px-4 text-sm font-semibold text-b-ink placeholder:text-b-ink/25 outline-none focus-visible:border-b-accent/50 focus-visible:ring-2 focus-visible:ring-b-accent/20 hover:border-b-border-hover transition-all duration-200"
                                title={nameValidationHint}
                                autocomplete="off"
                              />
                              <Show when={editEnvironmentError()}>
                                <p class="border border-red-500/40 bg-red-500/10 px-3 py-3 text-xs font-bold uppercase leading-snug text-red-400">
                                  {editEnvironmentError()}
                                </p>
                              </Show>
                              <div class="flex flex-col gap-3 sm:flex-row sm:justify-end">
                                <button
                                  type="button"
                                  onClick={() =>
                                    void handleRenameEnvironment(environment.id)
                                  }
                                  disabled={editEnvironmentLoading()}
                                  class="btn btn-sm btn-interactive btn-disabled btn-primary"
                                >
                                  <Show when={editEnvironmentLoading()}>
                                    <LoadingSpinner class="size-3.5 text-b-paper" />
                                  </Show>
                                  {editEnvironmentLoading()
                                    ? "Saving…"
                                    : environment.name === editingEnvironmentName()
                                      ? "Cancel"
                                      : "Save"}
                                </button>
                              </div>
                            </div>
                          }
                        >
                          <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p class="font-['Anton',sans-serif] text-xl tracking-wide text-b-ink">
                                {environment.name}
                              </p>
                              <div class="mt-2 flex flex-wrap items-center gap-4 text-xs font-semibold uppercase tracking-wider text-b-ink/50">
                                <Show when={!rpcsError()}>
                                  <span class="inline-flex items-center gap-1">
                                    <RpcIcon class="size-3.5" />
                                    {getEnvironmentRpcCount(environment.id)} RPC
                                    {getEnvironmentRpcCount(environment.id) === 1
                                      ? ""
                                      : "s"}
                                  </span>
                                </Show>
                                <span>
                                  {getActiveChainCount(environment)} active chain
                                  {getActiveChainCount(environment) === 1
                                    ? ""
                                    : "s"}
                                </span>
                              </div>
                            </div>
                            <div class="flex flex-col gap-3 sm:flex-row sm:justify-end">
                              <button
                                type="button"
                                onClick={() =>
                                  startEditingEnvironment(environment)
                                }
                                disabled={isDeleting()}
                                class="btn btn-sm btn-interactive btn-disabled btn-secondary"
                              >
                                Rename
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  void handleDeleteEnvironment(environment)
                                }
                                disabled={isDeleting()}
                                class="btn btn-sm btn-interactive btn-disabled btn-danger"
                              >
                                <Show when={isDeleting()}>
                                  <LoadingSpinner class="size-3.5" />
                                </Show>
                                {isDeleting() ? "Deleting…" : "Delete"}
                              </button>
                            </div>
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
                !isInitialEnvironmentLoadPending() &&
                (environmentsState() === "ready" ||
                  environmentsState() === "refreshing") &&
                environments().length === 0
              }
            >
              <div class="flex flex-col items-center justify-center gap-3 py-8 border border-dashed border-b-border/50 bg-b-paper/20">
                <EmptyStateIcon class="size-10 text-b-ink/20" />
                <p class="text-sm font-semibold uppercase tracking-wider text-b-ink/50">
                  No environments configured.
                </p>
              </div>
            </Show>
          </div>
        </section>
      </div>

      <Show when={environmentModalOpen()}>
        <div
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4 py-8"
          role="presentation"
          {...environmentModalBackdropHandlers}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-environment-title"
            class="w-full max-w-md border border-b-border bg-b-field p-8 shadow-[0_25px_50px_rgba(0,0,0,0.5)]"
            onClick={(e) => e.stopPropagation()}
          >
            <p class="mb-2 text-xs font-bold uppercase tracking-[0.35em] text-b-accent">
              Create
            </p>
            <h3
              id="new-environment-title"
              class="mb-8 font-['Anton',sans-serif] text-4xl uppercase leading-none tracking-wide text-b-ink"
            >
              New environment
            </h3>

            <form
              onSubmit={handleCreateEnvironment}
              class="flex flex-col gap-6"
            >
              <div class="flex flex-col gap-2">
                <label
                  for="new-environment-name"
                  class="text-xs font-bold uppercase tracking-widest text-b-ink/70"
                >
                  Name
                </label>
                <input
                  id="new-environment-name"
                  type="text"
                  required
                  pattern={nameValidationPattern}
                  value={newEnvironmentName()}
                  onInput={(e) => {
                    setNewEnvironmentName(e.currentTarget.value);
                    setCreateEnvironmentError(null);
                  }}
                  class="h-11 w-full border border-b-border bg-b-paper px-4 text-sm font-semibold text-b-ink placeholder:text-b-ink/25 outline-none focus-visible:border-b-accent/50 focus-visible:ring-2 focus-visible:ring-b-accent/20 hover:border-b-border-hover transition-all duration-200"
                  placeholder="DEV"
                  title={nameValidationHint}
                  autocomplete="off"
                />
                <p class="text-xs font-semibold uppercase tracking-wider text-b-ink/40">
                  {nameValidationHint}
                </p>
              </div>

              <Show when={createEnvironmentError()}>
                <p class="border border-red-500/40 bg-red-500/10 px-3 py-3 text-xs font-bold uppercase leading-snug text-red-400">
                  {createEnvironmentError()}
                </p>
              </Show>

              <div class="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeEnvironmentModal}
                  disabled={createEnvironmentLoading()}
                  class="btn btn-md btn-interactive btn-disabled btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createEnvironmentLoading()}
                  class="btn btn-md btn-interactive btn-disabled btn-primary"
                >
                  <Show when={createEnvironmentLoading()}>
                    <LoadingSpinner class="size-3.5 text-b-paper" />
                  </Show>
                  {createEnvironmentLoading() ? "Creating…" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Show>
    </>
  );
}
