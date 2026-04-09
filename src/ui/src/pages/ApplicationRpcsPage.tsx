import { createEffect, createMemo, createSignal, For, Show } from "solid-js";
import { useNavigate, useParams } from "@solidjs/router";
import LoadingSpinner from "../components/LoadingSpinner";
import SearchIcon from "../components/icons/SearchIcon";
import PencilIcon from "../components/icons/PencilIcon";
import TrashIcon from "../components/icons/TrashIcon";
import LightningIcon from "../components/icons/LightningIcon";
import EmptyStateIcon from "../components/icons/EmptyStateIcon";
import ProviderIcon from "../components/icons/ProviderIcon";
import PlusIcon from "../components/icons/PlusIcon";
import ChevronDownIcon from "../components/icons/ChevronDownIcon";
import { useAuth } from "../lib/auth";
import { useReferenceData } from "../lib/reference-data";
import { useApplicationData, type ApplicationRpc } from "../lib/application-data";
import { useEnvironment } from "../lib/environment-context";

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

const addressHint = "Enter a valid HTTP, HTTPS, WS, or WSS URL.";

function isValidRpcAddress(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return ["http:", "https:", "ws:", "wss:"].includes(url.protocol);
  } catch {
    return false;
  }
}

function validateRpcAddressInput(input: HTMLInputElement): boolean {
  const valid = input.value.length === 0 || isValidRpcAddress(input.value);
  input.setCustomValidity(valid ? "" : addressHint);
  return valid;
}

export default function ApplicationRpcsPage() {
  const auth = useAuth();
  const referenceData = useReferenceData();
  const applicationData = useApplicationData();
  const navigate = useNavigate();
  const params = useParams();
  const applicationId = () => params.applicationId;

  const chains = referenceData.chains.data;
  const chainsState = referenceData.chains.state;
  const chainsError = referenceData.chains.error;
  const providers = referenceData.rpcProviders.data;
  const providersState = referenceData.rpcProviders.state;
  const providersError = referenceData.rpcProviders.error;
  const rpcs = applicationData.rpcs.data;
  const rpcsState = applicationData.rpcs.state;
  const rpcsError = applicationData.rpcs.error;

  const environment = useEnvironment();
  const [filterText, setFilterText] = createSignal("");
  const [activeChain, setActiveChain] = createSignal<string | null>(null);
  const [onlyChainsWithRpcs, setOnlyChainsWithRpcs] = createSignal(false);

  const [createRpcModalOpen, setCreateRpcModalOpen] = createSignal(false);
  const [selectedChainForRpc, setSelectedChainForRpc] = createSignal<string>("");
  const [newRpcType, setNewRpcType] = createSignal<"Realtime" | "Archive" | "Tracing">("Realtime");
  const [newRpcAddress, setNewRpcAddress] = createSignal("");
  const [newRpcProviderId, setNewRpcProviderId] = createSignal<string>("");
  const [newRpcTracingMode, setNewRpcTracingMode] = createSignal<"Debug" | "Trace">("Debug");
  const [newRpcIndexerStepSize, setNewRpcIndexerStepSize] = createSignal("1");
  const [newRpcDexIndexerStepSize, setNewRpcDexIndexerStepSize] = createSignal("1");
  const [newRpcIndexerBlockOffset, setNewRpcIndexerBlockOffset] = createSignal("1");
  const [createRpcError, setCreateRpcError] = createSignal<string | null>(null);
  const [createRpcLoading, setCreateRpcLoading] = createSignal(false);

  const [editRpcModalOpen, setEditRpcModalOpen] = createSignal(false);
  const [rpcToEdit, setRpcToEdit] = createSignal<ApplicationRpc | null>(null);
  const [editRpcAddress, setEditRpcAddress] = createSignal("");
  const [editRpcProviderId, setEditRpcProviderId] = createSignal<string>("");
  const [editRpcError, setEditRpcError] = createSignal<string | null>(null);
  const [editRpcLoading, setEditRpcLoading] = createSignal(false);

  let newRpcAddressInput!: HTMLInputElement;
  let editRpcAddressInput!: HTMLInputElement;

  const [rpcToDelete, setRpcToDelete] = createSignal<ApplicationRpc | null>(null);
  const [deleteRpcError, setDeleteRpcError] = createSignal<string | null>(null);
  const [deleteRpcLoading, setDeleteRpcLoading] = createSignal(false);

  createEffect(() => {
    const prods = providers();
    if (prods.length > 0 && !newRpcProviderId()) {
      setNewRpcProviderId(prods[0].id);
    }
  });

  const availableChains = createMemo(() => {
    const uniqueChains = new Set(chains());
    return Array.from(uniqueChains).sort((a, b) => a.localeCompare(b));
  });

  const getChainRpcs = (chain: string, environment: string) => {
    return rpcs().filter(
      (rpc) => rpc.chain === chain && rpc.environment === environment,
    );
  };

  const chainRpcCounts = createMemo(() => {
    const env = environment.selectedEnvironment() || "";
    const counts: Record<string, number> = {};
    for (const rpc of rpcs()) {
      if (rpc.environment === env) {
        counts[rpc.chain] = (counts[rpc.chain] ?? 0) + 1;
      }
    }
    return counts;
  });

  const filteredChains = createMemo(() => {
    const allChains = availableChains();
    const filter = filterText().trim().toLowerCase();
    const counts = chainRpcCounts();
    let list = allChains;
    if (filter) {
      list = list.filter((chain) => chain.toLowerCase().includes(filter));
    }
    if (onlyChainsWithRpcs()) {
      list = list.filter((chain) => (counts[chain] ?? 0) > 0);
    }
    return list;
  });

  createEffect(() => {
    const list = filteredChains();
    const current = activeChain();
    if (list.length === 0) {
      setActiveChain(null);
      return;
    }
    if (!current || !list.includes(current)) {
      setActiveChain(list[0]);
    }
  });

  const activeChainRpcs = createMemo(() => {
    const chain = activeChain();
    const env = environment.selectedEnvironment() || "";
    if (!chain) return [];
    return getChainRpcs(chain, env);
  });

  const openCreateRpcModal = (chain: string) => {
    setCreateRpcError(null);
    setSelectedChainForRpc(chain);
    setNewRpcType("Realtime");
    setNewRpcAddress("");
    setNewRpcTracingMode("Debug");
    setNewRpcIndexerStepSize("1");
    setNewRpcDexIndexerStepSize("1");
    setNewRpcIndexerBlockOffset("1");
    const prods = providers();
    if (prods.length > 0) {
      setNewRpcProviderId(prods[0].id);
    }
    setCreateRpcModalOpen(true);
  };

  const closeCreateRpcModal = () => {
    if (createRpcLoading()) return;
    setCreateRpcModalOpen(false);
    setSelectedChainForRpc("");
  };

  const openEditRpcModal = (rpc: ApplicationRpc) => {
    setEditRpcError(null);
    setRpcToEdit(rpc);
    setEditRpcAddress(rpc.address);
    setEditRpcProviderId(rpc.providerId);
    setEditRpcModalOpen(true);
  };

  const closeEditRpcModal = () => {
    if (editRpcLoading()) return;
    setEditRpcModalOpen(false);
    setRpcToEdit(null);
  };

  const handleCreateRpc = async (e: SubmitEvent) => {
    e.preventDefault();
    const token = auth.token;
    const app = applicationId();
    const env = environment.selectedEnvironment();
    const providerId = newRpcProviderId();
    const chain = selectedChainForRpc();
    const rpcType = newRpcType();
    if (!token || !app || !env || !providerId || !chain) return;

    const address = newRpcAddress().trim();
    if (!isValidRpcAddress(address)) {
      setCreateRpcError(addressHint);
      newRpcAddressInput.setCustomValidity(addressHint);
      newRpcAddressInput.reportValidity();
      return;
    }

    const body: Record<string, number | string> = {
      environment: env,
      chain,
      address,
      providerId,
    };

    if (rpcType === "Tracing") {
      body.tracingMode = newRpcTracingMode();
    }

    if (rpcType === "Archive") {
      body.indexerStepSize = Number.parseInt(newRpcIndexerStepSize(), 10);
      body.dexIndexerStepSize = Number.parseInt(newRpcDexIndexerStepSize(), 10);
      body.indexerBlockOffset = Number.parseInt(newRpcIndexerBlockOffset(), 10);
    }

    setCreateRpcError(null);
    setCreateRpcLoading(true);
    try {
      const response = await fetch(
        `/api/Applications/${app}/Rpcs/${rpcType}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        },
      );
      if (!response.ok) {
        throw new Error(await readErrorMessage(response, "Failed to create RPC"));
      }
      await applicationData.refreshRpcs();
      await referenceData.refreshRpcProviders();
      setCreateRpcModalOpen(false);
      setNewRpcAddress("");
      setActiveChain(chain);
    } catch (err) {
      setCreateRpcError(
        err instanceof Error ? err.message : "Failed to create RPC",
      );
    } finally {
      setCreateRpcLoading(false);
    }
  };

  const handleEditRpc = async (e: SubmitEvent) => {
    e.preventDefault();
    const token = auth.token;
    const app = applicationId();
    const rpc = rpcToEdit();
    if (!token || !app || !rpc) return;

    const address = editRpcAddress().trim();
    if (!isValidRpcAddress(address)) {
      setEditRpcError(addressHint);
      editRpcAddressInput.setCustomValidity(addressHint);
      editRpcAddressInput.reportValidity();
      return;
    }

    setEditRpcError(null);
    setEditRpcLoading(true);
    try {
      const response = await fetch(
        `/api/Applications/${app}/Rpcs/${rpc.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            address,
            providerId: editRpcProviderId(),
          }),
        },
      );
      if (!response.ok) {
        throw new Error(await readErrorMessage(response, "Failed to update RPC"));
      }
      await applicationData.refreshRpcs();
      await referenceData.refreshRpcProviders();
      setEditRpcModalOpen(false);
      setRpcToEdit(null);
    } catch (err) {
      setEditRpcError(
        err instanceof Error ? err.message : "Failed to update RPC",
      );
    } finally {
      setEditRpcLoading(false);
    }
  };

  const handleDeleteRpc = async () => {
    const token = auth.token;
    const app = applicationId();
    const rpc = rpcToDelete();
    if (!token || !app || !rpc) return;

    setDeleteRpcError(null);
    setDeleteRpcLoading(true);
    try {
      const response = await fetch(
        `/api/Applications/${app}/Rpcs/${rpc.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!response.ok) {
        throw new Error(await readErrorMessage(response, "Failed to delete RPC"));
      }
      setRpcToDelete(null);
      await applicationData.refreshRpcs();
      await referenceData.refreshRpcProviders();
    } catch (err) {
      setDeleteRpcError(
        err instanceof Error ? err.message : "Failed to delete RPC",
      );
    } finally {
      setDeleteRpcLoading(false);
    }
  };

  const getProviderName = (providerId: string) => {
    const provider = providers().find((p) => p.id === providerId);
    return provider?.name ?? "Unknown";
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Realtime":
        return "text-green-400 border-green-500/30 bg-green-500/10";
      case "Archive":
        return "text-blue-400 border-blue-500/30 bg-blue-500/10";
      case "Tracing":
        return "text-purple-400 border-purple-500/30 bg-purple-500/10";
      default:
        return "text-b-ink/50 border-b-border bg-b-field";
    }
  };

  return (
    <>
      <div class="flex flex-col gap-6">
        <Show when={chainsState() === "pending" || rpcsState() === "pending"}>
          <div class="flex flex-col items-center justify-center gap-4 py-16">
            <LoadingSpinner class="size-8" />
            <p class="text-sm font-bold uppercase tracking-widest text-b-ink/80">
              Loading chains and RPCs…
            </p>
          </div>
        </Show>

        <Show when={chainsState() === "refreshing" || rpcsState() === "refreshing"}>
          <div class="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-b-ink/80">
            <LoadingSpinner class="size-4" />
            Updating…
          </div>
        </Show>

        <Show when={chainsError()}>
          <div class="mx-auto max-w-md">
            <p class="border-4 border-red-500/50 bg-red-500/10 px-4 py-4 text-center text-xs font-bold uppercase leading-snug text-red-400">
              {chainsError()!.message}
            </p>
          </div>
        </Show>

        <Show when={rpcsError()}>
          <div class="mx-auto max-w-md">
            <p class="border-4 border-red-500/50 bg-red-500/10 px-4 py-4 text-center text-xs font-bold uppercase leading-snug text-red-400">
              {rpcsError()!.message}
            </p>
          </div>
        </Show>

        <Show
          when={
            !chainsError() &&
            !rpcsError() &&
            (chainsState() === "ready" || chainsState() === "refreshing") &&
            (rpcsState() === "ready" || rpcsState() === "refreshing")
          }
        >
          <div class="flex flex-col gap-4 lg:flex-row lg:items-stretch lg:gap-6">
            <aside class="flex max-h-[min(22rem,52vh)] flex-col overflow-hidden border border-b-border bg-b-field lg:max-h-[calc(100vh-13rem)] lg:w-72 lg:shrink-0">
              <div class="shrink-0 space-y-3 border-b border-b-border p-4">
                <div class="flex items-center justify-between gap-2">
                  <p class="text-xs font-bold uppercase tracking-[0.35em] text-b-accent">
                    Chains
                  </p>
                  <span class="tabular-nums text-[0.65rem] font-bold uppercase tracking-widest text-b-ink/45">
                    {filteredChains().length}/{availableChains().length}
                  </span>
                </div>
                <div class="relative">
                  <input
                    type="text"
                    value={filterText()}
                    onInput={(e) => setFilterText(e.currentTarget.value)}
                    placeholder="Filter chains..."
                    class="h-10 w-full border border-b-border bg-b-paper px-3 pr-10 text-sm font-semibold text-b-ink placeholder:text-b-ink/25 outline-none focus-visible:border-b-accent/50 focus-visible:ring-2 focus-visible:ring-b-accent/20 hover:border-b-border-hover transition-all duration-200"
                  />
                  <div class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                    <SearchIcon class="size-4 text-b-ink/30" />
                  </div>
                </div>
                <label class="flex cursor-pointer select-none items-center gap-2">
                  <input
                    type="checkbox"
                    checked={onlyChainsWithRpcs()}
                    onChange={(e) => setOnlyChainsWithRpcs(e.currentTarget.checked)}
                    class="size-3.5 rounded border border-b-border bg-b-paper accent-b-accent"
                  />
                  <span class="text-[0.65rem] font-bold uppercase tracking-widest text-b-ink/55">
                    Has RPCs only
                  </span>
                </label>
              </div>
              <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2 [scrollbar-gutter:stable]">
                <For each={filteredChains()}>
                  {(chain) => {
                    const count = () => chainRpcCounts()[chain] ?? 0;
                    const isActive = () => activeChain() === chain;
                    return (
                      <button
                        type="button"
                        onClick={() => setActiveChain(chain)}
                        class={`mb-1 flex w-full items-center justify-between gap-2 border px-3 py-2.5 text-left transition-all duration-150 last:mb-0 ${
                          isActive()
                            ? "border-b-accent bg-b-accent/10 text-b-ink shadow-[inset_2px_0_0_0_var(--color-b-accent)]"
                            : "border-transparent bg-b-paper/15 text-b-ink/85 hover:border-b-border-hover hover:bg-b-paper/35"
                        }`}
                      >
                        <span class="min-w-0 truncate font-['Anton',sans-serif] text-base uppercase tracking-wide">
                          {chain}
                        </span>
                        <span
                          class={`shrink-0 tabular-nums rounded px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider ${
                            count() > 0
                              ? "bg-b-accent/15 text-b-accent"
                              : "bg-b-ink/10 text-b-ink/40"
                          }`}
                        >
                          {count()}
                        </span>
                      </button>
                    );
                  }}
                </For>
              </div>
            </aside>

            <section class="flex min-h-[min(24rem,55vh)] min-w-0 flex-1 flex-col overflow-hidden border border-b-border bg-b-field lg:min-h-[calc(100vh-13rem)]">
              <Show
                when={activeChain()}
                fallback={
                  <div class="flex flex-1 flex-col items-center justify-center gap-3 p-10">
                    <EmptyStateIcon class="size-10 text-b-ink/20" />
                    <p class="text-center text-xs font-semibold uppercase tracking-wider text-b-ink/45">
                      Select a chain from the list
                    </p>
                  </div>
                }
              >
                <div class="flex min-h-0 flex-1 flex-col">
                  <div class="flex shrink-0 flex-col gap-3 border-b border-b-border p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div class="min-w-0">
                      <p class="text-[0.65rem] font-bold uppercase tracking-[0.35em] text-b-accent">
                        Chain
                      </p>
                      <h2 class="truncate font-['Anton',sans-serif] text-2xl uppercase tracking-wide text-b-ink">
                        {activeChain()}
                      </h2>
                      <p class="mt-1 text-[0.65rem] font-bold uppercase tracking-widest text-b-ink/45">
                        {activeChainRpcs().length} RPC
                        {activeChainRpcs().length !== 1 ? "s" : ""} · {environment.selectedEnvironment()}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const ch = activeChain();
                        if (ch) openCreateRpcModal(ch);
                      }}
                      disabled={providersState() === "pending" || createRpcLoading() || deleteRpcLoading() || editRpcLoading()}
                      class="btn btn-sm btn-interactive btn-disabled btn-primary shrink-0 self-start sm:self-center"
                    >
                      <PlusIcon class="size-4" />
                      Add RPC
                    </button>
                  </div>
                  <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 [scrollbar-gutter:stable]">
                    <Show when={activeChainRpcs().length > 0}>
                      <div class="flex flex-col gap-3">
                        <For each={activeChainRpcs()}>
                          {(rpc) => (
                            <div class="flex flex-col gap-3 border border-b-border bg-b-paper/20 p-4 sm:flex-row sm:items-start sm:justify-between transition-colors hover:border-b-border-hover">
                              <div class="min-w-0 flex-1">
                                <div class="flex flex-wrap items-center gap-2">
                                  <span class={`inline-flex items-center border px-2 py-0.5 text-xs font-bold uppercase tracking-wider ${getTypeColor(rpc.type)}`}>
                                    {rpc.type}
                                  </span>
                                  <span class="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-b-ink/50">
                                    <ProviderIcon class="size-3.5" />
                                    {getProviderName(rpc.providerId)}
                                  </span>
                                </div>
                                <div class="mt-3">
                                  <code class="break-all font-mono text-xs font-semibold text-b-ink/80">
                                    {rpc.address}
                                  </code>
                                </div>
                                <Show when={rpc.type === "Tracing" && rpc.tracingMode}>
                                  <div class="mt-2 flex items-center gap-4 text-xs font-semibold uppercase tracking-wider text-b-ink/40">
                                    <span>Mode: {rpc.tracingMode}</span>
                                  </div>
                                </Show>
                                <Show when={rpc.type === "Archive"}>
                                  <div class="mt-2 flex items-center gap-4 text-xs font-semibold uppercase tracking-wider text-b-ink/40">
                                    <Show when={rpc.indexerStepSize}>
                                      <span>Step: {rpc.indexerStepSize}</span>
                                    </Show>
                                    <Show when={rpc.dexIndexerStepSize}>
                                      <span>DEX Step: {rpc.dexIndexerStepSize}</span>
                                    </Show>
                                    <Show when={rpc.indexerBlockOffset}>
                                      <span>Offset: {rpc.indexerBlockOffset}</span>
                                    </Show>
                                  </div>
                                </Show>
                              </div>
                              <div class="flex shrink-0 items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => openEditRpcModal(rpc)}
                                  disabled={createRpcLoading() || deleteRpcLoading() || editRpcLoading()}
                                  class="btn btn-sm btn-interactive btn-disabled btn-secondary"
                                  title="Edit RPC"
                                >
                                  <PencilIcon class="size-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDeleteRpcError(null);
                                    setRpcToDelete(rpc);
                                  }}
                                  disabled={createRpcLoading() || deleteRpcLoading() || editRpcLoading()}
                                  class="btn btn-sm btn-interactive btn-disabled btn-danger"
                                  title="Delete RPC"
                                >
                                  <TrashIcon class="size-4" />
                                </button>
                              </div>
                            </div>
                          )}
                        </For>
                      </div>
                    </Show>

                    <Show when={activeChainRpcs().length === 0}>
                      <div class="flex flex-col items-center justify-center gap-3 border border-dashed border-b-border/50 bg-b-field/30 py-12">
                        <EmptyStateIcon class="size-8 text-b-ink/20" />
                        <p class="text-xs font-semibold uppercase tracking-wider text-b-ink/50">
                          No RPCs configured for this chain
                        </p>
                      </div>
                    </Show>
                  </div>
                </div>
              </Show>
            </section>
          </div>
        </Show>

        <Show
          when={
            !chainsError() &&
            !rpcsError() &&
            (chainsState() === "ready" || chainsState() === "refreshing") &&
            availableChains().length === 0
          }
        >
          <div class="flex flex-col items-center justify-center gap-4 py-16 border border-dashed border-b-border/50 bg-b-field/30">
            <LightningIcon class="size-12 text-b-ink/20" />
            <p class="text-center text-sm font-semibold uppercase tracking-wider text-b-ink/50">
              No chains available.
            </p>
          </div>
        </Show>

        <Show
          when={
            !chainsError() &&
            !rpcsError() &&
            (chainsState() === "ready" || chainsState() === "refreshing") &&
            availableChains().length > 0 &&
            filteredChains().length === 0
          }
        >
          <div class="flex flex-col items-center justify-center gap-4 py-16 border border-dashed border-b-border/50 bg-b-field/30">
            <SearchIcon class="size-12 text-b-ink/20" />
            <p class="text-center text-sm font-semibold uppercase tracking-wider text-b-ink/50">
              No chains match your filter.
            </p>
          </div>
        </Show>
      </div>

      <Show when={createRpcModalOpen()}>
        <div
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4 py-8"
          role="presentation"
          onClick={closeCreateRpcModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-rpc-title"
            class="w-full max-w-lg border border-b-border bg-b-field p-8 shadow-[0_25px_50px_rgba(0,0,0,0.5)]"
            onClick={(e) => e.stopPropagation()}
          >
            <p class="mb-2 text-xs font-bold uppercase tracking-[0.35em] text-b-accent">
              Create
            </p>
            <h3
              id="create-rpc-title"
              class="mb-2 font-['Anton',sans-serif] text-4xl uppercase leading-none tracking-wide text-b-ink"
            >
              New RPC
            </h3>
            <p class="mb-6 text-xs font-bold uppercase tracking-widest text-b-ink/50">
              {selectedChainForRpc()} / {environment.selectedEnvironment()}
            </p>

            <form onSubmit={handleCreateRpc} class="flex flex-col gap-6">
              <div class="flex flex-col gap-2">
                <label class="text-xs font-bold uppercase tracking-widest text-b-ink/70">
                  Type
                </label>
                <div class="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewRpcType("Realtime")}
                    class={`px-4 py-3 text-xs font-bold uppercase tracking-wider border transition-all duration-200 ${
                      newRpcType() === "Realtime"
                        ? "border-green-500/50 bg-green-500/10 text-green-400"
                        : "border-b-border bg-b-paper text-b-ink/50 hover:border-b-border-hover hover:text-b-ink"
                    }`}
                  >
                    Realtime
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewRpcType("Archive")}
                    class={`px-4 py-3 text-xs font-bold uppercase tracking-wider border transition-all duration-200 ${
                      newRpcType() === "Archive"
                        ? "border-blue-500/50 bg-blue-500/10 text-blue-400"
                        : "border-b-border bg-b-paper text-b-ink/50 hover:border-b-border-hover hover:text-b-ink"
                    }`}
                  >
                    Archive
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewRpcType("Tracing")}
                    class={`px-4 py-3 text-xs font-bold uppercase tracking-wider border transition-all duration-200 ${
                      newRpcType() === "Tracing"
                        ? "border-purple-500/50 bg-purple-500/10 text-purple-400"
                        : "border-b-border bg-b-paper text-b-ink/50 hover:border-b-border-hover hover:text-b-ink"
                    }`}
                  >
                    Tracing
                  </button>
                </div>
              </div>

              <div class="flex flex-col gap-2">
                <label for="rpc-provider" class="text-xs font-bold uppercase tracking-widest text-b-ink/70">
                  Provider
                </label>
                <Show when={providersState() === "pending"}>
                  <div class="flex h-11 items-center gap-2 border border-b-border bg-b-field px-3">
                    <LoadingSpinner class="size-4" />
                    <span class="text-xs font-bold uppercase tracking-widest text-b-ink/50">
                      Loading providers…
                    </span>
                  </div>
                </Show>
                <Show when={providersError()}>
                  <p class="border border-red-500/40 bg-red-500/10 px-3 py-3 text-xs font-bold uppercase leading-snug text-red-400">
                    {providersError()!.message}
                  </p>
                </Show>
                <Show when={providersState() === "ready" && providers().length > 0}>
                  <div class="relative">
                    <select
                      id="rpc-provider"
                      value={newRpcProviderId()}
                      onChange={(e) => setNewRpcProviderId(e.currentTarget.value)}
                      class="h-11 w-full appearance-none border border-b-border bg-b-field px-4 pr-10 text-sm font-bold uppercase tracking-widest text-b-ink outline-none focus-visible:border-b-accent/50 focus-visible:ring-2 focus-visible:ring-b-accent/20 hover:border-b-border-hover transition-all duration-200 cursor-pointer"
                    >
                      <For each={providers()}>
                        {(provider) => (
                          <option value={provider.id} class="bg-b-field">
                            {provider.name}
                          </option>
                        )}
                      </For>
                    </select>
                    <div class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                      <ChevronDownIcon class="size-5 text-b-ink/50" />
                    </div>
                  </div>
                </Show>
                <Show when={providersState() === "ready" && providers().length === 0}>
                  <div class="flex flex-col gap-3 border border-dashed border-b-border/50 bg-b-paper/20 px-4 py-4">
                    <p class="text-xs font-bold uppercase tracking-widest text-b-ink/50">
                      No providers available.
                    </p>
                    <a
                      href={`/applications/${applicationId()}/providers`}
                      onClick={closeCreateRpcModal}
                      class="text-xs font-bold uppercase tracking-widest text-b-accent hover:text-b-accent-hover hover:underline transition-colors"
                    >
                      Create a provider first →
                    </a>
                  </div>
                </Show>
              </div>

              <div class="flex flex-col gap-2">
                <label for="rpc-address" class="text-xs font-bold uppercase tracking-widest text-b-ink/70">
                  Address
                </label>
                <input
                  ref={newRpcAddressInput}
                  id="rpc-address"
                  type="url"
                  required
                  value={newRpcAddress()}
                  onInput={(e) => {
                    setNewRpcAddress(e.currentTarget.value);
                    validateRpcAddressInput(e.currentTarget);
                    if (createRpcError() === addressHint) setCreateRpcError(null);
                  }}
                  onBlur={(e) => validateRpcAddressInput(e.currentTarget)}
                  class="h-11 w-full border border-b-border bg-b-paper px-4 text-sm font-semibold text-b-ink placeholder:text-b-ink/25 outline-none focus-visible:border-b-accent/50 focus-visible:ring-2 focus-visible:ring-b-accent/20 hover:border-b-border-hover transition-all duration-200"
                  placeholder="https://rpc.example.com"
                  title={addressHint}
                  autocomplete="off"
                />
                <p class="text-xs font-semibold uppercase tracking-wider text-b-ink/40">
                  {addressHint}
                </p>
              </div>

              <Show when={newRpcType() === "Tracing"}>
                <div class="flex flex-col gap-2">
                  <label for="rpc-tracing-mode" class="text-xs font-bold uppercase tracking-widest text-b-ink/70">
                    Tracing Mode
                  </label>
                  <div class="relative">
                    <select
                      id="rpc-tracing-mode"
                      value={newRpcTracingMode()}
                      onChange={(e) => setNewRpcTracingMode(e.currentTarget.value as "Debug" | "Trace")}
                      class="h-11 w-full appearance-none border border-b-border bg-b-field px-4 pr-10 text-sm font-bold uppercase tracking-widest text-b-ink outline-none focus-visible:border-b-accent/50 focus-visible:ring-2 focus-visible:ring-b-accent/20 hover:border-b-border-hover transition-all duration-200 cursor-pointer"
                    >
                      <option value="Debug" class="bg-b-field">
                        Debug
                      </option>
                      <option value="Trace" class="bg-b-field">
                        Trace
                      </option>
                    </select>
                    <div class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                      <ChevronDownIcon class="size-5 text-b-ink/50" />
                    </div>
                  </div>
                </div>
              </Show>

              <Show when={newRpcType() === "Archive"}>
                <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div class="flex flex-col gap-2">
                    <label for="rpc-indexer-step-size" class="text-xs font-bold uppercase tracking-widest text-b-ink/70">
                      Indexer Step
                    </label>
                    <input
                      id="rpc-indexer-step-size"
                      type="number"
                      min="1"
                      required={newRpcType() === "Archive"}
                      value={newRpcIndexerStepSize()}
                      onInput={(e) => setNewRpcIndexerStepSize(e.currentTarget.value)}
                      class="h-11 w-full border border-b-border bg-b-paper px-4 text-sm font-semibold text-b-ink placeholder:text-b-ink/25 outline-none focus-visible:border-b-accent/50 focus-visible:ring-2 focus-visible:ring-b-accent/20 hover:border-b-border-hover transition-all duration-200"
                      inputmode="numeric"
                    />
                  </div>
                  <div class="flex flex-col gap-2">
                    <label for="rpc-dex-indexer-step-size" class="text-xs font-bold uppercase tracking-widest text-b-ink/70">
                      Dex Step
                    </label>
                    <input
                      id="rpc-dex-indexer-step-size"
                      type="number"
                      min="1"
                      required={newRpcType() === "Archive"}
                      value={newRpcDexIndexerStepSize()}
                      onInput={(e) => setNewRpcDexIndexerStepSize(e.currentTarget.value)}
                      class="h-11 w-full border border-b-border bg-b-paper px-4 text-sm font-semibold text-b-ink placeholder:text-b-ink/25 outline-none focus-visible:border-b-accent/50 focus-visible:ring-2 focus-visible:ring-b-accent/20 hover:border-b-border-hover transition-all duration-200"
                      inputmode="numeric"
                    />
                  </div>
                  <div class="flex flex-col gap-2">
                    <label for="rpc-indexer-block-offset" class="text-xs font-bold uppercase tracking-widest text-b-ink/70">
                      Block Offset
                    </label>
                    <input
                      id="rpc-indexer-block-offset"
                      type="number"
                      min="1"
                      required={newRpcType() === "Archive"}
                      value={newRpcIndexerBlockOffset()}
                      onInput={(e) => setNewRpcIndexerBlockOffset(e.currentTarget.value)}
                      class="h-11 w-full border border-b-border bg-b-paper px-4 text-sm font-semibold text-b-ink placeholder:text-b-ink/25 outline-none focus-visible:border-b-accent/50 focus-visible:ring-2 focus-visible:ring-b-accent/20 hover:border-b-border-hover transition-all duration-200"
                      inputmode="numeric"
                    />
                  </div>
                </div>
              </Show>

              <Show when={createRpcError()}>
                <p class="border border-red-500/40 bg-red-500/10 px-3 py-3 text-xs font-bold uppercase leading-snug text-red-400">
                  {createRpcError()}
                </p>
              </Show>

              <div class="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeCreateRpcModal}
                  disabled={createRpcLoading()}
                  class="btn btn-md btn-interactive btn-disabled btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createRpcLoading() || !newRpcProviderId()}
                  class="btn btn-md btn-interactive btn-disabled btn-primary"
                >
                  <Show when={createRpcLoading()}>
                    <LoadingSpinner class="size-3.5 text-b-paper" />
                  </Show>
                  {createRpcLoading() ? "Creating…" : "Create RPC"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Show>

      <Show when={editRpcModalOpen() && rpcToEdit()}>
        <div
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4 py-8"
          role="presentation"
          onClick={closeEditRpcModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-rpc-title"
            class="w-full max-w-lg border border-b-border bg-b-field p-8 shadow-[0_25px_50px_rgba(0,0,0,0.5)]"
            onClick={(e) => e.stopPropagation()}
          >
            <p class="mb-2 text-xs font-bold uppercase tracking-[0.35em] text-b-accent">
              Edit
            </p>
            <h3
              id="edit-rpc-title"
              class="mb-8 font-['Anton',sans-serif] text-4xl uppercase leading-none tracking-wide text-b-ink"
            >
              Edit RPC
            </h3>

            <form onSubmit={handleEditRpc} class="flex flex-col gap-6">
              <div class="flex flex-col gap-2">
                <label class="text-xs font-bold uppercase tracking-widest text-b-ink/70">
                  Type
                </label>
                <div class="flex h-11 items-center border border-b-border bg-b-field px-4">
                  <span
                    class={`text-sm font-bold uppercase tracking-wider ${
                      rpcToEdit()?.type === "Realtime"
                        ? "text-green-400"
                        : rpcToEdit()?.type === "Archive"
                        ? "text-blue-400"
                        : "text-purple-400"
                    }`}
                  >
                    {rpcToEdit()?.type}
                  </span>
                </div>
              </div>

              <div class="flex flex-col gap-2">
                <label for="edit-rpc-provider" class="text-xs font-bold uppercase tracking-widest text-b-ink/70">
                  Provider
                </label>
                <Show when={providersState() === "ready" && providers().length > 0}>
                  <div class="relative">
                    <select
                      id="edit-rpc-provider"
                      value={editRpcProviderId()}
                      onChange={(e) => setEditRpcProviderId(e.currentTarget.value)}
                      class="h-11 w-full appearance-none border border-b-border bg-b-field px-4 pr-10 text-sm font-bold uppercase tracking-widest text-b-ink outline-none focus-visible:border-b-accent/50 focus-visible:ring-2 focus-visible:ring-b-accent/20 hover:border-b-border-hover transition-all duration-200 cursor-pointer"
                    >
                      <For each={providers()}>
                        {(provider) => (
                          <option value={provider.id} class="bg-b-field">
                            {provider.name}
                          </option>
                        )}
                      </For>
                    </select>
                    <div class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                      <ChevronDownIcon class="size-5 text-b-ink/50" />
                    </div>
                  </div>
                </Show>
                <Show when={providersState() === "ready" && providers().length === 0}>
                  <div class="flex flex-col gap-3 border border-dashed border-b-border/50 bg-b-paper/20 px-4 py-4">
                    <p class="text-xs font-bold uppercase tracking-widest text-b-ink/50">
                      No providers available.
                    </p>
                    <a
                      href={`/applications/${applicationId()}/providers`}
                      onClick={closeEditRpcModal}
                      class="text-xs font-bold uppercase tracking-widest text-b-accent hover:text-b-accent-hover hover:underline transition-colors"
                    >
                      Create a provider first →
                    </a>
                  </div>
                </Show>
              </div>

              <div class="flex flex-col gap-2">
                <label for="edit-rpc-address" class="text-xs font-bold uppercase tracking-widest text-b-ink/70">
                  Address
                </label>
                <input
                  ref={editRpcAddressInput}
                  id="edit-rpc-address"
                  type="url"
                  required
                  value={editRpcAddress()}
                  onInput={(e) => {
                    setEditRpcAddress(e.currentTarget.value);
                    validateRpcAddressInput(e.currentTarget);
                    if (editRpcError() === addressHint) setEditRpcError(null);
                  }}
                  onBlur={(e) => validateRpcAddressInput(e.currentTarget)}
                  class="h-11 w-full border border-b-border bg-b-paper px-4 text-sm font-semibold text-b-ink placeholder:text-b-ink/25 outline-none focus-visible:border-b-accent/50 focus-visible:ring-2 focus-visible:ring-b-accent/20 hover:border-b-border-hover transition-all duration-200"
                  placeholder="https://rpc.example.com"
                  title={addressHint}
                  autocomplete="off"
                />
                <p class="text-xs font-semibold uppercase tracking-wider text-b-ink/40">
                  {addressHint}
                </p>
              </div>

              <Show when={editRpcError()}>
                <p class="border border-red-500/40 bg-red-500/10 px-3 py-3 text-xs font-bold uppercase leading-snug text-red-400">
                  {editRpcError()}
                </p>
              </Show>

              <div class="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeEditRpcModal}
                  disabled={editRpcLoading()}
                  class="btn btn-md btn-interactive btn-disabled btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editRpcLoading()}
                  class="btn btn-md btn-interactive btn-disabled btn-primary"
                >
                  <Show when={editRpcLoading()}>
                    <LoadingSpinner class="size-3.5 text-b-paper" />
                  </Show>
                  {editRpcLoading() ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Show>

      <Show when={rpcToDelete()}>
        <div
          class="fixed inset-0 z-[55] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4 py-8"
          role="presentation"
          onClick={() => !deleteRpcLoading() && setRpcToDelete(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-rpc-title"
            class="w-full max-w-md border border-red-500/30 bg-b-field p-8 shadow-[0_25px_50px_rgba(0,0,0,0.5)]"
            onClick={(e) => e.stopPropagation()}
          >
            <p class="mb-2 text-xs font-bold uppercase tracking-[0.35em] text-red-400">
              Confirm Deletion
            </p>
            <h3
              id="delete-rpc-title"
              class="mb-4 font-['Anton',sans-serif] text-4xl uppercase leading-none tracking-wide text-b-ink"
            >
              Delete RPC
            </h3>
            <p class="mb-4 text-sm font-semibold text-b-ink/70">
              Permanently delete this{" "}
              <span class="font-bold text-red-400">{rpcToDelete()?.type}</span>
              {" "}RPC endpoint?
            </p>
            <p class="mb-8 text-xs font-mono text-b-ink/40 break-all">
              {rpcToDelete()?.address}
            </p>

            <Show when={deleteRpcError()}>
              <p class="mb-6 border border-red-500/40 bg-red-500/10 px-3 py-3 text-xs font-bold uppercase leading-snug text-red-400">
                {deleteRpcError()}
              </p>
            </Show>

            <div class="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setRpcToDelete(null)}
                disabled={deleteRpcLoading()}
                class="btn btn-md btn-interactive btn-disabled btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteRpc}
                disabled={deleteRpcLoading()}
                class="btn btn-md btn-interactive btn-disabled btn-danger"
              >
                <Show when={deleteRpcLoading()}>
                  <LoadingSpinner class="size-3.5" />
                </Show>
                {deleteRpcLoading() ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      </Show>
    </>
  );
}
