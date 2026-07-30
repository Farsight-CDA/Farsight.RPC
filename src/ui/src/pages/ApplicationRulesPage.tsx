import { Accessor, createMemo, createSignal, For, Show } from "solid-js";
import LoadingSpinner from "../components/LoadingSpinner";
import RuleIcon from "../components/icons/RuleIcon";
import EmptyStateIcon from "../components/icons/EmptyStateIcon";
import PencilIcon from "../components/icons/PencilIcon";
import PlusIcon from "../components/icons/PlusIcon";
import TrashIcon from "../components/icons/TrashIcon";
import WarningIcon from "../components/icons/WarningIcon";
import { createModalBackdropHandlers } from "../lib/createModalBackdropHandlers";
import { useAuth } from "../lib/auth";
import { useApplicationData, type ApplicationRpcRule } from "../lib/application-data";
import { useEnvironment } from "../lib/environment-context";
import { useEscapeKey } from "../lib/useEscapeKey";

const allCapabilities: RpcCapability[] = [
  "Archive",
  "DebugApi",
  "TracingApi",
  "StateOverrides",
  "BlockOverrides",
  "Subscriptions",
  "GetLogs",
];

type RpcCapability =
  | "Archive"
  | "DebugApi"
  | "TracingApi"
  | "StateOverrides"
  | "BlockOverrides"
  | "Subscriptions"
  | "GetLogs";

function formatCapability(capability: RpcCapability): string {
  switch (capability) {
    case "DebugApi":
      return "Debug API";
    case "TracingApi":
      return "Tracing API";
    case "StateOverrides":
      return "State Overrides";
    case "BlockOverrides":
      return "Block Overrides";
    case "GetLogs":
      return "eth_getLogs";
    default:
      return capability;
  }
}

function capabilityStyle(capability: RpcCapability): string {
  switch (capability) {
    case "Archive":
      return "border-blue-500/30 bg-blue-500/10 text-blue-400";
    case "DebugApi":
      return "border-purple-500/30 bg-purple-500/10 text-purple-400";
    case "TracingApi":
      return "border-pink-500/30 bg-pink-500/10 text-pink-400";
    case "StateOverrides":
      return "border-amber-500/30 bg-amber-500/10 text-amber-400";
    case "BlockOverrides":
      return "border-cyan-500/30 bg-cyan-500/10 text-cyan-400";
    case "Subscriptions":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-400";
    case "GetLogs":
      return "border-orange-500/30 bg-orange-500/10 text-orange-400";
    default:
      return "border-b-border bg-b-paper/20 text-b-ink/50";
  }
}

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

function validateCapabilities(
  allOf: RpcCapability[],
  anyOf: RpcCapability[],
): string | null {
  if (allOf.length === 0 && anyOf.length === 0) {
    return "At least one AllOf or AnyOf capability is required.";
  }
  const allSet = new Set(allOf);
  const anySet = new Set(anyOf);
  for (const capability of allSet) {
    if (anySet.has(capability)) {
      return "A capability cannot appear in both AllOf and AnyOf.";
    }
  }
  return null;
}

function buildRuleBody(
  allOf: RpcCapability[],
  anyOf: RpcCapability[],
): { allOf: RpcCapability[]; anyOf: RpcCapability[] } {
  return {
    allOf: [...allOf].sort(),
    anyOf: [...anyOf].sort(),
  };
}

export default function ApplicationRulesPage() {
  const auth = useAuth();
  const applicationData = useApplicationData();
  const environment = useEnvironment();

  const rules = applicationData.rules.data;
  const rulesState = applicationData.rules.state;
  const rulesError = applicationData.rules.error;

  const environments = environment.environments;
  const environmentsState = environment.environmentsState;

  const [isModalOpen, setIsModalOpen] = createSignal(false);
  const [modalMode, setModalMode] = createSignal<"create" | "edit">("create");
  const [editingRuleId, setEditingRuleId] = createSignal<string | null>(null);
  const [modalEnvironmentId, setModalEnvironmentId] = createSignal<string>("");
  const [allOf, setAllOf] = createSignal<RpcCapability[]>([]);
  const [anyOf, setAnyOf] = createSignal<RpcCapability[]>([]);
  const [modalError, setModalError] = createSignal<string | null>(null);
  const [modalLoading, setModalLoading] = createSignal(false);

  const [ruleToDelete, setRuleToDelete] = createSignal<ApplicationRpcRule | null>(null);
  const [deleteError, setDeleteError] = createSignal<string | null>(null);
  const [deleteLoading, setDeleteLoading] = createSignal(false);

  const filteredRules = createMemo(() => {
    const selectedId = environment.selectedEnvironmentId();
    if (!selectedId) return rules();
    return rules().filter((rule) => rule.environmentId === selectedId);
  });

  const selectedEnvironment = createMemo(() => {
    const selectedId = environment.selectedEnvironmentId();
    return environments().find((env) => env.id === selectedId) ?? null;
  });

  const openCreateModal = () => {
    setModalMode("create");
    setEditingRuleId(null);
    setAllOf([]);
    setAnyOf([]);
    setModalError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (rule: ApplicationRpcRule) => {
    setModalMode("edit");
    setEditingRuleId(rule.id);
    setModalEnvironmentId(rule.environmentId);
    setAllOf(rule.allOf as RpcCapability[]);
    setAnyOf(rule.anyOf as RpcCapability[]);
    setModalError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (modalLoading()) return;
    setIsModalOpen(false);
  };

  useEscapeKey(isModalOpen, closeModal);
  useEscapeKey(
    () => ruleToDelete() !== null,
    () => {
      if (!deleteLoading()) setRuleToDelete(null);
    },
  );

  const modalBackdropHandlers = createModalBackdropHandlers(closeModal);
  const deleteBackdropHandlers = createModalBackdropHandlers(() => {
    if (!deleteLoading()) setRuleToDelete(null);
  });

  const toggleCapability = (
    list: Accessor<RpcCapability[]>,
    setter: (value: RpcCapability[]) => void,
    capability: RpcCapability,
  ) => {
    const current = list();
    if (current.includes(capability)) {
      setter(current.filter((c) => c !== capability));
    } else {
      setter([...current, capability]);
    }
    setModalError(null);
  };

  const handleSave = async () => {
    const token = auth.token;
    const appId = applicationData.applicationId();
    if (!token || !appId) return;

    const validationError = validateCapabilities(allOf(), anyOf());
    if (validationError) {
      setModalError(validationError);
      return;
    }

    setModalError(null);
    setModalLoading(true);

    try {
      const environmentId =
        modalMode() === "create"
          ? environment.selectedEnvironmentId()
          : modalEnvironmentId();
      if (!environmentId) {
        throw new Error("Select an environment.");
      }
      const body = buildRuleBody(allOf(), anyOf());

      if (modalMode() === "create") {
        const response = await fetch(
          `/api/Applications/${appId}/Environments/${environmentId}/Rules`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              allOf: body.allOf,
              anyOf: body.anyOf,
            }),
          },
        );
        if (!response.ok) {
          throw new Error(await readErrorMessage(response, "Failed to create rule"));
        }
      } else {
        const ruleId = editingRuleId();
        if (!ruleId) return;
        const response = await fetch(
          `/api/Applications/${appId}/Environments/${environmentId}/Rules/${ruleId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              allOf: body.allOf,
              anyOf: body.anyOf,
            }),
          },
        );
        if (!response.ok) {
          throw new Error(await readErrorMessage(response, "Failed to update rule"));
        }
      }

      setIsModalOpen(false);
      await applicationData.refreshApplication();
    } catch (err) {
      setModalError(err instanceof Error ? err.message : "Failed to save rule");
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async () => {
    const token = auth.token;
    const appId = applicationData.applicationId();
    const rule = ruleToDelete();
    if (!token || !appId || !rule) return;

    setDeleteError(null);
    setDeleteLoading(true);
    try {
      const response = await fetch(
        `/api/Applications/${appId}/Environments/${rule.environmentId}/Rules/${rule.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!response.ok) {
        throw new Error(await readErrorMessage(response, "Failed to delete rule"));
      }
      setRuleToDelete(null);
      await applicationData.refreshApplication();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete rule");
    } finally {
      setDeleteLoading(false);
    }
  };

  const isBusy = () =>
    modalLoading() || deleteLoading() || rulesState() === "refreshing";

  return (
    <>
      <div class="flex min-h-0 flex-1 flex-col gap-6">
        <section class="flex min-h-0 flex-1 flex-col border border-b-border bg-b-field overflow-hidden">
          <div class="border-b border-b-border bg-b-paper/30 px-6 py-4">
            <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div class="flex items-center gap-3">
                <div class="flex size-10 items-center justify-center border border-b-accent/30 bg-b-accent/10">
                  <RuleIcon class="size-5 text-b-accent" />
                </div>
                <div>
                  <h2 class="font-['Anton',sans-serif] text-xl uppercase tracking-wide text-b-ink">
                    Rules
                  </h2>
                  <p class="text-xs font-bold uppercase tracking-widest text-b-ink/50">
                    Capability rules for the selected environment
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={openCreateModal}
                disabled={
                  environmentsState() === "pending" ||
                  !environment.selectedEnvironmentId() ||
                  isBusy()
                }
                class="btn btn-md btn-interactive btn-disabled btn-primary shrink-0"
              >
                <PlusIcon class="size-3.5" />
                New rule
              </button>
            </div>
          </div>

          <div class="min-h-0 flex-1 overflow-y-auto">
            <Show when={rulesState() === "pending" || rulesState() === "refreshing"}>
              <div class="flex items-center justify-center gap-3 py-8 text-xs font-bold uppercase tracking-widest text-b-ink/80">
                <LoadingSpinner class="size-4" />
                {rulesState() === "refreshing" ? "Updating rules…" : "Loading rules…"}
              </div>
            </Show>

            <Show when={rulesError()}>
              <div class="px-6 py-4">
                <p class="border border-red-500/40 bg-red-500/10 px-3 py-3 text-xs font-bold uppercase leading-snug text-red-400">
                  {rulesError()!.message}
                </p>
              </div>
            </Show>

            <Show
              when={
                !rulesError() &&
                (rulesState() === "ready" || rulesState() === "refreshing") &&
                filteredRules().length > 0
              }
            >
              <div class="flex flex-col gap-3">
                <For each={filteredRules()}>
                  {(rule) => (
                    <div class="flex flex-col gap-3 border border-b-border bg-b-paper/40 p-4 shadow-[0_1px_0_rgba(0,0,0,0.35)] transition-colors hover:border-b-border-hover sm:flex-row sm:items-center sm:justify-between">
                      <div class="min-w-0 flex-1">
                        <div class="flex flex-col gap-2">
                          <Show when={rule.allOf.length > 0}>
                            <div class="flex flex-wrap items-center gap-2">
                              <span class="text-[0.65rem] font-bold uppercase tracking-widest text-b-ink/50">
                                All of:
                              </span>
                              <For each={rule.allOf}>
                                {(capability) => (
                                  <span
                                    class={`inline-flex items-center border px-2 py-1 text-[0.65rem] font-bold uppercase tracking-wider ${capabilityStyle(
                                      capability as RpcCapability,
                                    )}`}
                                  >
                                    {formatCapability(capability as RpcCapability)}
                                  </span>
                                )}
                              </For>
                            </div>
                          </Show>
                          <Show when={rule.anyOf.length > 0}>
                            <div class="flex flex-wrap items-center gap-2">
                              <span class="text-[0.65rem] font-bold uppercase tracking-widest text-b-ink/50">
                                Any of:
                              </span>
                              <For each={rule.anyOf}>
                                {(capability) => (
                                  <span
                                    class={`inline-flex items-center border px-2 py-1 text-[0.65rem] font-bold uppercase tracking-wider ${capabilityStyle(
                                      capability as RpcCapability,
                                    )}`}
                                  >
                                    {formatCapability(capability as RpcCapability)}
                                  </span>
                                )}
                              </For>
                            </div>
                          </Show>
                        </div>
                      </div>
                      <div class="flex shrink-0 items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(rule)}
                          disabled={isBusy()}
                          class="btn btn-sm btn-interactive btn-disabled btn-secondary shrink-0"
                          title="Edit rule"
                        >
                          <PencilIcon class="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteError(null);
                            setRuleToDelete(rule);
                          }}
                          disabled={isBusy()}
                          class="btn btn-sm btn-interactive btn-disabled btn-danger shrink-0"
                          title="Delete rule"
                        >
                          <TrashIcon class="size-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </For>
              </div>
            </Show>

            <Show
              when={
                !rulesError() &&
                (rulesState() === "ready" || rulesState() === "refreshing") &&
                filteredRules().length === 0
              }
            >
              <div class="flex flex-col items-center justify-center gap-3 py-8 border border-b-border/50 bg-b-paper/20">
                <EmptyStateIcon class="size-10 text-b-ink/20" />
                <p class="text-sm font-semibold uppercase tracking-wider text-b-ink/50">
                  {selectedEnvironment()
                    ? `No rules for ${selectedEnvironment()!.name}.`
                    : "No rules available."}
                </p>
              </div>
            </Show>
          </div>
        </section>
      </div>

      <Show when={isModalOpen()}>
        <div
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4 py-8"
          role="presentation"
          {...modalBackdropHandlers}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="rule-modal-title"
            class="w-full max-w-lg border border-b-border bg-b-field p-8 shadow-[0_25px_50px_rgba(0,0,0,0.5)]"
            onClick={(e) => e.stopPropagation()}
          >
            <p class="mb-2 text-xs font-bold uppercase tracking-[0.35em] text-b-accent">
              {modalMode() === "create" ? "Create" : "Edit"}
            </p>
            <h3
              id="rule-modal-title"
              class="mb-8 font-['Anton',sans-serif] text-4xl uppercase leading-none tracking-wide text-b-ink"
            >
              {modalMode() === "create" ? "New rule" : "Edit rule"}
            </h3>

            <div class="flex flex-col gap-6">
              <div class="flex flex-col gap-4">
                <div>
                  <p class="mb-3 text-xs font-bold uppercase tracking-widest text-b-ink/70">
                    All of (required together)
                  </p>
                  <div class="flex flex-wrap gap-2">
                    <For each={allCapabilities}>
                      {(capability) => {
                        const selected = () => allOf().includes(capability);
                        return (
                          <button
                            type="button"
                            onClick={() =>
                              toggleCapability(allOf, setAllOf, capability)
                            }
                            disabled={modalLoading()}
                            class={`inline-flex items-center gap-1.5 border px-3 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                              selected()
                                ? capabilityStyle(capability)
                                : "border-b-border bg-b-paper text-b-ink/50 hover:border-b-border-hover hover:text-b-ink"
                            } disabled:cursor-not-allowed disabled:opacity-50`}
                          >
                            {formatCapability(capability)}
                          </button>
                        );
                      }}
                    </For>
                  </div>
                </div>

                <div>
                  <p class="mb-3 text-xs font-bold uppercase tracking-widest text-b-ink/70">
                    Any of (at least one)
                  </p>
                  <div class="flex flex-wrap gap-2">
                    <For each={allCapabilities}>
                      {(capability) => {
                        const selected = () => anyOf().includes(capability);
                        return (
                          <button
                            type="button"
                            onClick={() =>
                              toggleCapability(anyOf, setAnyOf, capability)
                            }
                            disabled={modalLoading()}
                            class={`inline-flex items-center gap-1.5 border px-3 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                              selected()
                                ? capabilityStyle(capability)
                                : "border-b-border bg-b-paper text-b-ink/50 hover:border-b-border-hover hover:text-b-ink"
                            } disabled:cursor-not-allowed disabled:opacity-50`}
                          >
                            {formatCapability(capability)}
                          </button>
                        );
                      }}
                    </For>
                  </div>
                </div>
              </div>

              <Show when={modalError()}>
                <div class="flex items-start gap-2 border border-red-500/40 bg-red-500/10 px-3 py-3 text-xs font-bold uppercase leading-snug text-red-400">
                  <WarningIcon class="size-4 shrink-0 mt-0.5" />
                  {modalError()}
                </div>
              </Show>

              <div class="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={modalLoading()}
                  class="btn btn-md btn-interactive btn-disabled btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={modalLoading()}
                  class="btn btn-md btn-interactive btn-disabled btn-primary"
                >
                  <Show when={modalLoading()}>
                    <LoadingSpinner class="size-3.5 text-b-paper" />
                  </Show>
                  {modalLoading() ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </Show>

      <Show when={ruleToDelete()}>
        <div
          class="fixed inset-0 z-[55] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4 py-8"
          role="presentation"
          {...deleteBackdropHandlers}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-rule-title"
            class="w-full max-w-md border border-red-500/30 bg-b-field p-8 shadow-[0_25px_50px_rgba(0,0,0,0.5)]"
            onClick={(e) => e.stopPropagation()}
          >
            <p class="mb-2 text-xs font-bold uppercase tracking-[0.35em] text-red-400">
              Confirm Deletion
            </p>
            <h3
              id="delete-rule-title"
              class="mb-4 font-['Anton',sans-serif] text-4xl uppercase leading-none tracking-wide text-b-ink"
            >
              Delete rule
            </h3>
            <p class="mb-8 text-sm font-semibold text-b-ink/70">
              Permanently delete this rule for{" "}
              <span class="font-bold text-b-ink">
                {environments().find((env) => env.id === ruleToDelete()!.environmentId)
                  ?.name ?? "Unknown environment"}
              </span>
              ? This cannot be undone.
            </p>

            <Show when={deleteError()}>
              <p class="mb-6 border border-red-500/40 bg-red-500/10 px-3 py-3 text-xs font-bold uppercase leading-snug text-red-400">
                {deleteError()}
              </p>
            </Show>

            <div class="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setRuleToDelete(null)}
                disabled={deleteLoading()}
                class="btn btn-md btn-interactive btn-disabled btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleDelete()}
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
    </>
  );
}
