import { useNavigate, useParams } from "@solidjs/router";
import { createMemo, createSignal, For, Show } from "solid-js";
import DeleteSection from "../components/DeleteSection";
import InlineNameEdit from "../components/InlineNameEdit";
import SettingsSection from "../components/SettingsSection";
import SettingsIcon from "../components/icons/SettingsIcon";
import { useAuth } from "../lib/auth";
import { ACTION_OPTIONS, actionBadgeClass, readErrorMessage } from "../lib/error-groups";
import { useReferenceData } from "../lib/reference-data";

export default function ErrorGroupGeneralPage() {
  const auth = useAuth();
  const referenceData = useReferenceData();
  const navigate = useNavigate();
  const params = useParams();
  const groupId = () => params.groupId;

  const errorGroups = referenceData.errorGroups.data;
  const group = createMemo(() => errorGroups().find((g) => g.id === groupId())!);

  const [actionLoading, setActionLoading] = createSignal(false);
  const [actionError, setActionError] = createSignal<string | null>(null);

  const handleUpdateName = async (newName: string) => {
    const token = auth.token;
    const g = group();
    if (!token) return;

    const response = await fetch(`/api/RpcErrorGroups/${g.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: newName,
        action: g.action,
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
    await referenceData.refreshErrorGroups();
  };

  const handleUpdateAction = async (newAction: string) => {
    const token = auth.token;
    const g = group();
    if (!token) return;

    if (g.action === newAction) return;

    setActionError(null);
    setActionLoading(true);
    try {
      const response = await fetch(`/api/RpcErrorGroups/${g.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: g.name,
          action: newAction,
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
      await referenceData.refreshErrorGroups();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to update error group",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    const token = auth.token;
    const g = group();
    if (!token) return;

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
  };

  return (
    <div class="flex flex-col gap-6">
      <SettingsSection
        icon={<SettingsIcon class="size-5 text-b-ink/70" />}
        title="General Settings"
        subtitle="Manage name and action"
      >
        <div class="flex flex-col gap-4">
          <InlineNameEdit
            value={() => group().name}
            label="Name"
            onSave={handleUpdateName}
            editButtonTitle="Edit error group"
            inputId="edit-group-name"
          />

          <div class="flex flex-col gap-2">
            <p class="text-xs font-bold uppercase tracking-widest text-b-ink/50 mb-1">
              Action
            </p>
            <div class="flex flex-wrap gap-2">
              <For each={ACTION_OPTIONS}>
                {(opt) => (
                  <button
                    type="button"
                    onClick={() => void handleUpdateAction(opt)}
                    disabled={actionLoading()}
                    class={`inline-flex items-center border px-3 py-1.5 text-xs font-bold tracking-wider transition-colors ${
                      opt === group().action
                        ? actionBadgeClass(opt)
                        : "text-b-ink/30 border-b-border bg-transparent hover:bg-b-ink/5 hover:text-b-ink/60 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    }`}
                  >
                    {opt}
                  </button>
                )}
              </For>
            </div>
          </div>

          <Show when={actionError()}>
            <p class="border border-red-500/40 bg-red-500/10 px-3 py-3 text-xs font-bold uppercase leading-snug text-red-400">
              {actionError()}
            </p>
          </Show>
        </div>
      </SettingsSection>

      <DeleteSection
        title="Delete Error Group"
        subtitle="Remove this group permanently"
        buttonTitle="Delete error group"
        onDelete={handleDelete}
      >
        <p class="text-sm font-semibold text-b-ink/70">
          Permanently delete{" "}
          <span class="font-bold text-red-400">{group().name}</span>? This will
          remove its{" "}
          <span class="font-bold text-b-ink">
            {group().errors.length} error pattern
            {group().errors.length === 1 ? "" : "s"}
          </span>
          . This cannot be undone.
        </p>
      </DeleteSection>
    </div>
  );
}
