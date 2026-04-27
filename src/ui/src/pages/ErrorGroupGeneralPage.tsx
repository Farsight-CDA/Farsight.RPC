import { A, useNavigate, useParams } from "@solidjs/router";
import { createMemo, createSignal, For, Show } from "solid-js";
import LoadingSpinner from "../components/LoadingSpinner";
import PencilIcon from "../components/icons/PencilIcon";
import SettingsIcon from "../components/icons/SettingsIcon";
import TrashIcon from "../components/icons/TrashIcon";
import { useAuth } from "../lib/auth";
import {
  nameValidationHint,
  nameValidationPattern,
  validateName,
} from "../lib/name-validation";
import { useReferenceData } from "../lib/reference-data";
import { ACTION_OPTIONS, actionBadgeClass, readErrorMessage } from "../lib/error-groups";

export default function ErrorGroupGeneralPage() {
  const auth = useAuth();
  const referenceData = useReferenceData();
  const navigate = useNavigate();
  const params = useParams();
  const groupId = () => params.groupId;

  const errorGroups = referenceData.errorGroups.data;
  const group = createMemo(() => errorGroups().find((g) => g.id === groupId())!);

  const [isEditing, setIsEditing] = createSignal(false);
  const [editingName, setEditingName] = createSignal("");
  const [editingAction, setEditingAction] = createSignal("");
  const [editError, setEditError] = createSignal<string | null>(null);
  const [editLoading, setEditLoading] = createSignal(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = createSignal(false);
  const [deleteError, setDeleteError] = createSignal<string | null>(null);
  const [deleteLoading, setDeleteLoading] = createSignal(false);

  const startEditing = () => {
    setEditError(null);
    setEditingName(group().name);
    setEditingAction(group().action);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    if (editLoading()) return;
    setIsEditing(false);
    setEditError(null);
  };

  const handleUpdate = async () => {
    const token = auth.token;
    const g = group();
    if (!token) return;

    const name = editingName();
    const validationError = validateName(name);
    if (validationError) {
      setEditError(validationError);
      return;
    }

    if (g.name === name && g.action === editingAction()) {
      setIsEditing(false);
      return;
    }

    setEditError(null);
    setEditLoading(true);
    try {
      const response = await fetch(`/api/RpcErrorGroups/${g.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          action: editingAction(),
          errors: g.errors,
        }),
      });
      if (!response.ok) {
        throw new Error(
          await readErrorMessage(
            response,
            "Failed to update error group",
            "An error group with this name already exists.",
          ),
        );
      }
      setIsEditing(false);
      await referenceData.refreshErrorGroups();
    } catch (err) {
      setEditError(
        err instanceof Error ? err.message : "Failed to update error group",
      );
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async () => {
    const token = auth.token;
    const g = group();
    if (!token) return;
    setDeleteError(null);
    setDeleteLoading(true);
    try {
      const response = await fetch(`/api/RpcErrorGroups/${g.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new Error(
          await readErrorMessage(response, "Failed to delete error group"),
        );
      }
      await referenceData.refreshErrorGroups();
      navigate("/errors");
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : "Failed to delete error group",
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div class="flex flex-col gap-6">
      <section class="border border-b-border bg-b-field overflow-hidden">
        <div class="border-b border-b-border bg-b-paper/30 px-6 py-4">
          <div class="flex items-center gap-3">
            <div class="flex size-10 items-center justify-center border border-b-ink/20 bg-b-ink/5">
              <SettingsIcon class="size-5 text-b-ink/70" />
            </div>
            <div>
              <h2 class="font-['Anton',sans-serif] text-xl uppercase tracking-wide text-b-ink">
                General Settings
              </h2>
              <p class="text-xs font-bold uppercase tracking-widest text-b-ink/50">
                Manage name and action
              </p>
            </div>
          </div>
        </div>

        <div class="p-6">
          <Show
            when={!isEditing()}
            fallback={
              <div class="flex flex-col gap-4">
                <div class="flex flex-col gap-2">
                  <label for="edit-name" class="text-xs font-bold uppercase tracking-widest text-b-ink/70">
                    Name
                  </label>
                  <input
                    id="edit-name"
                    type="text"
                    required
                    pattern={nameValidationPattern}
                    value={editingName()}
                    onInput={(e) => {
                      setEditingName(e.currentTarget.value);
                      setEditError(null);
                    }}
                    class="h-11 w-full border border-b-border bg-b-paper px-4 text-sm font-semibold text-b-ink placeholder:text-b-ink/25 outline-none focus-visible:border-b-accent/50 focus-visible:ring-2 focus-visible:ring-b-accent/20 hover:border-b-border-hover transition-all duration-200"
                    title={nameValidationHint}
                    autocomplete="off"
                  />
                  <p class="text-xs font-semibold uppercase tracking-wider text-b-ink/40">
                    {nameValidationHint}
                  </p>
                </div>

                <div class="flex flex-col gap-2">
                  <label for="edit-action" class="text-xs font-bold uppercase tracking-widest text-b-ink/70">
                    Action
                  </label>
                  <select
                    id="edit-action"
                    value={editingAction()}
                    onChange={(e) => setEditingAction(e.currentTarget.value)}
                    class="h-11 w-full border border-b-border bg-b-paper px-4 text-sm font-semibold text-b-ink outline-none focus-visible:border-b-accent/50 focus-visible:ring-2 focus-visible:ring-b-accent/20 hover:border-b-border-hover transition-all duration-200 appearance-none cursor-pointer"
                  >
                    <For each={ACTION_OPTIONS}>
                      {(opt) => <option value={opt}>{opt}</option>}
                    </For>
                  </select>
                </div>

                <Show when={editError()}>
                  <p class="border border-red-500/40 bg-red-500/10 px-3 py-3 text-xs font-bold uppercase leading-snug text-red-400">
                    {editError()}
                  </p>
                </Show>

                <div class="flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={cancelEditing}
                    disabled={editLoading()}
                    class="btn btn-sm btn-interactive btn-disabled btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleUpdate()}
                    disabled={editLoading()}
                    class="btn btn-sm btn-interactive btn-disabled btn-primary"
                  >
                    <Show when={editLoading()}>
                      <LoadingSpinner class="size-3.5 text-b-paper" />
                    </Show>
                    {editLoading() ? "Saving…" : "Save"}
                  </button>
                </div>
              </div>
            }
          >
            <div class="flex flex-col gap-4">
              <div class="flex flex-col gap-1">
                <p class="text-xs font-bold uppercase tracking-widest text-b-ink/50 mb-1">
                  Name
                </p>
                <p class="font-['Anton',sans-serif] text-2xl tracking-wide text-b-ink">
                  {group().name}
                </p>
              </div>

              <div class="flex flex-col gap-1">
                <p class="text-xs font-bold uppercase tracking-widest text-b-ink/50 mb-1">
                  Action
                </p>
                <span class={`inline-flex items-center self-start border px-2 py-0.5 text-[0.7rem] font-bold tracking-wider ${actionBadgeClass(group().action)}`}>
                  {group().action}
                </span>
              </div>

              <div class="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={startEditing}
                  disabled={deleteLoading()}
                  class="btn btn-sm btn-interactive btn-disabled btn-secondary shrink-0"
                >
                  <PencilIcon class="size-3.5" />
                  Edit
                </button>
              </div>
            </div>
          </Show>
        </div>
      </section>

      <section class="border border-red-500/30 bg-b-field overflow-hidden">
        <div class="flex items-center justify-between gap-4 px-6 py-4">
          <div class="flex items-center gap-3">
            <div class="flex size-10 items-center justify-center border border-red-500/30 bg-red-500/10 shrink-0">
              <TrashIcon class="size-5 text-red-400" />
            </div>
            <div>
              <h2 class="font-['Anton',sans-serif] text-xl uppercase tracking-wide text-red-400">
                Delete Error Group
              </h2>
              <p class="text-xs font-bold uppercase tracking-widest text-red-400/60">
                Remove this group permanently
              </p>
            </div>
          </div>
          <Show when={!showDeleteConfirm()}>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isEditing()}
              class="btn btn-sm btn-interactive btn-disabled btn-danger shrink-0"
            >
              Delete
            </button>
          </Show>
        </div>

        <Show when={showDeleteConfirm()}>
          <div class="border-t border-red-500/30 bg-red-500/5 px-6 py-4">
            <div class="flex flex-col gap-4">
              <p class="text-sm font-semibold text-b-ink/70">
                Permanently delete{" "}
                <span class="font-bold text-red-400">{group().name}</span>?
                This will remove its{" "}
                <span class="font-bold text-b-ink">
                  {group().errors.length} error pattern
                  {group().errors.length === 1 ? "" : "s"}
                </span>
                . This cannot be undone.
              </p>

              <Show when={deleteError()}>
                <p class="border border-red-500/40 bg-red-500/10 px-3 py-3 text-xs font-bold uppercase leading-snug text-red-400">
                  {deleteError()}
                </p>
              </Show>

              <div class="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteError(null);
                  }}
                  disabled={deleteLoading()}
                  class="btn btn-sm btn-interactive btn-disabled btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete()}
                  disabled={deleteLoading()}
                  class="btn btn-sm btn-interactive btn-disabled btn-danger"
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
      </section>
    </div>
  );
}
