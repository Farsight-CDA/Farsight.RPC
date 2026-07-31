import { createEffect, createMemo, createSignal, For, Show } from "solid-js";
import { useParams, useSearchParams } from "@solidjs/router";
import LoadingSpinner from "../components/LoadingSpinner";
import SearchIcon from "../components/icons/SearchIcon";
import PencilIcon from "../components/icons/PencilIcon";
import TrashIcon from "../components/icons/TrashIcon";
import LightningIcon from "../components/icons/LightningIcon";
import EmptyStateIcon from "../components/icons/EmptyStateIcon";
import ProviderIcon from "../components/icons/ProviderIcon";
import RpcIcon from "../components/icons/RpcIcon";
import PlusIcon from "../components/icons/PlusIcon";
import ChevronDownIcon from "../components/icons/ChevronDownIcon";
import CheckmarkIcon from "../components/icons/CheckmarkIcon";
import CopyIcon from "../components/icons/CopyIcon";
import WarningIcon from "../components/icons/WarningIcon";
import {
  allRpcCapabilities,
  formatRpcCapability,
  rpcCapabilityStyle,
  type RpcCapability,
} from "../components/RpcCapabilitiesField";
import RpcStateFields from "../components/RpcStateFields";
import { createModalBackdropHandlers } from "../lib/createModalBackdropHandlers";
import { useAuth } from "../lib/auth";
import {
  useReferenceData,
  type RpcProviderSummary,
} from "../lib/reference-data";
import {
  useApplicationData,
  type ApplicationRpc,
} from "../lib/application-data";
import { chainRuleValidation } from "../lib/rule-validation";
import { useEnvironment } from "../lib/environment-context";
import { useEscapeKey } from "../lib/useEscapeKey";

function CopyEndpointButton(props: { address: string }) {
  const [copied, setCopied] = createSignal(false);
  let timer: ReturnType<typeof setTimeout> | undefined;

  const handleCopy = () => {
    void navigator.clipboard.writeText(props.address);
    if (timer !== undefined) {
      clearTimeout(timer);
    }
    setCopied(true);
    timer = setTimeout(() => {
      setCopied(false);
      timer = undefined;
    }, 2000);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      class="inline-flex size-6 shrink-0 items-center justify-center rounded border border-b-border bg-b-field text-b-ink transition-all duration-200 hover:border-b-border-hover hover:bg-b-stripe focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-b-accent"
      title={copied() ? "Copied" : "Copy endpoint URL"}
    >
      {copied() ? (
        <CheckmarkIcon class="size-3 text-b-accent" />
      ) : (
        <CopyIcon class="size-3 opacity-70" />
      )}
    </button>
  );
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

const rpcValidationTimeoutMs = 15_000;
const rpcValidationTimedOutMessage = "RPC validation timed out.";

type ProbeResult = {
  chainId: number;
  latestBlockNumber: number;
  latestBlockTime: string;
  compatibility: {
    supportsPush0: boolean;
    supportsMCopy: boolean;
    supportsTStore: boolean;
    supportsBaseFee: boolean;
  };
  capabilities: RpcCapability[];
  ethGetLogsLimit: number | null;
  ethGetLogsError: string | null;
  debugApiError: string | null;
  tracingApiError: string | null;
};

async function validateRpcEndpoint(
  token: string,
  address: string,
  chain: string,
): Promise<
  | { ok: true; result: ProbeResult }
  | { ok: false; message: string }
> {
  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(
    () => controller.abort(),
    rpcValidationTimeoutMs,
  );

  try {
    const response = await fetch("/api/Rpcs/Validate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ address: address.trim(), chain }),
      signal: controller.signal,
    });
    if (!response.ok) {
      return {
        ok: false,
        message: await readErrorMessage(response, "RPC validation failed"),
      };
    }
    const data = (await response.json()) as ProbeResult;
    return { ok: true, result: data };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return { ok: false, message: rpcValidationTimedOutMessage };
    }

    throw error;
  } finally {
    globalThis.clearTimeout(timeoutId);
  }
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

function parsePositiveInteger(value: string): number | null {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

function inferProviderFromUrl(
  url: string,
  providers: RpcProviderSummary[],
): string | null {
  const lower = url.toLowerCase();
  const match = providers.find((p) => lower.includes(p.name.toLowerCase()));
  return match?.id ?? null;
}

export default function ApplicationRpcsPage() {
  const auth = useAuth();
  const referenceData = useReferenceData();
  const applicationData = useApplicationData();
  const params = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const applicationId = () => params.applicationId;

  const requestedChain = () => {
    const value = searchParams.chain;
    return Array.isArray(value) ? value[0] : value;
  };

  const allChains = referenceData.chains.data;
  const allChainsState = referenceData.chains.state;
  const allChainsError = referenceData.chains.error;
  const providers = referenceData.rpcProviders.data;
  const providersState = referenceData.rpcProviders.state;
  const providersError = referenceData.rpcProviders.error;
  const rpcs = applicationData.rpcs.data;
  const rpcsState = applicationData.rpcs.state;
  const rpcsError = applicationData.rpcs.error;
  const publicRpcs = applicationData.publicRpcs.data;
  const publicRpcsState = applicationData.publicRpcs.state;
  const rules = applicationData.rules.data;

  const environment = useEnvironment();
  const selectedEnvironment = createMemo(
    () =>
      environment
        .environments()
        .find((item) => item.id === environment.selectedEnvironmentId()) ??
      null,
  );

  const [filterText, setFilterText] = createSignal("");
  const [filterFailingOnly, setFilterFailingOnly] = createSignal(false);
  const [isAddingChains, setIsAddingChains] = createSignal(false);
  const [chainsToAdd, setChainsToAdd] = createSignal<Set<string>>(new Set());
  const [chainMutationError, setChainMutationError] = createSignal<
    string | null
  >(null);
  const [chainMutationLoading, setChainMutationLoading] = createSignal(false);

  const [createRpcModalOpen, setCreateRpcModalOpen] = createSignal(false);
  const [selectedChainForRpc, setSelectedChainForRpc] =
    createSignal<string>("");
  const [createStep, setCreateStep] = createSignal<1 | 2>(1);
  const [newRpcAddress, setNewRpcAddress] = createSignal("");
  const [newRpcProviderId, setNewRpcProviderId] = createSignal<string>("");
  const [newRpcCapabilities, setNewRpcCapabilities] = createSignal<
    Set<RpcCapability>
  >(new Set());
  const [newRpcEthGetLogsLimit, setNewRpcEthGetLogsLimit] = createSignal("");
  const [createRpcError, setCreateRpcError] = createSignal<string | null>(null);
  const [createRpcLoading, setCreateRpcLoading] = createSignal(false);
  const [createRpcTestStatus, setCreateRpcTestStatus] = createSignal<
    "untested" | "testing" | "passed" | "failed"
  >("untested");
  const [createRpcTestResult, setCreateRpcTestResult] =
    createSignal<ProbeResult | null>(null);
  const [createRpcTestError, setCreateRpcTestError] = createSignal<
    string | null
  >(null);
  const [createRpcSaveConfirm, setCreateRpcSaveConfirm] = createSignal(false);
  const [createProviderAutoInferred, setCreateProviderAutoInferred] =
    createSignal(false);
  const [createCapabilitiesAutoInferred, setCreateCapabilitiesAutoInferred] =
    createSignal(false);

  const [editRpcModalOpen, setEditRpcModalOpen] = createSignal(false);
  const [rpcToEdit, setRpcToEdit] = createSignal<ApplicationRpc | null>(null);
  const [editRpcProviderId, setEditRpcProviderId] = createSignal<string>("");
  const [editRpcCapabilities, setEditRpcCapabilities] = createSignal<
    Set<RpcCapability>
  >(new Set());
  const [editRpcEthGetLogsLimit, setEditRpcEthGetLogsLimit] = createSignal("");
  const [editRpcError, setEditRpcError] = createSignal<string | null>(null);
  const [editRpcLoading, setEditRpcLoading] = createSignal(false);
  const [editRpcTestStatus, setEditRpcTestStatus] = createSignal<
    "untested" | "testing" | "passed" | "failed"
  >("untested");
  const [editRpcTestResult, setEditRpcTestResult] =
    createSignal<ProbeResult | null>(null);
  const [editRpcTestError, setEditRpcTestError] = createSignal<string | null>(
    null,
  );
  const [editRpcSaveConfirm, setEditRpcSaveConfirm] = createSignal(false);
  const [editProviderAutoInferred, setEditProviderAutoInferred] =
    createSignal(false);

  let newRpcAddressInput!: HTMLInputElement;

  const [rpcToDelete, setRpcToDelete] = createSignal<ApplicationRpc | null>(
    null,
  );
  const [deleteRpcError, setDeleteRpcError] = createSignal<string | null>(null);
  const [deleteRpcLoading, setDeleteRpcLoading] = createSignal(false);

  const [chainToDisable, setChainToDisable] = createSignal<string | null>(null);
  const [disableChainError, setDisableChainError] = createSignal<string | null>(
    null,
  );
  const [disableChainLoading, setDisableChainLoading] = createSignal(false);

  // Drag and drop state
  const [dragRpcId, setDragRpcId] = createSignal<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = createSignal<number | null>(null);
  const [orderUpdateLoading, setOrderUpdateLoading] = createSignal(false);

  createEffect(() => {
    const prods = providers();
    const current = newRpcProviderId();
    if (current && !prods.some((p) => p.id === current)) {
      setNewRpcProviderId("");
    }
  });

  const availableChains = createMemo(() => {
    const uniqueChains = new Set(selectedEnvironment()?.chains ?? []);
    return Array.from(uniqueChains).sort((a, b) => a.localeCompare(b));
  });

  const inactiveChains = createMemo(() => {
    const activeChains = new Set(selectedEnvironment()?.chains ?? []);
    return Array.from(new Set(allChains()))
      .filter((chain) => !activeChains.has(chain))
      .sort((a, b) => a.localeCompare(b));
  });

  const getChainRpcs = (chain: string, environment: string) => {
    return rpcs().filter(
      (rpc) => rpc.chain === chain && rpc.environmentId === environment,
    );
  };

  const failingChains = createMemo(() => {
    const envId = environment.selectedEnvironmentId();
    if (!envId) return new Set<string>();
    const allRules = rules();
    const allRpcs = rpcs();
    const result = new Set<string>();
    for (const chain of availableChains()) {
      if (!chainRuleValidation(chain, envId, allRpcs, allRules)) {
        result.add(chain);
      }
    }
    return result;
  });

  const filteredChains = createMemo(() => {
    const allChains = availableChains();
    const filter = filterText().trim().toLowerCase();
    const failingOnly = filterFailingOnly();
    const failing = failingChains();
    let list = allChains;
    if (failingOnly) {
      list = list.filter((chain) => failing.has(chain));
    }
    if (filter) {
      list = list.filter((chain) => chain.toLowerCase().includes(filter));
    }
    return list;
  });

  const filteredInactiveChains = createMemo(() => {
    const chains = inactiveChains();
    const filter = filterText().trim().toLowerCase();
    let list = chains;
    if (filter) {
      list = list.filter((chain) => chain.toLowerCase().includes(filter));
    }
    return list;
  });

  const activeChain = createMemo(() => {
    const list = filteredChains();
    const requested = requestedChain();
    return requested && list.includes(requested) ? requested : (list[0] ?? null);
  });

  const setActiveChain = (chain: string) => {
    setSearchParams({ chain });
  };

  createEffect(() => {
    const selected = activeChain();
    if (requestedChain() !== selected) {
      setSearchParams({ chain: selected ?? undefined }, { replace: true });
    }
  });

  createEffect(() => {
    if (filterFailingOnly() && failingChains().size === 0) {
      setFilterFailingOnly(false);
    }
  });

  const providersHref = () => {
    const query = new URLSearchParams();
    const environmentId = environment.selectedEnvironmentId();
    if (environmentId) query.set("environment", environmentId);
    const search = query.toString();
    return `/applications/${applicationId()}/providers${search ? `?${search}` : ""}`;
  };

  const activeChainRpcs = createMemo(() => {
    const chain = activeChain();
    const env = environment.selectedEnvironmentId() || "";
    if (!chain) return [];
    return getChainRpcs(chain, env).sort((a, b) => a.order - b.order);
  });

  const activePublicRpcs = createMemo(() => {
    const chain = activeChain();
    if (!chain) return [];
    return publicRpcs().filter((rpc) => rpc.chain === chain);
  });

  const [expandedPublicRpcGroups, setExpandedPublicRpcGroups] = createSignal<
    Set<string>
  >(new Set());

  const activePublicRpcGroupKey = () =>
    `${environment.selectedEnvironmentId() ?? ""}:${activeChain() ?? ""}`;

  const isActivePublicRpcGroupExpanded = () =>
    expandedPublicRpcGroups().has(activePublicRpcGroupKey());

  const toggleActivePublicRpcGroup = () => {
    const key = activePublicRpcGroupKey();
    const next = new Set(expandedPublicRpcGroups());
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    setExpandedPublicRpcGroups(next);
  };

  const toggleAddChainsMode = () => {
    setChainMutationError(null);
    setChainsToAdd(new Set<string>());
    setFilterFailingOnly(false);
    setIsAddingChains(!isAddingChains());
  };

  const cancelAddChains = () => {
    if (chainMutationLoading()) return;
    setIsAddingChains(false);
    setChainsToAdd(new Set<string>());
  };

  const toggleChainSelection = (chain: string) => {
    const current = new Set<string>(chainsToAdd());
    if (current.has(chain)) {
      current.delete(chain);
    } else {
      current.add(chain);
    }
    setChainsToAdd(current);
  };

  const handleAddChains = async () => {
    const environmentId = environment.selectedEnvironmentId();
    const chains = Array.from(chainsToAdd());
    if (!environmentId || chains.length === 0) return;

    setChainMutationError(null);
    setChainMutationLoading(true);
    try {
      for (const chain of chains) {
        await applicationData.addEnvironmentChain(environmentId, chain);
      }
      setActiveChain(chains[0]);
      setIsAddingChains(false);
      setChainsToAdd(new Set<string>());
    } catch (err) {
      setChainMutationError(
        err instanceof Error ? err.message : "Failed to add chains",
      );
    } finally {
      setChainMutationLoading(false);
    }
  };

  const handleDisableChain = async (chain: string) => {
    const environmentId = environment.selectedEnvironmentId();
    if (!environmentId) return;

    const chainRpcs = getChainRpcs(chain, environmentId);
    if (chainRpcs.length > 0) {
      setDisableChainError(null);
      setChainToDisable(chain);
      return;
    }

    await performDisableChain(chain);
  };

  const performDisableChain = async (chain: string) => {
    const environmentId = environment.selectedEnvironmentId();
    if (!environmentId) return;

    setChainMutationError(null);
    setDisableChainLoading(true);
    try {
      await applicationData.removeEnvironmentChain(environmentId, chain);
      setChainToDisable(null);
    } catch (err) {
      setChainMutationError(
        err instanceof Error ? err.message : "Failed to disable chain",
      );
    } finally {
      setDisableChainLoading(false);
    }
  };

  const openCreateRpcModal = (chain: string) => {
    setCreateRpcError(null);
    setCreateStep(1);
    setCreateRpcTestStatus("untested");
    setCreateRpcTestResult(null);
    setCreateRpcTestError(null);
    setCreateRpcSaveConfirm(false);
    setCreateProviderAutoInferred(false);
    setCreateCapabilitiesAutoInferred(false);
    setSelectedChainForRpc(chain);
    setNewRpcAddress("");
    setNewRpcProviderId("");
    setNewRpcCapabilities(new Set<RpcCapability>());
    setNewRpcEthGetLogsLimit("");
    setCreateRpcModalOpen(true);
  };

  const closeCreateRpcModal = () => {
    if (createRpcLoading()) return;
    setCreateStep(1);
    setCreateRpcTestStatus("untested");
    setCreateRpcTestResult(null);
    setCreateRpcTestError(null);
    setCreateRpcSaveConfirm(false);
    setCreateProviderAutoInferred(false);
    setCreateCapabilitiesAutoInferred(false);
    setCreateRpcModalOpen(false);
    setSelectedChainForRpc("");
  };

  const openEditRpcModal = async (rpc: ApplicationRpc) => {
    setEditRpcError(null);
    setEditRpcTestStatus("untested");
    setEditRpcTestResult(null);
    setEditRpcTestError(null);
    setEditRpcSaveConfirm(false);
    setEditProviderAutoInferred(false);
    setRpcToEdit(rpc);
    setEditRpcProviderId(rpc.providerId);
    setEditRpcCapabilities(
      new Set(rpc.capabilities.filter(isKnownCapability)),
    );
    setEditRpcEthGetLogsLimit(
      rpc.ethGetLogsLimit === null ? "" : String(rpc.ethGetLogsLimit),
    );
    setEditRpcModalOpen(true);

    const token = auth.token;
    if (token && isValidRpcAddress(rpc.address)) {
      setEditRpcTestStatus("testing");
      try {
        const result = await validateRpcEndpoint(token, rpc.address, rpc.chain);
        if (result.ok) {
          setEditRpcTestStatus("passed");
          setEditRpcTestResult(result.result);
        } else {
          setEditRpcTestStatus("failed");
          setEditRpcTestError(result.message);
        }
      } catch (err) {
        setEditRpcTestStatus("failed");
        setEditRpcTestError(
          err instanceof Error ? err.message : "RPC validation failed",
        );
      }
    }
  };

  const closeEditRpcModal = () => {
    if (editRpcLoading()) return;
    setEditRpcTestStatus("untested");
    setEditRpcTestResult(null);
    setEditRpcTestError(null);
    setEditRpcSaveConfirm(false);
    setEditProviderAutoInferred(false);
    setEditRpcModalOpen(false);
    setRpcToEdit(null);
  };

  useEscapeKey(createRpcModalOpen, closeCreateRpcModal);
  useEscapeKey(editRpcModalOpen, closeEditRpcModal);
  useEscapeKey(
    () => rpcToDelete() !== null,
    () => {
      if (!deleteRpcLoading()) setRpcToDelete(null);
    },
  );
  useEscapeKey(
    () => chainToDisable() !== null,
    () => {
      if (!disableChainLoading()) setChainToDisable(null);
    },
  );

  const createRpcModalBackdropHandlers =
    createModalBackdropHandlers(closeCreateRpcModal);
  const editRpcModalBackdropHandlers =
    createModalBackdropHandlers(closeEditRpcModal);
  const deleteRpcBackdropHandlers = createModalBackdropHandlers(() => {
    if (!deleteRpcLoading()) setRpcToDelete(null);
  });
  const disableChainBackdropHandlers = createModalBackdropHandlers(() => {
    if (!disableChainLoading()) setChainToDisable(null);
  });

  function isKnownCapability(value: string): value is RpcCapability {
    return (allRpcCapabilities as readonly string[]).includes(value);
  }

  function autoApplyCapabilities(
    capabilities: RpcCapability[],
  ): Set<RpcCapability> {
    const next = new Set<RpcCapability>();
    for (const capability of capabilities) {
      next.add(capability);
    }
    return next;
  }

  function parseProbeEthGetLogsLimit(value: number | null): number | null {
    if (value === null) return null;
    return parsePositiveInteger(String(value));
  }

  const runCreateRpcTest = async (): Promise<boolean> => {
    const token = auth.token;
    const chain = selectedChainForRpc();
    if (!token || !chain) return false;
    const address = newRpcAddress().trim();
    if (!isValidRpcAddress(address)) {
      setCreateRpcError(addressHint);
      newRpcAddressInput.setCustomValidity(addressHint);
      newRpcAddressInput.reportValidity();
      return false;
    }

    const inferredProvider = inferProviderFromUrl(address, providers());
    if (inferredProvider) {
      setNewRpcProviderId(inferredProvider);
      setCreateProviderAutoInferred(true);
    }

    setCreateRpcError(null);
    setCreateRpcTestStatus("testing");
    setCreateRpcTestResult(null);
    setCreateRpcTestError(null);
    setCreateRpcSaveConfirm(false);
    setCreateCapabilitiesAutoInferred(false);
    try {
      const result = await validateRpcEndpoint(token, address, chain);
      if (result.ok) {
        setCreateRpcTestStatus("passed");
        setCreateRpcTestResult(result.result);
        const detected = autoApplyCapabilities(result.result.capabilities);
        if (detected.size > 0) {
          setNewRpcCapabilities(detected);
          setCreateCapabilitiesAutoInferred(true);
        }
        const detectedLimit = parseProbeEthGetLogsLimit(
          result.result.ethGetLogsLimit,
        );
        if (detectedLimit !== null) {
          setNewRpcEthGetLogsLimit(String(detectedLimit));
        }
        return true;
      } else {
        setCreateRpcTestStatus("failed");
        setCreateRpcTestError(result.message);
        return false;
      }
    } catch (err) {
      setCreateRpcTestStatus("failed");
      setCreateRpcTestError(
        err instanceof Error ? err.message : "RPC validation failed",
      );
      return false;
    }
  };

  const handleCreateContinue = async () => {
    if (await runCreateRpcTest()) {
      setCreateStep(2);
    }
  };

  const handleCreateRpc = async (e: SubmitEvent) => {
    e.preventDefault();
    const token = auth.token;
    const app = applicationId();
    const env = environment.selectedEnvironmentId();
    const providerId = newRpcProviderId();
    const chain = selectedChainForRpc();
    const supportsGetLogs = newRpcCapabilities().has("GetLogs");
    const ethGetLogsLimit = supportsGetLogs
      ? parsePositiveInteger(newRpcEthGetLogsLimit())
      : null;
    if (
      !token ||
      !app ||
      !env ||
      !providerId ||
      !chain ||
      (supportsGetLogs && !ethGetLogsLimit)
    )
      return;

    const address = newRpcAddress().trim();
    if (!isValidRpcAddress(address)) {
      setCreateRpcError(addressHint);
      newRpcAddressInput.setCustomValidity(addressHint);
      newRpcAddressInput.reportValidity();
      return;
    }

    if (
      createRpcTestStatus() === "untested" ||
      createRpcTestStatus() === "testing"
    ) {
      return;
    }
    if (createRpcTestStatus() === "failed" && !createRpcSaveConfirm()) {
      setCreateRpcSaveConfirm(true);
      return;
    }

    const chainRpcs = getChainRpcs(chain, env);
    const maxOrder = chainRpcs.reduce(
      (max, rpc) => Math.max(max, rpc.order),
      -1,
    );
    const order = maxOrder + 1;

    setCreateRpcError(null);
    setCreateRpcLoading(true);
    try {
      const response = await fetch(`/api/Applications/${app}/Rpcs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          environmentId: env,
          chain,
          address,
          providerId,
          capabilities: Array.from(newRpcCapabilities()),
          ethGetLogsLimit,
          order,
        }),
      });
      if (!response.ok) {
        throw new Error(
          await readErrorMessage(response, "Failed to create RPC"),
        );
      }
      await applicationData.refreshRpcs();
      await referenceData.refreshRpcProviders();
      setCreateRpcModalOpen(false);
      setNewRpcAddress("");
      setNewRpcCapabilities(new Set<RpcCapability>());
      setNewRpcEthGetLogsLimit("");
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
    const supportsGetLogs = editRpcCapabilities().has("GetLogs");
    const ethGetLogsLimit = supportsGetLogs
      ? parsePositiveInteger(editRpcEthGetLogsLimit())
      : null;
    if (!token || !app || !rpc || (supportsGetLogs && !ethGetLogsLimit)) return;

    if (
      editRpcTestStatus() === "untested" ||
      editRpcTestStatus() === "testing"
    ) {
      return;
    }
    if (editRpcTestStatus() === "failed" && !editRpcSaveConfirm()) {
      setEditRpcSaveConfirm(true);
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
            providerId: editRpcProviderId(),
            capabilities: Array.from(editRpcCapabilities()),
            ethGetLogsLimit,
          }),
        },
      );
      if (!response.ok) {
        throw new Error(
          await readErrorMessage(response, "Failed to update RPC"),
        );
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
      const response = await fetch(`/api/Applications/${app}/Rpcs/${rpc.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new Error(
          await readErrorMessage(response, "Failed to delete RPC"),
        );
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

  const handleReorder = async (fromIndex: number, toIndex: number) => {
    const token = auth.token;
    const app = applicationId();
    const env = environment.selectedEnvironmentId();
    const chain = activeChain();
    if (!token || !app || !env || !chain) return;

    const items = activeChainRpcs();
    if (
      fromIndex < 0 ||
      fromIndex >= items.length ||
      toIndex < 0 ||
      toIndex > items.length ||
      fromIndex === toIndex ||
      fromIndex + 1 === toIndex
    ) {
      return;
    }

    const item = items[fromIndex];
    const without = items.filter((_, i) => i !== fromIndex);
    let adjustedTo = toIndex;
    if (fromIndex < toIndex) {
      adjustedTo = toIndex - 1;
    }
    const reordered = [
      ...without.slice(0, adjustedTo),
      item,
      ...without.slice(adjustedTo),
    ];
    const rpcIds = reordered.map((rpc) => rpc.id);

    setOrderUpdateLoading(true);
    try {
      const response = await fetch(`/api/Applications/${app}/Rpcs/Order`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          environmentId: env,
          chain,
          rpcIds,
        }),
      });
      if (!response.ok) {
        throw new Error(
          await readErrorMessage(response, "Failed to reorder RPCs"),
        );
      }
      await applicationData.refreshRpcs();
    } catch (err) {
      setChainMutationError(
        err instanceof Error ? err.message : "Failed to reorder RPCs",
      );
    } finally {
      setOrderUpdateLoading(false);
      setDragRpcId(null);
      setDragOverIndex(null);
    }
  };

  const getProviderName = (providerId: string) => {
    const provider = providers().find((p) => p.id === providerId);
    return provider?.name ?? "Unknown";
  };

  const getCompatibilitySummary = (result: ProbeResult | null): string | null => {
    if (!result) return null;
    const items: string[] = [];
    if (result.compatibility.supportsPush0) items.push("PUSH0");
    if (result.compatibility.supportsMCopy) items.push("MCOPY");
    if (result.compatibility.supportsTStore) items.push("TSTORE");
    if (result.compatibility.supportsBaseFee) items.push("BASEFEE");
    return items.length > 0 ? items.join(", ") : null;
  };

  return (
    <>
      <div class="flex min-h-0 flex-1 flex-col gap-6">
        <section class="flex min-h-0 flex-1 flex-col border border-b-border bg-b-field overflow-hidden">
          <div class="border-b border-b-border bg-b-paper/30 px-6 py-4">
            <div class="flex items-center gap-3">
              <div class="flex size-10 items-center justify-center border border-b-accent/30 bg-b-accent/10">
                <RpcIcon class="size-5 text-b-accent" />
              </div>
              <div>
                <h2 class="font-['Anton',sans-serif] text-xl uppercase tracking-wide text-b-ink">
                  RPCs
                </h2>
                <p class="text-xs font-bold uppercase tracking-widest text-b-ink/50">
                  Configure RPC endpoints per environment
                </p>
              </div>
            </div>
          </div>

          <div class="flex flex-col gap-3 flex-1 min-h-0 overflow-hidden">
            <Show
              when={
                allChainsState() === "pending" ||
                rpcsState() === "pending" ||
                publicRpcsState() === "pending"
              }
            >
              <div class="flex flex-col items-center justify-center gap-4 py-16">
                <LoadingSpinner class="size-8" />
                <p class="text-sm font-bold uppercase tracking-widest text-b-ink/80">
                  Loading chains and RPCs…
                </p>
              </div>
            </Show>

            <Show
              when={
                allChainsState() === "refreshing" ||
                rpcsState() === "refreshing" ||
                publicRpcsState() === "refreshing"
              }
            >
              <div class="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-b-ink/80">
                <LoadingSpinner class="size-4" />
                Updating…
              </div>
            </Show>

            <Show when={allChainsError()}>
              <div class="mx-auto max-w-md">
                <p class="border-4 border-red-500/50 bg-red-500/10 px-4 py-4 text-center text-xs font-bold uppercase leading-snug text-red-400">
                  {allChainsError()!.message}
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

            <Show when={chainMutationError()}>
              <div class="mx-auto max-w-md">
                <p class="border-4 border-red-500/50 bg-red-500/10 px-4 py-4 text-center text-xs font-bold uppercase leading-snug text-red-400">
                  {chainMutationError()}
                </p>
              </div>
            </Show>

            <Show
              when={
                !allChainsError() &&
                !rpcsError() &&
                environment.environmentsState() === "ready" &&
                environment.environments().length === 0
              }
            >
              <div class="flex flex-col items-center justify-center gap-3 py-8 border border-b-border/50 bg-b-paper/20">
                <EmptyStateIcon class="size-10 text-b-ink/20" />
                <p class="text-sm font-semibold uppercase tracking-wider text-b-ink/50">
                  Add an environment before configuring RPCs.
                </p>
              </div>
            </Show>

            <Show
              when={
                !allChainsError() &&
                !rpcsError() &&
                environment.environments().length > 0 &&
                (allChainsState() === "ready" ||
                  allChainsState() === "refreshing") &&
                (rpcsState() === "ready" || rpcsState() === "refreshing") &&
                (publicRpcsState() === "ready" ||
                  publicRpcsState() === "refreshing")
              }
            >
              <div class="flex flex-col gap-4 lg:flex-row lg:items-stretch lg:gap-6 flex-1 min-h-0 overflow-hidden">
                <aside class="flex max-h-[min(22rem,52vh)] min-h-0 flex-col overflow-hidden border border-b-border bg-b-field lg:max-h-none lg:w-72 lg:shrink-0">
                  <div class="shrink-0 space-y-3 border-b border-b-border p-4">
                    <div class="flex items-center justify-between gap-2">
                      <p class="text-xs font-bold uppercase tracking-[0.35em] text-b-accent">
                        <Show when={isAddingChains()} fallback="Chains">
                          Add Chains
                        </Show>
                      </p>
                      <span class="tabular-nums text-[0.65rem] font-bold uppercase tracking-widest text-b-ink/45">
                        <Show
                          when={isAddingChains()}
                          fallback={`${filteredChains().length}/${availableChains().length}`}
                        >
                          {chainsToAdd().size}/{filteredInactiveChains().length}
                        </Show>
                      </span>
                    </div>
                    <Show when={!isAddingChains() && failingChains().size > 0}>
                      <button
                        type="button"
                        onClick={() => setFilterFailingOnly(!filterFailingOnly())}
                        aria-pressed={filterFailingOnly()}
                        class={`inline-flex w-full items-center justify-center gap-2 border px-3 py-2 text-left text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                          filterFailingOnly()
                            ? "border-amber-500/40 bg-amber-500/10 text-amber-300 hover:border-amber-500/60 hover:bg-amber-500/20 hover:text-amber-200"
                            : "border-b-border bg-b-paper/15 text-b-ink/60 hover:border-b-border-hover hover:bg-b-paper/30 hover:text-b-ink"
                        }`}
                      >
                        <WarningIcon class="size-3.5" />
                        <span>Ruleset issues</span>
                        <span class="tabular-nums">({failingChains().size})</span>
                      </button>
                    </Show>
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
                  </div>
                  <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2 [scrollbar-gutter:stable]">
                    <Show
                      when={!isAddingChains()}
                      fallback={
                        <button
                          type="button"
                          onClick={cancelAddChains}
                          disabled={chainMutationLoading()}
                          class="mb-1 flex w-full items-center justify-center gap-2 border border-dashed border-b-border/50 bg-b-paper/10 px-3 py-2.5 text-left transition-all duration-150 hover:border-red-500/50 hover:bg-red-500/10"
                        >
                          <span class="text-xs font-bold uppercase tracking-wider text-b-ink/70">
                            Cancel
                          </span>
                        </button>
                      }
                    >
                      <button
                        type="button"
                        onClick={toggleAddChainsMode}
                        disabled={
                          chainMutationLoading() || inactiveChains().length === 0
                        }
                        class="mb-1 flex w-full items-center justify-center gap-2 border border-dashed border-b-border/50 bg-b-paper/10 px-3 py-2.5 text-left transition-all duration-150 hover:border-b-accent/50 hover:bg-b-accent/5 disabled:opacity-40"
                      >
                        <PlusIcon class="size-4 text-b-accent" />
                        <span class="text-xs font-bold uppercase tracking-wider text-b-accent">
                          Add Chain
                        </span>
                      </button>
                    </Show>

                    <Show when={!isAddingChains()}>
                      <For each={filteredChains()}>
                        {(chain) => {
                          const isActive = () => activeChain() === chain;
                          const isFailing = () => failingChains().has(chain);
                          return (
                            <div
                              role="button"
                              tabindex="0"
                              onClick={() => setActiveChain(chain)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  setActiveChain(chain);
                                }
                              }}
                              class={`group mb-1 flex w-full cursor-pointer items-center justify-between border px-3 py-2.5 text-left transition-all duration-150 last:mb-0 ${
                                isActive()
                                  ? "border-b-accent bg-b-accent/10 text-b-ink shadow-[inset_2px_0_0_0_var(--color-b-accent)]"
                                  : "border-transparent bg-b-paper/15 text-b-ink/85 hover:border-b-border-hover hover:bg-b-paper/35"
                              } ${
                                isFailing()
                                  ? isActive()
                                    ? "bg-red-500/15"
                                    : "border-red-500/30 bg-red-500/10 hover:border-red-500/50 hover:bg-red-500/20"
                                  : ""
                              }`}
                            >
                              <span class="min-w-0 truncate font-['Anton',sans-serif] text-base tracking-wide">
                                {chain}
                              </span>
                              <div class="ml-2 flex shrink-0 items-center gap-2">
                                <Show when={failingChains().has(chain)}>
                                  <WarningIcon class="size-4 text-amber-300" />
                                </Show>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    void handleDisableChain(chain);
                                  }}
                                  disabled={
                                    chainMutationLoading() ||
                                    createRpcLoading() ||
                                    deleteRpcLoading() ||
                                    editRpcLoading()
                                  }
                                  class="shrink-0 opacity-0 transition-opacity duration-150 hover:text-red-400 group-hover:opacity-100 focus:opacity-100 disabled:opacity-30"
                                  title={`Disable ${chain}`}
                                >
                                  <TrashIcon class="size-4" />
                                </button>
                              </div>
                            </div>
                          );
                        }}
                      </For>
                    </Show>

                    <Show when={isAddingChains()}>
                      <Show
                        when={filteredInactiveChains().length > 0}
                        fallback={
                          <div class="border border-dashed border-b-border/50 bg-b-paper/10 px-3 py-4 text-center">
                            <p class="text-xs font-semibold uppercase tracking-wider text-b-ink/50">
                              No available chains to add
                            </p>
                          </div>
                        }
                      >
                        <For each={filteredInactiveChains()}>
                          {(chain) => {
                            const isSelected = () => chainsToAdd().has(chain);
                            return (
                              <div
                                role="button"
                                tabindex="0"
                                onClick={() => toggleChainSelection(chain)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    toggleChainSelection(chain);
                                  }
                                }}
                                class={`group mb-1 flex w-full cursor-pointer items-center gap-3 border px-3 py-2.5 text-left transition-all duration-150 last:mb-0 ${
                                  isSelected()
                                    ? "border-b-accent bg-b-accent/10 text-b-ink shadow-[inset_2px_0_0_0_var(--color-b-accent)]"
                                    : "border-transparent bg-b-paper/15 text-b-ink/85 hover:border-b-border-hover hover:bg-b-paper/35"
                                }`}
                              >
                                <div
                                  class={`flex size-4 shrink-0 items-center justify-center border transition-all duration-150 ${
                                    isSelected()
                                      ? "border-b-accent bg-b-accent"
                                      : "border-b-border bg-b-paper"
                                  }`}
                                >
                                  <Show when={isSelected()}>
                                    <CheckmarkIcon class="size-3 text-b-paper" />
                                  </Show>
                                </div>
                                <span class="min-w-0 truncate font-['Anton',sans-serif] text-base tracking-wide">
                                  {chain}
                                </span>
                              </div>
                            );
                          }}
                        </For>
                      </Show>
                    </Show>
                  </div>

                  <Show when={isAddingChains()}>
                    <div class="shrink-0 border-t border-b-border p-2">
                      <button
                        type="button"
                        onClick={handleAddChains}
                        disabled={
                          chainMutationLoading() || chainsToAdd().size === 0
                        }
                        class="flex w-full items-center justify-center gap-2 border border-b-accent bg-b-accent px-3 py-2.5 text-left transition-all duration-150 hover:bg-b-accent-hover disabled:opacity-40"
                      >
                        <Show when={chainMutationLoading()}>
                          <LoadingSpinner class="size-3.5 text-b-paper" />
                        </Show>
                        <span class="text-xs font-bold uppercase tracking-wider text-b-paper">
                          {chainMutationLoading()
                            ? "Adding…"
                            : `Add Selected (${chainsToAdd().size})`}
                        </span>
                      </button>
                    </div>
                  </Show>
                </aside>

                <section class="flex min-h-[min(24rem,55vh)] min-w-0 flex-1 flex-col overflow-hidden border border-b-border bg-b-field lg:min-h-0">
                  <Show
                    when={activeChain()}
                    fallback={
                      <div class="flex flex-1 flex-col items-center justify-center gap-3 p-10">
                        <Show
                          when={availableChains().length > 0}
                          fallback={
                            <>
                              <LightningIcon class="size-10 text-b-ink/20" />
                              <p class="text-center text-sm font-semibold uppercase tracking-wider text-b-ink/50">
                                No chains added for this environment.
                              </p>
                              <button
                                type="button"
                                onClick={toggleAddChainsMode}
                                disabled={
                                  chainMutationLoading() ||
                                  inactiveChains().length === 0
                                }
                                class="btn btn-md btn-interactive btn-disabled btn-primary"
                              >
                                <PlusIcon class="size-4" />
                                Add Chain
                              </button>
                            </>
                          }
                        >
                          <Show
                            when={filteredChains().length > 0}
                            fallback={
                              <>
                                <Show
                                  when={filterFailingOnly()}
                                  fallback={
                                    <>
                                      <SearchIcon class="size-10 text-b-ink/20" />
                                      <p class="text-center text-sm font-semibold uppercase tracking-wider text-b-ink/50">
                                        No chains match your filter.
                                      </p>
                                    </>
                                  }
                                >
                                  <>
                                    <WarningIcon class="size-10 text-amber-300/30" />
                                    <p class="text-center text-sm font-semibold uppercase tracking-wider text-b-ink/50">
                                      No failing chains match your filter.
                                    </p>
                                    <button
                                      type="button"
                                      onClick={() => setFilterFailingOnly(false)}
                                      class="btn btn-sm btn-interactive btn-secondary"
                                    >
                                      Clear ruleset filter
                                    </button>
                                  </>
                                </Show>
                              </>
                            }
                          >
                            <>
                              <EmptyStateIcon class="size-10 text-b-ink/20" />
                              <p class="text-center text-xs font-semibold uppercase tracking-wider text-b-ink/45">
                                Select a chain from the list
                              </p>
                            </>
                          </Show>
                        </Show>
                      </div>
                    }
                  >
                    <div class="flex min-h-0 flex-1 flex-col">
                      <div class="flex shrink-0 flex-col gap-3 border-b border-b-border p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div class="min-w-0">
                          <p class="text-[0.65rem] font-bold uppercase tracking-[0.35em] text-b-accent">
                            Chain
                          </p>
                          <h2 class="flex items-center gap-2 truncate font-['Anton',sans-serif] text-2xl tracking-wide text-b-ink">
                            {activeChain()}
                          </h2>
                          <p class="mt-1 text-[0.65rem] font-bold tracking-widest text-b-ink/45">
                            {activeChainRpcs().length} RPC
                            {activeChainRpcs().length !== 1 ? "s" : ""} ·{" "}
                            {selectedEnvironment()?.name}
                          </p>
                        </div>
                        <div class="flex shrink-0 flex-col self-start sm:self-center">
                          <button
                            type="button"
                            onClick={() => {
                              const ch = activeChain();
                              if (ch) openCreateRpcModal(ch);
                            }}
                            disabled={
                              providersState() === "pending" ||
                              createRpcLoading() ||
                              deleteRpcLoading() ||
                              editRpcLoading() ||
                              !selectedEnvironment()
                            }
                            class="btn btn-sm btn-interactive btn-disabled btn-primary"
                          >
                            <PlusIcon class="size-4" />
                            Add RPC
                          </button>
                        </div>
                      </div>

                      <div
                        class="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4"
                        onDragOver={(e) => {
                          if (!dragRpcId()) return;

                          e.preventDefault();
                          if (e.dataTransfer) {
                            e.dataTransfer.dropEffect = "move";
                          }

                          const items = Array.from(
                            e.currentTarget.querySelectorAll<HTMLElement>(
                              "[data-rpc-sort-item]",
                            ),
                          );
                          const overIndex = items.findIndex((item) => {
                            const rect = item.getBoundingClientRect();
                            return e.clientY < rect.top + rect.height / 2;
                          });
                          setDragOverIndex(
                            overIndex === -1 ? items.length : overIndex,
                          );
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          const draggedId = dragRpcId();
                          const toIndex = dragOverIndex();
                          if (!draggedId || toIndex === null) return;

                          const fromIndex = activeChainRpcs().findIndex(
                            (rpc) => rpc.id === draggedId,
                          );
                          if (fromIndex === -1) return;

                          void handleReorder(fromIndex, toIndex);
                        }}
                      >
                        <Show when={activeChainRpcs().length > 0 || activePublicRpcs().length > 0}>
                          <div class="flex flex-col gap-3">
                            <For each={activeChainRpcs()}>
                              {(rpc, index) => (
                                <>
                                  <Show when={dragOverIndex() === index()}>
                                    <div class="h-0.5 bg-b-accent" />
                                  </Show>
                                  <div
                                    data-rpc-sort-item
                                    draggable="true"
                                    onDragStart={(e) => {
                                      e.dataTransfer?.setData(
                                        "text/plain",
                                        rpc.id,
                                      );
                                      if (e.dataTransfer) {
                                        e.dataTransfer.effectAllowed = "move";
                                      }
                                      setDragRpcId(rpc.id);
                                    }}
                                    onDragEnd={() => {
                                      setDragRpcId(null);
                                      setDragOverIndex(null);
                                    }}
                                    class={`flex cursor-move flex-col gap-3 border border-b-border bg-b-paper/20 p-4 transition-colors hover:border-b-border-hover ${
                                      dragRpcId() === rpc.id
                                        ? "opacity-40"
                                        : ""
                                    } ${orderUpdateLoading() ? "pointer-events-none opacity-60" : ""}`}
                                  >
                                    <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                      <div class="min-w-0 flex-1">
                                        <div class="flex flex-wrap items-center gap-2">
                                          <span class="font-mono text-xs font-bold text-b-accent">
                                            #{index() + 1}
                                          </span>
                                          <span class="inline-flex items-center gap-1 text-xs font-semibold tracking-wider text-b-ink/50">
                                            <ProviderIcon class="size-3.5" />
                                            {getProviderName(rpc.providerId)}
                                          </span>
                                        </div>
                                        <div class="mt-3 flex items-center gap-2">
                                          <code class="break-all font-mono text-xs font-semibold text-b-ink/80">
                                            {rpc.address}
                                          </code>
                                          <CopyEndpointButton address={rpc.address} />
                                        </div>
                                        <Show when={rpc.ethGetLogsLimit}>
                                          {(limit) => (
                                            <p class="mt-2 text-[0.65rem] font-bold uppercase tracking-wider text-b-ink/40">
                                              eth_getLogs: {limit().toLocaleString()} blocks
                                            </p>
                                          )}
                                        </Show>
                                        <Show when={rpc.capabilities.length > 0}>
                                          <div class="mt-3 flex flex-wrap items-center gap-1.5">
                                            <For each={rpc.capabilities}>
                                              {(capability) => (
                                                <Show
                                                  when={isKnownCapability(capability) ? capability : undefined}
                                                >
                                                  {(cap) => (
                                                    <span
                                                      class={`inline-flex items-center border px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider ${rpcCapabilityStyle(cap())}`}
                                                    >
                                                      {formatRpcCapability(cap())}
                                                    </span>
                                                  )}
                                                </Show>
                                              )}
                                            </For>
                                          </div>
                                        </Show>
                                      </div>
                                      <div class="flex shrink-0 items-center gap-2">
                                        <button
                                          type="button"
                                          onClick={() => openEditRpcModal(rpc)}
                                          disabled={
                                            createRpcLoading() ||
                                            deleteRpcLoading() ||
                                            editRpcLoading() ||
                                            orderUpdateLoading()
                                          }
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
                                          disabled={
                                            createRpcLoading() ||
                                            deleteRpcLoading() ||
                                            editRpcLoading() ||
                                            orderUpdateLoading()
                                          }
                                          class="btn btn-sm btn-interactive btn-disabled btn-danger"
                                          title="Delete RPC"
                                        >
                                          <TrashIcon class="size-4" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </>
                              )}
                            </For>
                            <Show when={dragOverIndex() === activeChainRpcs().length}>
                              <div class="h-0.5 bg-b-accent" />
                            </Show>

                            <Show when={activePublicRpcs().length > 0}>
                              <div class="border border-b-border bg-b-paper/20 transition-colors hover:border-b-border-hover">
                                <button
                                  type="button"
                                  onClick={toggleActivePublicRpcGroup}
                                  class="flex w-full items-center justify-between gap-3 p-4 text-left"
                                  aria-expanded={isActivePublicRpcGroupExpanded()}
                                >
                                  <div class="min-w-0 flex-1">
                                    <div class="flex flex-wrap items-center gap-2">
                                      <span class="inline-flex items-center border px-2 py-0.5 text-xs font-bold tracking-wider text-b-accent border-b-accent/30 bg-b-accent/10">
                                        Public
                                      </span>
                                      <span class="text-xs font-semibold uppercase tracking-wider text-b-ink/50">
                                        {activePublicRpcs().length} node
                                        {activePublicRpcs().length === 1
                                          ? ""
                                          : "s"}
                                      </span>
                                    </div>
                                    <p class="mt-2 text-xs font-semibold uppercase tracking-wider text-b-ink/40">
                                      Discovered public RPC endpoints
                                    </p>
                                  </div>
                                  <ChevronDownIcon
                                    class={`size-4 shrink-0 text-b-ink/50 transition-transform ${
                                      isActivePublicRpcGroupExpanded()
                                        ? "rotate-180"
                                        : ""
                                    }`}
                                  />
                                </button>
                                <Show when={isActivePublicRpcGroupExpanded()}>
                                  <div class="border-t border-b-border/60 px-4 pb-4">
                                    <div class="flex flex-col gap-2 pt-3">
                                      <For each={activePublicRpcs()}>
                                        {(rpc) => (
                                          <div class="border border-b-border/60 bg-b-field/40 px-3 py-3">
                                            <div class="flex items-center gap-2">
                                              <code class="break-all font-mono text-xs font-semibold text-b-ink/80">
                                                {rpc.address}
                                              </code>
                                              <CopyEndpointButton address={rpc.address} />
                                            </div>
                                          </div>
                                        )}
                                      </For>
                                    </div>
                                  </div>
                                </Show>
                              </div>
                            </Show>
                          </div>
                        </Show>

                        <Show when={activeChainRpcs().length === 0 && activePublicRpcs().length === 0}>
                          <div class="flex flex-col items-center justify-center gap-3 border border-b-border/50 bg-b-field/30 py-12">
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
          </div>
        </section>
      </div>

      <Show when={createRpcModalOpen()}>
        <div
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4 py-8"
          role="presentation"
          {...createRpcModalBackdropHandlers}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-rpc-title"
            class="relative max-h-[calc(100vh-4rem)] w-full max-w-lg overflow-y-auto border border-b-border bg-b-field p-8 shadow-[0_25px_50px_rgba(0,0,0,0.5)]"
            onClick={(e) => e.stopPropagation()}
          >
            <span class="absolute top-8 right-8 inline-flex items-center border border-b-border/60 bg-b-paper/40 px-2 py-1 text-[0.65rem] font-bold uppercase tracking-wider text-b-ink/70">
              {selectedChainForRpc()}
            </span>
            <h3
              id="create-rpc-title"
              class="mb-8 font-['Anton',sans-serif] text-3xl uppercase leading-none tracking-wide text-b-ink"
            >
              New RPC
            </h3>

            <form onSubmit={handleCreateRpc} class="flex flex-col gap-6">
              <Show
                when={createStep() === 2}
                fallback={
                  <>
                    <div class="flex flex-col gap-2">
                      <label
                        for="rpc-address"
                        class="text-xs font-bold uppercase tracking-widest text-b-ink/70"
                      >
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
                          if (createRpcError() === addressHint)
                            setCreateRpcError(null);
                          setCreateRpcTestStatus("untested");
                          setCreateRpcTestResult(null);
                          setCreateRpcTestError(null);
                          setCreateRpcSaveConfirm(false);
                          setCreateProviderAutoInferred(false);
                          setCreateCapabilitiesAutoInferred(false);
                          setNewRpcEthGetLogsLimit("");
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            void handleCreateContinue();
                          }
                        }}
                        class="h-11 w-full border border-b-border bg-b-paper px-4 text-sm font-semibold text-b-ink placeholder:text-b-ink/25 outline-none focus-visible:border-b-accent/50 focus-visible:ring-2 focus-visible:ring-b-accent/20 hover:border-b-border-hover transition-all duration-200"
                        placeholder="https://rpc.example.com"
                        title={addressHint}
                        autocomplete="off"
                      />
                      <p class="text-xs font-semibold uppercase tracking-wider text-b-ink/40">
                        {addressHint}
                      </p>
                      <Show when={createRpcTestStatus() === "testing"}>
                        <div class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-b-ink/50">
                          <LoadingSpinner class="size-3.5" />
                          <span>Probing endpoint…</span>
                        </div>
                      </Show>
                      <Show when={createRpcTestStatus() === "passed" && createRpcTestResult()}>
                        <div class="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wider text-green-400">
                          <div class="flex items-center gap-2">
                            <CheckmarkIcon class="size-3.5" />
                            <span>Looks correct</span>
                          </div>
                          <Show when={getCompatibilitySummary(createRpcTestResult())}>
                            <span class="text-[0.65rem] text-b-ink/50">
                              Compatibility: {getCompatibilitySummary(createRpcTestResult())}
                            </span>
                          </Show>
                        </div>
                      </Show>
                      <Show when={createRpcTestStatus() === "failed"}>
                        <div class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-300">
                          <WarningIcon class="size-3.5" />
                          <span>{createRpcTestError() ?? "RPC validation failed"}</span>
                        </div>
                      </Show>
                    </div>

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
                        type="button"
                        onClick={() => void handleCreateContinue()}
                        disabled={
                          createRpcTestStatus() === "testing" ||
                          !isValidRpcAddress(newRpcAddress().trim())
                        }
                        class="btn btn-md btn-interactive btn-primary"
                      >
                        <Show when={createRpcTestStatus() === "testing"}>
                          <LoadingSpinner class="size-3.5 text-b-paper" />
                        </Show>
                        {createRpcTestStatus() === "testing"
                          ? "Validating…"
                          : "Validate & Continue"}
                      </button>
                    </div>
                  </>
                }
              >
                <>
                  <div class="flex flex-col gap-2">
                    <label class="text-xs font-bold uppercase tracking-widest text-b-ink/70">
                      Address
                    </label>
                    <div class="flex h-11 items-center border border-b-border bg-b-field px-4">
                      <code class="break-all font-mono text-sm font-semibold text-b-ink/70">
                        {newRpcAddress()}
                      </code>
                    </div>
                    <Show when={createRpcTestResult()}>
                      <div class="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wider text-green-400">
                        <div class="flex items-center gap-2">
                          <CheckmarkIcon class="size-3.5" />
                          <span>Looks correct</span>
                        </div>
                        <Show when={getCompatibilitySummary(createRpcTestResult())}>
                          <span class="text-[0.65rem] text-b-ink/50">
                            Compatibility: {getCompatibilitySummary(createRpcTestResult())}
                          </span>
                        </Show>
                      </div>
                    </Show>
                  </div>

                  <RpcStateFields
                    idPrefix="rpc"
                    ethGetLogsLimit={newRpcEthGetLogsLimit()}
                    reportedEthGetLogsLimit={parseProbeEthGetLogsLimit(
                      createRpcTestResult()?.ethGetLogsLimit ?? null,
                    )}
                    ethGetLogsError={
                      createRpcTestResult()?.ethGetLogsError ?? null
                    }
                    onEthGetLogsLimitChange={setNewRpcEthGetLogsLimit}
                    providerId={newRpcProviderId()}
                    providers={providers()}
                    providersPending={providersState() === "pending"}
                    providersReady={providersState() === "ready"}
                    providersError={providersError()?.message ?? null}
                    providersHref={providersHref()}
                    providerAutoDetected={createProviderAutoInferred()}
                    onProviderChange={(providerId) => {
                      setNewRpcProviderId(providerId);
                      setCreateProviderAutoInferred(false);
                    }}
                    onCreateProvider={closeCreateRpcModal}
                    selectedCapabilities={newRpcCapabilities()}
                    reportedCapabilities={
                      createRpcTestResult()?.capabilities ?? null
                    }
                    debugApiError={
                      createRpcTestResult()?.debugApiError ?? null
                    }
                    tracingApiError={
                      createRpcTestResult()?.tracingApiError ?? null
                    }
                    capabilitiesAutoDetected={
                      createCapabilitiesAutoInferred()
                    }
                    onCapabilitiesChange={(capabilities) => {
                      setNewRpcCapabilities(capabilities);
                      setCreateCapabilitiesAutoInferred(false);
                    }}
                  />

                  <Show when={createRpcError()}>
                    <p class="border border-red-500/40 bg-red-500/10 px-3 py-3 text-xs font-bold uppercase leading-snug text-red-400">
                      {createRpcError()}
                    </p>
                  </Show>

                  <div class="flex flex-col gap-3 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setCreateStep(1);
                        setCreateRpcTestStatus("untested");
                      }}
                      disabled={createRpcLoading()}
                      class="btn btn-md btn-interactive btn-disabled btn-secondary"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={
                        createRpcLoading() ||
                        !newRpcProviderId() ||
                        (newRpcCapabilities().has("GetLogs") &&
                          parsePositiveInteger(newRpcEthGetLogsLimit()) === null) ||
                        createRpcTestStatus() === "untested" ||
                        createRpcTestStatus() === "testing"
                      }
                      class={`btn btn-md btn-interactive btn-disabled ${
                        createRpcTestStatus() === "failed" &&
                        !createRpcSaveConfirm()
                          ? "btn-warning"
                          : createRpcTestStatus() === "failed" &&
                              createRpcSaveConfirm()
                            ? "btn-danger"
                            : "btn-primary"
                      }`}
                    >
                      <Show when={createRpcLoading()}>
                        <LoadingSpinner class="size-3.5 text-b-paper" />
                      </Show>
                      {createRpcLoading()
                        ? "Creating…"
                        : createRpcTestStatus() === "failed" &&
                            !createRpcSaveConfirm()
                          ? "Test Failed - Click to Save Anyway"
                          : createRpcTestStatus() === "failed" &&
                              createRpcSaveConfirm()
                            ? "Confirm Save (Test Failed)"
                            : "Create RPC"}
                    </button>
                  </div>
                </>
              </Show>
            </form>
          </div>
        </div>
      </Show>

      <Show when={editRpcModalOpen() && rpcToEdit()}>
        <div
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4 py-8"
          role="presentation"
          {...editRpcModalBackdropHandlers}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-rpc-title"
            class="relative max-h-[calc(100vh-4rem)] w-full max-w-lg overflow-y-auto border border-b-border bg-b-field p-8 shadow-[0_25px_50px_rgba(0,0,0,0.5)]"
            onClick={(e) => e.stopPropagation()}
          >
            <span class="absolute top-8 right-8 inline-flex items-center border border-b-border/60 bg-b-paper/40 px-2 py-1 text-[0.65rem] font-bold uppercase tracking-wider text-b-ink/70">
              {rpcToEdit()?.chain}
            </span>
            <h3
              id="edit-rpc-title"
              class="mb-8 font-['Anton',sans-serif] text-3xl uppercase leading-none tracking-wide text-b-ink"
            >
              Edit RPC
            </h3>

            <form onSubmit={handleEditRpc} class="flex flex-col">
              <div class="flex flex-col gap-6">
                <div class="flex flex-col gap-2">
                  <label class="text-xs font-bold uppercase tracking-widest text-b-ink/70">
                    Address
                  </label>
                  <div class="flex h-11 items-center border border-b-border bg-b-field px-4">
                    <code class="break-all font-mono text-sm font-semibold text-b-ink/70">
                      {rpcToEdit()?.address}
                    </code>
                  </div>
                  <Show when={editRpcTestStatus() === "testing"}>
                    <div class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-b-ink/50">
                      <LoadingSpinner class="size-3.5" />
                      <span>Probing endpoint…</span>
                    </div>
                  </Show>
                  <Show when={editRpcTestStatus() === "passed" && editRpcTestResult()}>
                    <div class="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wider text-green-400">
                      <div class="flex items-center gap-2">
                        <CheckmarkIcon class="size-3.5" />
                        <span>Looks correct</span>
                      </div>
                      <Show when={getCompatibilitySummary(editRpcTestResult())}>
                        <span class="text-[0.65rem] text-b-ink/50">
                          Compatibility: {getCompatibilitySummary(editRpcTestResult())}
                        </span>
                      </Show>
                    </div>
                  </Show>
                  <Show when={editRpcTestStatus() === "failed"}>
                    <div class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-300">
                      <WarningIcon class="size-3.5" />
                      <span>{editRpcTestError() ?? "RPC validation failed"}</span>
                    </div>
                  </Show>
                </div>

                <RpcStateFields
                  idPrefix="edit-rpc"
                  ethGetLogsLimit={editRpcEthGetLogsLimit()}
                  reportedEthGetLogsLimit={parseProbeEthGetLogsLimit(
                    editRpcTestResult()?.ethGetLogsLimit ?? null,
                  )}
                  ethGetLogsError={
                    editRpcTestResult()?.ethGetLogsError ?? null
                  }
                  onEthGetLogsLimitChange={setEditRpcEthGetLogsLimit}
                  providerId={editRpcProviderId()}
                  providers={providers()}
                  providersPending={providersState() === "pending"}
                  providersReady={providersState() === "ready"}
                  providersError={providersError()?.message ?? null}
                  providersHref={providersHref()}
                  providerAutoDetected={editProviderAutoInferred()}
                  onProviderChange={(providerId) => {
                    setEditRpcProviderId(providerId);
                    setEditProviderAutoInferred(false);
                  }}
                  onCreateProvider={closeEditRpcModal}
                  selectedCapabilities={editRpcCapabilities()}
                  reportedCapabilities={editRpcTestResult()?.capabilities ?? null}
                  debugApiError={editRpcTestResult()?.debugApiError ?? null}
                  tracingApiError={editRpcTestResult()?.tracingApiError ?? null}
                  onCapabilitiesChange={setEditRpcCapabilities}
                />

                <Show when={editRpcError()}>
                  <p class="border border-red-500/40 bg-red-500/10 px-3 py-3 text-xs font-bold uppercase leading-snug text-red-400">
                    {editRpcError()}
                  </p>
                </Show>
              </div>

              <div class="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeEditRpcModal}
                  disabled={editRpcLoading()}
                  class="btn btn-sm btn-interactive btn-disabled btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    editRpcLoading() ||
                    (editRpcCapabilities().has("GetLogs") &&
                      parsePositiveInteger(editRpcEthGetLogsLimit()) === null) ||
                    editRpcTestStatus() === "untested" ||
                    editRpcTestStatus() === "testing"
                  }
                  class={`btn btn-sm btn-interactive btn-disabled ${
                    editRpcTestStatus() === "failed" && !editRpcSaveConfirm()
                      ? "btn-warning"
                      : editRpcTestStatus() === "failed" && editRpcSaveConfirm()
                        ? "btn-danger"
                        : "btn-primary"
                  }`}
                >
                  <Show when={editRpcLoading()}>
                    <LoadingSpinner class="size-3.5 text-b-paper" />
                  </Show>
                  {editRpcLoading()
                    ? "Saving…"
                    : editRpcTestStatus() === "failed" && !editRpcSaveConfirm()
                      ? "Test Failed - Click to Save Anyway"
                      : editRpcTestStatus() === "failed" && editRpcSaveConfirm()
                        ? "Confirm Save (Test Failed)"
                        : "Save Changes"}
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
          {...deleteRpcBackdropHandlers}
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
              Permanently delete this RPC endpoint?
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

      <Show when={chainToDisable()}>
        <div
          class="fixed inset-0 z-[55] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4 py-8"
          role="presentation"
          {...disableChainBackdropHandlers}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="disable-chain-title"
            class="w-full max-w-md border border-amber-500/30 bg-b-field p-8 shadow-[0_25px_50px_rgba(0,0,0,0.5)]"
            onClick={(e) => e.stopPropagation()}
          >
            <p class="mb-2 text-xs font-bold uppercase tracking-[0.35em] text-amber-400">
              Confirm Disable
            </p>
            <h3
              id="disable-chain-title"
              class="mb-4 font-['Anton',sans-serif] text-4xl uppercase leading-none tracking-wide text-b-ink"
            >
              Disable Chain
            </h3>
            <p class="mb-4 text-sm font-semibold text-b-ink/70">
              Disable chain{" "}
              <span class="font-bold text-amber-400">{chainToDisable()}</span>{" "}
              for {selectedEnvironment()?.name}?
            </p>
            <div class="mb-6 border border-amber-500/20 bg-amber-500/10 px-3 py-3">
              <p class="text-xs font-semibold text-amber-300/80">
                Existing RPCs will be preserved and can be restored by
                re-enabling the chain.
              </p>
            </div>

            <Show when={disableChainError()}>
              <p class="mb-6 border border-red-500/40 bg-red-500/10 px-3 py-3 text-xs font-bold uppercase leading-snug text-red-400">
                {disableChainError()}
              </p>
            </Show>

            <div class="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setChainToDisable(null)}
                disabled={disableChainLoading()}
                class="btn btn-md btn-interactive btn-disabled btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const chain = chainToDisable();
                  if (chain) void performDisableChain(chain);
                }}
                disabled={disableChainLoading()}
                class="btn btn-md btn-interactive btn-disabled btn-warning"
              >
                <Show when={disableChainLoading()}>
                  <LoadingSpinner class="size-3.5" />
                </Show>
                {disableChainLoading() ? "Disabling…" : "Disable Chain"}
              </button>
            </div>
          </div>
        </div>
      </Show>
    </>
  );
}
