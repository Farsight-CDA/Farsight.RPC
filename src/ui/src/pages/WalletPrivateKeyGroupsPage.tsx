import { useParams } from "@solidjs/router";
import { createMemo, createSignal, For, Show } from "solid-js";
import LoadingSpinner from "../components/LoadingSpinner";
import Modal from "../components/Modal";
import PrivateKeyGroupModal from "../components/PrivateKeyGroupModal";
import KeyIcon from "../components/icons/KeyIcon";
import PencilIcon from "../components/icons/PencilIcon";
import PlusIcon from "../components/icons/PlusIcon";
import StructureIcon from "../components/icons/StructureIcon";
import TrashIcon from "../components/icons/TrashIcon";
import { readErrorMessage } from "../lib/error-groups";
import { useReferenceData } from "../lib/reference-data";
import {
  useWalletData,
  type WalletPrivateKeyGroupSummary,
} from "../lib/wallet-data";
import { useAuth } from "../lib/auth";

export default function WalletPrivateKeyGroupsPage() {
  const auth = useAuth();
  const referenceData = useReferenceData();
  const walletData = useWalletData();
  const params = useParams();
  const walletId = () => params.walletId;

  const groups = walletData.privateKeyGroups.data;
  const groupsState = walletData.privateKeyGroups.state;
  const groupsError = walletData.privateKeyGroups.error;
  const privateKeys = walletData.privateKeys.data;

  const wallet = createMemo(
    () =>
      referenceData.wallets.data().find((w) => w.id === walletId()) ?? null,
  );

  const keyCount = (groupId: string) =>
    privateKeys().filter((pk) => pk.groupId === groupId).length;

  // Create / edit modal
  const [modalOpen, setModalOpen] = createSignal(false);
  const [modalMode, setModalMode] = createSignal<"create" | "edit">("create");
  const [editingGroup, setEditingGroup] =
    createSignal<WalletPrivateKeyGroupSummary | null>(null);
  const [initialName, setInitialName] = createSignal("");
  const [initialDescription, setInitialDescription] = createSignal("");
  const [modalError, setModalError] = createSignal<string | null>(null);
  const [modalLoading, setModalLoading] = createSignal(false);

  // Delete confirmation
  const [groupToDelete, setGroupToDelete] =
    createSignal<WalletPrivateKeyGroupSummary | null>(null);
  const [deleteError, setDeleteError] = createSignal<string | null>(null);
  const [deleteLoading, setDeleteLoading] = createSignal(false);

  const isBusy = () => modalLoading() || deleteLoading();

  const openCreateModal = () => {
    if (isBusy()) return;
    setModalMode("create");
    setEditingGroup(null);
    setInitialName("");
    setInitialDescription("");
    setModalError(null);
    setModalOpen(true);
  };

  const openEditModal = (group: WalletPrivateKeyGroupSummary) => {
    if (isBusy()) return;
    setModalMode("edit");
    setEditingGroup(group);
    setInitialName(group.name);
    setInitialDescription(group.description);
    setModalError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    if (modalLoading()) return;
    setModalOpen(false);
    setModalError(null);
  };

  const handleSaveGroup = async (name: string, description: string) => {
    const token = auth.token;
    const id = walletId();
    if (!token || !id) return;

    setModalError(null);
    setModalLoading(true);
    try {
      if (modalMode() === "create") {
        const response = await fetch(
          `/api/Wallets/${id}/PrivateKeyGroups`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ name, description }),
          },
        );
        if (!response.ok) {
          throw new Error(
            await readErrorMessage(
              response,
              "Failed to create key group",
              "A private key group with this name already exists in the wallet.",
            ),
          );
        }
        const created = (await response.json()) as {
          id: string;
          name: string;
          description: string;
        };
        walletData.addPrivateKeyGroup({
          id: created.id,
          name: created.name,
          description: created.description,
        });
      } else {
        const group = editingGroup();
        if (!group) return;
        const response = await fetch(
          `/api/Wallets/${id}/PrivateKeyGroups/${group.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ name, description }),
          },
        );
        if (!response.ok) {
          throw new Error(
            await readErrorMessage(
              response,
              "Failed to update key group",
              "A private key group with this name already exists in the wallet.",
            ),
          );
        }
        walletData.updatePrivateKeyGroup(group.id, { name, description });
      }
      setModalOpen(false);
      void walletData.refresh();
    } catch (err) {
      setModalError(
        err instanceof Error ? err.message : "Failed to save key group",
      );
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteGroup = async () => {
    const token = auth.token;
    const id = walletId();
    const group = groupToDelete();
    if (!token || !id || !group) return;

    setDeleteError(null);
    setDeleteLoading(true);
    try {
      const response = await fetch(
        `/api/Wallets/${id}/PrivateKeyGroups/${group.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!response.ok) {
        throw new Error(
          await readErrorMessage(response, "Failed to delete key group"),
        );
      }
      walletData.removePrivateKeyGroup(group.id);
      setGroupToDelete(null);
      void walletData.refresh();
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : "Failed to delete key group",
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <>
      <div class="flex min-h-0 flex-1 flex-col gap-6">
        <section class="flex min-h-0 flex-1 flex-col border border-b-border bg-b-field overflow-hidden">
          <div class="border-b border-b-border bg-b-paper/30 px-6 py-4">
            <div class="flex items-center justify-between gap-3">
              <div class="flex items-center gap-3">
                <div class="flex size-10 items-center justify-center border border-b-accent/30 bg-b-accent/10">
                  <StructureIcon class="size-5 text-b-accent" />
                </div>
                <div>
                  <h2 class="font-['Anton',sans-serif] text-xl uppercase tracking-wide text-b-ink">
                    Key Groups
                  </h2>
                  <p class="text-xs font-bold uppercase tracking-widest text-b-ink/50">
                    {wallet()
                      ? `Organize private keys for ${wallet()!.name}`
                      : "Organize private keys"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={openCreateModal}
                disabled={isBusy()}
                class="btn btn-sm btn-interactive btn-disabled btn-primary shrink-0"
              >
                <PlusIcon class="size-4" />
                Add Group
              </button>
            </div>
          </div>

          <div class="flex flex-col gap-3 flex-1 min-h-0 overflow-hidden">
            <Show
              when={groupsState() === "pending" || groupsState() === "idle"}
            >
              <div class="flex flex-col items-center justify-center gap-4 py-16">
                <LoadingSpinner class="size-8" />
                <p class="text-sm font-bold uppercase tracking-widest text-b-ink/80">
                  Loading key groups…
                </p>
              </div>
            </Show>

            <Show when={groupsState() === "refreshing"}>
              <div class="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-b-ink/80">
                <LoadingSpinner class="size-4" />
                Updating…
              </div>
            </Show>

            <Show when={groupsError()}>
              <div class="mx-auto max-w-md">
                <p class="border-4 border-red-500/50 bg-red-500/10 px-4 py-4 text-center text-xs font-bold uppercase leading-snug text-red-400">
                  {groupsError()!.message}
                </p>
              </div>
            </Show>

            <Show
              when={
                !groupsError() &&
                (groupsState() === "ready" ||
                  groupsState() === "refreshing")
              }
            >
              <Show
                when={groups().length > 0}
                fallback={
                  <div class="flex flex-1 flex-col items-center justify-center gap-3 p-10">
                    <StructureIcon class="size-10 text-b-ink/20" />
                    <p class="text-center text-sm font-semibold uppercase tracking-wider text-b-ink/50">
                      No key groups yet. Create one to organize your private
                      keys.
                    </p>
                    <button
                      type="button"
                      onClick={openCreateModal}
                      disabled={isBusy()}
                      class="btn btn-md btn-interactive btn-disabled btn-primary"
                    >
                      <PlusIcon class="size-4" />
                      Add Group
                    </button>
                  </div>
                }
              >
                <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
                  <ul class="flex flex-col gap-4">
                    <For each={groups()}>
                      {(group) => (
                        <li class="border border-b-border bg-b-paper/40 shadow-[0_1px_0_rgba(0,0,0,0.35)] transition-colors hover:border-b-border-hover">
                          <div class="flex flex-col gap-4 p-4 sm:flex-row sm:items-stretch sm:justify-between sm:gap-6">
                            <div class="min-w-0 flex-1">
                              <div class="flex flex-wrap items-center gap-2">
                                <p class="font-['Anton',sans-serif] text-xl tracking-wide text-b-ink">
                                  {group.name}
                                </p>
                                <span class="inline-flex items-center gap-1.5 border border-b-accent/30 bg-b-accent/10 px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-widest text-b-accent">
                                  <KeyIcon class="size-3" />
                                  {keyCount(group.id)} key
                                  {keyCount(group.id) === 1 ? "" : "s"}
                                </span>
                              </div>
                              <Show
                                when={group.description.length > 0}
                                fallback={
                                  <p class="mt-1 text-xs font-semibold italic uppercase tracking-wider text-b-ink/30">
                                    No description
                                  </p>
                                }
                              >
                                <p class="mt-1 text-sm font-semibold text-b-ink/70">
                                  {group.description}
                                </p>
                              </Show>
                            </div>
                            <div class="flex shrink-0 items-center justify-end gap-2 border-t border-b-border/60 pt-3 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
                              <button
                                type="button"
                                onClick={() => openEditModal(group)}
                                disabled={isBusy()}
                                class="btn btn-sm btn-interactive btn-disabled btn-secondary"
                                title="Edit group"
                              >
                                <PencilIcon class="size-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setDeleteError(null);
                                  setGroupToDelete(group);
                                }}
                                disabled={isBusy()}
                                class="btn btn-sm btn-interactive btn-disabled btn-danger"
                                title="Delete group"
                              >
                                <TrashIcon class="size-4" />
                              </button>
                            </div>
                          </div>
                        </li>
                      )}
                    </For>
                  </ul>
                </div>
              </Show>
            </Show>
          </div>
        </section>
      </div>

      <PrivateKeyGroupModal
        open={modalOpen}
        mode={modalMode}
        initialName={initialName}
        initialDescription={initialDescription}
        loading={modalLoading}
        error={modalError}
        onClose={closeModal}
        onSubmit={(name, description) => void handleSaveGroup(name, description)}
      />

      {/* Delete group confirm modal */}
      <Modal
        open={() => groupToDelete() !== null}
        onClose={() => {
          if (!deleteLoading()) setGroupToDelete(null);
        }}
        danger
      >
        <p class="mb-2 text-xs font-bold uppercase tracking-[0.35em] text-red-400">
          Confirm Deletion
        </p>
        <h3
          id="delete-group-title"
          class="mb-4 font-['Anton',sans-serif] text-4xl uppercase leading-none tracking-wide text-b-ink"
        >
          Delete Key Group
        </h3>
        <p class="mb-4 text-sm font-semibold text-b-ink/70">
          Permanently delete{" "}
          <span class="font-bold text-red-400">
            {groupToDelete()?.name ?? ""}
          </span>
          ? Its{" "}
          <span class="font-bold text-b-ink">
            {keyCount(groupToDelete()?.id ?? "")} private key
            {keyCount(groupToDelete()?.id ?? "") === 1 ? "" : "s"}
          </span>{" "}
          will be unassigned immediately.
        </p>

        <Show when={deleteError()}>
          <p class="mb-6 border border-red-500/40 bg-red-500/10 px-3 py-3 text-xs font-bold uppercase leading-snug text-red-400">
            {deleteError()}
          </p>
        </Show>

        <div class="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => setGroupToDelete(null)}
            disabled={deleteLoading()}
            class="btn btn-md btn-interactive btn-disabled btn-secondary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleDeleteGroup()}
            disabled={deleteLoading()}
            class="btn btn-md btn-interactive btn-disabled btn-danger"
          >
            <Show when={deleteLoading()}>
              <LoadingSpinner class="size-3.5" />
            </Show>
            {deleteLoading() ? "Deleting…" : "Delete"}
          </button>
        </div>
      </Modal>
    </>
  );
}
