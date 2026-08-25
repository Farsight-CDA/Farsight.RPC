import { Accessor, createEffect, createMemo, createSignal, For, onCleanup, Show } from "solid-js";
import LoadingSpinner from "../components/LoadingSpinner";
import RuleIcon from "../components/icons/RuleIcon";
import CheckmarkIcon from "../components/icons/CheckmarkIcon";
import ChevronDownIcon from "../components/icons/ChevronDownIcon";
import CloseIcon from "../components/icons/CloseIcon";
import EmptyStateIcon from "../components/icons/EmptyStateIcon";
import PencilIcon from "../components/icons/PencilIcon";
import PlusIcon from "../components/icons/PlusIcon";
import SearchIcon from "../components/icons/SearchIcon";
import TrashIcon from "../components/icons/TrashIcon";
import WarningIcon from "../components/icons/WarningIcon";
import { createModalBackdropHandlers } from "../lib/createModalBackdropHandlers";
import { useAuth } from "../lib/auth";
import {
  useApplicationData,
  type ApplicationRpcRule,
  type RpcRuleSeverity,
} from "../lib/application-data";
import { useEnvironment } from "../lib/environment-context";
import { useEscapeKey } from "../lib/useEscapeKey";
import { useReferenceData } from "../lib/reference-data";

const allCapabilities: RpcCapability[] = [
  "Archive",
  "DebugApi",
  "DebugJsTracers",
  "TracingApi",
  "StateOverrides",
  "BlockOverrides",
  "Subscriptions",
  "GetLogs",
  "SendRawTransaction",
  "CreateAccessList",
];

type RpcCapability =
  | "Archive"
  | "DebugApi"
  | "DebugJsTracers"
  | "TracingApi"
  | "StateOverrides"
  | "BlockOverrides"
  | "Subscriptions"
  | "GetLogs"
  | "SendRawTransaction"
  | "CreateAccessList";

function formatCapability(capability: RpcCapability): string {
  switch (capability) {
    case "DebugApi":
      return "Debug API";
    case "DebugJsTracers":
      return "Debug JS Tracers";
    case "TracingApi":
      return "Tracing API";
    case "StateOverrides":
      return "State Overrides";
    case "BlockOverrides":
      return "Block Overrides";
    case "GetLogs":
      return "eth_getLogs";
    case "SendRawTransaction":
      return "eth_sendRawTransaction";
    case "CreateAccessList":
      return "eth_createAccessList";
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
    case "DebugJsTracers":
      return "border-violet-500/30 bg-violet-500/10 text-violet-400";
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
    case "SendRawTransaction":
      return "border-red-500/30 bg-red-500/10 text-red-400";
    case "CreateAccessList":
      return "border-lime-500/30 bg-lime-500/10 text-lime-400";
    default:
      return "border-b-border bg-b-paper/20 text-b-ink/50";
  }
}

const chainChipStyle =
  "inline-flex items-center border border-b-accent/30 bg-b-accent/10 px-2 py-1 text-[0.65rem] font-bold uppercase tracking-wider text-b-accent";

const allChainsChipStyle =
  "inline-flex items-center gap-1.5 border border-green-500/30 bg-green-500/10 px-2 py-1 text-[0.65rem] font-bold uppercase tracking-wider text-green-400";

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
  chains: string[],
  allOf: RpcCapability[],
  anyOf: RpcCapability[],
  severity: RpcRuleSeverity,
): {
  chains: string[];
  allOf: RpcCapability[];
  anyOf: RpcCapability[];
  severity: RpcRuleSeverity;
} {
  return {
    chains: [...chains].sort(),
    allOf: [...allOf].sort(),
    anyOf: [...anyOf].sort(),
    severity,
  };
}

export default function ApplicationRulesPage() {
  const auth = useAuth();
  const applicationData = useApplicationData();
  const environment = useEnvironment();
  const referenceData = useReferenceData();

  const rules = applicationData.rules.data;
  const rulesState = applicationData.rules.state;
  const rulesError = applicationData.rules.error;

  const environments = environment.environments;
  const environmentsState = environment.environmentsState;

  const allChains = referenceData.chains.data;
  const allChainsState = referenceData.chains.state;
  const allChainsError = referenceData.chains.error;

  const [isModalOpen, setIsModalOpen] = createSignal(false);
  const [modalMode, setModalMode] = createSignal<"create" | "edit">("create");
  const [editingRuleId, setEditingRuleId] = createSignal<string | null>(null);
  const [modalEnvironmentId, setModalEnvironmentId] = createSignal<string>("");
  const [chains, setChains] = createSignal<string[]>([]);
  const [chainPickerOpen, setChainPickerOpen] = createSignal(false);
  const [chainFilter, setChainFilter] = createSignal("");
  let chainPickerRef: HTMLDivElement | undefined;
  const [allOf, setAllOf] = createSignal<RpcCapability[]>([]);
  const [anyOf, setAnyOf] = createSignal<RpcCapability[]>([]);
  const [severity, setSeverity] = createSignal<RpcRuleSeverity>("Yellow");
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

  const availableRuleChains = createMemo(() => {
    const selected = new Set(chains());
    const candidates = new Set<string>(allChains());
    for (const chain of chains()) {
      candidates.add(chain);
    }
    return Array.from(candidates)
      .filter((chain) => !selected.has(chain))
      .sort((a, b) => a.localeCompare(b));
  });

  const filteredAvailableRuleChains = createMemo(() => {
    const filter = chainFilter().trim().toLowerCase();
    if (!filter) return availableRuleChains();
    return availableRuleChains().filter((chain) =>
      chain.toLowerCase().includes(filter),
    );
  });

  const openCreateModal = () => {
    setModalMode("create");
    setEditingRuleId(null);
    setChains([]);
    setChainPickerOpen(false);
    setChainFilter("");
    setAllOf([]);
    setAnyOf([]);
    setSeverity("Yellow");
    setModalError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (rule: ApplicationRpcRule) => {
    setModalMode("edit");
    setEditingRuleId(rule.id);
    setModalEnvironmentId(rule.environmentId);
    setChains(rule.chains);
    setChainPickerOpen(false);
    setChainFilter("");
    setAllOf(rule.allOf as RpcCapability[]);
    setAnyOf(rule.anyOf as RpcCapability[]);
    setSeverity(rule.severity);
    setModalError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (modalLoading()) return;
    setIsModalOpen(false);
  };

  useEscapeKey(isModalOpen, () => {
    if (chainPickerOpen()) {
      setChainPickerOpen(false);
      return;
    }
    closeModal();
  });
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

  const toggleChainPicker = () => {
    setChainFilter("");
    setChainPickerOpen((open) => !open);
  };

  const addChain = (chain: string) => {
    if (chains().includes(chain)) return;
    setChains((current) => [...current, chain]);
    setModalError(null);
  };

  const removeChain = (chain: string) => {
    setChains((current) => current.filter((c) => c !== chain));
    setModalError(null);
  };

  createEffect(() => {
    if (!chainPickerOpen()) return;
    const handleClick = (event: MouseEvent) => {
      if (!chainPickerRef?.contains(event.target as Node)) {
        setChainPickerOpen(false);
      }
    };
    document.addEventListener("click", handleClick);
    onCleanup(() => document.removeEventListener("click", handleClick));
  });

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
      const body = buildRuleBody(chains(), allOf(), anyOf(), severity());

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
              chains: body.chains,
              allOf: body.allOf,
              anyOf: body.anyOf,
              severity: body.severity,
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
              chains: body.chains,
              allOf: body.allOf,
              anyOf: body.anyOf,
              severity: body.severity,
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
                          <span
                            class={`inline-flex w-fit items-center gap-1.5 border px-2 py-1 text-[0.65rem] font-bold uppercase tracking-wider ${
                              rule.severity === "Red"
                                ? "border-red-500/30 bg-red-500/10 text-red-400"
                                : "border-amber-500/30 bg-amber-500/10 text-amber-300"
                            }`}
                          >
                            <WarningIcon class="size-3" />
                            {rule.severity}
                          </span>
                          <div class="flex flex-wrap items-center gap-2">
                            <span class="text-[0.65rem] font-bold uppercase tracking-widest text-b-ink/50">
                              Chains:
                            </span>
                            <Show
                              when={rule.chains.length > 0}
                              fallback={
                                <span class={allChainsChipStyle}>
                                  <CheckmarkIcon class="size-3" />
                                  All
                                </span>
                              }
                            >
                              <For each={rule.chains}>
                                {(chain) => (
                                  <span class={chainChipStyle}>{chain}</span>
                                )}
                              </For>
                            </Show>
                          </div>
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
            class="max-h-[calc(100vh-4rem)] w-full max-w-lg overflow-y-auto border border-b-border bg-b-field p-8 shadow-[0_25px_50px_rgba(0,0,0,0.5)]"
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
                    Severity
                  </p>
                  <div class="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Rule severity">
                    <button
                      type="button"
                      role="radio"
                      aria-checked={severity() === "Yellow"}
                      onClick={() => setSeverity("Yellow")}
                      disabled={modalLoading()}
                      class={`flex items-center justify-center gap-2 border px-3 py-2.5 text-xs font-bold uppercase tracking-wider transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                        severity() === "Yellow"
                          ? "border-amber-500/50 bg-amber-500/15 text-amber-300"
                          : "border-b-border bg-b-paper text-b-ink/50 hover:border-amber-500/30 hover:text-amber-300"
                      }`}
                    >
                      <WarningIcon class="size-4" />
                      Yellow
                    </button>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={severity() === "Red"}
                      onClick={() => setSeverity("Red")}
                      disabled={modalLoading()}
                      class={`flex items-center justify-center gap-2 border px-3 py-2.5 text-xs font-bold uppercase tracking-wider transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                        severity() === "Red"
                          ? "border-red-500/50 bg-red-500/15 text-red-400"
                          : "border-b-border bg-b-paper text-b-ink/50 hover:border-red-500/30 hover:text-red-400"
                      }`}
                    >
                      <WarningIcon class="size-4" />
                      Red
                    </button>
                  </div>
                </div>

                <div>
                  <p class="mb-3 text-xs font-bold uppercase tracking-widest text-b-ink/70">
                    Chains
                  </p>

                  <div class="relative" ref={chainPickerRef}>
                    <div
                      role="button"
                      tabindex="0"
                      aria-expanded={chainPickerOpen()}
                      onClick={toggleChainPicker}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          toggleChainPicker();
                        }
                      }}
                      class={`flex min-h-11 w-full cursor-pointer items-center gap-2 border bg-b-paper px-3 py-2 transition-all duration-200 hover:border-b-border-hover focus-visible:border-b-accent/50 focus-visible:ring-2 focus-visible:ring-b-accent/20 ${
                        chainPickerOpen()
                          ? "border-b-accent/50 ring-2 ring-b-accent/20"
                          : "border-b-border"
                      }`}
                    >
                      <Show
                        when={chains().length === 0}
                        fallback={
                          <div class="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
                            <For each={chains()}>
                              {(chain) => (
                                <span class={`${chainChipStyle} gap-1`}>
                                  {chain}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeChain(chain);
                                    }}
                                    disabled={modalLoading()}
                                    class="text-b-accent/60 transition-colors hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-50"
                                    title={`Remove ${chain}`}
                                  >
                                    <CloseIcon class="size-3" />
                                  </button>
                                </span>
                              )}
                            </For>
                          </div>
                        }
                      >
                        <div class="flex min-w-0 flex-1 items-center">
                          <span class="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-green-400">
                            <CheckmarkIcon class="size-4" />
                            All
                          </span>
                        </div>
                      </Show>
                      <ChevronDownIcon
                        class={`size-4 shrink-0 text-b-ink/40 transition-transform duration-200 ${
                          chainPickerOpen() ? "rotate-180" : ""
                        }`}
                      />
                    </div>

                    <Show when={chainPickerOpen()}>
                      <div class="absolute left-0 right-0 top-full z-20 mt-2 border border-b-border bg-b-field shadow-[0_25px_50px_rgba(0,0,0,0.5)]">
                        <div class="border-b border-b-border p-2">
                          <div class="relative">
                            <input
                              type="text"
                              autofocus
                              value={chainFilter()}
                              onInput={(e) =>
                                setChainFilter(e.currentTarget.value)
                              }
                              placeholder="Filter chains..."
                              class="h-10 w-full border border-b-border bg-b-paper px-3 pr-10 text-sm font-semibold text-b-ink placeholder:text-b-ink/25 outline-none focus-visible:border-b-accent/50 focus-visible:ring-2 focus-visible:ring-b-accent/20 hover:border-b-border-hover transition-all duration-200"
                            />
                            <div class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                              <SearchIcon class="size-4 text-b-ink/30" />
                            </div>
                          </div>
                        </div>

                        <div class="max-h-44 overflow-y-auto overscroll-contain p-1">
                          <Show when={allChainsError()}>
                            <p class="m-1 border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs font-bold uppercase leading-snug text-red-400">
                              {allChainsError()!.message}
                            </p>
                          </Show>

                          <Show when={allChainsState() === "pending"}>
                            <div class="flex items-center justify-center gap-2 py-4 text-xs font-bold uppercase tracking-widest text-b-ink/60">
                              <LoadingSpinner class="size-3.5" />
                              Loading chains…
                            </div>
                          </Show>

                          <Show
                            when={
                              (allChainsState() === "ready" ||
                                allChainsState() === "refreshing") &&
                              filteredAvailableRuleChains().length > 0
                            }
                          >
                            <For each={filteredAvailableRuleChains()}>
                              {(chain) => (
                                <button
                                  type="button"
                                  onClick={() => addChain(chain)}
                                  disabled={modalLoading()}
                                  class="group flex w-full items-center justify-between gap-2 border-b border-b-border/50 px-3 py-2 text-left transition-colors last:border-b-0 hover:bg-b-accent/5 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  <span class="min-w-0 truncate font-['Anton',sans-serif] text-sm tracking-wide text-b-ink/85 group-hover:text-b-ink">
                                    {chain}
                                  </span>
                                  <PlusIcon class="size-3.5 shrink-0 text-b-accent/60 group-hover:text-b-accent" />
                                </button>
                              )}
                            </For>
                          </Show>

                          <Show
                            when={
                              (allChainsState() === "ready" ||
                                allChainsState() === "refreshing") &&
                              !allChainsError() &&
                              filteredAvailableRuleChains().length === 0
                            }
                          >
                            <div class="px-3 py-3 text-center">
                              <p class="text-xs font-semibold uppercase tracking-wider text-b-ink/50">
                                {availableRuleChains().length === 0
                                  ? "All chains are added"
                                  : "No chains match your filter"}
                              </p>
                            </div>
                          </Show>
                        </div>
                      </div>
                    </Show>
                  </div>
                </div>

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
