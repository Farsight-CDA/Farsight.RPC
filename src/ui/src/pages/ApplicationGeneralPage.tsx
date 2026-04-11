import { createEffect, createMemo, createSignal, For, Show } from "solid-js";
import { useNavigate, useParams } from "@solidjs/router";
import LoadingSpinner from "../components/LoadingSpinner";
import PencilIcon from "../components/icons/PencilIcon";
import TrashIcon from "../components/icons/TrashIcon";
import SettingsIcon from "../components/icons/SettingsIcon";
import { useAuth } from "../lib/auth";
import {
  nameValidationHint,
  nameValidationPattern,
  validateName,
} from "../lib/name-validation";
import { useReferenceData } from "../lib/reference-data";
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
    return conflictHint ?? "An application with this name already exists.";
  return fallback;
}

export default function ApplicationGeneralPage() {
  const auth = useAuth();
  const referenceData = useReferenceData();
  const applicationData = useApplicationData();
  const navigate = useNavigate();
  const params = useParams();
  const applicationId = () => params.applicationId;

  const applications = referenceData.applications.data;
  const applicationsState = referenceData.applications.state;

  const application = createMemo(
    () => applications().find((app) => app.id === applicationId()) ?? null,
  );

  const [renameName, setRenameName] = createSignal("");
  const [renameError, setRenameError] = createSignal<string | null>(null);
  const [renameLoading, setRenameLoading] = createSignal(false);

  const [deleteError, setDeleteError] = createSignal<string | null>(null);
  const [deleteLoading, setDeleteLoading] = createSignal(false);

  const rpcStructures = referenceData.rpcStructures.data;
  const appStructures = applicationData.structures.data;

  const [structuresError, setStructuresError] = createSignal<string | null>(null);
  const [structuresLoading, setStructuresLoading] = createSignal(false);

  const isStructureSelected = (structure: string) =>
    appStructures().includes(structure);

  const toggleStructure = async (structure: string) => {
    const token = auth.token;
    const app = application();
    if (!token || !app) return;

    const current = appStructures();
    const next = current.includes(structure)
      ? current.filter((s) => s !== structure)
      : [...current, structure];

    setStructuresError(null);
    setStructuresLoading(true);
    try {
      const response = await fetch(`/api/Applications/${app.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: app.name, structures: next }),
      });
      if (!response.ok) {
        throw new Error(
          await readErrorMessage(response, "Failed to update structures"),
        );
      }
      await applicationData.refreshStructures();
    } catch (err) {
      setStructuresError(
        err instanceof Error ? err.message : "Failed to update structures",
      );
    } finally {
      setStructuresLoading(false);
    }
  };

  createEffect(() => {
    setRenameName(application()?.name ?? "");
  });

  const handleRename = async (e: SubmitEvent) => {
    e.preventDefault();
    const token = auth.token;
    const app = application();
    if (!token || !app) return;

    const name = renameName();
    const validationError = validateName(name);
    if (validationError) {
      setRenameError(validationError);
      return;
    }

    setRenameError(null);
    setRenameLoading(true);
    try {
      const response = await fetch(`/api/Applications/${app.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name }),
      });
      if (!response.ok) {
        throw new Error(await readErrorMessage(response, "Failed to rename application"));
      }
      await referenceData.refreshApplications();
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
      const response = await fetch(`/api/Applications/${app.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new Error(await readErrorMessage(response, "Failed to delete application"));
      }
      referenceData.removeApplication(app.id);
      navigate("/", { replace: true });
      void referenceData.refreshApplications();
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : "Failed to delete application",
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <>
      <div class="flex flex-col gap-6">
        <section class="border border-b-border bg-b-field overflow-hidden">
          <div class="border-b border-b-border bg-b-paper/30 px-6 py-4">
            <div class="flex items-center gap-3">
              <div class="flex size-10 items-center justify-center border border-b-ink/20 bg-b-ink/5">
                <PencilIcon class="size-5 text-b-ink/70" />
              </div>
              <div>
                <h2 class="font-['Anton',sans-serif] text-xl uppercase tracking-wide text-b-ink">
                  Rename Application
                </h2>
                <p class="text-xs font-bold uppercase tracking-widest text-b-ink/50">
                  Change the display name
                </p>
              </div>
            </div>
          </div>

          <div class="p-6">
            <form onSubmit={handleRename} class="flex flex-col gap-4">
              <div class="flex flex-col gap-2">
                <label
                  for="rename-app-name"
                  class="mb-2 block text-xs font-bold uppercase tracking-widest text-b-ink/70"
                >
                  Application Name
                </label>
                <div class="flex flex-col gap-2 sm:flex-row sm:items-start">
                  <div class="flex-1">
                    <input
                      id="rename-app-name"
                      type="text"
                      required
                      pattern={nameValidationPattern}
                      value={renameName()}
                      onInput={(e) => {
                        setRenameName(e.currentTarget.value);
                        setRenameError(null);
                      }}
                      class="h-11 w-full border border-b-border bg-b-paper px-4 text-sm font-semibold text-b-ink placeholder:text-b-ink/25 outline-none focus-visible:border-b-accent/50 focus-visible:ring-2 focus-visible:ring-b-accent/20 hover:border-b-border-hover transition-all duration-200"
                      placeholder="MY APPLICATION"
                      title={nameValidationHint}
                      autocomplete="off"
                    />
                    <p class="mt-2 text-xs font-semibold uppercase tracking-wider text-b-ink/40">
                      {nameValidationHint}
                    </p>
                  </div>
                  <button
                    type="submit"
                    disabled={renameLoading()}
                    class="btn btn-md btn-interactive btn-disabled btn-primary h-11"
                  >
                    <Show when={renameLoading()}>
                      <LoadingSpinner class="size-3.5 text-b-paper" />
                    </Show>
                    {renameLoading() ? "Saving…" : "Rename"}
                  </button>
                </div>
              </div>

              <Show when={renameError()}>
                <p class="border border-red-500/40 bg-red-500/10 px-3 py-3 text-xs font-bold uppercase leading-snug text-red-400">
                  {renameError()}
                </p>
              </Show>
            </form>
          </div>
        </section>

        <section class="border border-b-border bg-b-field overflow-hidden">
          <div class="border-b border-b-border bg-b-paper/30 px-6 py-4">
            <div class="flex items-center gap-3">
              <div class="flex size-10 items-center justify-center border border-b-ink/20 bg-b-ink/5">
                <SettingsIcon class="size-5 text-b-ink/70" />
              </div>
              <div>
                <h2 class="font-['Anton',sans-serif] text-xl uppercase tracking-wide text-b-ink">
                  Supported Structures
                </h2>
                <p class="text-xs font-bold uppercase tracking-widest text-b-ink/50">
                  Define expected RPC configurations
                </p>
              </div>
            </div>
          </div>

          <div class="p-6">
            <p class="mb-4 text-sm text-b-ink/70">
              Select which RPC structures this application supports. Each chain's
              RPCs will be validated against these structures.
            </p>

            <div class="flex flex-col gap-3">
              <For each={rpcStructures()}>
                {(def) => {
                  const typeEntries = () => Object.entries(def.requiredRpcTypes);
                  return (
                    <button
                      type="button"
                      disabled={structuresLoading()}
                      onClick={() => void toggleStructure(def.structure)}
                      class={`flex items-center gap-4 border px-4 py-4 text-left transition-all duration-200 ${
                        isStructureSelected(def.structure)
                          ? "border-b-accent/50 bg-b-accent/10"
                          : "border-b-border bg-b-paper/20 hover:border-b-border-hover"
                      } ${structuresLoading() ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                    >
                      <div
                        class={`flex size-5 shrink-0 items-center justify-center border transition-all duration-200 ${
                          isStructureSelected(def.structure)
                            ? "border-b-accent bg-b-accent"
                            : "border-b-ink/30 bg-b-paper"
                        }`}
                      >
                        <Show when={isStructureSelected(def.structure)}>
                          <svg class="size-3 text-b-paper" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6l3 3 5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                          </svg>
                        </Show>
                      </div>
                      <div class="min-w-0 flex-1">
                        <p class="font-['Anton',sans-serif] text-base uppercase tracking-wide text-b-ink">
                          {def.structure}
                        </p>
                        <div class="mt-1 flex flex-wrap gap-2">
                          <For each={typeEntries()}>
                            {([type, count]) => (
                              <span
                                class={`inline-flex items-center border px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider ${
                                  type === "Realtime"
                                    ? "text-green-400 border-green-500/30 bg-green-500/10"
                                    : type === "Archive"
                                      ? "text-blue-400 border-blue-500/30 bg-blue-500/10"
                                      : "text-purple-400 border-purple-500/30 bg-purple-500/10"
                                }`}
                              >
                                {count}x {type}
                              </span>
                            )}
                          </For>
                        </div>
                      </div>
                    </button>
                  );
                }}
              </For>
            </div>

            <Show when={structuresError()}>
              <p class="mt-4 border border-red-500/40 bg-red-500/10 px-3 py-3 text-xs font-bold uppercase leading-snug text-red-400">
                {structuresError()}
              </p>
            </Show>

            <Show when={structuresLoading()}>
              <div class="mt-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-b-ink/50">
                <LoadingSpinner class="size-3.5" />
                Saving…
              </div>
            </Show>
          </div>
        </section>

        <section class="border border-red-500/30 bg-b-field overflow-hidden">
          <div class="border-b border-red-500/30 bg-red-500/5 px-6 py-4">
            <div class="flex items-center gap-3">
              <div class="flex size-10 items-center justify-center border border-red-500/30 bg-red-500/10">
                <TrashIcon class="size-5 text-red-400" />
              </div>
              <div>
                <h2 class="font-['Anton',sans-serif] text-xl uppercase tracking-wide text-red-400">
                  Delete Application
                </h2>
                <p class="text-xs font-bold uppercase tracking-widest text-red-400/60">
                  Permanently remove this application
                </p>
              </div>
            </div>
          </div>

          <div class="p-6">
            <p class="mb-4 text-sm text-b-ink/70">
              Once deleted, this application and all its associated data
              will be permanently removed. This action cannot be undone.
            </p>

            <Show when={deleteError()}>
              <p class="mb-4 border border-red-500/40 bg-red-500/10 px-3 py-3 text-xs font-bold uppercase leading-snug text-red-400">
                {deleteError()}
              </p>
            </Show>

            <button
              type="button"
              onClick={() => setDeleteLoading(true)}
              disabled={deleteLoading()}
              class="btn btn-md btn-interactive btn-disabled btn-danger"
            >
              <Show when={deleteLoading()}>
                <LoadingSpinner class="size-3.5" />
              </Show>
              {deleteLoading() ? "Deleting…" : "Delete Application"}
            </button>
          </div>
        </section>
      </div>

      <Show when={deleteLoading()}>
        <div
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4 py-8"
          role="presentation"
          onClick={() => setDeleteLoading(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-application-title"
            class="w-full max-w-md border border-red-500/30 bg-b-field p-8 shadow-[0_25px_50px_rgba(0,0,0,0.5)]"
            onClick={(e) => e.stopPropagation()}
          >
            <p class="mb-2 text-xs font-bold uppercase tracking-[0.35em] text-red-400">
              Confirm Deletion
            </p>
            <h3
              id="delete-application-title"
              class="mb-4 font-['Anton',sans-serif] text-4xl uppercase leading-none tracking-wide text-b-ink"
            >
              Delete Application
            </h3>
            <p class="mb-8 text-sm font-semibold text-b-ink/70">
              Permanently delete{" "}
              <span class="font-bold text-red-400">{application()?.name}</span>?
              This cannot be undone.
            </p>

            <Show when={deleteError()}>
              <p class="mb-6 border border-red-500/40 bg-red-500/10 px-3 py-3 text-xs font-bold uppercase leading-snug text-red-400">
                {deleteError()}
              </p>
            </Show>

            <div class="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setDeleteLoading(false)}
                class="btn btn-md btn-interactive btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteApplication}
                class="btn btn-md btn-interactive btn-danger"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </Show>
    </>
  );
}
